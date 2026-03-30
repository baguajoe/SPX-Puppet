import React, { useState, useRef, useCallback, useEffect } from "react";
import PuppetCanvas from "./components/puppet/PuppetCanvas.jsx";
import PuppetCharacterPanel from "./components/puppet/PuppetCharacterPanel.jsx";
import PuppetTimeline from "./components/timeline/PuppetTimeline.jsx";
import KeyframeTimeline from "./components/timeline/KeyframeTimeline.jsx";
import PuppetScene from "./components/scene/PuppetScene.jsx";
import PuppetAssetLibrary from "./components/library/PuppetAssetLibrary.jsx";
import PuppetMarketplace from "./components/library/PuppetMarketplace.jsx";
import CollabPanel from "./components/collab/CollabPanel.jsx";
import StreamPanel from "./components/streaming/StreamPanel.jsx";
import AIVoicePanel from "./components/puppet/AIVoicePanel.jsx";
import DrawPanel from "./components/puppet/DrawPanel.jsx";
import AutoRigPanel from "./components/puppet/PuppetPanels.jsx";
import { TriggersPanel, MotionLibraryPanel, FacialSlidersPanel, CharacterLibraryPanel } from "./components/puppet/PuppetPanels.jsx";
import { CyclePlayer, startAutoBlink } from "./utils/PuppetCycleLayers.js";
import { MagnetSystem } from "./utils/PuppetMagnets.js";
import MenuBar from "./components/puppet/MenuBar.jsx";
import GeneralToolbar from "./components/puppet/GeneralToolbar.jsx";
import BoneToolbar from "./components/puppet/BoneToolbar.jsx";
import LayerPanel from "./components/puppet/LayerPanel.jsx";
import StatsOverlay from "./components/puppet/StatsOverlay.jsx";
import SceneSequencer from "./components/film/SceneSequencer.jsx";
import CameraAnimator from "./components/film/CameraAnimator.jsx";
import DialogueSystem from "./components/film/DialogueSystem.jsx";
import SoundtrackPanel from "./components/film/SoundtrackPanel.jsx";
import usePuppetMocap from "./hooks/usePuppetMocap.js";
import { createRig } from "./utils/PuppetRig.js";
import { solveFABRIK, createArmIK, createLegIK, drawIKChain } from "./utils/PuppetIK.js";
import { createPhysicsLayer, stepPhysicsLayer, applyWindToLayer } from "./utils/PuppetPhysics.js";
import { createLipSyncEngine } from "./utils/PuppetLipSync.js";
import { createRecorder, exportFramesAsJSON } from "./utils/PuppetRecorder.js";
import { createFaceExpressionEngine, EXPRESSIONS } from "./utils/PuppetFaceExpressions.js";
import { exportMP4, downloadFile } from "./utils/PuppetExporter.js";
import { exportFullFilm, downloadBlob } from "./utils/FilmExporter.js";
import { uploadPuppetRecording, savePuppetProject, listPuppetProjects, notifyStreamPireX } from "./utils/PuppetStreamPireXBridge.js";
import "./styles/puppet.css";

