import React, { useState, useRef, useEffect } from 'react';

const T={bg:"#06060f",panel:"#0d0d1a",border:"#1a1a2e",teal:"#00ffc8",orange:"#FF6600",text:"#e0e0e0",muted:"#aaa",font:"JetBrains Mono,monospace"};
const S={
  root:{background:T.bg,color:T.text,fontFamily:T.font,padding:16,height:"100%",overflowY:"auto"},
  h2:{color:T.teal,fontSize:14,marginBottom:12,letterSpacing:1},
  h3:{color:T.orange,fontSize:12,marginBottom:8,marginTop:8},
  lbl:{fontSize:11,color:T.muted,display:"block",marginBottom:4},
  inp:{width:"100%",background:T.panel,border:"1px solid "+T.border,color:T.text,padding:"4px 8px",borderRadius:4,fontFamily:T.font,fontSize:11,marginBottom:8,boxSizing:"border-box"},
  btn:{background:T.teal,color:T.bg,border:"none",borderRadius:4,padding:"7px 16px",fontFamily:T.font,fontSize:12,fontWeight:700,cursor:"pointer",marginRight:8,marginBottom:8},
  btnO:{background:T.orange,color:"#fff",border:"none",borderRadius:4,padding:"7px 16px",fontFamily:T.font,fontSize:12,fontWeight:700,cursor:"pointer",marginRight:8,marginBottom:8},
  btnSm:{background:T.panel,color:T.teal,border:"1px solid "+T.teal,borderRadius:4,padding:"3px 10px",fontFamily:T.font,fontSize:10,cursor:"pointer",marginRight:4,marginBottom:4},
  sec:{background:T.panel,border:"1px solid "+T.border,borderRadius:6,padding:12,marginBottom:12},
  stat:{fontSize:11,color:T.teal,marginBottom:4},
  canvas:{width:"100%",borderRadius:6,border:"2px solid "+T.border,display:"block",background:"#000"},
};

const STYLES = {
  "Anime Standard":      {headScale:0.85,limbScale:1.25,inkOutline:true,color:"#00ffc8",bgColor:"#06060f"},
  "Manga B&W":           {headScale:0.88,limbScale:1.2, inkOutline:true,color:"#ffffff",bgColor:"#000000",grayscale:true,speedLines:true},
  "Marvel What If":      {headScale:1.05,limbScale:1.15,inkOutline:true,color:"#FF6600",bgColor:"#fffef0",halftone:true},
  "Spider-Verse":        {headScale:1.0, limbScale:1.0, inkOutline:true,color:"#ff00ff",bgColor:"#fffef0",halftone:true,frameSkip:3},
  "90s Saturday Morning":{headScale:1.1, limbScale:1.05,inkOutline:true,color:"#ffaa00",bgColor:"#06060f",limitedPalette:true},
  "Classic Cartoon":     {headScale:1.3, limbScale:1.1, inkOutline:true,color:"#ffffff",bgColor:"#1a0a00",rubberLimbs:true},
  "Studio Ghibli":       {headScale:1.05,limbScale:0.95,inkOutline:false,color:"#88cc88",bgColor:"#334422"},
  "Chibi SD":            {headScale:1.8, limbScale:0.55,inkOutline:true,color:"#ff88cc",bgColor:"#220033"},
  "Synthwave Retro":     {headScale:1.0, limbScale:1.0, inkOutline:false,color:"#00ffc8",bgColor:"#050510",neonGlow:true},
  "Noir Cinematic":      {headScale:1.0, limbScale:1.0, inkOutline:true,color:"#ffffff",bgColor:"#000000",grayscale:true,highContrast:true},
  "Fleischer Rubber Hose":{headScale:1.4,limbScale:1.0, inkOutline:true,color:"#443322",bgColor:"#f5e6b0",rubberLimbs:true},
  "CalArts / Adventure Time":{headScale:1.15,limbScale:1.0,inkOutline:true,color:"#ff6600",bgColor:"#ffffff",wobbleLines:true},
  "Wayang Kulit Shadow": {headScale:1.0, limbScale:1.0, inkOutline:false,color:"#000000",bgColor:"#ff6600",silhouette:true},
  "South Park Cutout":   {headScale:1.2, limbScale:0.8, inkOutline:true,color:"#ff4400",bgColor:"#87ceeb",staticLimbs:true},
  "UPA Flat 50s":        {headScale:0.9, limbScale:0.85,inkOutline:true,color:"#cc4422",bgColor:"#f0e8d0",geometricShapes:true},
  "Soviet Soyuzmultfilm":{headScale:1.05,limbScale:0.95,inkOutline:false,color:"#8899aa",bgColor:"#1a2a1a",painterly:true,filmGrain:true},
  "Adult Swim Surreal":  {headScale:1.05,limbScale:1.0, inkOutline:true,color:"#00ff88",bgColor:"#050510",vhsDistort:true,filmGrain:true},
  "Moebius / Heavy Metal":{headScale:0.88,limbScale:1.1,inkOutline:true,color:"#cc9944",bgColor:"#f8f4e8",crosshatch:true},
  "Isometric Pixel":     {headScale:1.0, limbScale:1.0, inkOutline:false,color:"#00ffc8",bgColor:"#0d0d1a",pixelGrid:4},
  "8-Bit Pixel":         {headScale:1.0, limbScale:1.0, inkOutline:false,color:"#00ff00",bgColor:"#000000",pixelGrid:8},
};

