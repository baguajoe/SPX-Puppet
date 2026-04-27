
// PuppetRecorder.js — record canvas output, export WebM/MP4

export function createRecorder(canvas, fps = 30) {
  let mediaRecorder = null;
  let chunks = [];
  let recording = false;
  let startTime = null;
  let lastUrl = null;
  const frameData = []; // for JSON export

  const recorder = {
    start() {
      if (recording) return;
      // Revoke any leftover URL from the previous recording to avoid blob leak
      if (lastUrl) { try { URL.revokeObjectURL(lastUrl); } catch(_){} lastUrl = null; }
      chunks = []; frameData.length = 0;
      startTime = performance.now();
      try {
        const stream = canvas.captureStream(fps);
        mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
        mediaRecorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
        mediaRecorder.start(100);
        recording = true;
      } catch (err) {
        console.error('[Recorder] Start error:', err);
      }
    },

    recordFrame(frameObj) {
      if (!recording) return;
      // Cap at 9000 frames (5 min @ 30fps) to prevent OOM in long sessions
      if (frameData.length >= 9000) return;
      frameData.push({ time: (performance.now() - startTime) / 1000, ...frameObj });
    },

    stop() {
      return new Promise(resolve => {
        if (!recording || !mediaRecorder) { resolve(null); return; }
        mediaRecorder.onstop = () => {
          recording = false;
          const blob = new Blob(chunks, { type: 'video/webm' });
          lastUrl = URL.createObjectURL(blob);
          resolve({ blob, url: lastUrl, frames: [...frameData] });
        };
        mediaRecorder.stop();
      });
    },

    isRecording() { return recording; },
    isAtCap() { return frameData.length >= 9000; },
    getFrameCount() { return frameData.length; },
    getDuration() { return recording ? (performance.now() - startTime) / 1000 : 0; },
    revoke() {
      if (lastUrl) { try { URL.revokeObjectURL(lastUrl); } catch(_){} lastUrl = null; }
    },
  };

  return recorder;
}

export function downloadBlob(blob, filename) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function exportFramesAsJSON(frames, filename = 'puppet_session.json') {
  const blob = new Blob([JSON.stringify({ frames }, null, 2)], { type: 'application/json' });
  downloadBlob(blob, filename);
}
