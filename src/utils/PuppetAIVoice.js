// PuppetAIVoice.js — ElevenLabs AI Voice UPGRADE
// SPX Puppet | StreamPireX
// Features: TTS, voice clone, streaming, emotion-aware, auto lip sync, voice library

const ELEVENLABS_API = 'https://api.elevenlabs.io/v1';

export const FREE_VOICES = [
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella',   gender: 'female', accent: 'american' },
  { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni',  gender: 'male',   accent: 'american' },
  { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli',    gender: 'female', accent: 'american' },
  { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh',    gender: 'male',   accent: 'american' },
  { id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold',  gender: 'male',   accent: 'american' },
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam',    gender: 'male',   accent: 'american' },
  { id: 'yoZ06aMxZJJ28mfd3POQ', name: 'Sam',     gender: 'male',   accent: 'american' },
  { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi',    gender: 'female', accent: 'american' },
  { id: 'CYw3kZ02Hs0563khs1Fj', name: 'Dave',    gender: 'male',   accent: 'british' },
  { id: 'XB0fDUnXU5powFXDhCwa', name: 'Charlotte', gender: 'female', accent: 'british' },
];

export const MODELS = {
  MULTILINGUAL:  'eleven_multilingual_v2',
  MONOLINGUAL:   'eleven_monolingual_v1',
  TURBO:         'eleven_turbo_v2',
  TURBO_V2_5:    'eleven_turbo_v2_5',
};

export const VISEME_MAP = {
  A: { openness: 0.35, width: 1.0 }, E: { openness: 0.15, width: 1.1 },
  I: { openness: 0.08, width: 1.2 }, O: { openness: 0.28, width: 0.8 },
  U: { openness: 0.22, width: 0.7 }, M: { openness: 0.02, width: 0.7 },
  rest: { openness: 0, width: 1.0 },
};

// ─── Core TTS ─────────────────────────────────────────────────────────────────

export async function generateVoice(text, voiceId, apiKey, options = {}) {
  if (!apiKey) throw new Error('ElevenLabs API key required');
  const {
    model    = MODELS.MULTILINGUAL,
    stability         = 0.5,
    similarity_boost  = 0.75,
    style             = 0,
    use_speaker_boost = true,
    speed             = 1.0,
  } = options;

  const res = await fetch(`${ELEVENLABS_API}/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'xi-api-key': apiKey },
    body: JSON.stringify({
      text,
      model_id: model,
      voice_settings: { stability, similarity_boost, style, use_speaker_boost },
    }),
  });
  if (!res.ok) throw new Error(`ElevenLabs error ${res.status}: ${await res.text()}`);
  return await res.blob();
}

// ─── Streaming TTS ────────────────────────────────────────────────────────────

export async function streamVoice(text, voiceId, apiKey, onChunk, options = {}) {
  if (!apiKey) throw new Error('ElevenLabs API key required');
  const { model = MODELS.TURBO, stability = 0.5, similarity_boost = 0.75 } = options;

  const res = await fetch(`${ELEVENLABS_API}/text-to-speech/${voiceId}/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'xi-api-key': apiKey },
    body: JSON.stringify({
      text, model_id: model,
      voice_settings: { stability, similarity_boost },
    }),
  });
  if (!res.ok) throw new Error(`ElevenLabs stream error ${res.status}`);

  const reader = res.body.getReader();
  const chunks = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    onChunk?.(value);
  }
  return new Blob(chunks, { type: 'audio/mpeg' });
}

// ─── Voice Clone ──────────────────────────────────────────────────────────────

export async function createVoiceClone(name, description, audioFiles, apiKey) {
  if (!apiKey) throw new Error('ElevenLabs API key required');
  const formData = new FormData();
  formData.append('name', name);
  formData.append('description', description || '');
  audioFiles.forEach((file, i) => formData.append('files', file, `sample_${i}.mp3`));

  const res = await fetch(`${ELEVENLABS_API}/voices/add`, {
    method: 'POST',
    headers: { 'xi-api-key': apiKey },
    body: formData,
  });
  if (!res.ok) throw new Error(`Voice clone error ${res.status}: ${await res.text()}`);
  return await res.json(); // { voice_id, name, ... }
}

export async function listVoices(apiKey) {
  if (!apiKey) return FREE_VOICES;
  const res = await fetch(`${ELEVENLABS_API}/voices`, { headers: { 'xi-api-key': apiKey } });
  if (!res.ok) return FREE_VOICES;
  const data = await res.json();
  return data.voices ?? FREE_VOICES;
}

export async function deleteVoice(voiceId, apiKey) {
  if (!apiKey) throw new Error('ElevenLabs API key required');
  return fetch(`${ELEVENLABS_API}/voices/${voiceId}`, { method: 'DELETE', headers: { 'xi-api-key': apiKey } });
}

// ─── Auto Lip Sync ────────────────────────────────────────────────────────────

export function createAutoLipSync(audioBlob, onViseme, options = {}) {
  const { fftSize = 1024, smoothing = 0.4 } = options;
  const url = URL.createObjectURL(audioBlob);
  const audio = new Audio(url);
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const analyser = ctx.createAnalyser();
  analyser.fftSize = fftSize;

  let source = null, rafId = null;
  let current = { ...VISEME_MAP.rest };

  const classifyViseme = (data) => {
    const len = data.length;
    const rms = Math.sqrt(data.reduce((s,v) => s+v*v, 0) / len) / 128;
    if (rms < 0.04) return VISEME_MAP.rest;

    const lo  = bandEnergy(data, 0,   len*0.1);
    const mid = bandEnergy(data, len*0.1, len*0.4);
    const hi  = bandEnergy(data, len*0.4, len);

    if (rms < 0.08) return VISEME_MAP.M;
    if (hi > mid && hi > lo) return VISEME_MAP.I;
    if (lo > mid*1.5) return VISEME_MAP.A;
    if (mid > lo && mid > hi) return VISEME_MAP.E;
    if (lo > hi*1.2) return VISEME_MAP.O;
    return VISEME_MAP.U;
  };

  const tick = () => {
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);
    const target = classifyViseme(data);
    current = {
      openness: current.openness * (1-smoothing) + target.openness * smoothing,
      width:    current.width    * (1-smoothing) + target.width    * smoothing,
    };
    onViseme?.(current);
    rafId = requestAnimationFrame(tick);
  };

  return {
    async play() {
      source = ctx.createMediaElementSource(audio);
      source.connect(analyser); analyser.connect(ctx.destination);
      await audio.play();
      tick();
    },
    stop() {
      audio.pause(); cancelAnimationFrame(rafId); URL.revokeObjectURL(url);
    },
    getAudio() { return audio; },
    getProgress() { return audio.currentTime / (audio.duration || 1); },
    getDuration() { return audio.duration || 0; },
  };
}

function bandEnergy(data, lo, hi) {
  let s = 0;
  for (let i = Math.floor(lo); i < Math.ceil(hi); i++) s += data[i] * data[i];
  return Math.sqrt(s / Math.max(1, hi - lo));
}

// ─── Emotion-Aware Voice Settings ────────────────────────────────────────────

export const EMOTION_VOICE_SETTINGS = {
  neutral:   { stability: 0.50, similarity_boost: 0.75, style: 0.0 },
  happy:     { stability: 0.35, similarity_boost: 0.80, style: 0.6 },
  sad:       { stability: 0.70, similarity_boost: 0.70, style: 0.3 },
  angry:     { stability: 0.25, similarity_boost: 0.85, style: 0.8 },
  fearful:   { stability: 0.40, similarity_boost: 0.75, style: 0.5 },
  surprised: { stability: 0.30, similarity_boost: 0.80, style: 0.7 },
  whisper:   { stability: 0.90, similarity_boost: 0.60, style: 0.0 },
  shout:     { stability: 0.15, similarity_boost: 0.90, style: 1.0 },
};

export async function generateEmotionalVoice(text, voiceId, apiKey, emotion = 'neutral') {
  const settings = EMOTION_VOICE_SETTINGS[emotion] ?? EMOTION_VOICE_SETTINGS.neutral;
  return generateVoice(text, voiceId, apiKey, settings);
}

// ─── Usage stats ──────────────────────────────────────────────────────────────

export async function getUsage(apiKey) {
  if (!apiKey) return null;
  const res = await fetch(`${ELEVENLABS_API}/user/subscription`, { headers: { 'xi-api-key': apiKey } });
  if (!res.ok) return null;
  return res.json();
}

export default { generateVoice, streamVoice, createVoiceClone, listVoices, createAutoLipSync, generateEmotionalVoice, FREE_VOICES, MODELS, EMOTION_VOICE_SETTINGS };
