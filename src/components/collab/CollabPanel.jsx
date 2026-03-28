
// CollabPanel.jsx — multi-user puppeteering UI
import React, { useState, useRef } from 'react';
import { createCollabRoom, PUPPET_ROLES } from '../../utils/PuppetCollab.js';

export default function CollabPanel({ onRigReceived, onExpressionReceived }) {
  const roomRef  = useRef(null);
  const [connected, setConnected] = useState(false);
  const [roomId,    setRoomId]    = useState('');
  const [myRole,    setMyRole]    = useState(PUPPET_ROLES.BODY);
  const [log,       setLog]       = useState([]);
  const [chat,      setChat]      = useState('');
  const [peers,     setPeers]     = useState([]);

  const addLog = (msg) => setLog(prev => [...prev.slice(-15), msg]);

  const startRoom = () => {
    const room = createCollabRoom();
    room.connect(null, (data) => {
      addLog('[' + data.type + '] from ' + data.userId);
      if (data.type === 'rig_update')  onRigReceived?.(data.rig);
      if (data.type === 'expression')  onExpressionReceived?.(data.expression);
      if (data.type === 'peer_join')   setPeers(prev => [...prev, { id:data.userId, role:data.role }]);
    });
    roomRef.current = room;
    setRoomId(room.roomId);
    setConnected(true);
    addLog('Room created: ' + room.roomId);
  };

  const joinRoom = () => {
    if (!roomId) return;
    const room = createCollabRoom({ roomId });
    room.connect(null, (data) => {
      addLog('[' + data.type + '] ' + (data.text || ''));
      if (data.type === 'rig_update')  onRigReceived?.(data.rig);
      if (data.type === 'expression')  onExpressionReceived?.(data.expression);
    });
    roomRef.current = room;
    setConnected(true);
    addLog('Joined room: ' + roomId);
  };

  const leave = () => {
    roomRef.current?.disconnect();
    roomRef.current = null;
    setConnected(false);
    setPeers([]);
    addLog('Left room');
  };

  const sendChat = () => {
    if (!chat || !roomRef.current) return;
    roomRef.current.sendChatMessage(chat);
    addLog('Me: ' + chat);
    setChat('');
  };

  const copyId = () => { navigator.clipboard?.writeText(roomId); addLog('Room ID copied'); };

  return (
    <div>
      <div className="sp-section-label">Collaborative Puppeteering</div>

      {!connected ? (
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          <button className="sp-btn sp-btn--teal" onClick={startRoom}>🔗 Start Room</button>
          <input className="sp-input" placeholder="Room ID to join..." value={roomId}
            onChange={e => setRoomId(e.target.value.toUpperCase())} />
          <button className="sp-btn" onClick={joinRoom}>Join Room</button>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ fontSize:11, color:'var(--teal)', fontFamily:'monospace' }}>{roomId}</span>
            <button className="sp-btn" style={{ padding:'3px 8px', fontSize:10 }} onClick={copyId}>📋</button>
          </div>

          <div className="sp-section-label">My Role</div>
          <select className="sp-select" value={myRole} onChange={e => setMyRole(e.target.value)}>
            {Object.values(PUPPET_ROLES).map(r => <option key={r} value={r}>{r.replace('_',' ').toUpperCase()}</option>)}
          </select>

          {peers.length > 0 && (
            <div>
              <div className="sp-section-label">Peers ({peers.length})</div>
              {peers.map((p,i) => (
                <div key={i} style={{ fontSize:10, color:'var(--muted)', padding:'3px 0' }}>
                  {p.id} — {p.role}
                </div>
              ))}
            </div>
          )}

          <div style={{ display:'flex', gap:4 }}>
            <input className="sp-input" style={{ flex:1 }} placeholder="Chat..." value={chat}
              onChange={e => setChat(e.target.value)} onKeyDown={e => e.key==='Enter' && sendChat()} />
            <button className="sp-btn" style={{ padding:'4px 8px' }} onClick={sendChat}>→</button>
          </div>

          <button className="sp-btn sp-btn--danger" onClick={leave}>Leave Room</button>
        </div>
      )}

      <div style={{ marginTop:8, background:'#06060f', border:'1px solid var(--border)', borderRadius:6, padding:8, maxHeight:100, overflowY:'auto' }}>
        {log.map((l,i) => <div key={i} style={{ fontSize:10, color:'var(--muted)' }}>{l}</div>)}
      </div>
    </div>
  );
}
