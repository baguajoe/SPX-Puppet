
// PuppetCharacterPanel.jsx — import, manage, select characters
import React, { useRef } from 'react';
import { loadImageFromFile, createCharacterFromImage, createBuiltinCharacter } from '../../utils/PuppetImporter.js';

const BUILTIN_CHARS = [
  { type:'stick',   label:'Stick Figure',  emoji:'🏃' },
  { type:'robot',   label:'Robot',         emoji:'🤖' },
  { type:'ghost',   label:'Ghost',         emoji:'👻' },
  { type:'ninja',   label:'Ninja',         emoji:'🥷' },
];

export default function PuppetCharacterPanel({ characters, activeId, onAdd, onSelect, onRemove, onPositionChange }) {
  const fileRef = useRef(null);

  const handleFileImport = async (e) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        const { img } = await loadImageFromFile(file);
        const char = createCharacterFromImage(img, file.name.replace(/\.[^.]+$/, ''));
        char.image = img;
        onAdd(char);
      }
    }
    e.target.value = '';
  };

  const addBuiltin = (type) => {
    const char = createBuiltinCharacter(type);
    onAdd(char);
  };

  return (
    <div>
      <div className="sp-section-label">Characters</div>

      {/* Import */}
      <div className="sp-btn-row" style={{ marginBottom:8 }}>
        <button className="sp-btn sp-btn--primary" style={{ flex:1 }} onClick={() => fileRef.current?.click()}>
          📂 Import PNG/SVG
        </button>
        <input ref={fileRef} type="file" accept="image/*" multiple style={{ display:'none' }} onChange={handleFileImport} />
      </div>

      {/* Built-in characters */}
      <div className="sp-section-label">Built-in</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:10 }}>
        {BUILTIN_CHARS.map(b => (
          <button key={b.type} className="sp-btn" style={{ textAlign:'center', padding:'8px 4px' }} onClick={() => addBuiltin(b.type)}>
            <div style={{ fontSize:24 }}>{b.emoji}</div>
            <div style={{ fontSize:10, color:'var(--muted)', marginTop:2 }}>{b.label}</div>
          </button>
        ))}
      </div>

      {/* Character list */}
      {characters.length > 0 && (
        <>
          <div className="sp-section-label">Scene ({characters.length})</div>
          {characters.map(char => (
            <div key={char.id} className={`sp-character-card ${char.id === activeId ? 'sp-character-card--active' : ''}`}
              onClick={() => onSelect(char.id)} style={{ marginBottom:6 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                {char.image
                  ? <img src={char.image.src} alt={char.name} style={{ width:40, height:40, objectFit:'contain', borderRadius:4, background:'#111' }} />
                  : <div style={{ width:40, height:40, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 }}>
                      {BUILTIN_CHARS.find(b => b.type === char.builtin)?.emoji || '🎭'}
                    </div>
                }
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:11, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{char.name}</div>
                  <div style={{ fontSize:10, color:'var(--muted)' }}>{char.builtin ? 'Built-in' : 'Image'}</div>
                </div>
                <button onClick={e => { e.stopPropagation(); onRemove(char.id); }}
                  style={{ background:'none', border:'none', color:'var(--muted)', cursor:'pointer', fontSize:14, padding:'2px 4px' }}>✕</button>
              </div>

              {char.id === activeId && (
                <div style={{ marginTop:8, display:'flex', flexDirection:'column', gap:4 }}>
                  <div className="sp-label-row"><span>Scale</span><strong>{(char.scale||1).toFixed(2)}</strong></div>
                  <input type="range" className="sp-slider" min={0.1} max={3} step={0.05} value={char.scale||1}
                    onChange={e => onPositionChange(char.id, { scale: parseFloat(e.target.value) })} />
                  <div className="sp-label-row"><span>Opacity</span><strong>{(char.opacity||1).toFixed(2)}</strong></div>
                  <input type="range" className="sp-slider" min={0} max={1} step={0.05} value={char.opacity||1}
                    onChange={e => onPositionChange(char.id, { opacity: parseFloat(e.target.value) })} />
                </div>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
