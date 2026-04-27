// PuppetCollab.js — Multi-user puppeteering UPGRADE
// SPX Puppet | StreamPireX
// Features: WebSocket rooms, role system, presence, conflict resolution, reconnect, chat

export const PUPPET_ROLES = {
  BODY:       'body',
  LEFT_HAND:  'left_hand',
  RIGHT_HAND: 'right_hand',
  FACE:       'face',
  DIRECTOR:   'director',
  OBSERVER:   'observer',
};

const MSG_TYPES = {
  JOIN:         'join',
  LEAVE:        'leave',
  RIG_UPDATE:   'rig_update',
  EXPRESSION:   'expression',
  CHAT:         'chat',
  ROLE_ASSIGN:  'role_assign',
  ROLE_REQUEST: 'role_request',
  SCENE_STATE:  'scene_state',
  PING:         'ping',
  PONG:         'pong',
  PEER_LIST:    'peer_list',
  KEYFRAME:     'keyframe',
  CURSOR:       'cursor',
};

export function createCollabRoom(options = {}) {
  const {
    roomId   = 'spx-' + Math.random().toString(36).slice(2, 8).toUpperCase(),
    userId   = 'user_' + Math.random().toString(36).slice(2, 8),
    userName = 'Puppeteer',
    role     = PUPPET_ROLES.BODY,
    wsUrl    = null,
  } = options;

  let ws = null;
  let connected = false;
  let reconnectTimer = null;
  let reconnectAttempts = 0;
  let pingInterval = null;
  const handlers = {};
  const peers = new Map(); // userId → { userId, userName, role, lastSeen, cursor }
  const messageQueue = []; // queued while disconnected
  const history = []; // last N messages for late joiners

  const send = (data) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      messageQueue.push(data);
      return false;
    }
    try { ws.send(JSON.stringify(data)); return true; }
    catch(e) { console.error('[PuppetCollab] send error:', e); return false; }
  };

  const flushQueue = () => {
    while (messageQueue.length > 0 && ws?.readyState === WebSocket.OPEN) {
      send(messageQueue.shift());
    }
  };

  const handleMessage = (raw) => {
    try {
      const msg = JSON.parse(raw);
      history.push(msg);
      if (history.length > 200) history.shift();

      switch (msg.type) {
        case MSG_TYPES.PEER_LIST:
          msg.peers?.forEach(p => peers.set(p.userId, p));
          handlers.onPeerList?.(Array.from(peers.values()));
          break;
        case MSG_TYPES.JOIN:
          peers.set(msg.userId, { userId: msg.userId, userName: msg.userName, role: msg.role, lastSeen: Date.now() });
          handlers.onPeerJoin?.(peers.get(msg.userId));
          handlers.onPeerList?.(Array.from(peers.values()));
          break;
        case MSG_TYPES.LEAVE:
          peers.delete(msg.userId);
          handlers.onPeerLeave?.(msg.userId);
          handlers.onPeerList?.(Array.from(peers.values()));
          break;
        case MSG_TYPES.RIG_UPDATE:
          if (msg.userId !== userId) handlers.onRigUpdate?.(msg.userId, msg.rig);
          break;
        case MSG_TYPES.EXPRESSION:
          if (msg.userId !== userId) handlers.onExpression?.(msg.userId, msg.expression);
          break;
        case MSG_TYPES.CHAT:
          handlers.onChat?.(msg);
          break;
        case MSG_TYPES.ROLE_ASSIGN:
          if (peers.has(msg.peerId)) { peers.get(msg.peerId).role = msg.role; }
          if (msg.peerId === userId) handlers.onRoleChange?.(msg.role);
          handlers.onPeerList?.(Array.from(peers.values()));
          break;
        case MSG_TYPES.SCENE_STATE:
          handlers.onSceneState?.(msg.state);
          break;
        case MSG_TYPES.KEYFRAME:
          handlers.onKeyframe?.(msg.userId, msg.frame, msg.data);
          break;
        case MSG_TYPES.CURSOR:
          if (peers.has(msg.userId)) { peers.get(msg.userId).cursor = msg.cursor; }
          handlers.onCursor?.(msg.userId, msg.cursor);
          break;
        case MSG_TYPES.PONG:
          peers.get(userId) && (peers.get(userId).lastSeen = Date.now());
          break;
      }
      handlers.onMessage?.(msg);
    } catch(e) { console.warn('[PuppetCollab] parse error:', e); }
  };

  const connect = (url) => {
    const wsUrl = import.meta.env.VITE_COLLAB_WS ? `${import.meta.env.VITE_COLLAB_WS}/room/${roomId}` : null;
    if (!wsUrl) { console.warn("[PuppetCollab] VITE_COLLAB_WS not set — collab disabled"); return; }
    try {
      ws = new WebSocket(wsEndpoint);

      ws.onopen = () => {
        connected = true;
        reconnectAttempts = 0;
        handlers.onConnect?.();
        // Announce join
        send({ type: MSG_TYPES.JOIN, userId, userName, role, roomId });
        flushQueue();
        // Ping keepalive
        pingInterval = setInterval(() => {
          send({ type: MSG_TYPES.PING, userId });
        }, 5000);
      };

      ws.onclose = (e) => {
        connected = false;
        clearInterval(pingInterval);
        handlers.onDisconnect?.(e.code, e.reason);
        // Auto-reconnect with backoff
        if (reconnectAttempts < 5) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
          reconnectAttempts++;
          reconnectTimer = setTimeout(() => connect(url), delay);
        }
      };

      ws.onmessage = (e) => handleMessage(e.data);
      ws.onerror   = (e) => handlers.onError?.(e);

    } catch(e) { console.error('[PuppetCollab] connect error:', e); }
  };

  return {
    roomId, userId, userName,

    connect,

    // Rig update — throttle in caller to ~30fps
    sendRigUpdate(rig) {
      send({ type: MSG_TYPES.RIG_UPDATE, userId, roomId, rig, timestamp: Date.now() });
    },

    sendExpression(expression) {
      send({ type: MSG_TYPES.EXPRESSION, userId, roomId, expression, timestamp: Date.now() });
    },

    sendChatMessage(text) {
      const msg = { type: MSG_TYPES.CHAT, userId, userName, roomId, text, timestamp: Date.now() };
      history.push(msg);
      send(msg);
    },

    sendKeyframe(frame, data) {
      send({ type: MSG_TYPES.KEYFRAME, userId, roomId, frame, data, timestamp: Date.now() });
    },

    sendCursor(x, y) {
      send({ type: MSG_TYPES.CURSOR, userId, cursor: { x, y }, timestamp: Date.now() });
    },

    requestRole(requestedRole) {
      send({ type: MSG_TYPES.ROLE_REQUEST, userId, role: requestedRole, roomId });
    },

    assignRole(peerId, newRole) {
      if (!peers.has(peerId)) return;
      peers.get(peerId).role = newRole;
      send({ type: MSG_TYPES.ROLE_ASSIGN, userId, peerId, role: newRole, roomId });
    },

    broadcastSceneState(state) {
      send({ type: MSG_TYPES.SCENE_STATE, userId, roomId, state });
    },

    disconnect() {
      clearTimeout(reconnectTimer);
      clearInterval(pingInterval);
      reconnectAttempts = 99; // prevent auto-reconnect
      send({ type: MSG_TYPES.LEAVE, userId, roomId });
      ws?.close();
      ws = null; connected = false;
    },

    on(event, handler) { handlers[event] = handler; },
    off(event) { delete handlers[event]; },

    isConnected() { return connected; },
    getPeers() { return Array.from(peers.values()); },
    getPeer(id) { return peers.get(id); },
    getMyRole() { return role; },
    getRoomId() { return roomId; },
    getUserId() { return userId; },

    // Who has which role
    getRoleOwner(r) {
      for (const [id, peer] of peers) { if (peer.role === r) return peer; }
      return null;
    },

    getStats() {
      return { roomId, userId, connected, peerCount: peers.size, messageCount: history.length, reconnectAttempts };
    },

    getChatHistory() { return history.filter(m => m.type === MSG_TYPES.CHAT); },
  };
}

export default createCollabRoom;
