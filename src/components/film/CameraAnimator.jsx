
import React, { useState } from 'react';
const MOVES = [{id:'static',icon:'Cam',label:'Static'},{id:'pan_left',icon:'PanL',label:'Pan L'},{id:'pan_right',icon:'PanR',label:'Pan R'},{id:'zoom_in',icon:'ZIn',label:'Zoom In'},{id:'zoom_out',icon:'ZOut',label:'Zoom Out'},{id:'tilt_up',icon:'TUp',label:'Tilt Up'},{id:'tilt_down',icon:'TDn',label:'Tilt Dn'},{id:'shake',icon:'Shk',label:'Shake'},{id:'dolly',icon:'Dly',label:'Dolly'}];
export default function CameraAnimator({ onApplyMove, currentMove, onKeyframe }) {
  const [speed, setSpeed] = useState(1.0);
  const [intensity, setIntensity] = useState(0.5);
  return (
    <div>
      <div style={{fontSize:10,color:'#6b7280',letterSpacing:1,textTransform:'uppercase',marginBottom:6}}>Camera Moves</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:4,marginBottom:8}}>
        {MOVES.map(m=>(
          <button key={m.id} onClick={()=>onApplyMove&&onApplyMove(m.id,{speed,intensity})}
            style={{padding:'5px 3px',borderRadius:5,border:'1px solid',cursor:'pointer',textAlign:'center',borderColor:currentMove===m.id?'#00ffc8':'#21262d',background:currentMove===m.id?'rgba(0,255,200,0.1)':'#0d1117',color:currentMove===m.id?'#00ffc8':'#e0e0e0'}}>
            <div style={{fontSize:10}}>{m.icon}</div>
            <div style={{fontSize:8,color:'#6b7280',marginTop:1}}>{m.label}</div>
          </button>
        ))}
      </div>
      <div style={{marginBottom:5}}>
        <div style={{fontSize:9,color:'#6b7280',marginBottom:2}}>Speed: {speed.toFixed(1)}x</div>
        <input type="range" min={0.1} max={5} step={0.1} value={speed} onChange={e=>setSpeed(Number(e.target.value))} style={{width:'100%',accentColor:'#00ffc8'}} />
      </div>
      <div style={{marginBottom:8}}>
        <div style={{fontSize:9,color:'#6b7280',marginBottom:2}}>Intensity: {intensity.toFixed(2)}</div>
        <input type="range" min={0.1} max={1} step={0.05} value={intensity} onChange={e=>setIntensity(Number(e.target.value))} style={{width:'100%',accentColor:'#00ffc8'}} />
      </div>
      <button onClick={()=>onKeyframe&&onKeyframe('camera')} style={{width:'100%',padding:'5px',border:'1px solid #00ffc8',borderRadius:5,background:'rgba(0,255,200,0.1)',color:'#00ffc8',cursor:'pointer',fontSize:11}}>Set Camera Keyframe</button>
    </div>
  );
}
