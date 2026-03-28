
import React, { useState } from 'react';
const STYLES = [{id:'speech',icon:'Speech',label:'Speech'},{id:'thought',icon:'Think',label:'Thought'},{id:'caption',icon:'Cap',label:'Caption'},{id:'shout',icon:'Shout',label:'Shout'}];
export default function DialogueSystem({ characters, onAddDialogue, dialogues=[], currentFrame, fps=30 }) {
  const [text, setText] = useState('');
  const [charId, setCharId] = useState('');
  const [duration, setDuration] = useState(3);
  const [style, setStyle] = useState('speech');
  const active = dialogues.filter(d=>currentFrame>=d.startFrame&&currentFrame<=d.endFrame);
  const add = () => { if(!text.trim()) return; onAddDialogue&&onAddDialogue({id:crypto.randomUUID(),text,charId,style,startFrame:currentFrame,endFrame:currentFrame+Math.round(duration*fps)}); setText(''); };
  return (
    <div>
      <div style={{fontSize:10,color:'#6b7280',letterSpacing:1,textTransform:'uppercase',marginBottom:6}}>Dialogue</div>
      {active.length>0&&<div style={{marginBottom:8,padding:6,background:'rgba(0,255,200,0.05)',border:'1px solid rgba(0,255,200,0.2)',borderRadius:5}}>{active.map(d=><div key={d.id} style={{fontSize:11,color:'#e0e0e0'}}>{d.text}</div>)}</div>}
      <select value={charId} onChange={e=>setCharId(e.target.value)} style={{width:'100%',background:'#0d1117',border:'1px solid #21262d',borderRadius:4,color:'#e0e0e0',padding:'4px 6px',fontSize:11,marginBottom:5}}>
        <option value="">Character...</option>
        {characters.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Dialogue..." style={{width:'100%',background:'#0d1117',border:'1px solid #21262d',borderRadius:4,color:'#e0e0e0',padding:'5px',fontSize:11,resize:'vertical',minHeight:50,marginBottom:5}} />
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:3,marginBottom:6}}>
        {STYLES.map(s=><button key={s.id} onClick={()=>setStyle(s.id)} style={{padding:'4px 2px',borderRadius:4,border:'1px solid',textAlign:'center',cursor:'pointer',borderColor:style===s.id?'#00ffc8':'#21262d',background:style===s.id?'rgba(0,255,200,0.1)':'transparent',color:style===s.id?'#00ffc8':'#6b7280',fontSize:10}}>{s.label}</button>)}
      </div>
      <div style={{marginBottom:6}}>
        <div style={{fontSize:9,color:'#6b7280',marginBottom:2}}>Duration: {duration}s</div>
        <input type="range" min={0.5} max={10} step={0.5} value={duration} onChange={e=>setDuration(Number(e.target.value))} style={{width:'100%',accentColor:'#00ffc8'}} />
      </div>
      <button onClick={add} style={{width:'100%',padding:'5px',border:'1px solid #00ffc8',borderRadius:5,background:'rgba(0,255,200,0.1)',color:'#00ffc8',cursor:'pointer',fontSize:11}}>+ Add Dialogue</button>
      {dialogues.length>0&&<div style={{marginTop:8}}>{dialogues.map(d=><div key={d.id} style={{padding:'3px 6px',borderRadius:4,border:'1px solid #21262d',marginBottom:3,fontSize:10,color:'#aaa',display:'flex',justifyContent:'space-between'}}><span>{d.text.slice(0,25)}{d.text.length>25?'...':''}</span><span style={{fontSize:9,color:'#6b7280'}}>f{d.startFrame}</span></div>)}</div>}
    </div>
  );
}
