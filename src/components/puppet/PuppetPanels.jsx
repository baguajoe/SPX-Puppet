// =============================================================================
// TriggersPanel.jsx — Keyboard trigger assignment UI
// =============================================================================
import React, { useState, useEffect, useRef } from 'react';
import { TriggerEngine, DEFAULT_TRIGGERS, EXPRESSION_PRESETS } from '../../utils/PuppetTriggers.js';

const S = {
  root:  { padding:12, color:'#e0e0e0', fontFamily:'JetBrains Mono,monospace', fontSize:11 },
  title: { color:'#00ffc8', fontSize:13, fontWeight:700, marginBottom:10 },
  row:   { display:'flex', alignItems:'center', gap:6, padding:'4px 0', borderBottom:'1px solid #111' },
  key:   { width:28, height:28, display:'flex', alignItems:'center', justifyContent:'center',
           border:'1px solid #333', borderRadius:4, background:'#111', color:'#FF6600', fontWeight:700, cursor:'pointer' },
  label: { flex:1, color:'#ccc' },
  action:{ color:'#888', fontSize:10, flex:1 },
  badge: (c) => ({ padding:'1px 6px', borderRadius:10, background:`${c}22`, color:c, fontSize:9, border:`1px solid ${c}44` }),
  btn:   (c='#00ffc8') => ({ padding:'4px 12px', border:`1px solid ${c}`, borderRadius:4, background:'transparent', color:c, cursor:'pointer', fontSize:10 }),
  status:{ color:'#FF6600', fontSize:10, marginTop:8 },
};

export function TriggersPanel({ onCycle, onExpression, setStatus: setParentStatus }) {
  const [triggers, setTriggers] = useState([...DEFAULT_TRIGGERS]);
  const [active,   setActive]   = useState(false);
  const [lastFired,setLastFired]= useState('');
  const engineRef = useRef(null);

  useEffect(() => {
    engineRef.current = new TriggerEngine({
      onCycle:      (n) => { onCycle?.(n);      setLastFired(`▶ ${n}`); },
      onExpression: (e) => { onExpression?.(e); setLastFired(`😊 expr`); },
    });
    return () => engineRef.current?.stop();
  }, []);

  const toggle = () => {
    if (active) { engineRef.current?.stop(); setActive(false); }
    else        { engineRef.current?.start(); setActive(true); }
  };

  return (
    <div style={S.root}>
      <div style={S.title}>⌨️ Keyboard Triggers</div>
      <div style={{ marginBottom:8, display:'flex', gap:6, alignItems:'center' }}>
        <button style={S.btn(active ? '#ff4444' : '#00ffc8')} onClick={toggle}>
          {active ? '⏹ Stop Listening' : '▶ Start Listening'}
        </button>
        {active && <span style={{ color:'#00ffc8', fontSize:10 }}>● LIVE</span>}
      </div>
      <div style={{ maxHeight:320, overflowY:'auto' }}>
        {triggers.map((t, i) => (
          <div key={i} style={S.row}>
            <div style={S.key}>{t.key.toUpperCase()}</div>
            <span style={S.label}>{t.label}</span>
            <span style={S.action}>{t.action}</span>
            <span style={S.badge(t.color)}>{t.action.split(':')[0]}</span>
          </div>
        ))}
      </div>
      <div style={S.status}>{lastFired || 'Press a trigger key while listening'}</div>
    </div>
  );
}

// =============================================================================
// MotionLibraryPanel.jsx — Browse + apply pre-built motions
// =============================================================================
import { MOTION_LIBRARY, getCategories, MotionPlayer } from '../../utils/PuppetMotionLibrary.js';

