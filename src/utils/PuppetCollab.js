
// PuppetCollab.js — multi-user puppeteering via WebSocket

export function createCollabRoom(options = {}) {
  const { roomId = 'spx-' + Math.random().toString(36).slice(2,8).toUpperCase(), userId = 'user_' + Date.now() } = options;
  let ws = null;
  let connected = false;
  const handlers = {};
  const peers = {};

  return {
    roomId, userId,

    connect(wsUrl, onMessage) {
      try {
        ws = new WebSocket(wsUrl || `wss://echo.websocket.org`);
        ws.onopen  = () => { connected = true; handlers.onConnect?.(); };
        ws.onclose = () => { connected = false; handlers.onDisconnect?.(); };
        ws.onmessage = (e) => {
          try { const data = JSON.parse(e.data); onMessage?.(data); handlers.onMessage?.(data); }
          catch {}
        };
        ws.onerror = (e) => handlers.onError?.(e);
      } catch (err) { console.error('[PuppetCollab] WS error:', err); }
    },

    sendRigUpdate(rig) {
      if (!connected || !ws) return;
      ws.send(JSON.stringify({ type: 'rig_update', userId, roomId, rig, timestamp: Date.now() }));
    },

    sendExpression(expression) {
      if (!connected || !ws) return;
      ws.send(JSON.stringify({ type: 'expression', userId, roomId, expression, timestamp: Date.now() }));
    },

    sendChatMessage(text) {
      if (!connected || !ws) return;
      ws.send(JSON.stringify({ type: 'chat', userId, roomId, text, timestamp: Date.now() }));
    },

    assignRole(peerId, role) {
      peers[peerId] = { ...peers[peerId], role };
      if (!connected || !ws) return;
      ws.send(JSON.stringify({ type: 'role_assign', userId, peerId, role, roomId }));
    },

    disconnect() {
      ws?.close(); ws = null; connected = false;
    },

    on(event, handler) { handlers[event] = handler; },
    isConnected() { return connected; },
    getPeers() { return peers; },

    getStats() {
      return { roomId, userId, connected, peerCount: Object.keys(peers).length };
    },
  };
}

export const PUPPET_ROLES = {
  BODY:       'body',
  LEFT_HAND:  'left_hand',
  RIGHT_HAND: 'right_hand',
  FACE:       'face',
  DIRECTOR:   'director',
};