const PANELS = [
  ["characters","🎭","Chars"],
  ["scene",     "🌆","Scene"],
  ["library",   "📦","Lib"],
  ["marketplace","🛒","Market"],
  ["aivoice",   "🔊","Voice"],
  ["collab",    "👥","Collab"],
  ["stream",    "📡","Stream"],
  ["draw",      "✏️","Draw"],
  ["camera",    "🎥","Camera"],
  ["dialogue",  "💬","Dialog"],
  ["soundtrack","🎵","Sound"],
  ["film",      "🎬","Film"],
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
  const [transform,      setTransform]      = useState({ x:0, y:0, w:100, h:100, r:0 });
  const [showStats,      setShowStats]      = useState(true);
  const [keyframes,      setKeyframes]      = useState({});
  const [scenes,         setScenes]         = useState([{ id:"scene_1", name:"Scene 1", duration:10, dialogues:[], characters:[] }]);
  const [activeScene,    setActiveScene]    = useState("scene_1");
  const [dialogues,      setDialogues]      = useState([]);
  const [currentBGMusic, setCurrentBGMusic] = useState(null);
  const [cameraMove,     setCameraMove]     = useState("static");
  const [exportProgress, setExportProgress] = useState(null);
  const [useKeyframes,   setUseKeyframes]   = useState(false);
  const [history,        setHistory]        = useState([]);
  const [future,         setFuture]         = useState([]);
  const [physicsOn,      setPhysicsOn]      = useState(false);
  const [ikOn,           setIkOn]           = useState(false);

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

  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.code === "Space") { e.preventDefault(); isPlaying ? pausePlayback() : startPlayback(); }
      if (e.key === "f") setShowGrid((v) => !v);
      if (e.key === "b") setShowSkeleton((v) => !v);
      if (e.key === "Escape") setActivePanel("characters");
      if (e.ctrlKey && e.key === "s") { e.preventDefault(); handleMenuAction("save"); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isPlaying]);

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
    if (result) { setRecordedFrames(result.frames); setDownloadUrl(result.url); setStatus("Saved " + result.frames.length + " frames"); }
  };

  const startPlayback = () => {
    if (!recordedFrames.length) return;
    setPlaybackIdx(0); setIsPlaying(true);
    playIntervalRef.current = setInterval(() => {
      setPlaybackIdx((i) => {
        if (i >= recordedFrames.length - 1) { clearInterval(playIntervalRef.current); setIsPlaying(false); return 0; }
        return i + 1;
      });
    }, 1000 / 30);
  };

  const pausePlayback = () => { clearInterval(playIntervalRef.current); setIsPlaying(false); };
  const stopPlayback  = () => { clearInterval(playIntervalRef.current); setIsPlaying(false); setPlaybackIdx(0); };

  const addCharacter = (char) => {
    setHistory(h => [...h.slice(-20), characters]);
    setFuture([]);
    setCharacters((p) => [...p, char]);
    setActiveId(char.id);
    setStatus("Added: " + char.name);
  };
  const removeCharacter = (id) => { setCharacters((p) => p.filter((c) => c.id !== id)); setActiveId((p) => p === id ? null : p); };
  const updateCharacter = (id, updates) => { setCharacters((p) => p.map((c) => c.id === id ? { ...c, ...updates } : c)); };

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
      const blob = new Blob([JSON.stringify({ characters, scenes, dialogues, version:"1.0" })], { type:"application/json" });
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "puppet_project.json"; a.click();
      setStatus("Project saved");
    } else if (action === "export_mp4") { handleExportMP4(); }
    else if (action === "toggle_skeleton") { setShowSkeleton((v) => !v); }
    else if (action === "toggle_grid") { setShowGrid((v) => !v); }
    else if (action === "toggle_fps") { setShowStats((v) => !v); }
    else if (action === "new") { setCharacters([]); setRecordedFrames([]); setDialogues([]); setStatus("New project"); }
    else if (action === "load") {
      const inp = document.createElement("input");
      inp.type = "file"; inp.accept = ".json";
      inp.onchange = (e) => {
        const file = e.target.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          try {
            const data = JSON.parse(ev.target.result);
            if (data.characters) setCharacters(data.characters);
            if (data.scenes) setScenes(data.scenes);
            if (data.dialogues) setDialogues(data.dialogues);
            setStatus("Project loaded: " + file.name);
          } catch(err) { setStatus("Load failed: " + err.message); }
        };
        reader.readAsText(file);
      };
      inp.click();
    }
    else if (action === "toggle_physics") { setPhysicsOn(v => !v); setStatus("Physics: " + (!physicsOn ? "on" : "off")); }
    else if (action === "toggle_ik") { setIkOn(v => !v); setStatus("IK: " + (!ikOn ? "on" : "off")); }
    else if (action === "cloud_save") {
      const token = localStorage.getItem('jwt-token') || localStorage.getItem('token');
      if (!token) { setStatus("Sign in to StreamPireX to save to cloud"); return; }
      savePuppetProject({ characters, scenes, dialogues, keyframes, version: "1.0" }, "puppet_project")
        .then(r => { notifyStreamPireX(r.url, "puppet_project"); setStatus("✅ Saved to StreamPireX cloud"); })
        .catch(e => setStatus("Cloud save failed: " + e.message));
    }
    else if (action === "cloud_load") {
      listPuppetProjects()
        .then(projects => {
          if (!projects.length) { setStatus("No cloud projects found"); return; }
          // Use first project for now — UI picker can be added later
          setStatus("Found " + projects.length + " cloud project(s) — load from menu");
        })
        .catch(e => setStatus("Cloud load failed: " + e.message));
    }
    else if (action === "play") { isPlaying ? pausePlayback() : startPlayback(); }
  };

  const addScene = () => {
    const id = "scene_" + Date.now();
    setScenes((p) => [...p, { id, name:"Scene "+(p.length+1), duration:10, dialogues:[], characters:[] }]);
    setActiveScene(id); setStatus("Scene added");
  };

  const deleteScene = (id) => {
    setScenes((p) => p.filter((s) => s.id !== id));
    if (activeScene === id && scenes.length > 1) setActiveScene(scenes[0].id);
  };

  const reorderScene = (from, to) => {
    setScenes((p) => { const arr = [...p]; const [item] = arr.splice(from, 1); arr.splice(to, 0, item); return arr; });
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh", overflow:"hidden" }}>
      <MenuBar onAction={handleMenuAction} />
      <GeneralToolbar activeTool={activeTool} setActiveTool={setActiveTool}
        transform={transform} onTransformChange={setTransform}
        onUndo={() => {
          if (history.length === 0) return;
          const prev = history[history.length - 1];
          setFuture(f => [characters, ...f]);
          setCharacters(prev);
          setHistory(h => h.slice(0, -1));
          setStatus('Undo');
        }}
        onRedo={() => {
          if (future.length === 0) return;
          const next = future[0];
          setHistory(h => [...h, characters]);
          setCharacters(next);
          setFuture(f => f.slice(1));
          setStatus('Redo');
        }} />
      <BoneToolbar onAction={(a) => setStatus("Bone: " + a)} />

      <div style={{ display:"flex", flex:1, overflow:"hidden" }}>
        {/* Sidebar */}
        <div className="sp-sidebar" style={{ width:220 }}>
          <div className="sp-sidebar-header">
            <span className="sp-logo">SPX</span>
            <span style={{ fontWeight:700, fontSize:14 }}>Puppet</span>
            <span className={"sp-chip " + (mocapOn ? "sp-chip--on" : "sp-chip--off")} style={{ marginLeft:"auto", fontSize:9 }}>
              {mocapOn ? ("LIVE " + fps + "fps") : "Off"}
            </span>
          </div>

          {/* Panel nav — 2 rows of 6 */}
          <div style={{ display:"flex", gap:2, padding:"4px 5px", borderBottom:"1px solid var(--border)", flexWrap:"wrap" }}>
            {PANELS.map(([id, icon, label]) => (
              <button key={id} onClick={() => setActivePanel(id)}
                style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:1,
                  padding:"3px 4px", borderRadius:4, border:"1px solid", minWidth:30, flex:"0 0 auto",
                  borderColor: activePanel===id ? "var(--teal)" : "var(--border)",
                  background:  activePanel===id ? "rgba(0,255,200,0.1)" : "transparent",
                  color:       activePanel===id ? "var(--teal)" : "var(--muted)",
                  cursor:"pointer" }}>
                <span style={{ fontSize:11 }}>{icon}</span>
                <span style={{ fontSize:7, lineHeight:1 }}>{label}</span>
              </button>
            ))}
          </div>

          {/* Live capture */}
          <div style={{ padding:"6px 8px", borderBottom:"1px solid var(--border)", display:"flex", flexDirection:"column", gap:4 }}>
            <button className={"sp-btn " + (mocapOn ? "sp-btn--danger" : "sp-btn--primary")} onClick={toggleMocap}>
              {mocapOn ? "■ Stop MoCap" : "▶ Start MoCap"}
            </button>
            <div style={{ display:"flex", gap:4 }}>
              <button className={"sp-btn " + (lipSyncOn ? "sp-btn--danger" : "sp-btn--teal")} style={{ flex:1 }} onClick={toggleLipSync}>
                {lipSyncOn ? "■ Lip" : "🎤 Lip"}
              </button>
              <button className={"sp-btn " + (faceOn ? "sp-btn--danger" : "sp-btn--orange")} style={{ flex:1 }} onClick={toggleFace}>
                {faceOn ? "■ Face" : "😊 Face"}
              </button>
            </div>
            {mocapOn && (
              <video ref={videoRef} autoPlay muted playsInline
                style={{ width:"100%", borderRadius:6, border:"1px solid var(--border)", transform:"scaleX(-1)", display:"block" }} />
            )}
          </div>

          {/* Panel content */}
          <div className="sp-sidebar-body">
            {activePanel === "characters" && (
              <PuppetCharacterPanel characters={characters} activeId={activeId}
                onAdd={addCharacter} onSelect={setActiveId} onRemove={removeCharacter}
                onPositionChange={(id, updates) => updateCharacter(id, updates)} />
            )}
            {activePanel === "scene" && <PuppetScene onApply={setCurrentScene} currentScene={currentScene} />}
            {activePanel === "library" && (
              <PuppetAssetLibrary
                onAddProp={(p) => setProps((prev) => [...prev, { ...p, x:0.5, y:0.5 }])}
                onSetExpression={(id) => setExpression(EXPRESSIONS[id] || EXPRESSIONS.neutral)} />
            )}
            {activePanel === "marketplace" && <PuppetMarketplace onInstall={addCharacter} />}
            {activePanel === "aivoice" && <AIVoicePanel onMouthShape={setMouthShape} setStatus={setStatus} />}
            {activePanel === "collab" && <CollabPanel onRigReceived={onRigUpdate} onExpressionReceived={setExpression} />}
            {activePanel === "stream" && <StreamPanel canvasRef={canvasCompRef} webcamRef={videoRef} setStatus={setStatus} />}
            {activePanel === "camera" && (
              <CameraAnimator currentMove={cameraMove}
                onApplyMove={(move) => { setCameraMove(move); setStatus("Camera: " + move); }}
                onKeyframe={(track) => {
                  setKeyframes((prev) => ({ ...prev, [track]: [...(prev[track]||[]), { frame:playbackIdx }] }));
                  setStatus("Camera keyframe @ frame " + playbackIdx);
                }} />
            )}
            {activePanel === "dialogue" && (
              <DialogueSystem characters={characters} dialogues={dialogues} currentFrame={playbackIdx} fps={30}
                onAddDialogue={(d) => { setDialogues((prev) => [...prev, d]); setStatus("Dialogue added"); }} />
            )}
            {activePanel === "soundtrack" && (
              <SoundtrackPanel currentBGMusic={currentBGMusic}
                onSetBGMusic={(m) => { setCurrentBGMusic(m); setStatus("Music: " + m.label); }}
                onPlaySFX={(sfx) => setStatus("SFX: " + sfx.label)} />
            )}
            {activePanel === "film" && (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                <div style={{ fontSize:10, color:"#6b7280", letterSpacing:1, textTransform:"uppercase" }}>Film Export</div>
                <div style={{ fontSize:11, color:"#e0e0e0" }}>
                  {scenes.length} scene{scenes.length!==1?"s":""} total
                </div>
                {exportProgress && (
                  <div style={{ padding:8, background:"rgba(0,255,200,0.05)", border:"1px solid #00ffc8", borderRadius:6, fontSize:11, color:"#00ffc8" }}>
                    Exporting scene {exportProgress.scene+1}/{exportProgress.total}...
                  </div>
                )}
                <button className="sp-btn sp-btn--teal" onClick={async () => {
                  const canvas = canvasCompRef.current && canvasCompRef.current.getCanvas();
                  if (!canvas) return;
                  setStatus("Exporting film...");
                  const result = await exportFullFilm(scenes, canvas, 30, setExportProgress);
                  downloadBlob(result.blob, "spx_film.webm");
                  setExportProgress(null); setStatus("Film exported!");
                }}>🎬 Export Full Film</button>
                <button className="sp-btn" onClick={() => {
                  const snap = canvasCompRef.current && canvasCompRef.current.getDataURL();
                  setScenes((prev) => prev.map((s) => s.id===activeScene ? { ...s, thumbnail:snap } : s));
                  setStatus("Thumbnail captured");
                }}>📸 Capture Thumbnail</button>
                <label style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color:"var(--muted)", cursor:"pointer" }}>
                  <input type="checkbox" checked={useKeyframes} onChange={(e) => setUseKeyframes(e.target.checked)} />
                  Keyframe Timeline
                </label>
              </div>
            )}

            {/* View — always visible */}
            <div style={{ marginTop:10, borderTop:"1px solid var(--border)", paddingTop:8 }}>
              <div className="sp-section-label">View</div>
              <label style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:"var(--muted)", cursor:"pointer", marginBottom:3 }}>
                <input type="checkbox" checked={showSkeleton} onChange={(e) => setShowSkeleton(e.target.checked)} /> Skeleton
              </label>
              <label style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:"var(--muted)", cursor:"pointer", marginBottom:3 }}>
                <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} /> Grid
              </label>
              <label style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:"var(--muted)", cursor:"pointer" }}>
                <input type="checkbox" checked={showStats} onChange={(e) => setShowStats(e.target.checked)} /> FPS Stats
              </label>
            </div>
          </div>

          <div style={{ padding:"5px 10px", borderTop:"1px solid var(--border)", fontSize:10, color:"var(--muted)" }}>{status}</div>
        </div>

        {/* Main viewport */}
        <div className="sp-main">
          <div className="sp-toolbar">
            <span className="sp-toolbar-title">SPX Puppet</span>
            <span style={{ fontSize:10, color:"var(--muted)", marginRight:6 }}>{characters.length} chars</span>
            {mocapOn && <span style={{ fontSize:10, color:"var(--danger)", marginRight:6 }}>LIVE {fps}fps</span>}
            <button className="sp-btn" style={{ width:"auto", padding:"2px 8px", fontSize:10 }}
              onClick={() => { const c = characters.find((ch) => ch.id === activeId); if(c) updateCharacter(activeId, { scale:-(c.scale||1) }); }}>
              Flip
            </button>
            <button className="sp-btn sp-btn--teal" style={{ width:"auto", padding:"2px 8px", fontSize:10 }} onClick={handleExportMP4}>
              Export MP4
            </button>
          </div>

          <div className="sp-canvas-area">
            {activePanel === "autorig" && (
              <AutoRigPanel
                onRigComplete={(rig) => {
                  const active = characters.find(c => c.id === activeId);
                  if (active) setCharacters(cs => cs.map(c => c.id === activeId ? { ...c, rig } : c));
                }}
                setStatus={setStatus}
              />
            )}
            {activePanel === "triggers" && (
              <TriggersPanel
                onCycle={(name) => {
                  if (!window._cyclePlayer) {
                    window._cyclePlayer = new CyclePlayer();
                    window._cyclePlayer.on((n, frame) => {
                      Object.entries(frame).forEach(([joint, delta]) => {
                        setCharacters(cs => cs.map(c => c.id === activeId ? {
                          ...c,
                          joints: { ...c.joints, [joint]: { ...(c.joints?.[joint]||{}), rot: (c.joints?.[joint]?.rot||0) + (delta.rot||0), dy: (c.joints?.[joint]?.dy||0) + (delta.dy||0) } }
                        } : c));
                      });
                    });
                  }
                  window._cyclePlayer.toggle(name);
                }}
                onExpression={(expr) => setExpression?.(expr)}
                setStatus={setStatus}
              />
            )}
            {activePanel === "motions" && (
              <MotionLibraryPanel
                onMotionFrame={(frame) => {
                  Object.entries(frame).forEach(([joint, delta]) => {
                    setCharacters(cs => cs.map(c => c.id === activeId ? {
                      ...c,
                      joints: { ...c.joints, [joint]: { ...(c.joints?.[joint]||{}),
                        rot: (delta.rot !== undefined ? delta.rot : (c.joints?.[joint]?.rot||0)),
                        dy:  (delta.dy  !== undefined ? delta.dy  : (c.joints?.[joint]?.dy ||0)),
                      }}
                    } : c));
                  });
                }}
                setStatus={setStatus}
              />
            )}
            {activePanel === "facesliders" && (
              <FacialSlidersPanel
                onFacialUpdate={(state) => setMouthShape?.(state.mouthOpen)}
                setStatus={setStatus}
              />
            )}
            {activePanel === "charlibrary" && (
              <CharacterLibraryPanel
                onAddCharacter={(char) => {
                  const newChar = { ...char, id: `char_${Date.now()}` };
                  setCharacters(cs => [...cs, newChar]);
                  setActiveId(newChar.id);
                  setStatus(`Added ${char.name}`);
                }}
                setStatus={setStatus}
              />
            )}
            {activePanel === "draw" && (
              <div style={{ position:"absolute", inset:0, zIndex:10, display:"flex", flexDirection:"column" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"3px 10px", background:"#0d1117", borderBottom:"1px solid #21262d", flexShrink:0 }}>
                  <span style={{ fontSize:11, color:"#00ffc8", fontWeight:600 }}>Draw Character</span>
                  <button onClick={() => setActivePanel("characters")}
                    style={{ padding:"2px 8px", border:"1px solid #21262d", borderRadius:4, background:"transparent", color:"#6b7280", cursor:"pointer", fontSize:11 }}>
                    Close
                  </button>
                </div>
                <div style={{ flex:1, overflow:"hidden" }}>
                  <DrawPanel onExportCharacter={(char) => { addCharacter(char); setActivePanel("characters"); }} />
                </div>
              </div>
            )}
            <StatsOverlay fps={fps} show={showStats} />
            <PuppetCanvas ref={canvasCompRef} characters={characters} activeRig={rig}
              mouthShape={mouthShape} expression={expression}
              showSkeleton={showSkeleton} showGrid={showGrid}
              scene={currentScene} props={props}
              onCharacterMove={(id, updates) => updateCharacter(id, updates)} />
          </div>

          <SceneSequencer scenes={scenes} activeScene={activeScene}
            onSelectScene={setActiveScene} onAddScene={addScene}
            onDeleteScene={deleteScene} onReorderScene={reorderScene} />

          <div className="sp-timeline" style={{ height: useKeyframes ? 200 : 140 }}>
            {useKeyframes ? (
              <KeyframeTimeline totalFrames={recordedFrames.length || 300} currentFrame={playbackIdx}
                fps={30} keyframes={keyframes} isPlaying={isPlaying} isRecording={isRecording}
                onPlay={startPlayback} onPause={pausePlayback} onStop={stopPlayback}
                onRecord={startRecording} onStopRecord={stopRecording}
                onScrub={(idx) => { setIsPlaying(false); setPlaybackIdx(idx); }}
                onAddKeyframe={(frame, track) => {
                  setKeyframes((prev) => ({
                    ...prev,
                    [track]: [...(prev[track]||[]).filter((k) => k.frame!==frame), { frame }].sort((a,b) => a.frame-b.frame)
                  }));
                  setStatus("Keyframe: " + track + " @ " + frame);
                }}
                onDeleteKeyframe={(frame, track) => {
                  setKeyframes((prev) => ({ ...prev, [track]: (prev[track]||[]).filter((k) => k.frame!==frame) }));
                }} />
            ) : (
              <PuppetTimeline isRecording={isRecording} isPlaying={isPlaying}
                frameCount={recordedFrames.length} currentFrame={playbackIdx}
                duration={recordedFrames.length / 30} fps={30}
                onRecord={startRecording} onStopRecord={stopRecording}
                onPlay={startPlayback} onPause={pausePlayback} onStop={stopPlayback}
                onScrub={(idx) => { setIsPlaying(false); setPlaybackIdx(idx); }}
                onExportJSON={() => exportFramesAsJSON(recordedFrames)}
                onExportVideo={() => { if (downloadUrl) { const a=document.createElement("a"); a.href=downloadUrl; a.download="puppet.webm"; a.click(); }}}
                downloadUrl={downloadUrl} />
            )}
          </div>
        </div>

        <LayerPanel characters={characters} activeId={activeId} onSelect={setActiveId}
          onToggleVisible={(id) => { const c = characters.find((ch) => ch.id===id); if(c) updateCharacter(id, { visible:!c.visible }); }}
          onToggleLock={(id) => {
            const c = characters.find((ch) => ch.id === id);
            if (c) updateCharacter(id, { locked: !c.locked });
          }} />
      </div>

      {!mocapOn && (
        <video ref={videoRef} autoPlay muted playsInline
          style={{ position:"absolute", opacity:0, width:1, height:1, pointerEvents:"none" }} />
      )}
    </div>
  );
}