const SKELETON = {
  head:{x:320,y:80}, neck:{x:320,y:110}, chest:{x:320,y:155}, spine:{x:320,y:185}, hips:{x:320,y:220},
  l_shoulder:{x:290,y:130}, l_upper_arm:{x:265,y:155}, l_forearm:{x:248,y:185}, l_hand:{x:240,y:210},
  r_shoulder:{x:350,y:130}, r_upper_arm:{x:375,y:155}, r_forearm:{x:392,y:185}, r_hand:{x:400,y:210},
  l_thigh:{x:305,y:255}, l_shin:{x:300,y:295}, l_foot:{x:295,y:325},
  r_thigh:{x:335,y:255}, r_shin:{x:340,y:295}, r_foot:{x:345,y:325},
};

const CONNECTIONS=[
  ["head","neck"],["neck","chest"],["chest","spine"],["spine","hips"],
  ["chest","l_shoulder"],["l_shoulder","l_upper_arm"],["l_upper_arm","l_forearm"],["l_forearm","l_hand"],
  ["chest","r_shoulder"],["r_shoulder","r_upper_arm"],["r_upper_arm","r_forearm"],["r_forearm","r_hand"],
  ["hips","l_thigh"],["l_thigh","l_shin"],["l_shin","l_foot"],
  ["hips","r_thigh"],["r_thigh","r_shin"],["r_shin","r_foot"],
];

