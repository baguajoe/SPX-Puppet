
// PuppetAIVoice.js — ElevenLabs voice → auto lip sync

const ELEVENLABS_API = 'https://api.elevenlabs.io/v1';

export const VISEME_MAP = {
  A: { openness: 0.35, width: 1.0 },
  E: { openness: 0.15, width: 1.1 },
  I: { openness: 0.08, width: 1.2 },
  O: { openness: 0.28, width: 0.8 },
  U: { openness: 0.22, width: 0.7 },
  M: { openness: 0.02, width: 0.7 },
  rest: { openness: 0, width: 1.0 },
};

export async function generateVoice(text, voiceId, apiKey) {
  if (!apiKey) throw new Error('ElevenLabs API key required');
  const res = await fetch(`${ELEVENLABS_API}/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: { 'Content-Type':'application/json', 'xi-api-key': apiKey },
    body: JSON.stringify({ text, model_id:'eleven_monolingual_v1', voice_settings:{ stability:0.5, similarity_boost:0.75 } }),
  });
  if (!res.ok) throw new Error('ElevenLabs API error: ' + res.status);
  return await res.blob();
}

export function createAutoLipSync(audioBlob, onViseme) {
  const url = URL.createObjectURL(audioBlob);
  const audio = new Audio(url);
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 256;

  let source = null;
  let rafId  = null;
  let current = { ...VISEME_MAP.rest };

  const tick = () => {
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);
    const rms = Math.sqrt(data.reduce((s,v) => s + v*v, 0) / data.length) / 128;

    let viseme;
    if      (rms < 0.05) viseme = VISEME_MAP.rest;
    else if (rms < 0.15) viseme = VISEME_MAP.M;
    else if (rms < 0.25) viseme = VISEME_MAP.E;
    else if (rms < 0.35) viseme = VISEME_MAP.A;
    else if (rms < 0.45) viseme = VISEME_MAP.O;
    else                 viseme = VISEME_MAP.U;

    current = {
      openness: current.openness * 0.6 + viseme.openness * 0.4,
      width:    current.width    * 0.6 + viseme.width    * 0.4,
    };
    onViseme?.(current);
    rafId = requestAnimationFrame(tick);
  };

  return {
    async play() {
      source = ctx.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(ctx.destination);
      await audio.play();
      tick();
    },
    stop() {
      audio.pause(); cancelAnimationFrame(rafId);
      URL.revokeObjectURL(url);
    },
    getAudio() { return audio; },
  };
}

export const FREE_VOICES = [
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella' },
  { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni' },
  { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli' },
  { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh' },
  { id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold' },
];
