
import React, { useState } from "react";
export default function BoneToolbar({ onAction }) {
  const [showBone, setShowBone] = useState(true);
  const [bodyPart, setBodyPart] = useState("Body");
  const [boneColor, setBoneColor] = useState("#ffcc00");
  const [boneSize, setBoneSize] = useState(40);
  const [opacity, setOpacity] = useState(100);
  const [connect, setConnect] = useState(true);
  const N = { width:44, background:"#06060f", border:"1px solid #21262d", borderRadius:3, color:"#e0e0e0", fontSize:11, padding:"1px 4px", textAlign:"center" };
  const B = { padding:"2px 10px", border:"1px solid #21262d", borderRadius:4, background:"#1a1a2e", color:"#e0e0e0", fontSize:11, cursor:"pointer" };
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, padding:"2px 8px", background:"#0d1117", borderBottom:"1px solid #21262d", height:28, flexShrink:0 }}>
      <label style={{ display:"flex", alignItems:"center", gap:4, fontSize:11, color:"#e0e0e0", cursor:"pointer" }}>
        <input type="checkbox" checked={showBone} onChange={e => { setShowBone(e.target.checked); onAction && onAction("toggle_bones", e.target.checked); }} />
        Show Bone
      </label>
      <select value={bodyPart} onChange={e => setBodyPart(e.target.value)}
        style={{ background:"#06060f", border:"1px solid #21262d", borderRadius:4, color:"#e0e0e0", fontSize:11, padding:"1px 6px" }}>
        {["Body","Head","L.Arm","R.Arm","L.Leg","R.Leg","Hair","Cape"].map(p => <option key={p}>{p}</option>)}
      </select>
      <span style={{ fontSize:11, color:"#6b7280" }}>Color:</span>
      <input type="color" value={boneColor} onChange={e => setBoneColor(e.target.value)}
        style={{ width:26, height:18, borderRadius:3, border:"1px solid #21262d", cursor:"pointer", background:"none" }} />
      <span style={{ fontSize:11, color:"#6b7280" }}>Size:</span>
      <input type="number" style={N} value={boneSize} onChange={e => setBoneSize(Number(e.target.value))} min={1} max={100} />
      <span style={{ fontSize:11, color:"#6b7280" }}>Opacity:</span>
      <input type="number" style={N} value={opacity} onChange={e => setOpacity(Number(e.target.value))} min={0} max={100} />
      <label style={{ display:"flex", alignItems:"center", gap:4, fontSize:11, color:"#e0e0e0", cursor:"pointer" }}>
        <input type="checkbox" checked={connect} onChange={e => setConnect(e.target.checked)} />
        Connect
      </label>
      <div style={{ marginLeft:"auto", display:"flex", gap:6 }}>
        <button style={B} onClick={() => onAction && onAction("edit_pose")}>Edit Pose</button>
        <button style={B} onClick={() => onAction && onAction("preview")}>Preview</button>
      </div>
    </div>
  );
}
