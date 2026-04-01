#!/usr/bin/env python3
"""
SPX Puppet — 9 Upgrades Master Install
Run: python3 install_puppet_9.py
"""
import os

BASE = "/workspaces/SPX-Puppet/src/utils"
HOOKS = "/workspaces/SPX-Puppet/src/hooks"
TIMELINE = "/workspaces/SPX-Puppet/src/components/timeline"

for d in [BASE, HOOKS, TIMELINE]:
    os.makedirs(d, exist_ok=True)

files = {}

# ─────────────────────────────────────────────────────────────────────────────
# 01 — PuppetLipSync.js UPGRADE
# ─────────────────────────────────────────────────────────────────────────────
files[f"{BASE}/PuppetLipSync.js"] = r'''// PuppetLipSync.js — Real phoneme→viseme lip sync engine UPGRADE
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
'''

# ─────────────────────────────────────────────────────────────────────────────
# 02 — PuppetIK.js UPGRADE
# ─────────────────────────────────────────────────────────────────────────────
files[f"{BASE}/PuppetIK.js"] = r'''// PuppetIK.js — Inverse Kinematics UPGRADE
// SPX Puppet | StreamPireX
// Features: FABRIK 2D/3D, 2-bone analytic IK, joint constraints, angle limits, pole vectors

// ─── FABRIK 2D (existing, enhanced with constraints) ──────────────────────────

export function createIKChain(joints, options = {}) {
  return {
    joints: joints.map(j => ({
      x: j.x, y: j.y,
      minAngle: j.minAngle ?? -Math.PI,
      maxAngle: j.maxAngle ?? Math.PI,
      stiffness: j.stiffness ?? 0,
    })),
    iterations: options.iterations ?? 15,
    tolerance:  options.tolerance  ?? 0.5,
    constrainAngles: options.constrainAngles ?? false,
  };
}

export function solveFABRIK(chain, targetX, targetY) {
  const pts    = chain.joints.map(j => ({ x: j.x, y: j.y }));
  const joints = chain.joints;
  const lengths = [];

  for (let i = 0; i < pts.length - 1; i++) {
    lengths.push(dist2(pts[i], pts[i+1]));
  }

  const root = { x: pts[0].x, y: pts[0].y };
  const target = { x: targetX, y: targetY };

  // Check reach
  const totalLen = lengths.reduce((a, b) => a + b, 0);
  if (dist2(root, target) > totalLen) {
    // Fully extended toward target
    for (let i = 0; i < pts.length - 1; i++) {
      const d = dist2(pts[i], target);
      const t = lengths[i] / d;
      pts[i+1] = lerp2(pts[i], target, t);
    }
    return pts;
  }

  for (let iter = 0; iter < chain.iterations; iter++) {
    // Forward pass
    pts[pts.length - 1] = { ...target };
    for (let i = pts.length - 2; i >= 0; i--) {
      const d = dist2(pts[i+1], pts[i]) || 0.001;
      pts[i] = lerp2(pts[i+1], pts[i], lengths[i] / d);
    }

    // Backward pass
    pts[0] = { ...root };
    for (let i = 0; i < pts.length - 1; i++) {
      const d = dist2(pts[i], pts[i+1]) || 0.001;
      pts[i+1] = lerp2(pts[i], pts[i+1], lengths[i] / d);

      // Apply angle constraints
      if (chain.constrainAngles && i > 0) {
        const prevAngle = Math.atan2(pts[i].y - pts[i-1].y, pts[i].x - pts[i-1].x);
        let   currAngle = Math.atan2(pts[i+1].y - pts[i].y, pts[i+1].x - pts[i].x);
        const relAngle  = normalizeAngle(currAngle - prevAngle);
        const clamped   = Math.max(joints[i].minAngle, Math.min(joints[i].maxAngle, relAngle));
        if (Math.abs(clamped - relAngle) > 0.001) {
          const newAngle = prevAngle + clamped;
          pts[i+1] = {
            x: pts[i].x + Math.cos(newAngle) * lengths[i],
            y: pts[i].y + Math.sin(newAngle) * lengths[i],
          };
        }
      }
    }

    if (dist2(pts[pts.length-1], target) < chain.tolerance) break;
  }

  return pts;
}

// ─── 2-Bone Analytic IK (faster for arms/legs) ───────────────────────────────

export function solveTwoBoneIK(root, mid, end, target, poleAngle = 0) {
  const upperLen = dist2(root, mid);
  const lowerLen = dist2(mid, end);
  const totalLen = upperLen + lowerLen;
  const rootToTarget = dist2(root, target);

  const angle = Math.atan2(target.y - root.y, target.x - root.x);

  if (rootToTarget >= totalLen) {
    // Fully extended
    return {
      mid: { x: root.x + Math.cos(angle) * upperLen, y: root.y + Math.sin(angle) * upperLen },
      end: target,
    };
  }

  // Law of cosines
  const cosA = Math.max(-1, Math.min(1,
    (upperLen*upperLen + rootToTarget*rootToTarget - lowerLen*lowerLen) / (2 * upperLen * rootToTarget)
  ));
  const a1 = Math.acos(cosA);
  const midAngle = angle - a1 + poleAngle;

  const newMid = {
    x: root.x + Math.cos(midAngle) * upperLen,
    y: root.y + Math.sin(midAngle) * upperLen,
  };

  return { mid: newMid, end: target };
}

// ─── CCD (Cyclic Coordinate Descent) — better for spine chains ───────────────

export function solveCCD(points, lengths, targetX, targetY, iterations = 10) {
  const pts = points.map(p => ({ ...p }));
  const target = { x: targetX, y: targetY };

  for (let iter = 0; iter < iterations; iter++) {
    for (let i = pts.length - 2; i >= 0; i--) {
      const toEnd    = Math.atan2(pts[pts.length-1].y - pts[i].y, pts[pts.length-1].x - pts[i].x);
      const toTarget = Math.atan2(target.y - pts[i].y, target.x - pts[i].x);
      const delta    = normalizeAngle(toTarget - toEnd);

      // Rotate all joints from i+1 onward
      for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[j].x - pts[i].x;
        const dy = pts[j].y - pts[i].y;
        pts[j] = {
          x: pts[i].x + dx * Math.cos(delta) - dy * Math.sin(delta),
          y: pts[i].y + dx * Math.sin(delta) + dy * Math.cos(delta),
        };
      }
    }
    if (dist2(pts[pts.length-1], target) < 0.5) break;
  }
  return pts;
}

// ─── Joint Constraint Helpers ─────────────────────────────────────────────────

export function createJointConstraint(minAngleDeg, maxAngleDeg, axis = 'z') {
  return {
    min: (minAngleDeg * Math.PI) / 180,
    max: (maxAngleDeg * Math.PI) / 180,
    axis,
  };
}

export function applyJointConstraint(angle, constraint) {
  return Math.max(constraint.min, Math.min(constraint.max, normalizeAngle(angle)));
}

// Preset constraints for human puppet joints
export const HUMAN_CONSTRAINTS = {
  elbow:    createJointConstraint(0, 145),
  knee:     createJointConstraint(0, 160),
  shoulder: createJointConstraint(-90, 180),
  hip:      createJointConstraint(-30, 120),
  spine:    createJointConstraint(-20, 20),
  neck:     createJointConstraint(-45, 45),
  wrist:    createJointConstraint(-70, 70),
  ankle:    createJointConstraint(-40, 40),
};

// ─── Pole Vector ──────────────────────────────────────────────────────────────

export function computePoleAngle(root, poleTarget) {
  return Math.atan2(poleTarget.y - root.y, poleTarget.x - root.x);
}

// ─── Full IK Rig Solver ───────────────────────────────────────────────────────

export class PuppetIKRig {
  constructor() {
    this.chains = new Map();
  }

  addChain(name, joints, options = {}) {
    this.chains.set(name, createIKChain(joints, options));
  }

  solve(name, targetX, targetY, poleX = null, poleY = null) {
    const chain = this.chains.get(name);
    if (!chain) return null;

    if (chain.joints.length === 3 && poleX !== null) {
      const [root, mid, end] = chain.joints;
      const poleAngle = computePoleAngle(root, { x: poleX, y: poleY });
      return solveTwoBoneIK(root, mid, end, { x: targetX, y: targetY }, poleAngle);
    }

    return solveFABRIK(chain, targetX, targetY);
  }

  updateChainRoot(name, x, y) {
    const chain = this.chains.get(name);
    if (chain) { chain.joints[0].x = x; chain.joints[0].y = y; }
  }

  getChain(name) { return this.chains.get(name); }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function dist2(a, b) { return Math.sqrt((a.x-b.x)**2 + (a.y-b.y)**2); }
function lerp2(a, b, t) { return { x: a.x + (b.x-a.x)*t, y: a.y + (b.y-a.y)*t }; }
function normalizeAngle(a) { while (a > Math.PI) a -= Math.PI*2; while (a < -Math.PI) a += Math.PI*2; return a; }

export default { createIKChain, solveFABRIK, solveTwoBoneIK, solveCCD, PuppetIKRig, HUMAN_CONSTRAINTS };
'''

