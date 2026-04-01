// KeyframeTimeline.jsx — NLA-style Keyframe Timeline UPGRADE
// SPX Puppet | StreamPireX
// Features: multi-track, curve editor toggle, keyframe types, copy/paste, loop region, markers

import React, { useState, useRef, useCallback, useEffect } from 'react';

const TRACKS = ['Body','Head','L.Arm','R.Arm','L.Leg','R.Leg','Face','Hands','Camera','Audio','FX'];
const FW = 8; // pixels per frame at zoom 1

const KF_COLORS = { linear: '#00ffc8', bezier: '#4fc3f7', constant: '#f06292', auto: '#fbbf24' };
const KF_TYPES  = ['linear','bezier','constant','auto'];

const B = (extra={}) => ({
  padding:'3px 7px', border:'1px solid #21262d', borderRadius:4,
  background:'#1a1a2e', color:'#e0e0e0', cursor:'pointer', fontSize:11,
  ...extra
});

function fmt(f, fps) {
  const s = f / fps;
  return `${Math.floor(s/60)}:${(s%60).toFixed(1).padStart(4,'0')}`;
}

export default function KeyframeTimeline({
  totalFrames  = 300,
  currentFrame = 0,
  fps          = 30,
  onScrub,
  onAddKeyframe,
  onDeleteKeyframe,
  onMoveKeyframe,
  keyframes    = {},   // { trackName: [{ frame, type, value }] }
  isPlaying, isRecording,
  onPlay, onPause, onStop, onRecord, onStopRecord,
  loopStart, loopEnd, onSetLoop,
  markers = [],        // [{ frame, label, color }]
  onAddMarker,
}) {
  const [zoom,         setZoom]         = useState(1);
  const [selectedKFs,  setSelectedKFs]  = useState(new Set()); // "track:frame"
  const [copiedKFs,    setCopiedKFs]    = useState([]);
  const [showCurves,   setShowCurves]   = useState(false);
  const [activeTrack,  setActiveTrack]  = useState(null);
  const [dragging,     setDragging]     = useState(null); // { key, origFrame }
  const [loopMode,     setLoopMode]     = useState(false);
  const scrollRef   = useRef(null);
  const timelineRef = useRef(null);

  const gx = useCallback((f) => f * FW * zoom, [zoom]);
  const xToFrame = useCallback((x) => Math.max(0, Math.min(totalFrames, Math.round(x / (FW * zoom)))), [zoom, totalFrames]);

  // Auto-scroll to keep playhead visible
  useEffect(() => {
    const s = scrollRef.current;
    if (!s) return;
    const px = gx(currentFrame);
    if (px < s.scrollLeft || px > s.scrollLeft + s.clientWidth - 40) {
      s.scrollLeft = Math.max(0, px - s.clientWidth / 2);
    }
  }, [currentFrame, gx]);

  const handleTrackClick = useCallback((e, track) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left + (scrollRef.current?.scrollLeft ?? 0);
    const frame = xToFrame(x);

    if (e.shiftKey && onAddMarker) {
      onAddMarker(frame, track);
      return;
    }
    onAddKeyframe?.(frame, track);
  }, [xToFrame, onAddKeyframe, onAddMarker]);

  const handleRulerClick = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left + (scrollRef.current?.scrollLeft ?? 0);
    onScrub?.(xToFrame(x));
  }, [xToFrame, onScrub]);

  const handleKFContext = useCallback((e, frame, track) => {
    e.preventDefault();
    e.stopPropagation();
    onDeleteKeyframe?.(frame, track);
  }, [onDeleteKeyframe]);

  const handleKFClick = useCallback((e, frame, track) => {
    e.stopPropagation();
    const key = `${track}:${frame}`;
    if (e.ctrlKey || e.metaKey) {
      setSelectedKFs(prev => {
        const n = new Set(prev);
        n.has(key) ? n.delete(key) : n.add(key);
        return n;
      });
    } else {
      setSelectedKFs(new Set([key]));
      onScrub?.(frame);
    }
  }, [onScrub]);

  const copySelected = useCallback(() => {
    const copied = [];
    selectedKFs.forEach(key => {
      const [track, frameStr] = key.split(':');
      const frame = parseInt(frameStr);
      const kf = (keyframes[track] ?? []).find(k => k.frame === frame);
      if (kf) copied.push({ ...kf, track });
    });
    setCopiedKFs(copied);
  }, [selectedKFs, keyframes]);

  const pasteKeyframes = useCallback(() => {
    if (!copiedKFs.length) return;
    const minFrame = Math.min(...copiedKFs.map(k => k.frame));
    const offset = currentFrame - minFrame;
    copiedKFs.forEach(kf => {
      onAddKeyframe?.(kf.frame + offset, kf.track, kf.value, kf.type);
    });
  }, [copiedKFs, currentFrame, onAddKeyframe]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'c' && (e.ctrlKey || e.metaKey)) copySelected();
      if (e.key === 'v' && (e.ctrlKey || e.metaKey)) pasteKeyframes();
      if (e.key === 'Delete' || e.key === 'Backspace') {
        selectedKFs.forEach(key => {
          const [track, frameStr] = key.split(':');
          onDeleteKeyframe?.(parseInt(frameStr), track);
        });
        setSelectedKFs(new Set());
      }
      if (e.key === ' ') { e.preventDefault(); isPlaying ? onPause?.() : onPlay?.(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [copySelected, pasteKeyframes, selectedKFs, isPlaying, onPlay, onPause, onDeleteKeyframe]);

  const totalWidth = gx(totalFrames) + 200;

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',background:'#0d1117',borderTop:'1px solid #21262d',userSelect:'none'}}>

      {/* Transport bar */}
      <div style={{display:'flex',alignItems:'center',gap:4,padding:'3px 8px',borderBottom:'1px solid #21262d',flexShrink:0,flexWrap:'wrap'}}>
        <button style={B()} onClick={onStop}>{'|◀'}</button>
        <button style={B()} onClick={isPlaying ? onPause : onPlay}>{isPlaying ? '⏸' : '▶'}</button>
        <button style={B({borderColor:isRecording?'#ef4444':'#21262d',color:isRecording?'#ef4444':'#e0e0e0'})}
          onClick={isRecording ? onStopRecord : onRecord}>
          {isRecording ? '⏹ REC' : '⏺ Rec'}
        </button>

        <span style={{fontSize:10,color:'#6b7280',minWidth:90}}>{fmt(currentFrame,fps)} / {fmt(totalFrames,fps)}</span>

        <button style={B({borderColor:'#00ffc8',color:'#00ffc8'})} title="Add keyframe (K)"
          onClick={() => activeTrack && onAddKeyframe?.(currentFrame, activeTrack)}>⬥ Key</button>

        <button style={B({borderColor:loopMode?'#4fc3f7':'#21262d',color:loopMode?'#4fc3f7':'#e0e0e0'})}
          onClick={() => setLoopMode(v => !v)}>⟳ Loop</button>

        {loopMode && loopStart != null && loopEnd != null && (
          <span style={{fontSize:9,color:'#4fc3f7'}}>{fmt(loopStart,fps)}–{fmt(loopEnd,fps)}</span>
        )}

        <button style={B({borderColor:showCurves?'#fbbf24':'#21262d',color:showCurves?'#fbbf24':'#e0e0e0'})}
          onClick={() => setShowCurves(v => !v)}>~ Curves</button>

        {selectedKFs.size > 0 && (
          <>
            <button style={B()} onClick={copySelected}>⎘ Copy ({selectedKFs.size})</button>
            <button style={B()} onClick={pasteKeyframes}>⎘ Paste</button>
          </>
        )}

        <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:4}}>
          <span style={{fontSize:9,color:'#6b7280'}}>Zoom</span>
          <input type="range" min={0.25} max={6} step={0.25} value={zoom}
            onChange={e => setZoom(Number(e.target.value))}
            style={{width:60,accentColor:'#00ffc8'}} />
          <span style={{fontSize:9,color:'#6b7280',minWidth:20}}>{zoom}×</span>
        </div>
      </div>

      {/* Main timeline area */}
      <div style={{display:'flex',flex:1,overflow:'hidden'}} ref={timelineRef}>

        {/* Track labels */}
        <div style={{width:72,flexShrink:0,borderRight:'1px solid #21262d',background:'#080d14'}}>
          <div style={{height:22,borderBottom:'1px solid #21262d',background:'#06060f'}} />
          {TRACKS.map(t => (
            <div key={t}
              onClick={() => setActiveTrack(t)}
              style={{
                height: showCurves ? 56 : 28,
                display:'flex',alignItems:'center',padding:'0 8px',
                fontSize:10, cursor:'pointer',
                borderBottom:'1px solid rgba(33,38,45,0.5)',
                color: activeTrack===t ? '#00ffc8' : '#6b7280',
                background: activeTrack===t ? 'rgba(0,255,200,0.05)' : 'transparent',
              }}>
              {t}
            </div>
          ))}
        </div>

        {/* Scrollable tracks */}
        <div ref={scrollRef} style={{flex:1,overflowX:'auto',overflowY:'auto',position:'relative'}}>
          <div style={{width:totalWidth,position:'relative',minHeight:'100%'}}>

            {/* Ruler */}
            <div style={{
              height:22, background:'#06060f', borderBottom:'1px solid #21262d',
              cursor:'pointer', position:'sticky', top:0, zIndex:10,
            }} onClick={handleRulerClick}>
              {/* Loop region */}
              {loopMode && loopStart != null && loopEnd != null && (
                <div style={{
                  position:'absolute', top:0, bottom:0,
                  left:gx(loopStart), width:gx(loopEnd-loopStart),
                  background:'rgba(79,195,247,0.1)', borderLeft:'1px solid #4fc3f7', borderRight:'1px solid #4fc3f7',
                  pointerEvents:'none',
                }} />
              )}
              {/* Time labels */}
              {Array.from({length:Math.ceil(totalFrames/fps)+1},(_,i)=>(
                <div key={i} style={{position:'absolute',left:gx(i*fps),fontSize:8,color:'#4a5568',paddingLeft:2,top:2}}>
                  {fmt(i*fps,fps)}
                </div>
              ))}
              {/* Frame ticks */}
              {zoom >= 2 && Array.from({length:totalFrames+1},(_,i)=>(
                i%fps !== 0 && <div key={i} style={{position:'absolute',left:gx(i),top:14,width:1,height:4,background:'rgba(255,255,255,0.08)'}} />
              ))}
              {/* Markers */}
              {markers.map((m, i) => (
                <div key={i} title={m.label} style={{
                  position:'absolute',left:gx(m.frame)-4,top:2,
                  width:8,height:8,background:m.color??'#fbbf24',
                  clipPath:'polygon(50% 0%, 100% 100%, 0% 100%)',
                  cursor:'pointer', zIndex:3,
                }} />
              ))}
              {/* Playhead */}
              <div style={{position:'absolute',top:0,bottom:0,left:gx(currentFrame),width:2,background:'#00ffc8',zIndex:20,pointerEvents:'none'}}>
                <div style={{width:8,height:8,background:'#00ffc8',marginLeft:-3,clipPath:'polygon(0 0,100% 0,50% 100%)'}} />
              </div>
            </div>

            {/* Track rows */}
            {TRACKS.map(track => {
              const kfs = keyframes[track] ?? [];
              const rowH = showCurves ? 56 : 28;
              return (
                <div key={track}
                  style={{height:rowH,borderBottom:'1px solid rgba(33,38,45,0.4)',position:'relative',
                    cursor:'crosshair',
                    background: activeTrack===track ? 'rgba(0,255,200,0.03)' : 'rgba(0,0,0,0.15)'}}
                  onClick={e => handleTrackClick(e, track)}>

                  {/* Loop region shading */}
                  {loopMode && loopStart!=null && loopEnd!=null && (
                    <div style={{position:'absolute',top:0,bottom:0,left:gx(loopStart),width:gx(loopEnd-loopStart),background:'rgba(79,195,247,0.05)',pointerEvents:'none'}} />
                  )}

                  {/* Curve editor (simplified amplitude bars) */}
                  {showCurves && kfs.length > 1 && kfs.map((kf, i) => {
                    if (i === 0) return null;
                    const prev = kfs[i-1];
                    const x1 = gx(prev.frame), x2 = gx(kf.frame);
                    const w = x2 - x1;
                    const v = typeof kf.value === 'number' ? kf.value : 0.5;
                    return (
                      <div key={i} style={{
                        position:'absolute',left:x1,bottom:0,width:Math.max(1,w),
                        height:Math.round(v * (rowH-4)),
                        background:'rgba(0,255,200,0.08)',borderTop:'1px solid rgba(0,255,200,0.2)',
                        pointerEvents:'none',
                      }} />
                    );
                  })}

                  {/* Keyframe diamonds */}
                  {kfs.map((kf, i) => {
                    const key = `${track}:${kf.frame}`;
                    const selected = selectedKFs.has(key);
                    const color = KF_COLORS[kf.type ?? 'linear'];
                    return (
                      <div key={i}
                        title={`Frame ${kf.frame} · ${kf.type ?? 'linear'}`}
                        onClick={e => handleKFClick(e, kf.frame, track)}
                        onContextMenu={e => handleKFContext(e, kf.frame, track)}
                        style={{
                          position:'absolute',
                          left:gx(kf.frame)-5, top:'50%',
                          transform:'translateY(-50%) rotate(45deg)',
                          width:10,height:10,
                          background: selected ? '#fff' : color,
                          border:`1.5px solid ${selected?color:'rgba(0,0,0,0.4)'}`,
                          cursor:'pointer',zIndex:4,
                          boxShadow: selected ? `0 0 6px ${color}` : 'none',
                        }}
                      />
                    );
                  })}

                  {/* Playhead line per track */}
                  <div style={{position:'absolute',top:0,bottom:0,left:gx(currentFrame),width:1,background:'rgba(0,255,200,0.25)',pointerEvents:'none'}} />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div style={{display:'flex',gap:12,padding:'2px 8px',borderTop:'1px solid #21262d',fontSize:9,color:'#4a5568',flexShrink:0}}>
        <span>Frame {currentFrame} / {totalFrames}</span>
        <span>{fps} FPS</span>
        {activeTrack && <span>Track: <span style={{color:'#00ffc8'}}>{activeTrack}</span></span>}
        {selectedKFs.size > 0 && <span style={{color:'#fbbf24'}}>{selectedKFs.size} selected</span>}
        <span style={{marginLeft:'auto'}}>{Object.values(keyframes).reduce((s,a)=>s+(a?.length??0),0)} keyframes total</span>
      </div>
    </div>
  );
}
