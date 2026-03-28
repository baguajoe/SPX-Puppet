
// PuppetMarketplace.jsx — character/prop marketplace
import React, { useState } from 'react';

const FEATURED = [
  { id:'c1', name:'Anime Girl',    emoji:'👧', category:'character', price:'free', tags:['anime','female'] },
  { id:'c2', name:'Business Man',  emoji:'👨‍💼', category:'character', price:'free', tags:['realistic','male'] },
  { id:'c3', name:'Superhero',     emoji:'🦸', category:'character', price:'free', tags:['action','male'] },
  { id:'c4', name:'Wizard',        emoji:'🧙', category:'character', price:'free', tags:['fantasy'] },
  { id:'c5', name:'Dancer',        emoji:'💃', category:'character', price:'free', tags:['dance','female'] },
  { id:'c6', name:'Robot AI',      emoji:'🤖', category:'character', price:'free', tags:['scifi'] },
  { id:'p1', name:'City BG',       emoji:'🌆', category:'background', price:'free', tags:['urban'] },
  { id:'p2', name:'Space BG',      emoji:'🌌', category:'background', price:'free', tags:['space'] },
  { id:'p3', name:'Forest BG',     emoji:'🌲', category:'background', price:'free', tags:['nature'] },
  { id:'p4', name:'Studio BG',     emoji:'🎬', category:'background', price:'free', tags:['studio'] },
];

export default function PuppetMarketplace({ onInstall }) {
  const [category, setCategory] = useState('all');
  const [search,   setSearch]   = useState('');
  const [installed, setInstalled] = useState(new Set());

  const filtered = FEATURED.filter(item => {
    if (category !== 'all' && item.category !== category) return false;
    if (search && !item.name.toLowerCase().includes(search.toLowerCase()) &&
        !item.tags.some(t => t.includes(search.toLowerCase()))) return false;
    return true;
  });

  const install = (item) => {
    setInstalled(prev => new Set([...prev, item.id]));
    onInstall?.(item);
  };

  return (
    <div>
      <input className="sp-input" placeholder="Search characters, props..." value={search}
        onChange={e => setSearch(e.target.value)} style={{ marginBottom:8 }} />

      <div style={{ display:'flex', gap:4, marginBottom:10, flexWrap:'wrap' }}>
        {['all','character','background'].map(c => (
          <button key={c} className={`sp-btn ${category===c?'sp-btn--teal':''}`}
            style={{ flex:1, textAlign:'center', padding:'4px 6px', fontSize:10 }} onClick={() => setCategory(c)}>
            {c.charAt(0).toUpperCase()+c.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
        {filtered.map(item => (
          <div key={item.id} style={{ border:'1px solid var(--border)', borderRadius:8, padding:8, background:'var(--panel)' }}>
            <div style={{ fontSize:28, textAlign:'center', marginBottom:4 }}>{item.emoji}</div>
            <div style={{ fontSize:10, color:'var(--text)', textAlign:'center', marginBottom:4 }}>{item.name}</div>
            <div style={{ fontSize:9, color:'var(--muted)', textAlign:'center', marginBottom:6 }}>{item.tags.join(' · ')}</div>
            <button
              className={`sp-btn ${installed.has(item.id) ? 'sp-btn--teal' : ''}`}
              style={{ padding:'4px', fontSize:10, textAlign:'center' }}
              onClick={() => install(item)}>
              {installed.has(item.id) ? '✅ Added' : '+ Add'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
