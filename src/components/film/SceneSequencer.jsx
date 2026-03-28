
import React, { useState } from 'react';
export default function SceneSequencer({ scenes, activeScene, onSelectScene, onAddScene, onDeleteScene, onReorderScene }) {
  const [dragging, setDragging] = useState(null);
  const total = scenes.reduce((s,sc)=>s+(sc.duration||5),0);
  return (
    <div style={{background:'#06060f',borderTop:'1px solid #21262d',padding:'5px 10px',flexShrink:0}}>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
        <span style={{fontSize:9,color:'#6b7280',letterSpacing:1,textTransform:'uppercase'}}>Scenes - {scenes.length} - {total.toFixed(1)}s</span>
        <button onClick={onAddScene} style={{marginLeft:'auto',padding:'2px 8px',border:'1px solid #00ffc8',borderRadius:4,background:'rgba(0,255,200,0.1)',color:'#00ffc8',cursor:'pointer',fontSize:10}}>+ Scene</button>
      </div>
      <div style={{display:'flex',gap:4,overflowX:'auto',paddingBottom:2}}>
        {scenes.map((scene,i)=>(
          <div key={scene.id} draggable onDragStart={()=>setDragging(i)} onDragOver={e=>e.preventDefault()} onDrop={()=>{onReorderScene&&onReorderScene(dragging,i);setDragging(null);}} onClick={()=>onSelectScene(scene.id)}
            style={{flexShrink:0,width:Math.max(70,(scene.duration||5)*16),height:44,borderRadius:5,border:'2px solid',borderColor:scene.id===activeScene?'#00ffc8':'#21262d',background:scene.id===activeScene?'rgba(0,255,200,0.08)':'#0d1117',cursor:'pointer',position:'relative',padding:'3px 5px'}}>
            <div style={{fontSize:10,color:scene.id===activeScene?'#00ffc8':'#e0e0e0',fontWeight:600}}>{i+1}. {scene.name||'Scene'}</div>
            <div style={{fontSize:9,color:'#6b7280'}}>{(scene.duration||5).toFixed(1)}s</div>
            <button onClick={e=>{e.stopPropagation();onDeleteScene&&onDeleteScene(scene.id);}} style={{position:'absolute',top:2,right:2,background:'none',border:'none',color:'#6b7280',cursor:'pointer',fontSize:10,padding:0}}>x</button>
          </div>
        ))}
        {scenes.length===0&&<div style={{color:'#6b7280',fontSize:11,padding:'8px 0'}}>Click + Scene to start</div>}
      </div>
    </div>
  );
}
