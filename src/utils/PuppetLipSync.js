// PuppetLipSync.js — Real phoneme→viseme lip sync engine UPGRADE
// SPX Puppet | StreamPireX
// Features: 15 viseme shapes, formant analysis, phoneme detection, smoothing

// ─── 15-Viseme Shape Table (Preston Blair standard) ──────────────────────────
export const VISEMES = {
  rest:  { openness: 0.00, width: 1.00, teeth: 0.00, tongue: 0.00 },
  MBP:   { openness: 0.00, width: 0.70, teeth: 0.00, tongue: 0.00 }, // M, B, P
  FV:    { openness: 0.05, width: 0.80, teeth: 0.30, tongue: 0.00 }, // F, V
  TH:    { openness: 0.10, width: 0.85, teeth: 0.20, tongue: 0.60 }, // Th
  DE:    { openness: 0.12, width: 1.10, teeth: 0.10, tongue: 0.20 }, // D, T, N
  KG:    { openness: 0.20, width: 0.90, teeth: 0.00, tongue: 0.10 }, // K, G
  CH:    { openness: 0.15, width: 0.75, teeth: 0.30, tongue: 0.00 }, // Ch, J, Sh
  E:     { openness: 0.15, width: 1.20, teeth: 0.20, tongue: 0.10 }, // E, eh
  I:     { openness: 0.08, width: 1.25, teeth: 0.15, tongue: 0.15 }, // I, ee
  A:     { openness: 0.50, width: 1.00, teeth: 0.00, tongue: 0.00 }, // A, ah
  AH:    { openness: 0.60, width: 0.95, teeth: 0.00, tongue: 0.00 }, // AH open
  O:     { openness: 0.35, width: 0.70, teeth: 0.00, tongue: 0.00 }, // O, oh
  OO:    { openness: 0.25, width: 0.60, teeth: 0.00, tongue: 0.00 }, // OO, oo
  U:     { openness: 0.20, width: 0.65, teeth: 0.00, tongue: 0.00 }, // U, uh
  WQ:    { openness: 0.18, width: 0.60, teeth: 0.00, tongue: 0.00 }, // W, Q
  R:     { openness: 0.22, width: 0.75, teeth: 0.00, tongue: 0.30 }, // R
};

// ─── Phoneme → Viseme mapping ─────────────────────────────────────────────────
const PHONEME_TO_VISEME = {
  // Bilabials
  'm': 'MBP', 'b': 'MBP', 'p': 'MBP',
  // Labiodentals
  'f': 'FV', 'v': 'FV',
  // Dentals
  'θ': 'TH', 'ð': 'TH',
  // Alveolars
  'd': 'DE', 't': 'DE', 'n': 'DE', 'l': 'DE',
  // Velars
  'k': 'KG', 'g': 'KG', 'ŋ': 'KG',
  // Affricates/fricatives
  'tʃ': 'CH', 'dʒ': 'CH', 'ʃ': 'CH', 'ʒ': 'CH',
  // Vowels
  'e': 'E', 'ɛ': 'E', 'æ': 'E',
  'i': 'I', 'ɪ': 'I',
  'a': 'A', 'ʌ': 'A',
  'ɑ': 'AH', 'ɔ': 'AH',
  'o': 'O', 'ɒ': 'O',
  'u': 'OO', 'ʊ': 'OO',
  'ə': 'U', 'ɚ': 'U',
  'w': 'WQ',
  'r': 'R', 'ɹ': 'R',
  // Silence
  ' ': 'rest', '.': 'rest', ',': 'rest',
};

// Simple English text → phoneme approximation
function textToPhonemes(text) {
  const lower = text.toLowerCase();
  const phonemes = [];
  let i = 0;
  while (i < lower.length) {
    const ch = lower[i];
    // Check digraphs first
    const pair = lower.slice(i, i+2);
    if (['th','ch','sh','wh','ph','tch'].includes(pair)) {
      if (pair === 'th') phonemes.push('θ');
      else if (pair === 'ch' || pair === 'tch') phonemes.push('tʃ');
      else if (pair === 'sh') phonemes.push('ʃ');
      else if (pair === 'ph') phonemes.push('f');
      else phonemes.push(ch);
      i += 2; continue;
    }
    // Vowel rules
    if ('aeiou'.includes(ch)) {
      if (ch === 'a') phonemes.push('æ');
      else if (ch === 'e') phonemes.push('ɛ');
      else if (ch === 'i') phonemes.push('ɪ');
      else if (ch === 'o') phonemes.push('ɒ');
      else if (ch === 'u') phonemes.push('ʌ');
    } else {
      phonemes.push(ch);
    }
    i++;
  }
  return phonemes;
}

