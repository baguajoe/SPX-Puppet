
import React, { useState, useRef } from 'react';
const TRACKS = ['Body','Head','L.Arm','R.Arm','L.Leg','R.Leg','Camera','Audio'];
const FW = 8;
export default function KeyframeTimeline({ totalFrames=300, currentFrame=0, fps=30, onScrub, onAddKeyframe, onDeleteKeyframe, keyframes={}, isPlaying, isRecording, onPlay, onPause, onStop, onRecord, onStopRecord }) {
  const [zoom, setZoom] = useState(1);
  const scrollRef = useRef(null);
  const fmt = (f) => { const s=f/fps; return Math.floor(s/60)+':'+(s%60).toFixed(1).padStart(4,'0'); };
  const gx = (f) => f*FW*zoom;
  const B = {padding:'3px 7px',border:'1px solid #21262d',borderRadius:4,background:'#1a1a2e',color:'#e0e0e0',cursor:'pointer',fontSize:11};
  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',background:'#0d1117',borderTop:'1px solid #21262d'}}>
      <div style={{display:'flex',alignItems:'center',gap:5,padding:'3px 8px',borderBottom:'1px solid #21262d',flexShrink:0}}>
        <button style={B} onClick={onStop}>{'|<'}</button>
        <button style={B} onClick={isPlaying?onPause:onPlay}>{isPlaying?'||':'>'}</button>
        <button style={{...B,borderColor:isRecording?'#ef4444':'#21262d',color:isRecording?'#ef4444':'#e0e0e0'}} onClick={isRecording?onStopRecord:onRecord}>{isRecording?'Stop':'Rec'}</button>
        <span style={{fontSize:10,color:'#6b7280',minWidth:80}}>{fmt(currentFrame)} / {fmt(totalFrames)}</span>
        <button style={{...B,borderColor:'#00ffc8',color:'#00ffc8'}} onClick={()=>onAddKeyframe&&onAddKeyframe(currentFrame,'Body')}>Key</button>
        <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:4}}>
          <span style={{fontSize:9,color:'#6b7280'}}>Zoom</span>
          <input type="range" min={0.5} max={4} step={0.1} value={zoom} onChange={e=>setZoom(Number(e.target.value))} style={{width:50,accentColor:'#00ffc8'}} />
        </div>
      </div>
      <div style={{display:'flex',flex:1,overflow:'hidden'}}>
        <div style={{width:70,flexShrink:0,borderRight:'1px solid #21262d'}}>
          <div style={{height:18,borderBottom:'1px solid #21262d'}} />
          {TRACKS.map(t=><div key={t} style={{height:28,display:'flex',alignItems:'center',padding:'0 6px',fontSize:9,color:'#6b7280',borderBottom:'1px solid rgba(33,38,45,0.5)'}}>{t}</div>)}
        </div>
        <div ref={scrollRef} style={{flex:1,overflowX:'auto',position:'relative'}}>
          <div style={{width:gx(totalFrames)+100,position:'relative'}}>
            <div style={{height:18,background:'#06060f',borderBottom:'1px solid #21262d',cursor:'pointer',position:'sticky',top:0,zIndex:5}}
              onClick={e=>{const r=e.currentTarget.getBoundingClientRect();const x=e.clientX-r.left+(scrollRef.current?scrollRef.current.scrollLeft:0);onScrub&&onScrub(Math.max(0,Math.min(totalFrames,Math.round(x/(FW*zoom)))));}} >
              {Array.from({length:Math.ceil(totalFrames/fps)+1},(_,i)=>(
                <div key={i} style={{position:'absolute',left:gx(i*fps),fontSize:8,color:'#6b7280',paddingLeft:2}}>{fmt(i*fps)}</div>
              ))}
              <div style={{position:'absolute',top:0,bottom:0,left:gx(currentFrame),width:2,background:'#00ffc8',zIndex:10,pointerEvents:'none'}} />
            </div>
            {TRACKS.map(track=>(
              <div key={track} style={{height:28,borderBottom:'1px solid rgba(33,38,45,0.5)',position:'relative',cursor:'pointer',background:'rgba(0,0,0,0.2)'}}
                onClick={e=>{const r=e.currentTarget.getBoundingClientRect();const x=e.clientX-r.left+(scrollRef.current?scrollRef.current.scrollLeft:0);onAddKeyframe&&onAddKeyframe(Math.round(x/(FW*zoom)),track);}}>
                {(keyframes[track]||[]).map((kf,i)=>(
                  <div key={i} onContextMenu={e=>{e.preventDefault();onDeleteKeyframe&&onDeleteKeyframe(kf.frame,track);}}
                    style={{position:'absolute',left:gx(kf.frame)-4,top:'50%',transform:'translateY(-50%) rotate(45deg)',width:8,height:8,background:'#00ffc8',border:'1px solid #006644',cursor:'pointer',zIndex:2}} />
                ))}
                <div style={{position:'absolute',top:0,bottom:0,left:gx(currentFrame),width:2,background:'rgba(0,255,200,0.3)',pointerEvents:'none'}} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