function drawStyle(ctx,kf,sp,w,h,t=0){
  ctx.clearRect(0,0,w,h);
  // Background
  if(sp.neonGlow){ctx.fillStyle="#050510";ctx.fillRect(0,0,w,h);ctx.strokeStyle="#220044";ctx.lineWidth=0.5;for(let i=0;i<w;i+=20){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i,h);ctx.stroke();}for(let j=0;j<h;j+=20){ctx.beginPath();ctx.moveTo(0,j);ctx.lineTo(w,j);ctx.stroke();}}
  else if(sp.halftone){ctx.fillStyle="#fffef0";ctx.fillRect(0,0,w,h);ctx.fillStyle="#e0d8c0";for(let i=0;i<w;i+=8)for(let j=0;j<h;j+=8){ctx.beginPath();ctx.arc(i,j,1.5,0,Math.PI*2);ctx.fill();}}
  else if(sp.vhsDistort){ctx.fillStyle="#050510";ctx.fillRect(0,0,w,h);ctx.globalAlpha=0.12;for(let y=0;y<h;y+=3){ctx.fillStyle=y%6===0?"#ffffff":"#000";ctx.fillRect(0,y,w,1);}ctx.globalAlpha=1;}
  else if(sp.silhouette){const bg=ctx.createLinearGradient(0,0,0,h);bg.addColorStop(0,"#2a1500");bg.addColorStop(0.5,sp.bgColor||"#ff6600");bg.addColorStop(1,"#2a1500");ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);}
  else{ctx.fillStyle=sp.bgColor||"#06060f";ctx.fillRect(0,0,w,h);}
  if(sp.filmGrain){ctx.globalAlpha=0.04;for(let i=0;i<300;i++){ctx.fillStyle="#fff";ctx.fillRect(Math.random()*w,Math.random()*h,1,1);}ctx.globalAlpha=1;}
  if(sp.speedLines){ctx.strokeStyle="rgba(255,255,255,0.06)";ctx.lineWidth=1;for(let i=0;i<20;i++){ctx.beginPath();ctx.moveTo(w/2,h/2);const a=i/20*Math.PI*2;ctx.lineTo(w/2+Math.cos(a)*w,h/2+Math.sin(a)*h);ctx.stroke();}}

  const col=sp.grayscale?"#aaaaaa":(sp.color||"#00ffc8");
  const lw=sp.inkOutline?3:2;

  if(sp.rubberLimbs){
    CONNECTIONS.forEach(([a,b])=>{
      const pa=kf[a],pb=kf[b];if(!pa||!pb)return;
      const mx=(pa.x+pb.x)/2+Math.sin(t*3+pa.x)*8,my=(pa.y+pb.y)/2+Math.cos(t*3+pa.y)*8;
      ctx.beginPath();ctx.moveTo(pa.x,pa.y);ctx.quadraticCurveTo(mx,my,pb.x,pb.y);
      if(sp.neonGlow){ctx.shadowBlur=10;ctx.shadowColor=col;}
      ctx.strokeStyle=col;ctx.lineWidth=4;ctx.stroke();ctx.shadowBlur=0;
    });
  } else if(sp.silhouette){
    ctx.fillStyle="#000000";
    Object.values(kf).forEach(pos=>{ctx.beginPath();ctx.arc(pos.x,pos.y,8,0,Math.PI*2);ctx.fill();});
    CONNECTIONS.forEach(([a,b])=>{const pa=kf[a],pb=kf[b];if(!pa||!pb)return;ctx.strokeStyle="#000";ctx.lineWidth=10;ctx.beginPath();ctx.moveTo(pa.x,pa.y);ctx.lineTo(pb.x,pb.y);ctx.stroke();});
  } else if(!sp.staticLimbs){
    if(sp.inkOutline){CONNECTIONS.forEach(([a,b])=>{const pa=kf[a],pb=kf[b];if(!pa||!pb)return;ctx.beginPath();ctx.moveTo(pa.x,pa.y);ctx.lineTo(pb.x,pb.y);ctx.strokeStyle="#000";ctx.lineWidth=lw+2;ctx.stroke();});}
    CONNECTIONS.forEach(([a,b])=>{
      const pa=kf[a],pb=kf[b];if(!pa||!pb)return;
      ctx.beginPath();ctx.moveTo(pa.x,pa.y);ctx.lineTo(pb.x,pb.y);
      if(sp.neonGlow){ctx.shadowBlur=8;ctx.shadowColor=col;}
      ctx.strokeStyle=sp.grayscale&&sp.highContrast?"#fff":col;ctx.lineWidth=lw;ctx.stroke();ctx.shadowBlur=0;
    });
  } else {
    // Static limbs — body only
    ["chest","spine","hips","l_shoulder","r_shoulder"].forEach(b=>{if(kf[b]){ctx.beginPath();ctx.arc(kf[b].x,kf[b].y,6,0,Math.PI*2);ctx.fillStyle=col;ctx.fill();}});
  }

  // Joints
  Object.entries(kf).forEach(([bone,pos])=>{
    const r=bone==="head"?(sp.headScale||1)*14:4;
    ctx.beginPath();ctx.arc(pos.x,pos.y,r,0,Math.PI*2);
    if(bone==="head"){ctx.fillStyle=sp.bgColor||"#06060f";ctx.fill();ctx.strokeStyle=col;ctx.lineWidth=lw;ctx.stroke();}
    else{if(sp.neonGlow){ctx.shadowBlur=6;ctx.shadowColor=col;}ctx.fillStyle=col;ctx.fill();ctx.shadowBlur=0;}
  });

  if(sp.pixelGrid){
    const snap=(v,g)=>Math.round(v/g)*g;
    ctx.globalAlpha=0.3;
    ctx.strokeStyle=col;ctx.lineWidth=0.5;
    for(let x=0;x<w;x+=sp.pixelGrid){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}
    for(let y=0;y<h;y+=sp.pixelGrid){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
    ctx.globalAlpha=1;
  }
  ctx.fillStyle="rgba(0,255,200,0.5)";ctx.font="10px JetBrains Mono,monospace";
  ctx.fillText(Object.keys(STYLES).find(k=>STYLES[k]===sp)||"Style",8,h-8);
}