// ─── Formant-based viseme detection from audio ────────────────────────────────
function detectVisemeFromFormants(freqData) {
  const len = freqData.length;
  const sampleRate = 44100;
  const binHz = sampleRate / (len * 2);

  // Energy in formant bands
  const f1 = bandEnergy(freqData, 200, 900, binHz);   // F1: vowel height
  const f2 = bandEnergy(freqData, 900, 2500, binHz);  // F2: vowel frontness
  const f3 = bandEnergy(freqData, 2500, 3500, binHz); // F3: consonants
  const total = f1 + f2 + f3 + 0.001;

  const rms = Math.sqrt(freqData.reduce((s,v) => s+v*v, 0) / len) / 128;

  if (rms < 0.04) return 'rest';

  const r1 = f1 / total, r2 = f2 / total;

  // Classify by formant ratios
  if (f3 / total > 0.4) return 'CH';
  if (r1 > 0.5 && r2 < 0.3) return 'AH';
  if (r1 > 0.4 && r2 > 0.35) return 'A';
  if (r1 < 0.25 && r2 > 0.5) return 'I';
  if (r1 < 0.3 && r2 < 0.3) return 'OO';
  if (r1 > 0.3 && r2 < 0.35) return 'O';
  if (r2 > 0.45) return 'E';
  if (rms < 0.08) return 'MBP';
  return 'U';
}

function bandEnergy(data, lowHz, highHz, binHz) {
  const lo = Math.floor(lowHz / binHz);
  const hi = Math.min(data.length - 1, Math.floor(highHz / binHz));
  let sum = 0;
  for (let i = lo; i <= hi; i++) sum += data[i] * data[i];
  return Math.sqrt(sum / Math.max(1, hi - lo));
}

// ─── Lip Sync Engine ──────────────────────────────────────────────────────────

export function createLipSyncEngine(options = {}) {
  const { smoothing = 0.5, fftSize = 1024 } = options;

  let audioCtx = null, analyser = null, source = null, stream = null;
  let running = false, rafId = null;
  let current = { ...VISEMES.rest };
  let onViseme = null;
  let fftData = null;

  const smooth = (a, b, t) => ({
    openness: a.openness * (1-t) + b.openness * t,
    width:    a.width    * (1-t) + b.width    * t,
    teeth:    (a.teeth   ?? 0) * (1-t) + (b.teeth   ?? 0) * t,
    tongue:   (a.tongue  ?? 0) * (1-t) + (b.tongue  ?? 0) * t,
  });

  const tick = () => {
    if (!running) return;
    fftData = fftData || new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(fftData);
    const visemeKey = detectVisemeFromFormants(fftData);
    const target = VISEMES[visemeKey] ?? VISEMES.rest;
    current = smooth(current, target, smoothing);
    onViseme?.({ ...current, viseme: visemeKey });
    rafId = requestAnimationFrame(tick);
  };

  return {
    async start(callback) {
      onViseme = callback;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = fftSize;
        source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);
        running = true;
        tick();
      } catch(e) { console.error('[LipSync] mic error:', e); }
    },

    stop() {
      running = false;
      cancelAnimationFrame(rafId);
      stream?.getTracks().forEach(t => t.stop());
      audioCtx?.close();
      audioCtx = null; analyser = null; source = null; stream = null;
      current = { ...VISEMES.rest };
    },

    // Drive lip sync from text (for TTS playback)
    driveFromText(text, durationMs, callback) {
      const phonemes = textToPhonemes(text);
      const msPerPhoneme = durationMs / Math.max(phonemes.length, 1);
      let i = 0;
      const drive = () => {
        if (i >= phonemes.length) { callback?.({ ...VISEMES.rest, viseme: 'rest' }); return; }
        const ph = phonemes[i++];
        const visemeKey = PHONEME_TO_VISEME[ph] ?? 'rest';
        callback?.({ ...VISEMES[visemeKey], viseme: visemeKey, phoneme: ph });
        setTimeout(drive, msPerPhoneme);
      };
      drive();
    },

    // Drive from audio blob (post-TTS)
    async driveFromAudio(audioBlob, callback) {
      const url = URL.createObjectURL(audioBlob);
      const audio = new Audio(url);
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const an = ctx.createAnalyser();
      an.fftSize = fftSize;
      const src = ctx.createMediaElementSource(audio);
      src.connect(an); an.connect(ctx.destination);
      const data = new Uint8Array(an.frequencyBinCount);
      let rid;
      const loop = () => {
        an.getByteFrequencyData(data);
        const vk = detectVisemeFromFormants(data);
        callback?.({ ...VISEMES[vk], viseme: vk });
        rid = requestAnimationFrame(loop);
      };
      audio.onended = () => { cancelAnimationFrame(rid); URL.revokeObjectURL(url); callback?.({ ...VISEMES.rest, viseme: 'rest' }); };
      await audio.play();
      loop();
      return audio;
    },

    getCurrentViseme() { return { ...current }; },
    isRunning() { return running; },
    getFFTData() { return fftData; },
  };
}

// Legacy compat
export const MOUTH_SHAPES = VISEMES;
export { textToPhonemes, PHONEME_TO_VISEME };
export default createLipSyncEngine;
