
// PuppetScene.jsx — background layers, parallax, multi-character management
import React, { useState } from 'react';

const SCENE_PRESETS = [
  { id:'black',     label:'Black Studio',    bg:'#000000' },
  { id:'dark',      label:'Dark Stage',      bg:'#06060f' },
  { id:'studio',    label:'White Studio',    bg:'#f5f5f5' },
  { id:'sunset',    gradient: ['#ff6b35','#f7c948','#1a1a2e'], label:'Sunset' },
  { id:'night',     gradient: ['#0f0c29','#302b63','#24243e'], label:'Night Sky' },
  { id:'forest',    gradient: ['#134e5e','#71b280'], label:'Forest' },
  { id:'ocean',     gradient: ['#2980b9','#6dd5fa','#ffffff'], label:'Ocean' },
  { id:'neon',      gradient: ['#0f0c29','#302b63'], label:'Neon City' },
];

export default function PuppetScene({ onApply, currentScene }) {
  const [selected, setSelected] = useState(currentScene?.id || 'dark');
  const [customColor, setCustomColor] = useState('#06060f');
  const [showFloor, setShowFloor] = useState(true);
  const [floorColor, setFloorColor] = useState('#1a1a2e');

  const apply = () => {
    const preset = SCENE_PRESETS.find(p => p.id === selected);
    onApply?.({ ...preset, showFloor, floorColor, customColor });
  };

  return (
    <div>
      <div className="sp-section-label">Scene Preset</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:10 }}>
        {SCENE_PRESETS.map(p => (
          <button key={p.id}
            onClick={() => setSelected(p.id)}
            style={{
              padding:'8px 6px', borderRadius:8, border:`2px solid ${selected===p.id?'var(--teal)':'var(--border)'}`,
              background: p.gradient
                ? `linear-gradient(135deg, ${p.gradient.join(',')})`
                : p.bg || '#06060f',
              color: p.bg === '#f5f5f5' ? '#000' : '#fff',
              cursor:'pointer', fontSize:10, fontWeight:600,
            }}>
            {p.label}
          </button>
        ))}
      </div>

      <div className="sp-section-label">Floor</div>
      <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'var(--muted)', marginBottom:6 }}>
        <input type="checkbox" checked={showFloor} onChange={e => setShowFloor(e.target.checked)} />
        Show Floor Line
      </label>
      {showFloor && (
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
          <span style={{ fontSize:11, color:'var(--muted)' }}>Color</span>
          <input type="color" value={floorColor} onChange={e => setFloorColor(e.target.value)}
            style={{ width:36, height:28, borderRadius:4, border:'1px solid var(--border)', cursor:'pointer', background:'none' }} />
        </div>
      )}

      <button className="sp-btn sp-btn--teal" onClick={apply}>Apply Scene</button>
    </div>
  );
}