export default function Puppet2DStylePanel({ liveKeyframes }) {
  const canvasRef=useRef(null);
  const [style,setStyle]=useState("Anime Standard");
  const [playing,setPlaying]=useState(true);
  const [t,setT]=useState(0);
  const raf=useRef(null);
  const lastT=useRef(0);
  const tRef=useRef(0);
  const KF=liveKeyframes||SKELETON;

  useEffect(()=>{
    const tick=(now)=>{
      const dt=Math.min((now-lastT.current)/1000,0.05);
      lastT.current=now;
      if(playing) tRef.current+=dt;
      const canvas=canvasRef.current;if(!canvas)return;
      canvas.width=640;canvas.height=400;
      const sp=STYLES[style]||STYLES["Anime Standard"];
      // Animate skeleton slightly
      const animKF={};
      Object.entries(KF).forEach(([b,v])=>{
        animKF[b]={...v};
        if(b==="head")animKF[b].y=v.y+Math.sin(tRef.current*1.5)*3;
        if(b.includes("hand"))animKF[b].x=v.x+Math.sin(tRef.current*2+(b.includes("l")?0:Math.PI))*8;
      });
      drawStyle(canvas.getContext("2d"),animKF,sp,640,400,tRef.current);
      raf.current=requestAnimationFrame(tick);
    };
    raf.current=requestAnimationFrame(tick);
    return()=>cancelAnimationFrame(raf.current);
  },[style,playing,liveKeyframes]);

  function exportFrame(){
    const canvas=canvasRef.current;if(!canvas)return;
    const a=document.createElement("a");a.href=canvas.toDataURL("image/png");
    a.download=`puppet_${style.replace(/ /g,"_")}.png`;a.click();
  }

  return(
    <div style={S.root}>
      <div style={S.h2}>🎨 2D STYLE EXPORT</div>
      <div style={S.sec}>
        <label style={S.lbl}>Animation Style ({Object.keys(STYLES).length} available)</label>
        <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>
          {Object.keys(STYLES).map(s=>(
            <button key={s} style={{...S.btnSm,background:style===s?T.teal:T.panel,color:style===s?T.bg:T.teal}} onClick={()=>setStyle(s)}>
              {s}
            </button>
          ))}
        </div>
      </div>
      <canvas ref={canvasRef} style={S.canvas}/>
      <div style={{marginTop:8}}>
        <button style={S.btn} onClick={()=>setPlaying(!playing)}>{playing?"⏸ Pause":"▶ Play"}</button>
        <button style={S.btnO} onClick={exportFrame}>💾 Export Frame</button>
      </div>
      <div style={S.sec}>
        <div style={{fontSize:10,color:"#888",lineHeight:1.7}}>
          Styles apply to live puppet output in real-time<br/>
          Export any frame as PNG for storyboarding<br/>
          Connect liveKeyframes prop to drive from puppet rig
        </div>
      </div>
    </div>
  );
}