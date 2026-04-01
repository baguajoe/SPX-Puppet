// PuppetFaceExpressions.js — FACS-based face expression system UPGRADE
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
