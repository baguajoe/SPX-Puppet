
// PuppetLipSync.js — microphone audio → mouth shape

const MOUTH_SHAPES = {
  rest:   { openness: 0.0, width: 1.0 },
  M:      { openness: 0.02, width: 0.7 },
  E:      { openness: 0.15, width: 1.1 },
  A:      { openness: 0.35, width: 1.0 },
  O:      { openness: 0.28, width: 0.8 },
  U:      { openness: 0.22, width: 0.7 },
  AH:     { openness: 0.45, width: 0.95 },
};

export function createLipSyncEngine() {
  let audioCtx = null;
  let analyser = null;
  let source = null;
  let stream = null;
  let running = false;
  let currentShape = { ...MOUTH_SHAPES.rest };
  let smoothedVolume = 0;

  const engine = {
    async start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);
        running = true;
        return true;
      } catch (err) {
        console.error('[LipSync] Mic error:', err);
        return false;
      }
    },

    stop() {
      running = false;
      source?.disconnect();
      stream?.getTracks().forEach(t => t.stop());
      audioCtx?.close();
      audioCtx = null; analyser = null; source = null; stream = null;
      currentShape = { ...MOUTH_SHAPES.rest };
    },

    getShape() {
      if (!running || !analyser) return MOUTH_SHAPES.rest;

      const data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);

      // RMS volume
      const rms = Math.sqrt(data.reduce((s, v) => s + v * v, 0) / data.length) / 128;
      smoothedVolume = smoothedVolume * 0.7 + rms * 0.3;

      const vol = smoothedVolume;
      let shape;
      if (vol < 0.05) shape = MOUTH_SHAPES.rest;
      else if (vol < 0.15) shape = MOUTH_SHAPES.M;
      else if (vol < 0.25) shape = MOUTH_SHAPES.E;
      else if (vol < 0.35) shape = MOUTH_SHAPES.A;
      else if (vol < 0.45) shape = MOUTH_SHAPES.O;
      else shape = MOUTH_SHAPES.AH;

      // Smooth transition
      currentShape = {
        openness: currentShape.openness * 0.6 + shape.openness * 0.4,
        width:    currentShape.width    * 0.6 + shape.width    * 0.4,
      };
      return currentShape;
    },

    isRunning() { return running; },
  };

  return engine;
}

export { MOUTH_SHAPES };
