
// AIVoicePanel.jsx — ElevenLabs AI voice + auto lip sync
import React, { useState, useRef } from 'react';
import { generateVoice, createAutoLipSync, FREE_VOICES } from '../../utils/PuppetAIVoice.js';

export default function AIVoicePanel({ onMouthShape, setStatus }) {
  const [apiKey,    setApiKey]    = useState('');
  const [voiceId,   setVoiceId]   = useState(FREE_VOICES[0].id);
  const [text,      setText]      = useState('');
  const [loading,   setLoading]   = useState(false);
  const [playing,   setPlaying]   = useState(false);
  const lipSyncRef = useRef(null);

  const speak = async () => {
    if (!text.trim()) return;
    if (!apiKey) { setStatus('Enter your ElevenLabs API key'); return; }
    setLoading(true);
    try {
      const blob = await generateVoice(text, voiceId, apiKey);
      const sync = createAutoLipSync(blob, (shape) => onMouthShape?.(shape));
      lipSyncRef.current = sync;
      await sync.play();
      setPlaying(true);
      sync.getAudio().onended = () => setPlaying(false);
      setStatus('AI voice playing with auto lip sync');
    } catch (err) {
      setStatus('Voice error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const stop = () => {
    lipSyncRef.current?.stop();
    lipSyncRef.current = null;
    setPlaying(false);
    onMouthShape?.({ openness:0, width:1 });
  };

  return (
    <div>
      <div className="sp-section-label">AI Voice + Lip Sync</div>

      <div style={{ marginBottom:6 }}>
        <div className="sp-label-row"><span>ElevenLabs API Key</span></div>
        <input className="sp-input" type="password" placeholder="sk-..." value={apiKey}
          onChange={e => setApiKey(e.target.value)} />
      </div>

      <div style={{ marginBottom:6 }}>
        <div className="sp-label-row"><span>Voice</span></div>
        <select className="sp-select" value={voiceId} onChange={e => setVoiceId(e.target.value)}>
          {FREE_VOICES.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
      </div>

      <div style={{ marginBottom:8 }}>
        <div className="sp-label-row"><span>Text to speak</span></div>
        <textarea className="sp-input" rows={3} placeholder="Type what your character will say..."
          value={text} onChange={e => setText(e.target.value)}
          style={{ resize:'vertical', lineHeight:1.5 }} />
      </div>

      <div className="sp-btn-row">
        <button className="sp-btn sp-btn--primary" onClick={speak} disabled={loading || playing} style={{ flex:1 }}>
          {loading ? '⏳ Generating...' : '🔊 Speak'}
        </button>
        {playing && <button className="sp-btn sp-btn--danger" onClick={stop}>■ Stop</button>}
      </div>

      <div style={{ marginTop:8, fontSize:10, color:'var(--muted)', lineHeight:1.5 }}>
        No API key? Get a free key at elevenlabs.io (10,000 chars/month free tier)
      </div>
    </div>
  );
}
