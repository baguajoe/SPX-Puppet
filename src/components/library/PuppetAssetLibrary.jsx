
// PuppetAssetLibrary.jsx — built-in props, backgrounds, character presets
import React, { useState } from 'react';

const PROPS = [
  { id:'microphone', emoji:'🎤', label:'Microphone' },
  { id:'guitar',     emoji:'🎸', label:'Guitar' },
  { id:'camera',     emoji:'📷', label:'Camera' },
  { id:'laptop',     emoji:'💻', label:'Laptop' },
  { id:'phone',      emoji:'📱', label:'Phone' },
  { id:'book',       emoji:'📚', label:'Book' },
  { id:'coffee',     emoji:'☕', label:'Coffee' },
  { id:'headphones', emoji:'🎧', label:'Headphones' },
  { id:'sword',      emoji:'⚔️',  label:'Sword' },
  { id:'shield',     emoji:'🛡️',  label:'Shield' },
  { id:'wand',       emoji:'🪄', label:'Magic Wand' },
  { id:'balloon',    emoji:'🎈', label:'Balloon' },
];

const EXPRESSIONS_PRESETS = [
  { id:'happy',     emoji:'😊', label:'Happy' },
  { id:'sad',       emoji:'😢', label:'Sad' },
  { id:'angry',     emoji:'😠', label:'Angry' },
  { id:'surprised', emoji:'😲', label:'Surprised' },
  { id:'wink',      emoji:'😉', label:'Wink' },
  { id:'cool',      emoji:'😎', label:'Cool' },
];

export default function PuppetAssetLibrary({ onAddProp, onSetExpression }) {
  const [tab, setTab] = useState('props');

  return (
    <div>
      <div style={{ display:'flex', gap:4, marginBottom:10 }}>
        {[['props','Props'],['expressions','Expressions']].map(([id,lbl]) => (
          <button key={id} className={`sp-btn ${tab===id?'sp-btn--teal':''}`}
            style={{ flex:1, textAlign:'center', padding:'4px 8px' }} onClick={() => setTab(id)}>
            {lbl}
          </button>
        ))}
      </div>

      {tab === 'props' && (
        <>
          <div className="sp-section-label">Scene Props</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6 }}>
            {PROPS.map(p => (
              <button key={p.id} className="sp-btn" style={{ textAlign:'center', padding:'8px 4px' }}
                onClick={() => onAddProp?.(p)}>
                <div style={{ fontSize:22 }}>{p.emoji}</div>
                <div style={{ fontSize:9, color:'var(--muted)', marginTop:2 }}>{p.label}</div>
              </button>
            ))}
          </div>
        </>
      )}

      {tab === 'expressions' && (
        <>
          <div className="sp-section-label">Expression Presets</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6 }}>
            {EXPRESSIONS_PRESETS.map(e => (
              <button key={e.id} className="sp-btn" style={{ textAlign:'center', padding:'8px 4px' }}
                onClick={() => onSetExpression?.(e.id)}>
                <div style={{ fontSize:22 }}>{e.emoji}</div>
                <div style={{ fontSize:9, color:'var(--muted)', marginTop:2 }}>{e.label}</div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
