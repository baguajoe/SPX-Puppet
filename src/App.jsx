
// SPX Puppet — Main App
import React, { useState, useRef, useCallback, useEffect } from 'react';
import PuppetCanvas from './components/puppet/PuppetCanvas.jsx';
import PuppetCharacterPanel from './components/puppet/PuppetCharacterPanel.jsx';
import PuppetTimeline from './components/timeline/PuppetTimeline.jsx';
import usePuppetMocap from './hooks/usePuppetMocap.js';
import { createRig } from './utils/PuppetRig.js';
import { createFaceExpressionEngine, drawExpressionOnCharacter, EXPRESSIONS } from './utils/PuppetFaceExpressions.js';
import { createPhysicsLayer, stepPhysicsLayer, applyWindToLayer, createHairLayer } from './utils/PuppetPhysics.js';
import { createArmIK, createLegIK, solveFABRIK } from './utils/PuppetIK.js';
import { exportMP4, downloadFile } from './utils/PuppetExporter.js';
import { createHead360Rig, updateHead360 } from './utils/PuppetHead360.js';
import PuppetScene from './components/scene/PuppetScene.jsx';
import PuppetAssetLibrary from './components/library/PuppetAssetLibrary.jsx';
import useFaceExpression from './hooks/useFaceExpression.js';
import { createLipSyncEngine } from './utils/PuppetLipSync.js';
import { createRecorder, downloadBlob, exportFramesAsJSON } from './utils/PuppetRecorder.js';
import './styles/puppet.css';

