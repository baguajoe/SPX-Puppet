
// PuppetExporter.js — export WebM (via MediaRecorder), GIF (via canvas frames), PNG sequence

export async function exportWebM(canvas, durationSec=10, fps=30) {
  return new Promise((resolve, reject) => {
    try {
      const stream  = canvas.captureStream(fps);
      const recorder = new MediaRecorder(stream, { mimeType:'video/webm;codecs=vp9' });
      const chunks  = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type:'video/webm' });
        resolve({ blob, url: URL.createObjectURL(blob), filename:`puppet_${Date.now()}.webm` });
      };
      recorder.start(100);
      setTimeout(() => recorder.stop(), durationSec * 1000);
    } catch(err) { reject(err); }
  });
}

export function exportPNGSequence(frames, canvas) {
  frames.forEach((frame, i) => {
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `puppet_frame_${String(i).padStart(4,'0')}.png`;
    a.click();
  });
}

export function exportGIF(frames, width, height) {
  // GIF export requires a library — we note this for future integration
  console.warn('[PuppetExporter] GIF export requires gif.js library — coming in Tier 3');
  alert('GIF export: download as WebM and convert with FFmpeg or ezgif.com');
}

export function downloadFile(blob, filename) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

// Backward-compat alias — new callers should use exportWebM
export const exportMP4 = exportWebM;
