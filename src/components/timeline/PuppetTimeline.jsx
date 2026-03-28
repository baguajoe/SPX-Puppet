
// PuppetTimeline.jsx — record/play scrubber
import React, { useState, useRef, useEffect } from 'react';

export default function PuppetTimeline({
  isRecording, isPlaying, frameCount = 0, currentFrame = 0,
  duration = 0, fps = 30,
  onPlay, onPause, onStop, onScrub, onRecord, onStopRecord,
  onExportJSON, onExportVideo, downloadUrl,
}) {
  const scrubRef = useRef(null);

  const fmt = (s) => {
    const m = Math.floor(s / 60);
    const sec = (s % 60).toFixed(1).padStart(4,'0');
    return `${m}:${sec}`;
  };

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', padding:'8px 14px', gap:8 }}>
      {/* Controls */}
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        {/* Transport */}
        <button className="sp-btn" style={{ width:'auto', padding:'4px 10px' }} onClick={onStop}>⏮</button>
        <button className="sp-btn" style={{ width:'auto', padding:'4px 10px' }} onClick={isPlaying ? onPause : onPlay}>
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button className={`sp-btn ${isRecording ? 'sp-btn--danger' : 'sp-btn--orange'}`} style={{ width:'auto', padding:'4px 10px' }}
          onClick={isRecording ? onStopRecord : onRecord}>
          {isRecording ? '⏹ Stop' : '⏺ Record'}
        </button>

        {/* Time display */}
        <span style={{ fontSize:11, color:'#6b7280', minWidth:80, fontFamily:'monospace' }}>
          {fmt(currentFrame / fps)} / {fmt(duration)}
        </span>

        <span style={{ fontSize:10, color:'#6b7280' }}>{frameCount} frames @ {fps}fps</span>

        {/* Export */}
        {frameCount > 0 && (
          <div style={{ marginLeft:'auto', display:'flex', gap:6 }}>
            <button className="sp-btn sp-btn--teal" style={{ width:'auto', padding:'4px 10px', fontSize:10 }} onClick={onExportJSON}>
              💾 JSON
            </button>
            <button className="sp-btn sp-btn--teal" style={{ width:'auto', padding:'4px 10px', fontSize:10 }} onClick={onExportVideo}>
              🎬 WebM
            </button>
            {downloadUrl && (
              <a href={downloadUrl} download="puppet_recording.webm"
                style={{ padding:'4px 10px', background:'rgba(0,255,200,0.1)', border:'1px solid var(--teal)', borderRadius:6, color:'var(--teal)', fontSize:10, textDecoration:'none' }}>
                ⬇ Download
              </a>
            )}
          </div>
        )}
      </div>

      {/* Scrubber */}
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <input type="range" className="sp-slider" min={0} max={Math.max(1, frameCount - 1)} value={currentFrame}
          onChange={e => onScrub?.(Number(e.target.value))} style={{ flex:1 }} />
      </div>

      {/* Recording indicator */}
      {isRecording && (
        <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'var(--danger)' }}>
          <span style={{ width:8, height:8, borderRadius:'50%', background:'var(--danger)', animation:'pulse 1s infinite', display:'inline-block' }} />
          Recording... {fmt(duration)}
        </div>
      )}
    </div>
  );
}
