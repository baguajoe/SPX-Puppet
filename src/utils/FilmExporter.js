export async function exportScene(canvas, durationSec, fps, onProgress) {
  return new Promise((resolve, reject) => {
    try {
      const stream = canvas.captureStream(fps);
      const recorder = new MediaRecorder(stream, { mimeType:'video/webm;codecs=vp9' });
      const chunks = [];
      recorder.ondataavailable = e => { if(e.data.size>0) chunks.push(e.data); };
      recorder.onstop = () => resolve(new Blob(chunks, { type:'video/webm' }));
      recorder.start(100);
      let elapsed = 0;
      const id = setInterval(() => {
        elapsed += 0.1; onProgress&&onProgress(elapsed/durationSec);
        if (elapsed>=durationSec) { clearInterval(id); recorder.stop(); }
      }, 100);
    } catch(err) { reject(err); }
  });
}

export async function exportFullFilm(scenes, canvas, fps, onProgress) {
  const blobs = [];
  for (let i=0; i<scenes.length; i++) {
    onProgress&&onProgress({ scene:i, total:scenes.length, phase:'rendering' });
    const blob = await exportScene(canvas, scenes[i].duration||5, fps, p => onProgress&&onProgress({ scene:i, total:scenes.length, phase:'recording', progress:p }));
    blobs.push(blob);
  }
  const combined = new Blob(blobs, { type:'video/webm' });
  return { blob:combined, url:URL.createObjectURL(combined) };
}

export function downloadBlob(blob, filename) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = filename; a.click();
  URL.revokeObjectURL(a.href);
}
