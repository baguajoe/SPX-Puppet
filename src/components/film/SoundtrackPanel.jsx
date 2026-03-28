
import React, { useState } from 'react';
const SFX = [{id:'pop',label:'Pop',freq:800},{id:'bell',label:'Bell',freq:880},{id:'drum',label:'Drum',freq:100},{id:'whoosh',label:'Whoosh',freq:200},{id:'magic',label:'Magic',freq:1000},{id:'thunder',label:'Thunder',freq:60}];
const MUSIC = [{id:'upbeat',label:'Upbeat Pop',bpm:120,mood:'happy'},{id:'dramatic',label:'Epic Drama',bpm:90,mood:'tense'},{id:'chill',label:'Lo-fi Chill',bpm:80,mood:'calm'},{id:'action',label:'Action',bpm:140,mood:'intense'}];
export default function SoundtrackPanel({ onPlaySFX, onSetBGMusic, currentBGMusic }) {
  const [tab, setTab] = useState('sfx');
  const [volume, setVolume] = useState(0.7);
  const play = (sfx) => { try { const ctx=new (window.AudioContext||window.webkitAudioContext)(); const osc=ctx.createOscillator(); const g=ctx.createGain(); osc.connect(g); g.connect(ctx.destination); osc.frequency.value=sfx.freq; g.gain.value=volume; osc.start(); g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.3); setTimeout(()=>{osc.stop();ctx.close();},400); } catch(e){} onPlaySFX&&onPlaySFX(sfx); };
  return (
    <div>
      <div style={{fontSize:10,color:'#6b7280',letterSpacing:1,textTransform:'uppercase',marginBottom:6}}>Soundtrack</div>
      <div style={{display:'flex',gap:4,marginBottom:8}}>
        {[['sfx','SFX'],['music','Music']].map(([id,lbl])=><button key={id} onClick={()=>setTab(id)} style={{flex:1,padding:'4px',borderRadius:4,border:'1px solid',fontSize:10,cursor:'pointer',borderColor:tab===id?'#00ffc8':'#21262d',background:tab===id?'rgba(0,255,200,0.1)':'transparent',color:tab===id?'#00ffc8':'#6b7280'}}>{lbl}</button>)}
      </div>
      <div style={{marginBottom:8}}>
        <div style={{fontSize:9,color:'#6b7280',marginBottom:2}}>Volume: {Math.round(volume*100)}%</div>
        <input type="range" min={0} max={1} step={0.05} value={volume} onChange={e=>setVolume(Number(e.target.value))} style={{width:'100%',accentColor:'#00ffc8'}} />
      </div>
      {tab==='sfx'&&<div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:4}}>{SFX.map(sfx=><button key={sfx.id} onClick={()=>play(sfx)} style={{padding:'8px 4px',borderRadius:5,border:'1px solid #21262d',background:'#0d1117',cursor:'pointer',fontSize:11,color:'#e0e0e0'}}>{sfx.label}</button>)}</div>}
      {tab==='music'&&<div style={{display:'flex',flexDirection:'column',gap:4}}>{MUSIC.map(m=><button key={m.id} onClick={()=>onSetBGMusic&&onSetBGMusic(m)} style={{padding:'6px 8px',borderRadius:5,border:'1px solid',textAlign:'left',cursor:'pointer',borderColor:currentBGMusic&&currentBGMusic.id===m.id?'#00ffc8':'#21262d',background:currentBGMusic&&currentBGMusic.id===m.id?'rgba(0,255,200,0.08)':'#0d1117',color:currentBGMusic&&currentBGMusic.id===m.id?'#00ffc8':'#e0e0e0'}}><div style={{fontSize:11,fontWeight:600}}>{m.label}</div><div style={{fontSize:9,color:'#6b7280'}}>{m.bpm} BPM</div></button>)}</div>}
    </div>
  );
}
