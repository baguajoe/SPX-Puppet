
import React from "react";
const BONES = [
  "Root > Hip","Hip > RThigh","RThigh > RShank","RShank > RFoot",
  "Hip > LThigh","LThigh > LShank","LShank > LFoot",
  "Hip > Spine","Spine > Head","Spine > RArm","RArm > RForearm","RForearm > RHand",
  "Spine > LArm","LArm > LForearm","LForearm > LHand",
];
export default function LayerPanel({ characters, activeId, onSelect, onToggleVisible, onToggleLock }) {
  return (
    <div style={{ width:220, background:"#0d1117", borderLeft:"1px solid #21262d", display:"flex", flexDirection:"column", overflow:"hidden", flexShrink:0 }}>
      <div style={{ padding:"6px 10px", borderBottom:"1px solid #21262d", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <span style={{ fontSize:11, fontWeight:600, color:"#e0e0e0" }}>Layer</span>
        <span style={{ fontSize:9, color:"#6b7280" }}>drag to reorder</span>
      </div>
      <div style={{ flex:1, overflowY:"auto" }}>
        {characters.length === 0 && (
          <div style={{ padding:14, fontSize:11, color:"#6b7280", textAlign:"center" }}>No characters</div>
        )}
        {characters.map(char => (
          <div key={char.id}>
            <div onClick={() => onSelect(char.id)} style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 8px", cursor:"pointer", background:char.id===activeId?"rgba(0,255,200,0.07)":"transparent", borderBottom:"1px solid #21262d" }}>
              <span style={{ fontSize:14 }}>{char.builtin ? "🎭" : "🖼"}</span>
              <span style={{ fontSize:11, color:char.id===activeId?"#00ffc8":"#e0e0e0", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{char.name}</span>
              <button onClick={e => { e.stopPropagation(); onToggleVisible && onToggleVisible(char.id); }} style={{ background:"none", border:"none", cursor:"pointer", fontSize:11, color:"#6b7280", padding:"0 2px" }}>{char.visible!==false?"👁":"🚫"}</button>
              <button onClick={e => { e.stopPropagation(); onToggleLock && onToggleLock(char.id); }} style={{ background:"none", border:"none", cursor:"pointer", fontSize:11, color:"#6b7280", padding:"0 2px" }}>🔓</button>
            </div>
            {char.id === activeId && BONES.map((bone, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:6, padding:"3px 8px 3px 22px", borderBottom:"1px solid rgba(33,38,45,0.4)", background:"rgba(0,0,0,0.2)", cursor:"pointer", fontSize:10, color:"#888" }}
                onMouseEnter={e => e.currentTarget.style.background="rgba(0,255,200,0.04)"}
                onMouseLeave={e => e.currentTarget.style.background="rgba(0,0,0,0.2)"}>
                <span style={{ width:14, height:1, background:"#00ffc8", opacity:0.3, flexShrink:0 }} />
                <span style={{ flex:1 }}>{bone}</span>
                <span style={{ color:"#6b7280" }}>👁</span>
                <span style={{ color:"#6b7280" }}>◇</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
