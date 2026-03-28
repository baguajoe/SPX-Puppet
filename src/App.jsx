import React, { useState, useRef, useCallback, useEffect } from "react";
import PuppetCanvas from "./components/puppet/PuppetCanvas.jsx";
import PuppetCharacterPanel from "./components/puppet/PuppetCharacterPanel.jsx";
import PuppetTimeline from "./components/timeline/PuppetTimeline.jsx";
import PuppetScene from "./components/scene/PuppetScene.jsx";
import PuppetAssetLibrary from "./components/library/PuppetAssetLibrary.jsx";
import PuppetMarketplace from "./components/library/PuppetMarketplace.jsx";
import CollabPanel from "./components/collab/CollabPanel.jsx";
import StreamPanel from "./components/streaming/StreamPanel.jsx";
import AIVoicePanel from "./components/puppet/AIVoicePanel.jsx";
import MenuBar from "./components/puppet/MenuBar.jsx";
import DrawPanel from "./components/puppet/DrawPanel.jsx";
import GeneralToolbar from "./components/puppet/GeneralToolbar.jsx";
import BoneToolbar from "./components/puppet/BoneToolbar.jsx";
import LayerPanel from "./components/puppet/LayerPanel.jsx";
import StatsOverlay from "./components/puppet/StatsOverlay.jsx";
import usePuppetMocap from "./hooks/usePuppetMocap.js";
import { createRig } from "./utils/PuppetRig.js";
import { createLipSyncEngine } from "./utils/PuppetLipSync.js";
import { createRecorder, exportFramesAsJSON } from "./utils/PuppetRecorder.js";
import { createFaceExpressionEngine, EXPRESSIONS } from "./utils/PuppetFaceExpressions.js";
import { exportMP4, downloadFile } from "./utils/PuppetExporter.js";
import "./styles/puppet.css";

const PANELS = [
  ["characters", "🎭", "Chars"],
  ["scene",      "🌆", "Scene"],
  ["library",    "📦", "Lib"],
  ["marketplace","🛒", "Market"],
  ["aivoice",    "🔊", "Voice"],
  ["collab",     "👥", "Collab"],
  ["stream",     "📡", "Stream"],
  ["draw",       "✏️",  "Draw"],

];

