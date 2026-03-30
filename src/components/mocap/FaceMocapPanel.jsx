import React, { useState, useRef, useEffect } from 'react';

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
  bar:{background:"#1a1a2e",borderRadius:3,height:8,marginBottom:4},
  barFill:(v)=>({width:`${Math.round(Math.max(0,Math.min(1,v))*100)}%`,height:"100%",background:T.teal,borderRadius:3}),
  canvas:{width:"100%",borderRadius:6,border:"1px solid "+T.border,background:"#000",display:"block"},
};

function dist(a,b){ if(!a||!b)return 0; return Math.sqrt((a.x-b.x)**2+(a.y-b.y)**2+((a.z||0)-(b.z||0))**2); }

function extractFaceParams(lm){
  const jawOpen  = Math.min(1, dist(lm[13],lm[14])*15);
  const eyeL     = Math.min(1, dist(lm[159],lm[145])*12);
  const eyeR     = Math.min(1, dist(lm[386],lm[374])*12);
  const browL    = Math.max(0, 0.5-(lm[105].y-lm[159].y)*10);
  const browR    = Math.max(0, 0.5-(lm[334].y-lm[386].y)*10);
  const mouthW   = dist(lm[61],lm[291]);
  const smile    = Math.min(1,(mouthW-0.12)*10);
  const headYaw  = (lm[4].x-0.5)*2;
  const headPitch= (lm[4].y-(lm[152]?.y||0.7))*3-0.6;
  const headRoll = ((lm[61]?.y||0.5)-(lm[291]?.y||0.5))*5;
  return {jawOpen,eyeL,eyeR,browL,browR,smile,headYaw,headPitch,headRoll};
}

