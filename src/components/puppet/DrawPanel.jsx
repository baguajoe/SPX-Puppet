
// DrawPanel.jsx — built-in character drawing tool with pressure sensitivity
import React, { useRef, useState, useEffect, useCallback } from "react";

const TOOLS = [
  { id:"pencil",  icon:"✏️",  label:"Pencil",  size:2,  opacity:1.0 },
  { id:"brush",   icon:"🖌",  label:"Brush",   size:8,  opacity:0.85 },
  { id:"eraser",  icon:"⬜",  label:"Eraser",  size:16, opacity:1.0 },
  { id:"fill",    icon:"🪣",  label:"Fill",    size:1,  opacity:1.0 },
  { id:"line",    icon:"╱",   label:"Line",    size:2,  opacity:1.0 },
  { id:"rect",    icon:"▭",   label:"Rect",    size:2,  opacity:1.0 },
  { id:"ellipse", icon:"⬭",   label:"Ellipse", size:2,  opacity:1.0 },
];

const COLORS = [
  "#000000","#ffffff","#e0e0e0","#6b7280",
  "#ef4444","#f97316","#eab308","#22c55e",
  "#3b82f6","#8b5cf6","#ec4899","#06b6d4",
  "#92400e","#166534","#1e3a5f","#4c1d95",
  "#fde68a","#bbf7d0","#bfdbfe","#fecdd3",
];

const LAYER_NAMES = ["Background","Color","Lineart","Sketch"];

function floodFill(ctx, startX, startY, fillColor, canvasW, canvasH) {
  const imageData = ctx.getImageData(0, 0, canvasW, canvasH);
  const data = imageData.data;
  const idx = (x, y) => (y * canvasW + x) * 4;
  const target = data.slice(idx(startX, startY), idx(startX, startY) + 4);
  const fill = [
    parseInt(fillColor.slice(1,3),16),
    parseInt(fillColor.slice(3,5),16),
    parseInt(fillColor.slice(5,7),16),
    255,
  ];
  if (target[0]===fill[0] && target[1]===fill[1] && target[2]===fill[2]) return;
  const match = (x, y) => {
    const i = idx(x, y);
    return data[i]===target[0] && data[i+1]===target[1] && data[i+2]===target[2] && data[i+3]===target[3];
  };
  const stack = [[startX, startY]];
  while (stack.length) {
    const [x, y] = stack.pop();
    if (x < 0 || x >= canvasW || y < 0 || y >= canvasH) continue;
    if (!match(x, y)) continue;
    const i = idx(x, y);
    data[i]=fill[0]; data[i+1]=fill[1]; data[i+2]=fill[2]; data[i+3]=fill[3];
    stack.push([x+1,y],[x-1,y],[x,y+1],[x,y-1]);
  }
  ctx.putImageData(imageData, 0, 0);
}