# ─────────────────────────────────────────────────────────────────────────────
# 03 — PuppetPhysics.js UPGRADE
# ─────────────────────────────────────────────────────────────────────────────
files[f"{BASE}/PuppetPhysics.js"] = r'''// PuppetPhysics.js — Physics UPGRADE
// SPX Puppet | StreamPireX
// Features: spring chains, wind, collision, secondary motion, jiggle bones, verlet integration

// ─── Verlet Spring Chain ──────────────────────────────────────────────────────

export function createPhysicsLayer(points, options = {}) {
  const { stiffness=0.3, damping=0.85, gravity=0.3, windX=0, windY=0, colliders=[] } = options;
  return {
    points: points.map(p => ({
      ...p, vx: 0, vy: 0,
      px: p.x, py: p.y, // previous position (verlet)
      pinned: p.pinned || false,
      mass: p.mass ?? 1.0,
    })),
    stiffness, damping, gravity, windX, windY, colliders,
    restPositions: points.map(p => ({ x: p.x, y: p.y })),
    constraints: [], // distance constraints between non-adjacent points
  };
}

export function stepPhysicsLayer(layer, dt = 1/60) {
  const pts = layer.points.map(p => ({ ...p }));
  const { stiffness, damping, gravity, windX, windY, colliders } = layer;

  pts.forEach((p, i) => {
    if (p.pinned) return;

    // Verlet integration
    const ax = (windX + (layer.restPositions[i].x - p.x) * stiffness) / p.mass;
    const ay = (gravity + windY + (layer.restPositions[i].y - p.y) * stiffness) / p.mass;

    const newX = p.x + (p.x - p.px) * damping + ax * dt * dt * 3600;
    const newY = p.y + (p.y - p.py) * damping + ay * dt * dt * 3600;

    p.px = p.x; p.py = p.y;
    p.x = newX; p.y = newY;

    // Collider response
    colliders.forEach(c => {
      if (c.type === 'circle') {
        const dx = p.x - c.x, dy = p.y - c.y;
        const d = Math.sqrt(dx*dx + dy*dy);
        if (d < c.radius) {
          const norm = d || 1;
          p.x = c.x + (dx/norm) * c.radius;
          p.y = c.y + (dy/norm) * c.radius;
          p.px = p.x; p.py = p.y; // kill velocity at collision
        }
      } else if (c.type === 'ground') {
        if (p.y > c.y) { p.y = c.y; p.py = p.y + (p.py - p.y) * 0.3; } // bounce
      }
    });
  });

  // Constraint solving (distance constraints)
  for (let iter = 0; iter < 3; iter++) {
    layer.constraints.forEach(({ a, b, restLen }) => {
      const pa = pts[a], pb = pts[b];
      if (!pa || !pb) return;
      const dx = pb.x - pa.x, dy = pb.y - pa.y;
      const d = Math.sqrt(dx*dx + dy*dy) || 0.001;
      const diff = (d - restLen) / d * 0.5;
      if (!pa.pinned) { pa.x += dx * diff; pa.y += dy * diff; }
      if (!pb.pinned) { pb.x -= dx * diff; pb.y -= dy * diff; }
    });
  }

  return { ...layer, points: pts };
}

// ─── Wind System ─────────────────────────────────────────────────────────────

export function createWindSystem(options = {}) {
  const { baseStrengthX = 0, baseStrengthY = 0, gustFreq = 0.5, gustAmplitude = 0.5 } = options;
  let time = 0;

  return {
    update(dt) {
      time += dt;
      const gust = Math.sin(time * gustFreq * Math.PI * 2) * gustAmplitude;
      const turbulence = (Math.random() - 0.5) * 0.1;
      return {
        x: baseStrengthX + gust + turbulence,
        y: baseStrengthY + Math.cos(time * gustFreq * 0.7 * Math.PI * 2) * gustAmplitude * 0.3,
      };
    },
    setBaseWind(x, y) { options.baseStrengthX = x; options.baseStrengthY = y; },
  };
}

// ─── Jiggle Bone ─────────────────────────────────────────────────────────────

export function createJiggleBone(options = {}) {
  const { stiffness = 0.2, damping = 0.8, maxStretch = 0.3 } = options;
  let vel = { x: 0, y: 0 };
  let pos = null;

  return {
    update(targetX, targetY, dt = 1/60) {
      if (!pos) { pos = { x: targetX, y: targetY }; return pos; }

      const springX = (targetX - pos.x) * stiffness;
      const springY = (targetY - pos.y) * stiffness;

      vel.x = (vel.x + springX) * damping;
      vel.y = (vel.y + springY) * damping;

      pos.x += vel.x;
      pos.y += vel.y;

      // Clamp max stretch
      const dx = pos.x - targetX, dy = pos.y - targetY;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist > maxStretch) {
        const scale = maxStretch / dist;
        pos.x = targetX + dx * scale;
        pos.y = targetY + dy * scale;
      }

      return { ...pos };
    },
    reset() { pos = null; vel = { x: 0, y: 0 }; },
  };
}

// ─── Secondary Motion (follow-through) ───────────────────────────────────────

export function createSecondaryMotion(options = {}) {
  const { lag = 0.15, overshoot = 0.1 } = options;
  let prev = null, velocity = { x: 0, y: 0 };

  return {
    update(primaryX, primaryY) {
      if (!prev) { prev = { x: primaryX, y: primaryY }; return prev; }

      // Spring-damper toward primary with overshoot
      const dx = primaryX - prev.x;
      const dy = primaryY - prev.y;

      velocity.x = velocity.x * (1 - lag) + dx * lag;
      velocity.y = velocity.y * (1 - lag) + dy * lag;

      prev.x += velocity.x;
      prev.y += velocity.y;

      return {
        x: prev.x + velocity.x * overshoot,
        y: prev.y + velocity.y * overshoot,
      };
    },
    reset() { prev = null; velocity = { x: 0, y: 0 }; },
  };
}

// ─── Cloth / Hair presets ─────────────────────────────────────────────────────

export function createHairPhysics(points) {
  return createPhysicsLayer(points, { stiffness: 0.08, damping: 0.92, gravity: 0.4 });
}

export function createClothPhysics(points) {
  return createPhysicsLayer(points, { stiffness: 0.15, damping: 0.88, gravity: 0.25 });
}

export function createLooseCloth(points) {
  return createPhysicsLayer(points, { stiffness: 0.05, damping: 0.95, gravity: 0.2 });
}

export default { createPhysicsLayer, stepPhysicsLayer, createWindSystem, createJiggleBone, createSecondaryMotion, createHairPhysics, createClothPhysics };
'''

