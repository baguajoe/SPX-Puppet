import React, { useState, useRef } from 'react';
import SPXMotionImporter from '../pipeline/SPXMotionImporter';

const T={bg:"#06060f",panel:"#0d0d1a",border:"#1a1a2e",teal:"#00ffc8",orange:"#FF6600",text:"#e0e0e0",muted:"#aaa",font:"JetBrains Mono,monospace"};
const S={
  root:{background:T.bg,color:T.text,fontFamily:T.font,padding:16,height:"100%",overflowY:"auto"},
  h2:{color:T.teal,fontSize:14,marginBottom:12,letterSpacing:1},
  lbl:{fontSize:11,color:T.muted,display:"block",marginBottom:4},
  inp:{width:"100%",background:T.panel,border:"1px solid "+T.border,color:T.text,padding:"4px 8px",borderRadius:4,fontFamily:T.font,fontSize:11,marginBottom:8,boxSizing:"border-box"},
  btn:{background:T.teal,color:T.bg,border:"none",borderRadius:4,padding:"7px 16px",fontFamily:T.font,fontSize:12,fontWeight:700,cursor:"pointer",marginRight:8,marginBottom:8},
  btnO:{background:T.orange,color:"#fff",border:"none",borderRadius:4,padding:"7px 16px",fontFamily:T.font,fontSize:12,fontWeight:700,cursor:"pointer",marginRight:8,marginBottom:8},
  btnRed:{background:"#cc2200",color:"#fff",border:"none",borderRadius:4,padding:"7px 16px",fontFamily:T.font,fontSize:12,fontWeight:700,cursor:"pointer",marginRight:8,marginBottom:8},
  sec:{background:T.panel,border:"1px solid "+T.border,borderRadius:6,padding:12,marginBottom:12},
  stat:{fontSize:11,color:T.teal,marginBottom:4},
  progress:(p)=>({width:`${p*100}%`,height:4,background:T.teal,borderRadius:2,transition:"width .05s"}),
  track:{background:"#1a1a2e",borderRadius:4,height:4,marginBottom:8,cursor:"pointer",position:"relative"},
};

export default function SPXMotionPlayerPanel({ onFrame }) {
  const [loaded,setLoaded]=useState(null);
  const [playing,setPlaying]=useState(false);
  const [loop,setLoop]=useState(true);
  const [speed,setSpeed]=useState(1.0);
  const [progress,setProgress]=useState(0);
  const [currentTime,setCurrentTime]=useState(0);
  const [status,setStatus]=useState('');
  const importerRef=useRef(new SPXMotionImporter());
  const raf=useRef(null);
  const startT=useRef(0);
  const pausedAt=useRef(0);

  async function loadFile(file){
    try{
      const motion=await importerRef.current.loadFromFile(file);
      setLoaded({name:motion.name,duration:motion.duration,fps:motion.fps,bones:motion.bones.length,frames:motion.frames.length});
      setStatus(`✓ Loaded: ${motion.name} (${motion.duration.toFixed(2)}s, ${motion.bones.length} bones)`);
      setProgress(0);setCurrentTime(0);
    }catch(e){setStatus('Error: '+e.message);}
  }

  function startPlay(){
    const imp=importerRef.current;
    if(!imp.motion){setStatus('No motion loaded');return;}
    setPlaying(true);
    if(loop){
      imp.loop(kf=>{
        onFrame&&onFrame(kf);
        const elapsed=(performance.now()-startT.current)/1000*speed;
        const t=((elapsed%imp.duration)+imp.duration)%imp.duration;
        setProgress(t/imp.duration);setCurrentTime(t);
      });
    } else {
      imp.play(kf=>{
        onFrame&&onFrame(kf);
        const elapsed=(performance.now()-startT.current)/1000*speed;
        setProgress(Math.min(1,elapsed/imp.duration));setCurrentTime(Math.min(elapsed,imp.duration));
      },()=>{setPlaying(false);setProgress(1);setStatus('Playback complete');});
    }
    startT.current=performance.now()-pausedAt.current*1000/speed;
    setStatus('Playing…');
  }

  function stopPlay(){
    importerRef.current.stop();
    pausedAt.current=currentTime;
    setPlaying(false);setStatus('Paused');
  }

  function resetPlay(){
    importerRef.current.stop();
    setPlaying(false);setProgress(0);setCurrentTime(0);pausedAt.current=0;setStatus('Reset');
  }

  function seekTo(e){
    if(!loaded)return;
    const rect=e.currentTarget.getBoundingClientRect();
    const p=(e.clientX-rect.left)/rect.width;
    const t=p*loaded.duration;
    pausedAt.current=t;setCurrentTime(t);setProgress(p);
    const kf=importerRef.current.getFrameAt(t);
    onFrame&&onFrame(kf);
  }

  return(
    <div style={S.root}>
      <div style={S.h2}>🎭 SPXMOTION PLAYER</div>
      <div style={S.sec}>
        <label style={S.btn}>
          📁 Load .spxmotion
          <input type="file" accept=".spxmotion,.json" style={{display:'none'}}
            onChange={e=>e.target.files[0]&&loadFile(e.target.files[0])}/>
        </label>
        {status&&<div style={{...S.stat,marginTop:4}}>{status}</div>}
      </div>

      {loaded&&<>
        <div style={S.sec}>
          <div style={S.stat}>Name: {loaded.name}</div>
          <div style={S.stat}>Duration: {loaded.duration.toFixed(2)}s @ {loaded.fps}fps</div>
          <div style={S.stat}>Bones: {loaded.bones} | Frames: {loaded.frames}</div>
        </div>

        <div style={S.sec}>
          <div style={S.track} onClick={seekTo}>
            <div style={S.progress(progress)}/>
          </div>
          <div style={{fontSize:10,color:T.muted,marginBottom:8}}>
            {currentTime.toFixed(2)}s / {loaded.duration.toFixed(2)}s
          </div>
          {!playing
            ?<button style={S.btn} onClick={startPlay}>▶ Play</button>
            :<button style={S.btnRed} onClick={stopPlay}>⏸ Pause</button>
          }
          <button style={S.btnO} onClick={resetPlay}>⏮ Reset</button>
          <label style={{...S.lbl,cursor:'pointer',marginTop:8}}>
            <input type="checkbox" checked={loop} onChange={e=>setLoop(e.target.checked)}/> Loop
          </label>
          <label style={S.lbl}>Speed: {speed.toFixed(2)}x</label>
          <input style={S.inp} type="range" min={0.1} max={3} step={0.05} value={speed} onChange={e=>setSpeed(+e.target.value)}/>
        </div>
      </>}

      <div style={S.sec}>
        <div style={{fontSize:10,color:'#888',lineHeight:1.7}}>
          .spxmotion files are generated by:<br/>
          • SPX Mesh Editor → Export to Puppet button<br/>
          • Video Body Mocap panel<br/>
          • Face Mocap panel<br/>
          Compatible with all SPX Puppet bone names
        </div>
      </div>
    </div>
  );
}