export default function DrawPanel({ onExportCharacter }) {
  const canvasRefs = useRef({});
  const [activeTool, setActiveTool] = useState("brush");
  const [color, setColor] = useState("#000000");
  const [size, setSize] = useState(6);
  const [opacity, setOpacity] = useState(1.0);
  const [activeLayer, setActiveLayer] = useState("Lineart");
  const [layerVisible, setLayerVisible] = useState({ Background:true, Color:true, Lineart:true, Sketch:true });
  const [layerOpacity, setLayerOpacity] = useState({ Background:1, Color:1, Lineart:1, Sketch:0.5 });
  const [canvasSize] = useState({ w:512, h:512 });
  const drawing = useRef(false);
  const lastPos = useRef(null);
  const lineStart = useRef(null);
  const history = useRef([]);
  const histIdx = useRef(-1);

  // Init canvases with transparent background
  useEffect(() => {
    LAYER_NAMES.forEach(name => {
      const canvas = canvasRefs.current[name];
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvasSize.w, canvasSize.h);
      if (name === "Background") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvasSize.w, canvasSize.h);
      }
    });
  }, []);

  const saveHistory = useCallback((layerName) => {
    const canvas = canvasRefs.current[layerName];
    if (!canvas) return;
    const snap = canvas.toDataURL();
    history.current = history.current.slice(0, histIdx.current + 1);
    history.current.push({ layer: layerName, data: snap });
    histIdx.current = history.current.length - 1;
  }, []);

  const undo = useCallback(() => {
    if (histIdx.current < 0) return;
    const snap = history.current[histIdx.current];
    histIdx.current--;
    const canvas = canvasRefs.current[snap.layer];
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => { ctx.clearRect(0,0,canvasSize.w,canvasSize.h); ctx.drawImage(img,0,0); };
    img.src = snap.data;
  }, [canvasSize]);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvasSize.w / rect.width;
    const scaleY = canvasSize.h / rect.height;
    const pressure = e.pressure !== undefined ? (e.pressure || 0.5) : 0.5;
    if (e.touches) {
      return { x:(e.touches[0].clientX - rect.left)*scaleX, y:(e.touches[0].clientY - rect.top)*scaleY, pressure };
    }
    return { x:(e.clientX - rect.left)*scaleX, y:(e.clientY - rect.top)*scaleY, pressure };
  };

  const startDraw = useCallback((e) => {
    e.preventDefault();
    const canvas = canvasRefs.current[activeLayer];
    if (!canvas) return;
    const pos = getPos(e, canvas);
    drawing.current = true;
    lastPos.current = pos;
    lineStart.current = pos;
    saveHistory(activeLayer);

    if (activeTool === "fill") {
      const ctx = canvas.getContext("2d");
      floodFill(ctx, Math.floor(pos.x), Math.floor(pos.y), color, canvasSize.w, canvasSize.h);
    }
  }, [activeLayer, activeTool, color, saveHistory, canvasSize]);

  const draw = useCallback((e) => {
    e.preventDefault();
    if (!drawing.current) return;
    const canvas = canvasRefs.current[activeLayer];
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    const pressure = pos.pressure;

    if (activeTool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, size * pressure, 0, Math.PI*2);
      ctx.fillStyle = "rgba(0,0,0,1)";
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
    } else if (activeTool === "pencil" || activeTool === "brush") {
      ctx.globalAlpha = opacity * (activeTool === "brush" ? pressure : 1);
      ctx.strokeStyle = color;
      ctx.lineWidth = size * (activeTool === "brush" ? pressure : 1);
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.beginPath();
      if (lastPos.current) { ctx.moveTo(lastPos.current.x, lastPos.current.y); }
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    lastPos.current = pos;
  }, [activeLayer, activeTool, color, size, opacity]);

  const endDraw = useCallback((e) => {
    if (!drawing.current) return;
    drawing.current = false;
    const canvas = canvasRefs.current[activeLayer];
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const pos = lastPos.current;
    const start = lineStart.current;

    if (activeTool === "line" && start && pos) {
      ctx.strokeStyle = color; ctx.lineWidth = size; ctx.globalAlpha = opacity;
      ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(start.x, start.y); ctx.lineTo(pos.x, pos.y); ctx.stroke();
      ctx.globalAlpha = 1;
    } else if (activeTool === "rect" && start && pos) {
      ctx.strokeStyle = color; ctx.lineWidth = size; ctx.globalAlpha = opacity;
      ctx.strokeRect(start.x, start.y, pos.x-start.x, pos.y-start.y);
      ctx.globalAlpha = 1;
    } else if (activeTool === "ellipse" && start && pos) {
      ctx.strokeStyle = color; ctx.lineWidth = size; ctx.globalAlpha = opacity;
      ctx.beginPath();
      ctx.ellipse((start.x+pos.x)/2, (start.y+pos.y)/2, Math.abs(pos.x-start.x)/2, Math.abs(pos.y-start.y)/2, 0, 0, Math.PI*2);
      ctx.stroke(); ctx.globalAlpha = 1;
    }
    lastPos.current = null;
  }, [activeLayer, activeTool, color, size, opacity]);

  const clearLayer = () => {
    const canvas = canvasRefs.current[activeLayer];
    if (!canvas) return;
    saveHistory(activeLayer);
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvasSize.w, canvasSize.h);
    if (activeLayer === "Background") { ctx.fillStyle = "#ffffff"; ctx.fillRect(0,0,canvasSize.w,canvasSize.h); }
  };

  const exportCharacter = () => {
    const merged = document.createElement("canvas");
    merged.width = canvasSize.w; merged.height = canvasSize.h;
    const ctx = merged.getContext("2d");
    LAYER_NAMES.slice().reverse().forEach(name => {
      if (!layerVisible[name]) return;
      const c = canvasRefs.current[name];
      if (!c) return;
      ctx.globalAlpha = layerOpacity[name];
      ctx.drawImage(c, 0, 0);
    });
    ctx.globalAlpha = 1;
    merged.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        onExportCharacter && onExportCharacter({
          id: crypto.randomUUID(),
          name: "My Character",
          image: img,
          builtin: null,
          position: { x:0.5, y:0.5 },
          scale: 0.6,
          rotation: 0,
          visible: true,
          opacity: 1,
        });
      };
      img.src = url;
    }, "image/png");
  };

  const downloadDrawing = () => {
    const merged = document.createElement("canvas");
    merged.width = canvasSize.w; merged.height = canvasSize.h;
    const ctx = merged.getContext("2d");
    LAYER_NAMES.slice().reverse().forEach(name => {
      if (!layerVisible[name]) return;
      const c = canvasRefs.current[name];
      if (c) ctx.drawImage(c, 0, 0);
    });
    const a = document.createElement("a");
    a.href = merged.toDataURL("image/png");
    a.download = "spx_character.png"; a.click();
  };

  const S = {
    wrap: { display:"flex", height:"100%", overflow:"hidden" },
    tools: { width:36, background:"#06060f", borderRight:"1px solid #21262d", display:"flex", flexDirection:"column", alignItems:"center", padding:"6px 0", gap:4 },
    toolBtn: (active) => ({ width:28, height:28, borderRadius:5, border:"1px solid", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:13,
      borderColor: active ? "#00ffc8" : "#21262d",
      background:  active ? "rgba(0,255,200,0.15)" : "transparent",
      color:       active ? "#00ffc8" : "#6b7280" }),
    canvasArea: { flex:1, position:"relative", overflow:"hidden", background:"#1a1a1a", display:"flex", alignItems:"center", justifyContent:"center" },
    right: { width:160, background:"#0d1117", borderLeft:"1px solid #21262d", display:"flex", flexDirection:"column", padding:8, gap:8, overflow:"auto" },
    label: { fontSize:9, color:"#6b7280", letterSpacing:1, textTransform:"uppercase", marginBottom:2 },
    btn: { padding:"4px 8px", borderRadius:5, border:"1px solid #21262d", background:"#1a1a2e", color:"#e0e0e0", cursor:"pointer", fontSize:10, width:"100%" },
    btnTeal: { padding:"4px 8px", borderRadius:5, border:"1px solid #00ffc8", background:"rgba(0,255,200,0.1)", color:"#00ffc8", cursor:"pointer", fontSize:10, width:"100%" },
    layerItem: (active) => ({ padding:"4px 6px", borderRadius:4, border:"1px solid", marginBottom:3, cursor:"pointer", fontSize:10,
      borderColor: active ? "#00ffc8" : "#21262d",
      background:  active ? "rgba(0,255,200,0.07)" : "transparent",
      color:        active ? "#00ffc8" : "#e0e0e0" }),
  };

  return (
    <div style={S.wrap}>
      {/* Tool strip */}
      <div style={S.tools}>
        {TOOLS.map(t => (
          <button key={t.id} title={t.label} style={S.toolBtn(activeTool===t.id)} onClick={() => { setActiveTool(t.id); if(t.size) setSize(t.size); }}>
            {t.icon}
          </button>
        ))}
        <div style={{ width:24, height:1, background:"#21262d", margin:"4px 0" }} />
        <button title="Undo" style={S.toolBtn(false)} onClick={undo}>↩</button>
        <button title="Clear Layer" style={S.toolBtn(false)} onClick={clearLayer}>🗑</button>
      </div>

      {/* Canvas stack */}
      <div style={S.canvasArea}>
        {/* Checkerboard transparency indicator */}
        <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(45deg,#333 25%,transparent 25%),linear-gradient(-45deg,#333 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#333 75%),linear-gradient(-45deg,transparent 75%,#333 75%)", backgroundSize:"16px 16px", backgroundPosition:"0 0,0 8px,8px -8px,-8px 0", opacity:0.3 }} />
        {/* Layer canvases stacked */}
        <div style={{ position:"relative", width:canvasSize.w, height:canvasSize.h, maxWidth:"100%", maxHeight:"100%" }}>
          {LAYER_NAMES.slice().reverse().map((name, i) => (
            <canvas key={name} ref={el => { if(el) canvasRefs.current[name] = el; }}
              width={canvasSize.w} height={canvasSize.h}
              style={{ position: i===0?"relative":"absolute", top:0, left:0, width:"100%", height:"100%",
                display:layerVisible[name]?"block":"none",
                opacity: layerOpacity[name],
                pointerEvents: name === activeLayer ? "auto" : "none",
                cursor: activeTool==="eraser" ? "cell" : activeTool==="fill" ? "crosshair" : "default",
                touchAction:"none" }}
              onPointerDown={name===activeLayer ? startDraw : undefined}
              onPointerMove={name===activeLayer ? draw : undefined}
              onPointerUp={name===activeLayer ? endDraw : undefined}
              onPointerLeave={name===activeLayer ? endDraw : undefined}
            />
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div style={S.right}>
        {/* Color */}
        <div>
          <div style={S.label}>Color</div>
          <input type="color" value={color} onChange={e => setColor(e.target.value)}
            style={{ width:"100%", height:28, borderRadius:5, border:"1px solid #21262d", cursor:"pointer", background:"none" }} />
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:2, marginTop:4 }}>
            {COLORS.map(c => (
              <div key={c} onClick={() => setColor(c)}
                style={{ width:"100%", aspectRatio:"1", borderRadius:3, background:c, cursor:"pointer",
                  border: color===c ? "2px solid #00ffc8" : "1px solid #21262d" }} />
            ))}
          </div>
        </div>

        {/* Size */}
        <div>
          <div style={S.label}>Size: {size}px</div>
          <input type="range" min={1} max={80} value={size} onChange={e => setSize(Number(e.target.value))}
            style={{ width:"100%", accentColor:"#00ffc8" }} />
        </div>

        {/* Opacity */}
        <div>
          <div style={S.label}>Opacity: {Math.round(opacity*100)}%</div>
          <input type="range" min={0.05} max={1} step={0.05} value={opacity} onChange={e => setOpacity(Number(e.target.value))}
            style={{ width:"100%", accentColor:"#00ffc8" }} />
        </div>

        {/* Layers */}
        <div>
          <div style={S.label}>Layers</div>
          {LAYER_NAMES.map(name => (
            <div key={name} onClick={() => setActiveLayer(name)} style={S.layerItem(activeLayer===name)}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <span>{name}</span>
                <button onClick={e => { e.stopPropagation(); setLayerVisible(v => ({...v,[name]:!v[name]})); }}
                  style={{ background:"none", border:"none", cursor:"pointer", fontSize:10, color:"#6b7280", padding:0 }}>
                  {layerVisible[name]?"👁":"🚫"}
                </button>
              </div>
              <input type="range" min={0} max={1} step={0.1} value={layerOpacity[name]}
                onClick={e => e.stopPropagation()}
                onChange={e => setLayerOpacity(v => ({...v,[name]:Number(e.target.value)}))}
                style={{ width:"100%", accentColor:"#00ffc8", marginTop:2 }} />
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
          <button style={S.btnTeal} onClick={exportCharacter}>🎭 Use as Puppet</button>
          <button style={S.btn} onClick={downloadDrawing}>⬇ Download PNG</button>
          <button style={{ ...S.btn, color:"var(--danger)", borderColor:"var(--danger)" }} onClick={clearLayer}>🗑 Clear Layer</button>
        </div>
      </div>
    </div>
  );
}