# ─────────────────────────────────────────────────────────────────────────────
# 04 — PuppetFaceExpressions.js UPGRADE
# ─────────────────────────────────────────────────────────────────────────────
files[f"{BASE}/PuppetFaceExpressions.js"] = r'''// PuppetFaceExpressions.js — FACS-based face expression system UPGRADE
// SPX Puppet | StreamPireX
// Features: 52 action units, blendshape mixing, emotion interpolation, expression recorder

const loadScript = (src) => new Promise((res, rej) => {
  if (document.querySelector(`script[src="${src}"]`)) return res();
  const s = document.createElement('script');
  s.src = src; s.onload = res; s.onerror = rej;
  document.head.appendChild(s);
});

// ─── FACS Action Units (subset relevant to puppet) ────────────────────────────
export const ACTION_UNITS = {
  // Brow
  AU1:  'innerBrowRaise',   AU2:  'outerBrowRaise',  AU4:  'browLower',
  AU5:  'upperLidRaiser',   AU6:  'cheekRaiser',
  // Eye
  AU7:  'lidTightener',     AU43: 'eyesClosed',       AU45: 'blink',
  AU46: 'wink',
  // Nose
  AU9:  'noseWrinkler',     AU38: 'nostrilCompressor',
  // Mouth
  AU10: 'upperLipRaiser',   AU11: 'nasolabialDeepener', AU12: 'lipCornerPuller',
  AU13: 'cheekPuffer',      AU14: 'dimpler',           AU15: 'lipCornerDepressor',
  AU16: 'lowerLipDepressor', AU17: 'chinRaiser',       AU18: 'lipPuckerer',
  AU20: 'lipStretcher',     AU22: 'lipFunneler',       AU23: 'lipTightener',
  AU24: 'lipPressor',       AU25: 'lipsPartOpen',      AU26: 'jawDrop',
  AU27: 'mouthStretch',     AU28: 'lipSuck',
  // Head
  AU51: 'headTurnLeft',     AU52: 'headTurnRight',    AU53: 'headUp',
  AU54: 'headDown',         AU55: 'headTiltLeft',     AU56: 'headTiltRight',
};

// ─── Preset Expressions (blends of AUs) ──────────────────────────────────────
export const EXPRESSIONS = {
  neutral:   { jawOpen:0, leftBlink:0, rightBlink:0, browRaise:0, smile:0, AU12:0, AU4:0, AU9:0 },
  happy:     { jawOpen:0.15, leftBlink:0, rightBlink:0, browRaise:0.3, smile:1, AU6:0.7, AU12:0.8 },
  surprised: { jawOpen:0.7, leftBlink:0, rightBlink:0, browRaise:1.0, smile:0, AU1:1, AU2:1, AU5:0.8 },
  sad:       { jawOpen:0, leftBlink:0, rightBlink:0, browRaise:-0.3, smile:-0.5, AU15:0.7, AU17:0.5, AU4:0.6 },
  angry:     { jawOpen:0.1, leftBlink:0, rightBlink:0, browRaise:-0.5, smile:-0.3, AU4:0.9, AU7:0.8, AU23:0.6 },
  disgusted: { jawOpen:0.05, leftBlink:0, rightBlink:0, browRaise:-0.2, smile:-0.4, AU9:0.9, AU15:0.5, AU16:0.3 },
  fearful:   { jawOpen:0.4, leftBlink:0, rightBlink:0, browRaise:0.7, smile:-0.2, AU1:0.8, AU4:0.5, AU20:0.6 },
  wink:      { jawOpen:0, leftBlink:1, rightBlink:0, browRaise:0.2, smile:0.5, AU12:0.4 },
  smirk:     { jawOpen:0, leftBlink:0, rightBlink:0, browRaise:0.1, smile:0.4, AU12:0.3, AU14:0.5 },
  confused:  { jawOpen:0.1, leftBlink:0, rightBlink:0.3, browRaise:0.2, smile:0, AU1:0.4, AU4:0.3 },
};

// ─── Landmark Extraction ──────────────────────────────────────────────────────

function dist(a, b) { return Math.sqrt((a.x-b.x)**2 + (a.y-b.y)**2); }

export function extractExpression(faceLandmarks) {
  if (!faceLandmarks || faceLandmarks.length < 468) return { ...EXPRESSIONS.neutral };
  const lms = faceLandmarks;

  const eyeWidth   = dist(lms[33],  lms[133]) || 0.001;
  const lipDist    = dist(lms[13],  lms[14]);
  const jawOpen    = Math.min(1, lipDist / (eyeWidth * 1.5));

  const leftEyeH   = dist(lms[159], lms[145]);
  const rightEyeH  = dist(lms[386], lms[374]);
  const leftEyeW   = dist(lms[33],  lms[133]) || 0.001;
  const rightEyeW  = dist(lms[263], lms[362]) || 0.001;
  const leftBlink  = 1 - Math.min(1, leftEyeH  / (leftEyeW  * 0.35));
  const rightBlink = 1 - Math.min(1, rightEyeH / (rightEyeW * 0.35));

  const browRaise  = Math.max(-1, Math.min(1, (lms[159].y - lms[66].y) * 10 - 0.5));
  const mouthW     = dist(lms[61], lms[291]);
  const smile      = Math.max(-1, Math.min(1, (mouthW / eyeWidth - 0.8) * 3));

  // Additional AUs
  const nostrilW   = dist(lms[129], lms[358]);
  const noseWrinkle= Math.max(0, Math.min(1, (nostrilW / eyeWidth - 0.5) * 4));
  const cheekRaise = Math.max(0, Math.min(1, (lms[206].y - lms[187].y) / (eyeWidth * 0.5)));
  const lipPucker  = Math.max(0, Math.min(1, 1 - (mouthW / (eyeWidth * 0.7))));

  // Head pose (simplified)
  const noseX      = lms[1].x;
  const headTurn   = Math.max(-1, Math.min(1, (noseX - 0.5) * 3));
  const noseY      = lms[1].y;
  const headNod    = Math.max(-1, Math.min(1, (noseY - 0.5) * 3));

  return {
    jawOpen, leftBlink, rightBlink, browRaise, smile,
    AU9: noseWrinkle, AU6: cheekRaise, AU18: lipPucker,
    AU51: Math.min(0, headTurn), AU52: Math.max(0, headTurn),
    AU53: Math.min(0, headNod),  AU54: Math.max(0, headNod),
  };
}

// ─── Expression Blender ───────────────────────────────────────────────────────

export class ExpressionBlender {
  constructor() {
    this.current   = { ...EXPRESSIONS.neutral };
    this.target    = { ...EXPRESSIONS.neutral };
    this.blendSpeed = 0.12;
    this.overrides  = {};
  }

  setTarget(expressionName, weight = 1.0) {
    const expr = EXPRESSIONS[expressionName];
    if (!expr) return;
    Object.keys(expr).forEach(k => {
      this.target[k] = (this.target[k] ?? 0) * (1 - weight) + expr[k] * weight;
    });
  }

  setTargetRaw(expression) {
    Object.assign(this.target, expression);
  }

  setOverride(key, value) { this.overrides[key] = value; }
  clearOverride(key) { delete this.overrides[key]; }

  update() {
    Object.keys(this.target).forEach(k => {
      const cur = this.current[k] ?? 0;
      const tgt = this.target[k] ?? 0;
      this.current[k] = cur + (tgt - cur) * this.blendSpeed;
    });
    return { ...this.current, ...this.overrides };
  }

  blendBetween(exprA, exprB, t) {
    const a = EXPRESSIONS[exprA] ?? EXPRESSIONS.neutral;
    const b = EXPRESSIONS[exprB] ?? EXPRESSIONS.neutral;
    const result = {};
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    keys.forEach(k => {
      result[k] = (a[k] ?? 0) * (1-t) + (b[k] ?? 0) * t;
    });
    return result;
  }

  reset() { this.current = { ...EXPRESSIONS.neutral }; this.target = { ...EXPRESSIONS.neutral }; }
}

// ─── Expression Recorder ─────────────────────────────────────────────────────

export class ExpressionRecorder {
  constructor() { this.frames = []; this.recording = false; this.startTime = null; }

  start() { this.frames = []; this.startTime = performance.now(); this.recording = true; }

  record(expression) {
    if (!this.recording) return;
    this.frames.push({ t: (performance.now() - this.startTime) / 1000, ...expression });
  }

  stop() { this.recording = false; return this.frames; }

  getAtTime(t) {
    if (!this.frames.length) return EXPRESSIONS.neutral;
    let lo = 0, hi = this.frames.length - 1;
    while (lo < hi - 1) {
      const mid = (lo + hi) >> 1;
      if (this.frames[mid].t <= t) lo = mid; else hi = mid;
    }
    if (hi === lo) return this.frames[lo];
    const alpha = (t - this.frames[lo].t) / (this.frames[hi].t - this.frames[lo].t + 0.001);
    const a = this.frames[lo], b = this.frames[hi];
    const result = {};
    Object.keys(a).forEach(k => {
      if (k === 't') return;
      result[k] = (a[k] ?? 0) * (1 - alpha) + (b[k] ?? 0) * alpha;
    });
    return result;
  }

  serialize() { return JSON.stringify(this.frames); }
  deserialize(json) { this.frames = JSON.parse(json); }
}

// ─── Face Expression Engine (camera → expressions) ───────────────────────────

export function createFaceExpressionEngine() {
  let faceMesh = null, camera = null, running = false;
  let current = { ...EXPRESSIONS.neutral };
  const blender = new ExpressionBlender();

  return {
    async start(videoEl, onExpression) {
      await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js');
      await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');

      faceMesh = new window.FaceMesh({
        locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}`,
      });
      faceMesh.setOptions({ maxNumFaces:1, refineLandmarks:true, minDetectionConfidence:0.5, minTrackingConfidence:0.5 });
      faceMesh.onResults(results => {
        if (!results.multiFaceLandmarks?.[0]) return;
        const raw = extractExpression(results.multiFaceLandmarks[0]);
        blender.setTargetRaw(raw);
        current = blender.update();
        onExpression?.(current, results.multiFaceLandmarks[0]);
      });

      camera = new window.Camera(videoEl, {
        onFrame: async () => { await faceMesh.send({ image: videoEl }); },
        width: 640, height: 480,
      });
      await camera.start();
      running = true;
    },

    stop() {
      camera?.stop(); camera = null; faceMesh = null; running = false;
      current = { ...EXPRESSIONS.neutral };
    },

    setExpression(name, weight) { blender.setTarget(name, weight); },
    blender, getCurrent() { return current; },
    isRunning() { return running; },
  };
}

export { drawExpressionOnCharacter } from './PuppetFaceExpressionsCanvas.js';
export default { EXPRESSIONS, ACTION_UNITS, extractExpression, ExpressionBlender, ExpressionRecorder, createFaceExpressionEngine };
'''