export default function App() {
  // Characters
  const [characters, setCharacters]   = useState([]);
  const [activeId, setActiveId]       = useState(null);

  // Rig
  const rigRef  = useRef(createRig(640, 480));
  const [rig, setRig] = useState(rigRef.current);

  // Video / mocap
  const videoRef = useRef(null);
  const [mocapOn, setMocapOn]     = useState(false);
  const [lipSyncOn, setLipSyncOn] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [showGrid, setShowGrid]         = useState(true);
  const [mouthShape, setMouthShape]     = useState(null);

  // Timeline
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying]     = useState(false);
  const [recordedFrames, setRecordedFrames] = useState([]);
  const [playbackIdx, setPlaybackIdx]       = useState(0);
  const [downloadUrl, setDownloadUrl]       = useState(null);
  const recorderRef   = useRef(null);
  const lipSyncRef    = useRef(null);
  const canvasCompRef = useRef(null);
  const playIntervalRef = useRef(null);

  // Status
  const [status, setStatus] = useState('Ready');

  const onRigUpdate = useCallback((newRig) => {
    rigRef.current = newRig;
    setRig({ ...newRig });
  }, []);

  // Face expression
  const [faceOn, setFaceOn] = useState(false);
  const faceEngineRef = useRef(null);
  const [expression, setExpression] = useState({ ...EXPRESSIONS.neutral });
  const [currentScene, setCurrentScene] = useState({ id:'dark', bg:'#06060f' });
  const [props, setProps] = useState([]);

  const toggleFace = async () => {
    if (faceOn) {
      faceEngineRef.current?.stop(); faceEngineRef.current = null;
      setFaceOn(false); setStatus('Face tracking stopped');
    } else {
      const engine = createFaceExpressionEngine();
      await engine.start(videoRef.current, (expr) => setExpression(expr));
      faceEngineRef.current = engine;
      setFaceOn(true); setStatus('Face tracking running');
    }
  };

  const handleExportMP4 = async () => {
    const canvas = canvasCompRef.current?.getCanvas();
    if (!canvas) return;
    setStatus('Exporting MP4...');
    const result = await exportMP4(canvas, 10, 30);
    downloadFile(result.blob, result.filename);
    setStatus('MP4 exported!');
  };

    const { status: mocapStatus, fps, start: startMocap, stop: stopMocap } =
    usePuppetMocap(videoRef, rigRef, onRigUpdate, mocapOn);

  // Lip sync tick
  useEffect(() => {
    if (!lipSyncOn) return;
    const id = setInterval(() => {
      if (lipSyncRef.current) setMouthShape(lipSyncRef.current.getShape());
    }, 33);
    return () => clearInterval(id);
  }, [lipSyncOn]);

  const toggleMocap = async () => {
    if (mocapOn) { stopMocap(); setMocapOn(false); setStatus('MoCap stopped'); }
    else { setMocapOn(true); await startMocap(); setStatus('MoCap running'); }
  };

  const toggleLipSync = async () => {
    if (lipSyncOn) {
      lipSyncRef.current?.stop(); lipSyncRef.current = null;
      setLipSyncOn(false); setMouthShape(null); setStatus('Lip sync stopped');
    } else {
      const engine = createLipSyncEngine();
      const ok = await engine.start();
      if (ok) { lipSyncRef.current = engine; setLipSyncOn(true); setStatus('Lip sync running'); }
      else { setStatus('Mic access denied'); }
    }
  };

  const startRecording = () => {
    const canvas = canvasCompRef.current?.getCanvas();
    if (!canvas) return;
    const rec = createRecorder(canvas, 30);
    rec.start(); recorderRef.current = rec;
    setIsRecording(true); setStatus('Recording...');
  };

  const stopRecording = async () => {
    const result = await recorderRef.current?.stop();
    setIsRecording(false);
    if (result) {
      setRecordedFrames(result.frames);
      setDownloadUrl(result.url);
      setStatus('Recording saved — ' + result.frames.length + ' frames');
    }
  };

  const startPlayback = () => {
    if (!recordedFrames.length) return;
    setPlaybackIdx(0); setIsPlaying(true);
    playIntervalRef.current = setInterval(() => {
      setPlaybackIdx(i => { if (i >= recordedFrames.length - 1) { clearInterval(playIntervalRef.current); setIsPlaying(false); return 0; } return i + 1; });
    }, 1000 / 30);
  };

  const pausePlayback = () => { clearInterval(playIntervalRef.current); setIsPlaying(false); };
  const stopPlayback  = () => { clearInterval(playIntervalRef.current); setIsPlaying(false); setPlaybackIdx(0); };

  const addCharacter = (char) => {
    setCharacters(prev => [...prev, char]);
    setActiveId(char.id);
    setStatus('Character added: ' + char.name);
  };

  const removeCharacter = (id) => {
    setCharacters(prev => prev.filter(c => c.id !== id));
    setActiveId(prev => prev === id ? null : prev);
  };

  const updateCharacter = (id, updates) => {
    setCharacters(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const activeChar = characters.find(c => c.id === activeId) || null;

  return (
    <div className="sp-workspace">
      {/* Hidden webcam */}
      <video ref={videoRef} autoPlay muted playsInline style={{ position:'absolute', opacity:0, width:1, height:1, pointerEvents:'none' }} />

      {/* ── Sidebar ── */}
      <div className="sp-sidebar">
        <div className="sp-sidebar-header">
          <span className="sp-logo">SPX</span>
          <span style={{ fontWeight:700, fontSize:14 }}>Puppet</span>
          <span className={`sp-chip ${mocapOn ? 'sp-chip--on' : 'sp-chip--off'}`} style={{ marginLeft:'auto', fontSize:9 }}>
            {mocapOn ? `● ${fps}fps` : '○ Off'}
          </span>
        </div>

        <div className="sp-sidebar-body">
          {/* MoCap controls */}
          <div className="sp-section-label">Live Capture</div>
          <button className={`sp-btn ${mocapOn ? 'sp-btn--danger' : 'sp-btn--primary'}`} onClick={toggleMocap}>
            {mocapOn ? '■ Stop MoCap' : '▶ Start MoCap'}
          </button>
          <button className={`sp-btn ${lipSyncOn ? 'sp-btn--danger' : 'sp-btn--teal'}`} onClick={toggleLipSync}>
            {lipSyncOn ? '■ Stop Lip Sync' : '🎤 Start Lip Sync'}
          </button>

          {/* View options */}
          <div className="sp-section-label">View</div>
          <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'var(--muted)', cursor:'pointer' }}>
            <input type="checkbox" checked={showSkeleton} onChange={e => setShowSkeleton(e.target.checked)} />
            Show Skeleton
          </label>
          <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'var(--muted)', cursor:'pointer' }}>
            <input type="checkbox" checked={showGrid} onChange={e => setShowGrid(e.target.checked)} />
            Show Grid
          </label>

          {/* Webcam preview */}
          <button className="sp-btn sp-btn--teal" style={{ width:'auto', padding:'4px 10px', fontSize:10 }} onClick={handleExportMP4}>
            🎬 Export MP4
          </button>
          {mocapOn && (
            <div style={{ marginTop:8 }}>
              <div className="sp-section-label">Webcam</div>
              <video ref={videoRef} autoPlay muted playsInline style={{ width:'100%', borderRadius:8, border:'1px solid var(--border)', transform:'scaleX(-1)' }} />
            </div>
          )}

          {/* Face Expressions */}
          <button className={`sp-btn ${faceOn ? 'sp-btn--danger' : 'sp-btn--orange'}`} onClick={toggleFace}>
            {faceOn ? '■ Stop Face Track' : '😊 Face Expressions'}
          </button>

          {/* Scene */}
          <div style={{ marginTop:8 }}>
            <PuppetScene onApply={setCurrentScene} currentScene={currentScene} />
          </div>

          {/* Asset Library */}
          <div style={{ marginTop:8 }}>
            <div className="sp-section-label">Asset Library</div>
            <PuppetAssetLibrary
              onAddProp={p => setProps(prev => [...prev, { ...p, x:0.5, y:0.5 }])}
              onSetExpression={id => setExpression(EXPRESSIONS[id] || EXPRESSIONS.neutral)}
            />
          </div>

          {/* Characters */}
          <div style={{ marginTop:8 }}>
            <PuppetCharacterPanel
              characters={characters}
              activeId={activeId}
              onAdd={addCharacter}
              onSelect={setActiveId}
              onRemove={removeCharacter}
              onPositionChange={(id, updates) => updateCharacter(id, updates)}
            />
          </div>
        </div>

        {/* Status bar */}
        <div style={{ padding:'8px 12px', borderTop:'1px solid var(--border)', fontSize:10, color:'var(--muted)' }}>
          {status}
        </div>
      </div>

      {/* ── Main area ── */}
      <div className="sp-main">
        {/* Toolbar */}
        <div className="sp-toolbar">
          <span className="sp-toolbar-title">SPX Puppet — 2D Character Animator</span>
          <span style={{ fontSize:10, color:'var(--muted)' }}>
            {characters.length} character{characters.length !== 1 ? 's' : ''} in scene
          </span>
          <button className="sp-btn sp-btn--teal" style={{ width:'auto', padding:'4px 10px', fontSize:10 }} onClick={handleExportMP4}>
            🎬 Export MP4
          </button>
          {mocapOn && (
            <div className="sp-hud" style={{ position:'static', background:'transparent', padding:0 }}>
              <span className="sp-hud-dot sp-hud-dot--live" />
              <span style={{ fontSize:10, color:'var(--danger)' }}>LIVE {fps}fps</span>
            </div>
          )}
        </div>

        {/* Canvas */}
        <div className="sp-canvas-area">
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

        {/* Timeline */}
        <div className="sp-timeline">
          <PuppetTimeline
            isRecording={isRecording}
            isPlaying={isPlaying}
            frameCount={recordedFrames.length}
            currentFrame={playbackIdx}
            duration={recordedFrames.length / 30}
            fps={30}
            onRecord={startRecording}
            onStopRecord={stopRecording}
            onPlay={startPlayback}
            onPause={pausePlayback}
            onStop={stopPlayback}
            onScrub={idx => { setIsPlaying(false); setPlaybackIdx(idx); }}
            onExportJSON={() => exportFramesAsJSON(recordedFrames)}
            onExportVideo={() => { if (downloadUrl) { const a = document.createElement('a'); a.href=downloadUrl; a.download='puppet.webm'; a.click(); } }}
            downloadUrl={downloadUrl}
          />
        </div>
      </div>
    </div>
  );
}
