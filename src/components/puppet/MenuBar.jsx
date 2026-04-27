
import React, { useState } from "react";

const MENUS = {
  File: [
    { label:"New Project", shortcut:"Ctrl+N", action:"new" },
    { label:"Open", shortcut:"Ctrl+O", action:"load" },
    { label:"Save", shortcut:"Ctrl+S", action:"save" },
    { label:"---" },
    { label:"Save to Cloud", shortcut:"", action:"cloud_save" },
    { label:"Load from Cloud", shortcut:"", action:"cloud_load" },
    { label:"---" },
    { label:"Export WebM", shortcut:"Ctrl+E", action:"export_mp4" },
  ],
  Edit: [
    { label:"Undo", shortcut:"Ctrl+Z", action:"undo" },
    { label:"Redo", shortcut:"Ctrl+Y", action:"redo" },
    { label:"---" },
    { label:"Delete", shortcut:"Del", action:"delete" },
  ],
  View: [
    { label:"Show Skeleton", shortcut:"Ctrl+Shift+B", action:"toggle_skeleton" },
    { label:"Show Grid", shortcut:"Ctrl+\'", action:"toggle_grid" },
    { label:"Show FPS Stats", shortcut:"", action:"toggle_fps" },
    { label:"---" },
    { label:"Fullscreen", shortcut:"F11", action:"fullscreen" },
  ],
  Puppet: [
    { label:"Reset Pose", shortcut:"", action:"reset_pose" },
  ],
  Animation: [
    { label:"Play/Pause", shortcut:"Space", action:"play" },
  ],
  Help: [
    { label:"Documentation", shortcut:"F1", action:"docs" },
    { label:"About SPX Puppet", shortcut:"", action:"about" },
    { label:"StreamPireX", shortcut:"", action:"streampirex" },
  ],
};

export default function MenuBar({ onAction }) {
  const [open, setOpen] = useState(null);
  const handle = (action) => { setOpen(null); onAction && onAction(action); };
  return (
    <div style={{ display:"flex", alignItems:"center", background:"#0d1117", borderBottom:"1px solid #21262d", height:26, flexShrink:0, userSelect:"none", position:"relative", zIndex:1000 }}>
      <div style={{ padding:"0 10px", borderRight:"1px solid #21262d", height:"100%", display:"flex", alignItems:"center", gap:6 }}>
        <span style={{ background:"#00ffc8", color:"#000", fontSize:9, fontWeight:800, padding:"1px 5px", borderRadius:3 }}>SPX</span>
        <span style={{ fontSize:11, color:"#e0e0e0", fontWeight:600 }}>Puppet</span>
      </div>
      {Object.entries(MENUS).map(([name, items]) => (
        <div key={name} style={{ position:"relative" }}>
          <button onClick={() => setOpen(open === name ? null : name)}
            style={{ padding:"0 10px", height:26, background:open===name?"#21262d":"transparent", border:"none", color:open===name?"#00ffc8":"#e0e0e0", cursor:"pointer", fontSize:11 }}>
            {name}
          </button>
          {open === name && (
            <div style={{ position:"absolute", top:26, left:0, background:"#0d1117", border:"1px solid #21262d", borderRadius:4, minWidth:200, zIndex:2000, boxShadow:"0 8px 24px rgba(0,0,0,0.6)" }}>
              {items.map((item, i) => item.label === "---"
                ? <div key={i} style={{ height:1, background:"#21262d", margin:"3px 0" }} />
                : <div key={i} onClick={() => handle(item.action)}
                    style={{ display:"flex", justifyContent:"space-between", padding:"5px 12px", cursor:"pointer", fontSize:11, color:"#e0e0e0" }}
                    onMouseEnter={e => e.currentTarget.style.background="#21262d"}
                    onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                    <span>{item.label}</span>
                    {item.shortcut && <span style={{ color:"#6b7280", fontSize:10 }}>{item.shortcut}</span>}
                  </div>
              )}
            </div>
          )}
        </div>
      ))}
      {open && <div style={{ position:"fixed", inset:0, zIndex:999 }} onClick={() => setOpen(null)} />}
    </div>
  );
}
