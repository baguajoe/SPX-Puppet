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
  canvas:{width:"100%",borderRadius:6,border:"1px solid "+T.border,background:"#000",display:"block"},
  bar:(p)=>({width:`${p}%`,height:4,background:T.teal,borderRadius:2,transition:"width .2s"}),
};

const POSE_TO_SPX={
  0:"head", 11:"l_shoulder", 12:"r_shoulder", 13:"l_upper_arm", 14:"r_upper_arm",
  15:"l_forearm", 16:"r_forearm", 17:"l_hand", 18:"r_hand",
  23:"l_thigh", 24:"r_thigh", 25:"l_shin", 26:"r_shin", 27:"l_foot", 28:"r_foot",
};

function midpoint(a,b){ return {x:(a.x+b.x)/2,y:(a.y+b.y)/2,z:((a.z||0)+(b.z||0))/2}; }

function landmarksToSPX(lm,w,h){
  const kf={};
  Object.entries(POSE_TO_SPX).forEach(([idx,name])=>{
    const p=lm[+idx]; if(!p) return;
    kf[name]={x:p.x*w, y:p.y*h, rotation:0, scale:1, confidence:p.visibility||1};
  });
  if(lm[23]&&lm[24]){ const hip=midpoint(lm[23],lm[24]); kf.hips={x:hip.x*w,y:hip.y*h,rotation:0,scale:1}; }
  if(lm[11]&&lm[12]&&lm[23]&&lm[24]){ const sp=midpoint(midpoint(lm[11],lm[12]),midpoint(lm[23],lm[24])); kf.spine={x:sp.x*w,y:sp.y*h,rotation:0,scale:1}; }
  return kf;
}

const CONNECTIONS=[[11,12],[11,13],[13,15],[12,14],[14,16],[11,23],[12,24],[23,24],[23,25],[25,27],[24,26],[26,28]];

