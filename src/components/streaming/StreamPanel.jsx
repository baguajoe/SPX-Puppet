
// StreamPanel.jsx — live streaming controls
import React, { useState, useRef } from 'react';
import { createPuppetStream, overlayPuppetOnWebcam } from '../../utils/PuppetStreamer.js';

export default function StreamPanel({ canvasRef, webcamRef, setStatus }) {
  const streamerRef  = useRef(null);
  const [streaming,  setStreaming]  = useState(false);
  const [streamUrl,  setStreamUrl]  = useState('');
  const [mode,       setMode]       = useState('virtual'); // virtual | overlay | webrtc
  const [roomId,     setRoomId]     = useState('');

  const startStream = async () => {
    const canvas = canvasRef?.current?.getCanvas?.();
    if (!canvas) { setStatus('No canvas found'); return; }
    const streamer = createPuppetStream(canvas, 30);
    streamerRef.current = streamer;

    if (mode === 'virtual') {
      const stream = await streamer.startVirtualCamera((s) => {
        setStatus('Virtual camera stream active — use in OBS/StreamPireX');
      });
      setStreamUrl(URL.createObjectURL(new Blob([], { type: 'video/webm' })));
    } else if (mode === 'webrtc') {
      await streamer.startWebRTC(null, roomId || 'spx-room');
      setStatus('WebRTC stream started');
    } else if (mode === 'overlay') {
      if (webcamRef?.current) {
        const outCanvas = document.createElement('canvas');
        const stream = overlayPuppetOnWebcam(canvas, webcamRef.current, outCanvas);
        setStatus('Puppet overlay on webcam active');
      }
    }
    setStreaming(true);
  };

  const stopStream = () => {
    streamerRef.current?.stopStream();
    setStreaming(false);
    setStatus('Stream stopped');
  };

  return (
    <div>
      <div className="sp-section-label">Live Streaming</div>

      <div className="sp-section-label" style={{ marginTop:4 }}>Mode</div>
      <select className="sp-select" value={mode} onChange={e => setMode(e.target.value)} disabled={streaming} style={{ marginBottom:8 }}>
        <option value="virtual">Virtual Camera (OBS)</option>
        <option value="overlay">Webcam Overlay</option>
        <option value="webrtc">WebRTC P2P</option>
      </select>

      {mode === 'webrtc' && (
        <input className="sp-input" style={{ marginBottom:8 }} placeholder="Room ID"
          value={roomId} onChange={e => setRoomId(e.target.value)} />
      )}

      <button className={`sp-btn ${streaming ? 'sp-btn--danger' : 'sp-btn--orange'}`}
        onClick={streaming ? stopStream : startStream} style={{ marginBottom:8 }}>
        {streaming ? '■ Stop Stream' : '📡 Start Stream'}
      </button>

      {streaming && (
        <div style={{ padding:8, background:'rgba(255,102,0,0.1)', border:'1px solid var(--orange)', borderRadius:6, fontSize:10, color:'var(--orange)' }}>
          ● Live — {mode === 'virtual' ? 'Open OBS → Add Source → Window Capture → select browser' :
                    mode === 'overlay' ? 'Puppet overlaid on webcam feed' : 'WebRTC stream active'}
        </div>
      )}

      <div className="sp-section-label" style={{ marginTop:12 }}>StreamPireX Integration</div>
      <div style={{ fontSize:10, color:'var(--muted)', lineHeight:1.6 }}>
        Your puppet stream can be sent directly to StreamPireX for broadcast on Twitch, YouTube, and StreamPireX Radio.
      </div>
      <button className="sp-btn sp-btn--teal" style={{ marginTop:6 }}
        onClick={() => window.open('https://streampirex.com', '_blank')}>
        Open StreamPireX →
      </button>
    </div>
  );
}