export default function App() {
  const [characters,     setCharacters]     = useState([]);
  const [activeId,       setActiveId]       = useState(null);
  const [rig,            setRig]            = useState(createRig(640, 480));
  const [mocapOn,        setMocapOn]        = useState(false);
  const [lipSyncOn,      setLipSyncOn]      = useState(false);
  const [faceOn,         setFaceOn]         = useState(false);
  const [showSkeleton,   setShowSkeleton]   = useState(true);
  const [showGrid,       setShowGrid]       = useState(true);
  const [mouthShape,     setMouthShape]     = useState(null);
  const [expression,     setExpression]     = useState({ ...EXPRESSIONS.neutral });
  const [currentScene,   setCurrentScene]   = useState({ id: "dark", bg: "#06060f" });
  const [props,          setProps]          = useState([]);
  const [activePanel,    setActivePanel]    = useState("characters");
  const [isRecording,    setIsRecording]    = useState(false);
  const [isPlaying,      setIsPlaying]      = useState(false);
  const [recordedFrames, setRecordedFrames] = useState([]);
  const [playbackIdx,    setPlaybackIdx]    = useState(0);
  const [downloadUrl,    setDownloadUrl]    = useState(null);
  const [status,         setStatus]         = useState("Ready");
  const [activeTool,     setActiveTool]     = useState("select");
  const [transform,      setTransform]      = useState({ x: 0, y: 0, w: 100, h: 100, r: 0 });
  const [showStats,      setShowStats]      = useState(true);

  const rigRef          = useRef(createRig(640, 480));
  const videoRef        = useRef(null);
  const canvasCompRef   = useRef(null);
  const recorderRef     = useRef(null);
  const lipSyncRef      = useRef(null);
  const faceEngineRef   = useRef(null);
  const playIntervalRef = useRef(null);

  const onRigUpdate = useCallback((newRig) => {
    rigRef.current = newRig;
    setRig({ ...newRig });
  }, []);

  const { fps, start: startMocap, stop: stopMocap } =
    usePuppetMocap(videoRef, rigRef, onRigUpdate, mocapOn);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.code === 'Space') { e.preventDefault(); isPlaying ? pausePlayback() : startPlayback(); }
      if (e.key === 'r' && !e.ctrlKey) { isRecording ? stopRecording() : startRecording(); }
      if (e.key === 'f') { setShowGrid(v => !v); }
      if (e.key === 'b') { setShowSkeleton(v => !v); }
      if (e.key === 'Escape') { setActivePanel('characters'); }
      if (e.ctrlKey && e.key === 's') { e.preventDefault(); handleMenuAction('save'); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isPlaying, isRecording]);

  useEffect(() => {
    if (!lipSyncOn) return;
    const id = setInterval(() => {
      if (lipSyncRef.current) setMouthShape(lipSyncRef.current.getShape());
    }, 33);
    return () => clearInterval(id);
  }, [lipSyncOn]);

  const toggleMocap = async () => {
    if (mocapOn) { stopMocap(); setMocapOn(false); setStatus("MoCap stopped"); }
    else { setMocapOn(true); await startMocap(); setStatus("MoCap running"); }
  };

  const toggleLipSync = async () => {
    if (lipSyncOn) {
      lipSyncRef.current && lipSyncRef.current.stop();
      lipSyncRef.current = null;
      setLipSyncOn(false); setMouthShape(null); setStatus("Lip sync stopped");
    } else {
      const engine = createLipSyncEngine();
      const ok = await engine.start();
      if (ok) { lipSyncRef.current = engine; setLipSyncOn(true); setStatus("Lip sync running"); }
      else setStatus("Mic access denied");
    }
  };

  const toggleFace = async () => {
    if (faceOn) {
      faceEngineRef.current && faceEngineRef.current.stop();
      faceEngineRef.current = null;
      setFaceOn(false); setStatus("Face tracking stopped");
    } else {
      try {
        const engine = createFaceExpressionEngine();
        await engine.start(videoRef.current, (expr) => setExpression(expr));
        faceEngineRef.current = engine;
        setFaceOn(true); setStatus("Face tracking running");
      } catch (e) { setStatus("Face error: " + e.message); }
    }
  };

  const startRecording = () => {
    const canvas = canvasCompRef.current && canvasCompRef.current.getCanvas();
    if (!canvas) return;
    const rec = createRecorder(canvas, 30);
    rec.start(); recorderRef.current = rec;
    setIsRecording(true); setStatus("Recording...");
  };

  const stopRecording = async () => {
    const result = recorderRef.current && await recorderRef.current.stop();
    setIsRecording(false);
    if (result) {
      setRecordedFrames(result.frames);
      setDownloadUrl(result.url);
      setStatus("Saved " + result.frames.length + " frames");
    }
  };

  const startPlayback = () => {
    if (!recordedFrames.length) return;
    setPlaybackIdx(0); setIsPlaying(true);
    playIntervalRef.current = setInterval(() => {
      setPlaybackIdx((i) => {
        if (i >= recordedFrames.length - 1) {
          clearInterval(playIntervalRef.current); setIsPlaying(false); return 0;
        }
        return i + 1;
      });
    }, 1000 / 30);
  };

  const pausePlayback = () => { clearInterval(playIntervalRef.current); setIsPlaying(false); };
  const stopPlayback  = () => { clearInterval(playIntervalRef.current); setIsPlaying(false); setPlaybackIdx(0); };

  const addCharacter = (char) => {
    setCharacters((prev) => [...prev, char]);
    setActiveId(char.id);
    setStatus("Added: " + char.name);
  };

  const removeCharacter = (id) => {
    setCharacters((prev) => prev.filter((c) => c.id !== id));
    setActiveId((prev) => (prev === id ? null : prev));
  };

  const updateCharacter = (id, updates) => {
    setCharacters((prev) => prev.map((c) => c.id === id ? { ...c, ...updates } : c));
  };

  const handleExportMP4 = async () => {
    const canvas = canvasCompRef.current && canvasCompRef.current.getCanvas();
    if (!canvas) return;
    setStatus("Exporting...");
    const result = await exportMP4(canvas, 10, 30);
    downloadFile(result.blob, result.filename);
    setStatus("MP4 exported!");
  };

  const handleMenuAction = (action) => {
    if (action === "save") {
      const data = JSON.stringify({ characters, version: "1.0" });
      const blob = new Blob([data], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "puppet_project.json"; a.click();
      setStatus("Project saved");
    } else if (action === "export_json") {
      exportFramesAsJSON(recordedFrames);
    } else if (action === "export_mp4") {
      handleExportMP4();
    } else if (action === "toggle_skeleton") {
      setShowSkeleton((v) => !v);
    } else if (action === "toggle_grid") {
      setShowGrid((v) => !v);
    } else if (action === "play") {
      isPlaying ? pausePlayback() : startPlayback();
    } else if (action === "new") {
      setCharacters([]); setRecordedFrames([]); setStatus("New project");
    } else if (action === "toggle_fps") {
      setShowStats((v) => !v);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      <MenuBar onAction={handleMenuAction} />
      <GeneralToolbar
        activeTool={activeTool} setActiveTool={setActiveTool}
        transform={transform} onTransformChange={setTransform}
        onUndo={() => setStatus("Undo")} onRedo={() => setStatus("Redo")}
      />
      <BoneToolbar onAction={(a) => setStatus("Bone: " + a)} />

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sidebar */}
        <div className="sp-sidebar" style={{ width: 220 }}>
          <div className="sp-sidebar-header">
            <span className="sp-logo">SPX</span>
            <span style={{ fontWeight: 700, fontSize: 14 }}>Puppet</span>
            <span className={"sp-chip " + (mocapOn ? "sp-chip--on" : "sp-chip--off")}
              style={{ marginLeft: "auto", fontSize: 9 }}>
              {mocapOn ? ("LIVE " + fps + "fps") : "Off"}
            </span>
          </div>

          {/* Panel nav */}
          <div style={{ display: "flex", gap: 2, padding: "5px 6px", borderBottom: "1px solid var(--border)", flexWrap: "wrap" }}>
            {PANELS.map(([id, icon, label]) => (
              <button key={id} onClick={() => setActivePanel(id)}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1,
                  padding: "4px 5px", borderRadius: 4, border: "1px solid", minWidth: 32,
                  borderColor: activePanel === id ? "var(--teal)" : "var(--border)",
                  background: activePanel === id ? "rgba(0,255,200,0.1)" : "transparent",
                  color: activePanel === id ? "var(--teal)" : "var(--muted)",
                  cursor: "pointer" }}>
                <span style={{ fontSize: 12 }}>{icon}</span>
                <span style={{ fontSize: 7, lineHeight: 1 }}>{label}</span>
              </button>
            ))}
          </div>

          {/* Live capture */}
          <div style={{ padding: "7px 8px", borderBottom: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 5 }}>
            <button className={"sp-btn " + (mocapOn ? "sp-btn--danger" : "sp-btn--primary")} onClick={toggleMocap}>
              {mocapOn ? "■ Stop MoCap" : "▶ Start MoCap"}
            </button>
            <div style={{ display: "flex", gap: 5 }}>
              <button className={"sp-btn " + (lipSyncOn ? "sp-btn--danger" : "sp-btn--teal")}
                style={{ flex: 1 }} onClick={toggleLipSync}>
                {lipSyncOn ? "■ Lip" : "🎤 Lip"}
              </button>
              <button className={"sp-btn " + (faceOn ? "sp-btn--danger" : "sp-btn--orange")}
                style={{ flex: 1 }} onClick={toggleFace}>
                {faceOn ? "■ Face" : "😊 Face"}
              </button>
            </div>
            {mocapOn && (
              <video ref={videoRef} autoPlay muted playsInline
                style={{ width: "100%", borderRadius: 6, border: "1px solid var(--border)", transform: "scaleX(-1)", display: "block" }} />
            )}
          </div>

          {/* Panel content */}
          <div className="sp-sidebar-body">
            {activePanel === "characters" && (
              <PuppetCharacterPanel
                characters={characters} activeId={activeId}
                onAdd={addCharacter} onSelect={setActiveId}
                onRemove={removeCharacter}
                onPositionChange={(id, updates) => updateCharacter(id, updates)}
              />
            )}
            {activePanel === "scene" && (
              <PuppetScene onApply={setCurrentScene} currentScene={currentScene} />
            )}
            {activePanel === "library" && (
              <PuppetAssetLibrary
                onAddProp={(p) => setProps((prev) => [...prev, { ...p, x: 0.5, y: 0.5 }])}
                onSetExpression={(id) => setExpression(EXPRESSIONS[id] || EXPRESSIONS.neutral)}
              />
            )}
            {activePanel === "marketplace" && (
              <PuppetMarketplace onInstall={addCharacter} />
            )}
            {activePanel === "aivoice" && (
              <AIVoicePanel onMouthShape={setMouthShape} setStatus={setStatus} />
            )}
            {activePanel === "collab" && (
              <CollabPanel onRigReceived={onRigUpdate} onExpressionReceived={setExpression} />
            )}
            {activePanel === "draw" && null}
          {activePanel === "stream" && (
              <StreamPanel canvasRef={canvasCompRef} webcamRef={videoRef} setStatus={setStatus} />
            )}

            {/* View options always visible */}
            <div style={{ marginTop: 12, borderTop: "1px solid var(--border)", paddingTop: 10 }}>
              <div className="sp-section-label">View</div>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--muted)", cursor: "pointer", marginBottom: 4 }}>
                <input type="checkbox" checked={showSkeleton} onChange={(e) => setShowSkeleton(e.target.checked)} />
                Show Skeleton
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--muted)", cursor: "pointer", marginBottom: 4 }}>
                <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} />
                Show Grid
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--muted)", cursor: "pointer" }}>
                <input type="checkbox" checked={showStats} onChange={(e) => setShowStats(e.target.checked)} />
                Show FPS Stats
              </label>
            </div>
          </div>

          <div style={{ padding: "5px 10px", borderTop: "1px solid var(--border)", fontSize: 10, color: "var(--muted)" }}>
            {status}
          </div>
        </div>

        {/* Main viewport */}
        <div className="sp-main">
          <div className="sp-toolbar">
            <span className="sp-toolbar-title">SPX Puppet</span>
            <span style={{ fontSize: 10, color: "var(--muted)", marginRight: 8 }}>
              {characters.length} character{characters.length !== 1 ? "s" : ""}
            </span>
            {mocapOn && (
              <span style={{ fontSize: 10, color: "var(--danger)", marginRight: 8 }}>LIVE {fps}fps</span>
            )}
            <button className="sp-btn sp-btn--teal"
              style={{ width: "auto", padding: "3px 10px", fontSize: 10 }} onClick={handleExportMP4}>
              Export MP4
            </button>
          </div>

          <div className="sp-canvas-area" style={{ display: "flex", flexDirection: "row" }}>
            {activePanel === "draw" && (
              <div style={{ position:"absolute", inset:0, zIndex:10, display:"flex", flexDirection:"column" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"4px 10px", background:"#0d1117", borderBottom:"1px solid #21262d", flexShrink:0 }}>
                  <span style={{ fontSize:11, color:"#00ffc8", fontWeight:600 }}>✏️ Draw Character</span>
                  <button onClick={() => setActivePanel("characters")}
                    style={{ padding:"2px 10px", border:"1px solid #21262d", borderRadius:4, background:"transparent", color:"#6b7280", cursor:"pointer", fontSize:11 }}>
                    ✕ Close
                  </button>
                </div>
                <div style={{ flex:1, overflow:"hidden" }}>
                  <DrawPanel onExportCharacter={(char) => { addCharacter(char); setActivePanel("characters"); }} />
                </div>
              </div>
            )}
            <StatsOverlay fps={fps} show={showStats} />
            <PuppetCanvas
              ref={canvasCompRef}
              characters={characters}
              activeRig={rig}
              mouthShape={mouthShape}
              expression={expression}
              showSkeleton={showSkeleton}
              showGrid={showGrid}
            />
          </div>

          <div className="sp-timeline">
            <PuppetTimeline
              isRecording={isRecording} isPlaying={isPlaying}
              frameCount={recordedFrames.length} currentFrame={playbackIdx}
              duration={recordedFrames.length / 30} fps={30}
              onRecord={startRecording} onStopRecord={stopRecording}
              onPlay={startPlayback} onPause={pausePlayback} onStop={stopPlayback}
              onScrub={(idx) => { setIsPlaying(false); setPlaybackIdx(idx); }}
              onExportJSON={() => exportFramesAsJSON(recordedFrames)}
              onExportVideo={() => {
                if (downloadUrl) {
                  const a = document.createElement("a");
                  a.href = downloadUrl; a.download = "puppet.webm"; a.click();
                }
              }}
              downloadUrl={downloadUrl}
            />
          </div>
        </div>

        {/* Layer panel */}
        <LayerPanel
          characters={characters} activeId={activeId}
          onSelect={setActiveId}
          onToggleVisible={(id) => updateCharacter(id, { visible: !characters.find((c) => c.id === id).visible })}
          onToggleLock={() => {}}
        />
      </div>

      {/* Hidden webcam when mocap off */}
      {!mocapOn && (
        <video ref={videoRef} autoPlay muted playsInline
          style={{ position: "absolute", opacity: 0, width: 1, height: 1, pointerEvents: "none" }} />
      )}
    </div>
  );
}