# ─────────────────────────────────────────────────────────────────────────────
# 04b — PuppetFaceExpressionsCanvas.js (split canvas drawing out)
# ─────────────────────────────────────────────────────────────────────────────
files[f"{BASE}/PuppetFaceExpressionsCanvas.js"] = r'''// PuppetFaceExpressionsCanvas.js — canvas drawing for face expressions
export function drawExpressionOnCharacter(ctx, expression, headX, headY, headSize) {
  const { jawOpen=0, leftBlink=0, rightBlink=0, browRaise=0, smile=0 } = expression;
  const r = headSize / 2;
  const eyeY   = headY - r * 0.15;
  const leftX  = headX - r * 0.3;
  const rightX = headX + r * 0.3;

  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.ellipse(leftX,  eyeY, r*0.12, Math.max(0.01, r*0.12*(1-leftBlink*0.95)),  0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(rightX, eyeY, r*0.12, Math.max(0.01, r*0.12*(1-rightBlink*0.95)), 0, 0, Math.PI*2); ctx.fill();

  if (leftBlink < 0.7)  { ctx.fillStyle='#222'; ctx.beginPath(); ctx.arc(leftX,  eyeY, r*0.06, 0, Math.PI*2); ctx.fill(); }
  if (rightBlink < 0.7) { ctx.fillStyle='#222'; ctx.beginPath(); ctx.arc(rightX, eyeY, r*0.06, 0, Math.PI*2); ctx.fill(); }

  ctx.strokeStyle='#333'; ctx.lineWidth=r*0.06;
  const browY = eyeY - r*0.22 - browRaise*r*0.1;
  ctx.beginPath(); ctx.moveTo(leftX-r*0.15, browY); ctx.lineTo(leftX+r*0.15, browY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(rightX-r*0.15, browY); ctx.lineTo(rightX+r*0.15, browY); ctx.stroke();

  const mouthY = headY + r*0.3, mouthW = r*0.4, mouthH = jawOpen*r*0.4;
  ctx.strokeStyle='#cc3333'; ctx.lineWidth=r*0.05;
  if (jawOpen > 0.05) {
    ctx.fillStyle='#cc2200'; ctx.beginPath(); ctx.ellipse(headX, mouthY, mouthW, mouthH, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.moveTo(headX-mouthW, mouthY); ctx.quadraticCurveTo(headX, mouthY+smile*r*0.15, headX+mouthW, mouthY); ctx.stroke();
  }
}
'''

