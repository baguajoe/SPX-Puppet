
import React from "react";
const TOOLS = [
  { id:"select", icon:"↖", label:"Select (V)" },
  { id:"move",   icon:"✥", label:"Move (G)" },
  { id:"rotate", icon:"↻", label:"Rotate (R)" },
  { id:"scale",  icon:"⤡", label:"Scale (S)" },
  { id:"bone",   icon:"🦴", label:"Bone Edit (B)" },
  { id:"pin",    icon:"📌", label:"Pin Joint" },
  { id:"paint",  icon:"🖌", label:"Weight Paint" },
];
const B = { padding:"3px 7px", border:"1px solid #21262d", borderRadius:4, background:"transparent", color:"#6b7280", cursor:"pointer", fontSize:12 };
const BA = { ...B, borderColor:"#00ffc8", background:"rgba(0,255,200,0.1)", color:"#00ffc8" };
const NUM = { width:46, background:"#06060f", border:"1px solid #21262d", borderRadius:3, color:"#e0e0e0", fontSize:10, padding:"1px 4px", textAlign:"center" };
export default function GeneralToolbar({ activeTool, setActiveTool, onUndo, onRedo, transform, onTransformChange }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:4, padding:"2px 8px", background:"#0d1117", borderBottom:"1px solid #21262d", height:30, flexShrink:0, flexWrap:"wrap" }}>
      <button style={B} onClick={onUndo} title="Undo">↩</button>
      <button style={B} onClick={onRedo} title="Redo">↪</button>
      <div style={{ width:1, height:18, background:"#21262d", margin:"0 2px" }} />
      {TOOLS.map(t => <button key={t.id} title={t.label} style={activeTool===t.id?BA:B} onClick={() => setActiveTool(t.id)}>{t.icon}</button>)}
      <div style={{ width:1, height:18, background:"#21262d", margin:"0 2px" }} />
      {["X","Y","W","H"].map(k => (
        <div key={k} style={{ display:"flex", alignItems:"center", gap:2 }}>
          <span style={{ fontSize:9, color:"#6b7280" }}>{k}</span>
          <input type="number" style={NUM} value={(transform && transform[k.toLowerCase()]) || 0}
            onChange={e => onTransformChange && onTransformChange({ ...transform, [k.toLowerCase()]: Number(e.target.value) })} />
        </div>
      ))}
      <div style={{ display:"flex", alignItems:"center", gap:2 }}>
        <span style={{ fontSize:9, color:"#6b7280" }}>R</span>
        <input type="number" style={NUM} value={(transform && transform.r) || 0}
          onChange={e => onTransformChange && onTransformChange({ ...transform, r: Number(e.target.value) })} />
      </div>
    </div>
  );
}
