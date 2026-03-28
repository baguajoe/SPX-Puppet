
import React, { useState, useEffect } from "react";
export default function StatsOverlay({ fps, show }) {
  const [ram, setRam] = useState("--");
  useEffect(() => {
    if (!show) return;
    const id = setInterval(() => {
      if (performance && performance.memory) {
        setRam(Math.round(performance.memory.usedJSHeapSize/1024/1024) + "MB");
      }
    }, 1000);
    return () => clearInterval(id);
  }, [show]);
  if (!show) return null;
  return (
    <div style={{ position:"absolute", top:8, left:8, background:"rgba(0,0,0,0.7)", padding:"4px 8px", borderRadius:4, fontSize:10, color:"#4ade80", fontFamily:"monospace", lineHeight:1.8, pointerEvents:"none", zIndex:10 }}>
      <div>FPS: {fps || 0}</div>
      <div>RAM: {ram}</div>
    </div>
  );
}