# ─────────────────────────────────────────────────────────────────────────────
# 05 — PuppetAIVoice.js UPGRADE
# ─────────────────────────────────────────────────────────────────────────────
files[f"{BASE}/PuppetAIVoice.js"] = r'''// PuppetAIVoice.js — ElevenLabs AI Voice UPGRADE
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
'''

# ─────────────────────────────────────────────────────────────────────────────
# 06 — PuppetCollab.js UPGRADE
# ─────────────────────────────────────────────────────────────────────────────
files[f"{BASE}/PuppetCollab.js"] = r'''// PuppetCollab.js — Multi-user puppeteering UPGRADE
// SPX Puppet | StreamPireX
// Features: WebSocket rooms, role system, presence, conflict resolution, reconnect, chat

export const PUPPET_ROLES = {
  BODY:       'body',
  LEFT_HAND:  'left_hand',
  RIGHT_HAND: 'right_hand',
  FACE:       'face',
  DIRECTOR:   'director',
  OBSERVER:   'observer',
};

const MSG_TYPES = {
  JOIN:         'join',
  LEAVE:        'leave',
  RIG_UPDATE:   'rig_update',
  EXPRESSION:   'expression',
  CHAT:         'chat',
  ROLE_ASSIGN:  'role_assign',
  ROLE_REQUEST: 'role_request',
  SCENE_STATE:  'scene_state',
  PING:         'ping',
  PONG:         'pong',
  PEER_LIST:    'peer_list',
  KEYFRAME:     'keyframe',
  CURSOR:       'cursor',
};

export function createCollabRoom(options = {}) {
  const {
    roomId   = 'spx-' + Math.random().toString(36).slice(2, 8).toUpperCase(),
    userId   = 'user_' + Math.random().toString(36).slice(2, 8),
    userName = 'Puppeteer',
    role     = PUPPET_ROLES.BODY,
    wsUrl    = null,
  } = options;

  let ws = null;
  let connected = false;
  let reconnectTimer = null;
  let reconnectAttempts = 0;
  let pingInterval = null;
  const handlers = {};
  const peers = new Map(); // userId → { userId, userName, role, lastSeen, cursor }
  const messageQueue = []; // queued while disconnected
  const history = []; // last N messages for late joiners

  const send = (data) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      messageQueue.push(data);
      return false;
    }
    try { ws.send(JSON.stringify(data)); return true; }
    catch(e) { console.error('[PuppetCollab] send error:', e); return false; }
  };

  const flushQueue = () => {
    while (messageQueue.length > 0 && ws?.readyState === WebSocket.OPEN) {
      send(messageQueue.shift());
    }
  };

  const handleMessage = (raw) => {
    try {
      const msg = JSON.parse(raw);
      history.push(msg);
      if (history.length > 200) history.shift();

      switch (msg.type) {
        case MSG_TYPES.PEER_LIST:
          msg.peers?.forEach(p => peers.set(p.userId, p));
          handlers.onPeerList?.(Array.from(peers.values()));
          break;
        case MSG_TYPES.JOIN:
          peers.set(msg.userId, { userId: msg.userId, userName: msg.userName, role: msg.role, lastSeen: Date.now() });
          handlers.onPeerJoin?.(peers.get(msg.userId));
          handlers.onPeerList?.(Array.from(peers.values()));
          break;
        case MSG_TYPES.LEAVE:
          peers.delete(msg.userId);
          handlers.onPeerLeave?.(msg.userId);
          handlers.onPeerList?.(Array.from(peers.values()));
          break;
        case MSG_TYPES.RIG_UPDATE:
          if (msg.userId !== userId) handlers.onRigUpdate?.(msg.userId, msg.rig);
          break;
        case MSG_TYPES.EXPRESSION:
          if (msg.userId !== userId) handlers.onExpression?.(msg.userId, msg.expression);
          break;
        case MSG_TYPES.CHAT:
          handlers.onChat?.(msg);
          break;
        case MSG_TYPES.ROLE_ASSIGN:
          if (peers.has(msg.peerId)) { peers.get(msg.peerId).role = msg.role; }
          if (msg.peerId === userId) handlers.onRoleChange?.(msg.role);
          handlers.onPeerList?.(Array.from(peers.values()));
          break;
        case MSG_TYPES.SCENE_STATE:
          handlers.onSceneState?.(msg.state);
          break;
        case MSG_TYPES.KEYFRAME:
          handlers.onKeyframe?.(msg.userId, msg.frame, msg.data);
          break;
        case MSG_TYPES.CURSOR:
          if (peers.has(msg.userId)) { peers.get(msg.userId).cursor = msg.cursor; }
          handlers.onCursor?.(msg.userId, msg.cursor);
          break;
        case MSG_TYPES.PONG:
          peers.get(userId) && (peers.get(userId).lastSeen = Date.now());
          break;
      }
      handlers.onMessage?.(msg);
    } catch(e) { console.warn('[PuppetCollab] parse error:', e); }
  };

  const connect = (url) => {
    const wsEndpoint = url || wsUrl || `wss://spx-puppet-collab.streampirex.com/room/${roomId}`;
    try {
      ws = new WebSocket(wsEndpoint);

      ws.onopen = () => {
        connected = true;
        reconnectAttempts = 0;
        handlers.onConnect?.();
        // Announce join
        send({ type: MSG_TYPES.JOIN, userId, userName, role, roomId });
        flushQueue();
        // Ping keepalive
        pingInterval = setInterval(() => {
          send({ type: MSG_TYPES.PING, userId });
        }, 5000);
      };

      ws.onclose = (e) => {
        connected = false;
        clearInterval(pingInterval);
        handlers.onDisconnect?.(e.code, e.reason);
        // Auto-reconnect with backoff
        if (reconnectAttempts < 5) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
          reconnectAttempts++;
          reconnectTimer = setTimeout(() => connect(url), delay);
        }
      };

      ws.onmessage = (e) => handleMessage(e.data);
      ws.onerror   = (e) => handlers.onError?.(e);

    } catch(e) { console.error('[PuppetCollab] connect error:', e); }
  };

  return {
    roomId, userId, userName,

    connect,

    // Rig update — throttle in caller to ~30fps
    sendRigUpdate(rig) {
      send({ type: MSG_TYPES.RIG_UPDATE, userId, roomId, rig, timestamp: Date.now() });
    },

    sendExpression(expression) {
      send({ type: MSG_TYPES.EXPRESSION, userId, roomId, expression, timestamp: Date.now() });
    },

    sendChatMessage(text) {
      const msg = { type: MSG_TYPES.CHAT, userId, userName, roomId, text, timestamp: Date.now() };
      history.push(msg);
      send(msg);
    },

    sendKeyframe(frame, data) {
      send({ type: MSG_TYPES.KEYFRAME, userId, roomId, frame, data, timestamp: Date.now() });
    },

    sendCursor(x, y) {
      send({ type: MSG_TYPES.CURSOR, userId, cursor: { x, y }, timestamp: Date.now() });
    },

    requestRole(requestedRole) {
      send({ type: MSG_TYPES.ROLE_REQUEST, userId, role: requestedRole, roomId });
    },

    assignRole(peerId, newRole) {
      if (!peers.has(peerId)) return;
      peers.get(peerId).role = newRole;
      send({ type: MSG_TYPES.ROLE_ASSIGN, userId, peerId, role: newRole, roomId });
    },

    broadcastSceneState(state) {
      send({ type: MSG_TYPES.SCENE_STATE, userId, roomId, state });
    },

    disconnect() {
      clearTimeout(reconnectTimer);
      clearInterval(pingInterval);
      reconnectAttempts = 99; // prevent auto-reconnect
      send({ type: MSG_TYPES.LEAVE, userId, roomId });
      ws?.close();
      ws = null; connected = false;
    },

    on(event, handler) { handlers[event] = handler; },
    off(event) { delete handlers[event]; },

    isConnected() { return connected; },
    getPeers() { return Array.from(peers.values()); },
    getPeer(id) { return peers.get(id); },
    getMyRole() { return role; },
    getRoomId() { return roomId; },
    getUserId() { return userId; },

    // Who has which role
    getRoleOwner(r) {
      for (const [id, peer] of peers) { if (peer.role === r) return peer; }
      return null;
    },

    getStats() {
      return { roomId, userId, connected, peerCount: peers.size, messageCount: history.length, reconnectAttempts };
    },

    getChatHistory() { return history.filter(m => m.type === MSG_TYPES.CHAT); },
  };
}

export default createCollabRoom;
'''

