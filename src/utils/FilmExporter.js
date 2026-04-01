// FilmExporter.js — Film Export UPGRADE
// SPX Puppet | StreamPireX
// Features: WebM/MP4, GIF, PNG sequence, frame-by-frame, codec selection, resolution presets

export const EXPORT_FORMATS = {
  WEBM_VP9:  { mimeType: 'video/webm;codecs=vp9',  ext: 'webm', label: 'WebM VP9' },
  WEBM_VP8:  { mimeType: 'video/webm;codecs=vp8',  ext: 'webm', label: 'WebM VP8' },
  MP4_H264:  { mimeType: 'video/mp4;codecs=avc1',  ext: 'mp4',  label: 'MP4 H.264' },
  WEBM_AV1:  { mimeType: 'video/webm;codecs=av1',  ext: 'webm', label: 'WebM AV1' },
};

export const RESOLUTION_PRESETS = {
  '720p':  { width: 1280, height: 720  },
  '1080p': { width: 1920, height: 1080 },
  '4K':    { width: 3840, height: 2160 },
  'square':{ width: 1080, height: 1080 },
  'story': { width: 1080, height: 1920 },
};

function getBestMimeType() {
  for (const fmt of Object.values(EXPORT_FORMATS)) {
    if (MediaRecorder.isTypeSupported(fmt.mimeType)) return fmt;
  }
  return { mimeType: 'video/webm', ext: 'webm', label: 'WebM' };
}

// ─── Single Scene Export ──────────────────────────────────────────────────────

export async function exportScene(canvas, durationSec, fps = 30, options = {}) {
  const {
    onProgress = null,
    format     = getBestMimeType(),
    audioBlobUrl = null,
  } = options;

  return new Promise((resolve, reject) => {
    try {
      const stream = canvas.captureStream(fps);

      // Mix audio if provided
      if (audioBlobUrl) {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const dest = audioCtx.createMediaStreamDestination();
        const audio = new Audio(audioBlobUrl);
        const src = audioCtx.createMediaElementSource(audio);
        src.connect(dest);
        dest.stream.getAudioTracks().forEach(t => stream.addTrack(t));
        audio.play().catch(() => {});
      }

      const mimeType = MediaRecorder.isTypeSupported(format.mimeType) ? format.mimeType : 'video/webm';
      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8_000_000 });
      const chunks = [];

      recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
      recorder.onerror = reject;

      recorder.start(100); // collect every 100ms

      let elapsed = 0;
      const id = setInterval(() => {
        elapsed += 0.1;
        onProgress?.(Math.min(1, elapsed / durationSec));
        if (elapsed >= durationSec) { clearInterval(id); recorder.stop(); }
      }, 100);

    } catch(err) { reject(err); }
  });
}

// ─── Multi-Scene Film Export ──────────────────────────────────────────────────

export async function exportFullFilm(scenes, canvas, fps = 30, options = {}) {
  const { onProgress = null, format = getBestMimeType() } = options;
  const blobs = [];

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    onProgress?.({ scene: i, total: scenes.length, phase: 'rendering', progress: 0 });
    const blob = await exportScene(canvas, scene.duration ?? 5, fps, {
      format,
      audioBlobUrl: scene.audioUrl ?? null,
      onProgress: p => onProgress?.({ scene: i, total: scenes.length, phase: 'recording', progress: p }),
    });
    blobs.push(blob);
    onProgress?.({ scene: i, total: scenes.length, phase: 'done', progress: 1 });
  }

  const combined = new Blob(blobs, { type: format.mimeType });
  return { blob: combined, url: URL.createObjectURL(combined), format };
}

// ─── PNG Sequence Export ──────────────────────────────────────────────────────

export async function exportPNGSequence(canvas, durationSec, fps = 24, onFrame, onProgress) {
  const frames = [];
  const totalFrames = Math.ceil(durationSec * fps);
  const msPerFrame = 1000 / fps;

  for (let f = 0; f < totalFrames; f++) {
    // Caller drives animation — call onFrame so they can advance to frame f
    await onFrame?.(f, f / fps);

    const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
    frames.push({ frame: f, blob, filename: `frame_${String(f).padStart(5, '0')}.png` });
    onProgress?.(f / totalFrames);
  }

  return frames;
}

// ─── GIF Export (via canvas frames) ──────────────────────────────────────────

export async function exportGIF(canvas, durationSec, fps = 15, options = {}) {
  const { onProgress = null, scale = 0.5 } = options;
  // GIF requires gifshot or gif.js — stub with instructions
  console.info('[FilmExporter] GIF export requires gifshot.js CDN. Loading...');

  await loadScript('https://cdn.jsdelivr.net/npm/gifshot@0.4.5/build/gifshot.min.js');
  if (!window.gifshot) throw new Error('gifshot not available');

  const frames = [];
  const totalFrames = Math.ceil(durationSec * fps);
  const offscreen = document.createElement('canvas');
  offscreen.width  = Math.round(canvas.width  * scale);
  offscreen.height = Math.round(canvas.height * scale);
  const ctx = offscreen.getContext('2d');

  for (let f = 0; f < totalFrames; f++) {
    ctx.drawImage(canvas, 0, 0, offscreen.width, offscreen.height);
    frames.push(offscreen.toDataURL('image/png'));
    onProgress?.(f / totalFrames);
    await new Promise(res => setTimeout(res, 1000 / fps));
  }

  return new Promise((resolve, reject) => {
    window.gifshot.createGIF({
      images: frames,
      gifWidth:  offscreen.width,
      gifHeight: offscreen.height,
      interval: 1 / fps,
    }, result => {
      if (result.error) reject(result.error);
      else resolve({ dataURL: result.image, blob: dataURLtoBlob(result.image) });
    });
  });
}

// ─── Screenshot ───────────────────────────────────────────────────────────────

export function exportScreenshot(canvas, filename = 'puppet_screenshot.png') {
  canvas.toBlob(blob => downloadBlob(blob, filename), 'image/png');
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function downloadBlob(blob, filename) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = filename; a.click();
  URL.revokeObjectURL(a.href);
}

function dataURLtoBlob(dataURL) {
  const [header, data] = dataURL.split(',');
  const mime = header.match(/:(.*?);/)[1];
  const binary = atob(data);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

function loadScript(src) {
  return new Promise((res, rej) => {
    if (document.querySelector(`script[src="${src}"]`)) return res();
    const s = document.createElement('script');
    s.src = src; s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
}

export default { exportScene, exportFullFilm, exportPNGSequence, exportGIF, exportScreenshot, downloadBlob, EXPORT_FORMATS, RESOLUTION_PRESETS };