export default function FaceMocapPanel({ onFaceParams, onMotionReady }) {
  const [mpReady,setMpReady]=useState(false);
  const [live,setLive]=useState(false);
  const [recording,setRecording]=useState(false);
  const [params,setParams]=useState({});
  const [fps,setFps]=useState(30);
  const [frameCount,setFrameCount]=useState(0);
  const [status,setStatus]=useState('');
  const videoRef=useRef(null);
  const canvasRef=useRef(null);
  const meshRef=useRef(null);
  const camRef=useRef(null);
  const recorded=useRef([]);
  const startT=useRef(0);

  useEffect(()=>{
    if(window.FaceMesh){setMpReady(true);return;}
    const s=document.createElement('script');
    s.src='https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js';
    s.crossOrigin='anonymous';s.onload=()=>setMpReady(true);
    document.head.appendChild(s);
  },[]);

  function initFaceMesh(videoEl,canvasEl){
    if(!window.FaceMesh){setStatus('FaceMesh not loaded');return null;}
    const fm=new window.FaceMesh({locateFile:f=>`https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}`});
    fm.setOptions({maxNumFaces:1,refineLandmarks:true,minDetectionConfidence:0.5,minTrackingConfidence:0.5});
    fm.onResults(results=>{
      const ctx=canvasEl.getContext('2d');
      ctx.clearRect(0,0,canvasEl.width,canvasEl.height);
      ctx.drawImage(results.image,0,0,canvasEl.width,canvasEl.height);
      if(!results.multiFaceLandmarks?.[0]) return;
      const lm=results.multiFaceLandmarks[0];
      ctx.fillStyle='#00ffc8';
      lm.forEach(p=>{ctx.beginPath();ctx.arc(p.x*canvasEl.width,p.y*canvasEl.height,1,0,Math.PI*2);ctx.fill();});
      const fp=extractFaceParams(lm);
      setParams(fp);
      onFaceParams&&onFaceParams(fp);
      if(recording){
        recorded.current.push({time:(performance.now()-startT.current)/1000,params:{...fp}});
        setFrameCount(recorded.current.length);
      }
    });
    meshRef.current=fm;return fm;
  }

  async function startLive(){
    if(!mpReady){setStatus('MediaPipe loading…');return;}
    const canvas=canvasRef.current;canvas.width=480;canvas.height=360;
    try{
      const stream=await navigator.mediaDevices.getUserMedia({video:{width:480,height:360}});
      videoRef.current.srcObject=stream;videoRef.current.play();
      const fm=initFaceMesh(videoRef.current,canvas);if(!fm)return;
      if(window.Camera){
        camRef.current=new window.Camera(videoRef.current,{onFrame:async()=>{await fm.send({image:videoRef.current});},width:480,height:360});
        camRef.current.start();setLive(true);setStatus('✓ Face mocap live');
      } else {
        // Fallback: manual frame loop
        const loop=async()=>{if(!live)return;await fm.send({image:videoRef.current});requestAnimationFrame(loop);};
        requestAnimationFrame(loop);setLive(true);setStatus('✓ Face mocap live (fallback mode)');
      }
    }catch(e){setStatus('Camera error: '+e.message);}
  }

  function stopLive(){camRef.current?.stop();if(videoRef.current?.srcObject)videoRef.current.srcObject.getTracks().forEach(t=>t.stop());setLive(false);setStatus('Stopped');}
  function startRecord(){recorded.current=[];startT.current=performance.now();setRecording(true);setStatus('Recording…');setFrameCount(0);}
  function stopRecord(){setRecording(false);setStatus(`${recorded.current.length} frames recorded`);if(recorded.current.length)exportMotion();}

  function exportMotion(){
    const duration=recorded.current[recorded.current.length-1]?.time||0;
    const frames=recorded.current.map(r=>({
      time:r.time,
      keyframes:{
        face_jaw:    {x:0,y:0,rotation:r.params.jawOpen*20,scale:1},
        face_eye_l:  {x:0,y:0,rotation:0,scale:Math.max(0.05,r.params.eyeL)},
        face_eye_r:  {x:0,y:0,rotation:0,scale:Math.max(0.05,r.params.eyeR)},
        face_brow_l: {x:0,y:-r.params.browL*10,rotation:0,scale:1},
        face_brow_r: {x:0,y:-r.params.browR*10,rotation:0,scale:1},
        face_smile:  {x:0,y:0,rotation:r.params.smile*10,scale:1},
        head:        {x:320+r.params.headYaw*80,y:180-r.params.headPitch*60,rotation:r.params.headRoll*20,scale:1},
      }
    }));
    const motion={version:'1.0',format:'spxmotion',name:'face_mocap',fps,duration,
      canvasW:640,canvasH:480,
      bones:['face_jaw','face_eye_l','face_eye_r','face_brow_l','face_brow_r','face_smile','head'],frames};
    const b=new Blob([JSON.stringify(motion,null,2)],{type:'application/json'});
    const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='face_mocap.spxmotion';a.click();
    onMotionReady&&onMotionReady(motion);
    setStatus(`✓ face_mocap.spxmotion exported (${frames.length} frames)`);
  }

  const pBar=(label,val)=>(
    <div key={label}>
      <div style={S.lbl}>{label}: {typeof val==='number'?val.toFixed(3):val}</div>
      {typeof val==='number'&&<div style={S.bar}><div style={S.barFill(Math.abs(val))}/></div>}
    </div>
  );

  return(
    <div style={S.root}>
      <div style={S.h2}>😶 FACE MOCAP</div>
      <div style={S.sec}>
        <div style={S.stat}>{mpReady?'✓ FaceMesh ready':'⏳ Loading…'}</div>
        <video ref={videoRef} style={{display:'none'}} playsInline muted/>
        <canvas ref={canvasRef} style={S.canvas}/>
      </div>
      <div style={S.sec}>
        {!live
          ?<button style={S.btn} onClick={startLive}>📷 Start Face Mocap</button>
          :<button style={S.btnRed} onClick={stopLive}>✕ Stop</button>
        }
        {live&&(!recording
          ?<button style={S.btnO} onClick={startRecord}>⏺ Record</button>
          :<button style={S.btnRed} onClick={stopRecord}>⏹ Stop + Export</button>
        )}
      </div>
      {Object.keys(params).length>0&&(
        <div style={S.sec}>
          <div style={S.lbl}>Live Parameters</div>
          {pBar('Jaw Open',   params.jawOpen)}
          {pBar('Eye L',      params.eyeL)}
          {pBar('Eye R',      params.eyeR)}
          {pBar('Brow L',     params.browL)}
          {pBar('Brow R',     params.browR)}
          {pBar('Smile',      params.smile)}
          {pBar('Head Yaw',   params.headYaw)}
          {pBar('Head Pitch', params.headPitch)}
          {pBar('Head Roll',  params.headRoll)}
        </div>
      )}
      {recording&&<div style={S.stat}>Frames: {frameCount}</div>}
      {status&&<div style={{...S.stat,marginTop:4}}>{status}</div>}
    </div>
  );
}