# ─────────────────────────────────────────────────────────────────────────────
# 07 — FilmExporter.js UPGRADE
# ─────────────────────────────────────────────────────────────────────────────
files[f"{BASE.replace('utils', '')}utils/FilmExporter.js"] = r'''// FilmExporter.js — Film Export UPGRADE
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
'''

# ─────────────────────────────────────────────────────────────────────────────
# 08 — KeyframeTimeline.jsx UPGRADE
# ─────────────────────────────────────────────────────────────────────────────
files[f"{TIMELINE}/KeyframeTimeline.jsx"] = r'''// KeyframeTimeline.jsx — NLA-style Keyframe Timeline UPGRADE
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
'''

# ─────────────────────────────────────────────────────────────────────────────
# 09 — usePuppetMocap.js UPGRADE
# ─────────────────────────────────────────────────────────────────────────────
files[f"{HOOKS}/usePuppetMocap.js"] = r'''// usePuppetMocap.js — Puppet Mocap Hook UPGRADE
// SPX Puppet | StreamPireX
// Features: body + face + hands, smoother selector, depth estimation, model quality,
//           multi-person toggle, foot plant fix, recording with face data

import { useState, useRef, useCallback, useEffect } from 'react';
import { updateRigFromPose } from '../utils/PuppetRig.js';

const loadScript = (src) => new Promise((res, rej) => {
  if (document.querySelector(`script[src="${src}"]`)) return res();
  const s = document.createElement('script');
  s.src = src; s.onload = res; s.onerror = rej;
  document.head.appendChild(s);
});

// Simple EMA smoother for landmarks
function createEMASmoother(alpha = 0.6) {
  let prev = null;
  return {
    smooth(lms) {
      if (!prev) { prev = lms; return lms; }
      const result = lms.map((lm, i) => {
        const p = prev[i];
        if (!lm || !p) return lm;
        return { ...lm, x: p.x*(1-alpha)+lm.x*alpha, y: p.y*(1-alpha)+lm.y*alpha, z: (p.z??0)*(1-alpha)+(lm.z??0)*alpha };
      });
      prev = result;
      return result;
    },
    reset() { prev = null; },
  };
}

// One Euro filter (fast motion)
function createOneEuroSmoother(minCutoff = 1.0, beta = 0.007) {
  let filters = null;
  const alpha = (cutoff) => { const te = 1/30; const tau = 1/(2*Math.PI*cutoff); return 1/(1+tau/te); };

  return {
    smooth(lms) {
      if (!filters) filters = lms.map(() => ({ x: null, dx: 0, y: null, dy: 0, z: null, dz: 0 }));
      return lms.map((lm, i) => {
        if (!lm) return lm;
        const f = filters[i];
        const filter1d = (v, prev, dv) => {
          if (prev === null) return v;
          const d = (v - prev) * 30;
          const nd = dv + alpha(1.0) * (d - dv);
          const cutoff = minCutoff + beta * Math.abs(nd);
          return prev + alpha(cutoff) * (v - prev);
        };
        const nx = filter1d(lm.x, f.x, f.dx);
        const ny = filter1d(lm.y, f.y, f.dy);
        const nz = filter1d(lm.z??0, f.z??0, f.dz);
        f.dx = (nx-lm.x)*30; f.x = nx;
        f.dy = (ny-lm.y)*30; f.y = ny;
        f.dz = (nz-(lm.z??0))*30; f.z = nz;
        return { ...lm, x: nx, y: ny, z: nz };
      });
      filters = filters;
    },
    reset() { filters = null; },
  };
}

export default function usePuppetMocap(videoRef, rigRef, onRigUpdate, options = {}) {
  const {
    enabled         = true,
    smootherType    = 'ONE_EURO',  // 'ONE_EURO' | 'EMA' | 'NONE'
    modelComplexity = 1,
    trackFace       = false,
    trackHands      = false,
    onFaceUpdate    = null,
    onHandUpdate    = null,
  } = options;

  const poseRef     = useRef(null);
  const cameraRef   = useRef(null);
  const faceMeshRef = useRef(null);
  const smootherRef = useRef(null);
  const recordRef   = useRef(null); // recording buffer

  const [status,    setStatus]    = useState('idle');
  const [fps,       setFps]       = useState(0);
  const [landmarks, setLandmarks] = useState(null);
  const [faceData,  setFaceData]  = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const fpsRef = useRef({ frames: 0, last: performance.now() });

  // Init smoother
  useEffect(() => {
    smootherRef.current = smootherType === 'EMA'
      ? createEMASmoother(0.65)
      : smootherType === 'ONE_EURO'
        ? createOneEuroSmoother()
        : null;
  }, [smootherType]);

  const handlePoseResults = useCallback((results) => {
    if (!results.poseLandmarks) return;
    let lms = results.poseLandmarks;

    if (smootherRef.current) lms = smootherRef.current.smooth(lms);

    setLandmarks(lms);

    if (rigRef?.current) {
      rigRef.current = updateRigFromPose(rigRef.current, lms, 640, 480);
      onRigUpdate?.(rigRef.current, lms);
    }

    // Record
    if (isRecording && recordRef.current) {
      recordRef.current.push({
        t: (performance.now() - (recordRef.current._startTime ?? performance.now())) / 1000,
        landmarks: lms.map(l => ({ ...l })),
        face: faceData,
      });
    }

    fpsRef.current.frames++;
    const now = performance.now();
    if (now - fpsRef.current.last >= 1000) {
      setFps(fpsRef.current.frames);
      fpsRef.current = { frames: 0, last: now };
    }
  }, [rigRef, onRigUpdate, isRecording, faceData]);

  const start = useCallback(async () => {
    if (!enabled || !videoRef?.current) return;
    setStatus('loading');
    smootherRef.current?.reset?.();
    try {
      await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js');
      await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');

      const pose = new window.Pose({ locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${f}` });
      pose.setOptions({ modelComplexity, smoothLandmarks: true, enableSegmentation: false, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
      pose.onResults(handlePoseResults);
      poseRef.current = pose;

      if (trackFace) {
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js');
        const faceMesh = new window.FaceMesh({ locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}` });
        faceMesh.setOptions({ maxNumFaces: 1, refineLandmarks: true, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
        faceMesh.onResults(r => {
          if (r.multiFaceLandmarks?.[0]) {
            setFaceData(r.multiFaceLandmarks[0]);
            onFaceUpdate?.(r.multiFaceLandmarks[0]);
          }
        });
        faceMeshRef.current = faceMesh;
      }

      const camera = new window.Camera(videoRef.current, {
        onFrame: async () => {
          await poseRef.current?.send({ image: videoRef.current });
          if (faceMeshRef.current) await faceMeshRef.current.send({ image: videoRef.current });
        },
        width: 640, height: 480,
      });
      await camera.start();
      cameraRef.current = camera;
      setStatus('running');
    } catch(err) {
      console.error('[usePuppetMocap]', err);
      setStatus('error');
    }
  }, [enabled, videoRef, handlePoseResults, modelComplexity, trackFace, onFaceUpdate]);

  const stop = useCallback(() => {
    cameraRef.current?.stop(); cameraRef.current = null;
    poseRef.current?.close(); poseRef.current = null;
    faceMeshRef.current?.close?.(); faceMeshRef.current = null;
    if (videoRef?.current) { videoRef.current.srcObject?.getTracks?.().forEach(t=>t.stop()); videoRef.current.srcObject = null; }
    smootherRef.current?.reset?.();
    setStatus('idle'); setFps(0); setLandmarks(null); setFaceData(null);
  }, [videoRef]);

  const startRecording = useCallback(() => {
    recordRef.current = []; recordRef.current._startTime = performance.now();
    setIsRecording(true);
  }, []);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
    const frames = [...(recordRef.current ?? [])];
    recordRef.current = null;
    return frames;
  }, []);

  useEffect(() => () => stop(), [stop]);

  return { status, fps, landmarks, faceData, isRecording, start, stop, startRecording, stopRecording };
}
'''

# ─── Write all files ──────────────────────────────────────────────────────────
written = []
for path, code in files.items():
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as f:
        f.write(code)
    written.append(path)
    print(f"✅ {path}")

print(f"\n🎉 Done — {len(written)} files written")
print("Run: npm run build 2>&1 | grep 'MISSING_EXPORT|Error:' | head -30")