export function MotionLibraryPanel({ onMotionFrame, setStatus }) {
  const [cat,     setCat]     = useState('all');
  const [playing, setPlaying] = useState(null);
  const playerRef             = useRef(null);

  useEffect(() => {
    playerRef.current = new MotionPlayer((frame, id) => onMotionFrame?.(frame, id));
    return () => playerRef.current?.stop();
  }, []);

  const cats = ['all', ...getCategories()];
  const filtered = cat === 'all' ? MOTION_LIBRARY : MOTION_LIBRARY.filter(m => m.category === cat);

  const playMotion = (id) => {
    playerRef.current?.play(id);
    setPlaying(id);
    setStatus?.(`▶ ${MOTION_LIBRARY.find(m=>m.id===id)?.name}`);
  };

  const stopMotion = () => {
    playerRef.current?.stop();
    setPlaying(null);
    setStatus?.('Motion stopped');
  };

  return (
    <div style={S.root}>
      <div style={S.title}>🎬 Motion Library</div>
      <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:8 }}>
        {cats.map(c => (
          <button key={c} style={{ ...S.btn(cat===c?'#00ffc8':'#444'), padding:'2px 8px', textTransform:'capitalize' }}
            onClick={() => setCat(c)}>{c}</button>
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
        {filtered.map(m => (
          <div key={m.id} style={{ border:`1px solid ${playing===m.id?'#00ffc8':'#222'}`, borderRadius:6, padding:8, cursor:'pointer',
            background: playing===m.id ? 'rgba(0,255,200,0.06)' : '#0a0a14' }}
            onClick={() => playing===m.id ? stopMotion() : playMotion(m.id)}>
            <div style={{ fontSize:20, textAlign:'center' }}>{m.thumbnail}</div>
            <div style={{ textAlign:'center', color: playing===m.id?'#00ffc8':'#ccc', fontSize:10, marginTop:4 }}>{m.name}</div>
            <div style={{ textAlign:'center', color:'#555', fontSize:9 }}>{m.duration}s {m.loop?'loop':''}</div>
          </div>
        ))}
      </div>
      {playing && <button style={{ ...S.btn('#ff4444'), marginTop:8, width:'100%' }} onClick={stopMotion}>⏹ Stop</button>}
    </div>
  );
}

// =============================================================================
// FacialSlidersPanel.jsx — Manual facial control sliders
// =============================================================================
import { FACIAL_PARAMS, FACE_PRESETS, FacialAnimator, defaultFacialState } from '../../utils/PuppetFacialSliders.js';

export function FacialSlidersPanel({ onFacialUpdate, mediaPipeState, blendWeight = 0.5 }) {
  const [manual,   setManual]   = useState(defaultFacialState);
  const [blend,    setBlend]    = useState(blendWeight);
  const [preset,   setPreset]   = useState('neutral');
  const animRef                  = useRef(null);

  useEffect(() => {
    animRef.current = new FacialAnimator((state) => onFacialUpdate?.(state));
    animRef.current.setTarget(manual);
    return () => animRef.current?.stop();
  }, []);

  const handleSlider = (id, val) => {
    const next = { ...manual, [id]: val };
    setManual(next);
    animRef.current?.setTarget(next);
  };

  const applyPreset = (name) => {
    setPreset(name);
    const p = FACE_PRESETS[name];
    if (!p) return;
    const next = { ...manual, ...p };
    setManual(next);
    animRef.current?.setTarget(next);
  };

  return (
    <div style={S.root}>
      <div style={S.title}>😊 Facial Sliders</div>

      {/* Presets */}
      <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:10 }}>
        {Object.keys(FACE_PRESETS).map(name => (
          <button key={name} style={{ ...S.btn(preset===name?'#00ffc8':'#444'), padding:'2px 8px', textTransform:'capitalize' }}
            onClick={() => applyPreset(name)}>{name}</button>
        ))}
      </div>

      {/* MediaPipe blend */}
      {mediaPipeState && (
        <div style={{ marginBottom:8, display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ color:'#888', fontSize:10 }}>MediaPipe blend</span>
          <input type="range" min={0} max={1} step={0.05} value={blend}
            onChange={e => setBlend(Number(e.target.value))} style={{ flex:1 }}/>
          <span style={{ color:'#FF6600', fontSize:10 }}>{Math.round(blend*100)}%</span>
        </div>
      )}

      {/* Sliders */}
      <div style={{ maxHeight:280, overflowY:'auto' }}>
        {FACIAL_PARAMS.map(p => (
          <div key={p.id} style={{ display:'flex', alignItems:'center', gap:6, padding:'3px 0', borderBottom:'1px solid #0d0d1a' }}>
            <span style={{ width:72, color:'#888', fontSize:10 }}>{p.label}</span>
            <input type="range" min={p.min} max={p.max} step={(p.max-p.min)/100}
              value={manual[p.id] ?? p.default}
              onChange={e => handleSlider(p.id, Number(e.target.value))}
              style={{ flex:1 }}/>
            <span style={{ width:32, color:'#FF6600', fontSize:10, textAlign:'right' }}>
              {(manual[p.id] ?? p.default).toFixed(1)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// CharacterLibraryPanel.jsx — Built-in characters + sprite sheet import
// =============================================================================
import { BUILT_IN_CHARACTERS, getCategories as getCharCats, importSpriteSheet } from '../../utils/PuppetCharacterLibrary.js';

export function CharacterLibraryPanel({ onAddCharacter, setStatus }) {
  const [cat,      setCat]     = useState('all');
  const [ssFrame,  setSsFrame] = useState({ w:64, h:64 });
  const cats = ['all', ...getCharCats()];
  const filtered = cat==='all' ? BUILT_IN_CHARACTERS : BUILT_IN_CHARACTERS.filter(c=>c.category===cat);

  const handleSpriteImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setStatus?.('Importing sprite sheet…');
    try {
      const result = await importSpriteSheet(file, ssFrame.w, ssFrame.h);
      setStatus?.(`✅ ${result.total} frames imported`);
      onAddCharacter?.({ id:`sprite_${Date.now()}`, name:file.name, spriteFrames:result.frames, category:'sprite' });
    } catch(e) {
      setStatus?.('Import failed: '+e.message);
    }
  };

  return (
    <div style={S.root}>
      <div style={S.title}>🎭 Character Library</div>

      {/* Category filter */}
      <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:8 }}>
        {cats.map(c => (
          <button key={c} style={{ ...S.btn(cat===c?'#00ffc8':'#444'), padding:'2px 8px', textTransform:'capitalize' }}
            onClick={() => setCat(c)}>{c}</button>
        ))}
      </div>

      {/* Built-in grid */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:12 }}>
        {filtered.map(c => (
          <div key={c.id} style={{ border:'1px solid #222', borderRadius:6, padding:8, cursor:'pointer', background:'#0a0a14' }}
            onClick={() => { onAddCharacter?.(c); setStatus?.(`Added ${c.name}`); }}>
            <div style={{ fontSize:24, textAlign:'center' }}>{c.thumbnail}</div>
            <div style={{ textAlign:'center', color:'#ccc', fontSize:10, marginTop:4 }}>{c.name}</div>
            <div style={{ textAlign:'center', color:'#555', fontSize:9, textTransform:'capitalize' }}>{c.category}</div>
          </div>
        ))}
      </div>

      {/* Sprite sheet import */}
      <div style={{ borderTop:'1px solid #1a1a2e', paddingTop:10 }}>
        <div style={{ color:'#888', fontSize:10, marginBottom:6 }}>📋 Import Sprite Sheet</div>
        <div style={{ display:'flex', gap:6, alignItems:'center', marginBottom:6 }}>
          <span style={{ color:'#666', fontSize:10 }}>Frame W</span>
          <input type="number" value={ssFrame.w} onChange={e=>setSsFrame(p=>({...p,w:+e.target.value}))}
            style={{ width:50, background:'#111', border:'1px solid #333', color:'#ccc', padding:'2px 4px', borderRadius:3, fontSize:10 }}/>
          <span style={{ color:'#666', fontSize:10 }}>H</span>
          <input type="number" value={ssFrame.h} onChange={e=>setSsFrame(p=>({...p,h:+e.target.value}))}
            style={{ width:50, background:'#111', border:'1px solid #333', color:'#ccc', padding:'2px 4px', borderRadius:3, fontSize:10 }}/>
        </div>
        <label style={{ ...S.btn('#FF6600'), display:'inline-block', cursor:'pointer' }}>
          📂 Import Sheet
          <input type="file" accept="image/*" style={{ display:'none' }} onChange={handleSpriteImport}/>
        </label>
      </div>
    </div>
  );
}
import { autoRigImage } from '../../utils/PuppetAutoRig.js';

const S = {
  root:   { padding:16, color:'#e0e0e0', fontFamily:'JetBrains Mono,monospace', fontSize:12 },
  title:  { color:'#00ffc8', fontSize:13, fontWeight:700, marginBottom:12 },
  drop:   { border:'2px dashed #333', borderRadius:8, padding:32, textAlign:'center', cursor:'pointer', color:'#555', fontSize:11, marginBottom:12 },
  btn:    (c='#00ffc8') => ({ padding:'6px 16px', border:`1px solid ${c}`, borderRadius:4, background:'transparent', color:c, cursor:'pointer', fontSize:11, margin:'4px 2px' }),
  status: { color:'#FF6600', fontSize:10, marginTop:8, minHeight:16 },
  preview:{ width:'100%', borderRadius:6, marginTop:8, border:'1px solid #222' },
  joint:  { display:'flex', justifyContent:'space-between', padding:'3px 6px', borderBottom:'1px solid #111', fontSize:10 },
};

export function AutoRigPanel({ onRigComplete, setStatus: setParentStatus }) {
  const [status,    setStatus]    = useState('Drop a character image to auto-rig');
  const [preview,   setPreview]   = useState(null);
  const [rig,       setRig]       = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [showJoints,setShowJoints]= useState(false);
  const inputRef = useRef();

  const processFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setStatus('Please drop an image file (PNG, JPG, etc.)');
      return;
    }
    setLoading(true);
    setStatus('Analyzing character…');
    try {
      const result = await autoRigImage(file);
      setRig(result.rig);
      setPreview(result.imageUrl);
      setStatus(`✅ Auto-rig complete — ${Object.keys(result.rig.joints).length} joints detected`);
    } catch (e) {
      setStatus('Auto-rig failed: ' + e.message);
    }
    setLoading(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    processFile(e.dataTransfer.files[0]);
  };

  const handleApply = () => {
    if (!rig) return;
    onRigComplete?.(rig);
    setParentStatus?.('✅ Rig applied to character');
    setStatus('Rig applied ✓');
  };

  return (
    <div style={S.root}>
      <div style={S.title}>🦾 Auto-Rig from Image</div>

      <div
        style={S.drop}
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
      >
        {loading ? '⏳ Analyzing…' : '📁 Drop character image here or click to browse'}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display:'none' }}
          onChange={e => processFile(e.target.files[0])}
        />
      </div>

      {preview && (
        <img src={preview} alt="character preview" style={S.preview} />
      )}

      {rig && (
        <>
          <div style={{ marginTop:8, display:'flex', gap:4, flexWrap:'wrap' }}>
            <button style={S.btn()} onClick={handleApply}>✅ Apply Rig</button>
            <button style={S.btn('#888')} onClick={() => setShowJoints(v => !v)}>
              {showJoints ? '▲ Hide' : '▼ Show'} Joints ({Object.keys(rig.joints).length})
            </button>
            <button style={S.btn('#555')} onClick={() => { setRig(null); setPreview(null); setStatus('Ready'); }}>
              ✕ Clear
            </button>
          </div>

          {showJoints && (
            <div style={{ marginTop:8, maxHeight:200, overflowY:'auto', border:'1px solid #1a1a2e', borderRadius:4 }}>
              {Object.entries(rig.joints).map(([name, j]) => (
                <div key={name} style={S.joint}>
                  <span style={{ color:'#00ffc8' }}>{name}</span>
                  <span style={{ color:'#888' }}>x:{Math.round(j.x)} y:{Math.round(j.y)}</span>
                  <span style={{ color:'#FF6600' }}>{rig.tags[name] || ''}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <div style={S.status}>{status}</div>
    </div>
  );
}