export default function VideoMocapPanel({ onMotionReady, onLiveFrame }) {
  const [mpReady,setMpReady]=useState(false);
  const [recording,setRecording]=useState(false);
  const [live,setLive]=useState(false);
  const [fps,setFps]=useState(30);
  const [canvasW,setCanvasW]=useState(640);
  const [canvasH,setCanvasH]=useState(480);
  const [progress,setProgress]=useState(0);
  const [frameCount,setFrameCount]=useState(0);
  const [status,setStatus]=useState('');
  const [videoSrc,setVideoSrc]=useState(null);
  const videoRef=useRef(null);
  const canvasRef=useRef(null);
  const poseRef=useRef(null);
  const camRef=useRef(null);
  const recorded=useRef([]);
  const startT=useRef(0);

  useEffect(()=>{
    if(window.Pose){setMpReady(true);return;}
    const s=document.createElement('script');
    s.src='https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js';
    s.crossOrigin='anonymous';
    s.onload=()=>{
      const s2=document.createElement('script');
      s2.src='https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js';
      s2.crossOrigin='anonymous'; s2.onload=()=>setMpReady(true);
      document.head.appendChild(s2);
    };
    document.head.appendChild(s);
  },[]);

  function initPose(videoEl,canvasEl){
    if(!window.Pose){setStatus('MediaPipe not loaded');return null;}
    const pose=new window.Pose({locateFile:f=>`https://cdn.jsdelivr.net/npm/@mediapipe/pose/${f}`});
    pose.setOptions({modelComplexity:1,smoothLandmarks:true,minDetectionConfidence:0.5,minTrackingConfidence:0.5});
    pose.onResults(results=>{
      const ctx=canvasEl.getContext('2d');
      ctx.clearRect(0,0,canvasEl.width,canvasEl.height);
      ctx.drawImage(results.image,0,0,canvasEl.width,canvasEl.height);
      if(!results.poseLandmarks) return;
      const lm=results.poseLandmarks;
      // Draw skeleton
      ctx.strokeStyle='#00ffc8'; ctx.lineWidth=2;
      CONNECTIONS.forEach(([a,b])=>{
        const pa=lm[a],pb=lm[b]; if(!pa||!pb) return;
        ctx.beginPath();ctx.moveTo(pa.x*canvasEl.width,pa.y*canvasEl.height);
        ctx.lineTo(pb.x*canvasEl.width,pb.y*canvasEl.height);ctx.stroke();
      });
      Object.keys(POSE_TO_SPX).forEach(i=>{
        const p=lm[+i]; if(!p) return;
        ctx.beginPath();ctx.arc(p.x*canvasEl.width,p.y*canvasEl.height,4,0,Math.PI*2);
        ctx.fillStyle='#FF6600';ctx.fill();
      });
      const kf=landmarksToSPX(lm,canvasEl.width,canvasEl.height);
      onLiveFrame&&onLiveFrame(kf);
      if(recording){
        recorded.current.push({time:(performance.now()-startT.current)/1000,keyframes:kf});
        setFrameCount(recorded.current.length);
      }
    });
    poseRef.current=pose; return pose;
  }

  async function startWebcam(){
    if(!mpReady){setStatus('MediaPipe loading…');return;}
    const canvas=canvasRef.current;
    canvas.width=canvasW;canvas.height=canvasH;
    try{
      const stream=await navigator.mediaDevices.getUserMedia({video:{width:canvasW,height:canvasH}});
      videoRef.current.srcObject=stream;videoRef.current.play();
      const pose=initPose(videoRef.current,canvas);if(!pose)return;
      if(window.Camera){
        camRef.current=new window.Camera(videoRef.current,{onFrame:async()=>{await pose.send({image:videoRef.current});},width:canvasW,height:canvasH});
        camRef.current.start();setLive(true);setStatus('✓ Live body mocap running');
      }
    }catch(e){setStatus('Camera error: '+e.message);}
  }

  async function processVideo(file){
    if(!mpReady){setStatus('MediaPipe loading…');return;}
    setVideoSrc(URL.createObjectURL(file));
    setTimeout(async()=>{
      const video=videoRef.current,canvas=canvasRef.current;
      canvas.width=canvasW;canvas.height=canvasH;
      const pose=initPose(video,canvas);if(!pose)return;
      recorded.current=[];setRecording(true);
      const duration=video.duration,step=1/fps;let t=0;
      setStatus('Processing video…');
      while(t<=duration){
        video.currentTime=t;
        await new Promise(res=>video.addEventListener('seeked',res,{once:true}));
        await pose.send({image:video});
        setProgress(Math.round(t/duration*100));
        t+=step;
      }
      setRecording(false);buildMotion();
    },500);
  }

  function buildMotion(){
    const bones=[...new Set([...Object.values(POSE_TO_SPX),'hips','spine'])];
    const motion={version:'1.0',format:'spxmotion',name:'video_mocap',fps,
      duration:recorded.current.length/fps,canvasW,canvasH,bones,frames:recorded.current};
    const b=new Blob([JSON.stringify(motion,null,2)],{type:'application/json'});
    const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='video_mocap.spxmotion';a.click();
    onMotionReady&&onMotionReady(motion);
    setStatus(`✓ video_mocap.spxmotion downloaded (${recorded.current.length} frames)`);
  }

  function startRecord(){recorded.current=[];startT.current=performance.now();setRecording(true);setFrameCount(0);setStatus('Recording…');}
  function stopRecord(){setRecording(false);setStatus(`${recorded.current.length} frames recorded`);if(recorded.current.length)buildMotion();}
  function stopAll(){camRef.current?.stop();if(videoRef.current?.srcObject)videoRef.current.srcObject.getTracks().forEach(t=>t.stop());setLive(false);setRecording(false);setStatus('Stopped');}

  return(
    <div style={S.root}>
      <div style={S.h2}>🎬 VIDEO BODY MOCAP</div>
      <div style={S.sec}>
        <div style={S.stat}>{mpReady?'✓ MediaPipe Pose ready':'⏳ Loading MediaPipe…'}</div>
        <video ref={videoRef} src={videoSrc} style={{display:'none'}} crossOrigin="anonymous" playsInline muted/>
        <canvas ref={canvasRef} style={S.canvas}/>
      </div>
      <div style={S.sec}>
        <button style={S.btn} onClick={startWebcam}>📷 Live Webcam</button>
        <label style={S.btn}>
          📁 Upload MP4
          <input type="file" accept="video/*" style={{display:'none'}} onChange={e=>e.target.files[0]&&processVideo(e.target.files[0])}/>
        </label>
      </div>
      {live&&(recording
        ?<button style={S.btnRed} onClick={stopRecord}>⏹ Stop + Export</button>
        :<button style={S.btnO} onClick={startRecord}>⏺ Record</button>
      )}
      {live&&<button style={S.btn} onClick={stopAll}>✕ Stop All</button>}
      {progress>0&&progress<100&&<div style={{background:T.panel,borderRadius:4,padding:4,marginTop:8}}><div style={S.bar(progress)}/><div style={{fontSize:10,color:T.teal,marginTop:4}}>{progress}%</div></div>}
      {recording&&<div style={S.stat}>Frames: {frameCount}</div>}
      {status&&<div style={{...S.stat,marginTop:8}}>{status}</div>}
    </div>
  );
}