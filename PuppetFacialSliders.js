// =============================================================================
// PuppetFacialSliders.js — Manual Facial Puppet Sliders
// =============================================================================
// Independent of MediaPipe — user can manually control facial expressions
// via sliders. Can blend with MediaPipe input.
// =============================================================================

export const FACIAL_PARAMS = [
  { id: 'eyebrowL',   label: 'Brow L',     min: -15, max: 15,  default: 0,   unit: 'deg'  },
  { id: 'eyebrowR',   label: 'Brow R',     min: -15, max: 15,  default: 0,   unit: 'deg'  },
  { id: 'eyeL',       label: 'Eye L',      min: 0,   max: 1,   default: 1,   unit: 'open' },
  { id: 'eyeR',       label: 'Eye R',      min: 0,   max: 1,   default: 1,   unit: 'open' },
  { id: 'mouthOpen',  label: 'Mouth Open', min: 0,   max: 1,   default: 0,   unit: 'open' },
  { id: 'mouthCurl',  label: 'Mouth Curl', min: -1,  max: 1,   default: 0,   unit: 'curl' },
  { id: 'mouthWide',  label: 'Mouth Wide', min: 0,   max: 1,   default: 0.5, unit: ''     },
  { id: 'cheekL',     label: 'Cheek L',    min: 0,   max: 1,   default: 0,   unit: 'puff' },
  { id: 'cheekR',     label: 'Cheek R',    min: 0,   max: 1,   default: 0,   unit: 'puff' },
  { id: 'noseFlare',  label: 'Nose',       min: 0,   max: 1,   default: 0,   unit: ''     },
  { id: 'headTiltX',  label: 'Head Tilt',  min: -30, max: 30,  default: 0,   unit: 'deg'  },
  { id: 'headTurnY',  label: 'Head Turn',  min: -45, max: 45,  default: 0,   unit: 'deg'  },
  { id: 'jawOpen',    label: 'Jaw',        min: 0,   max: 1,   default: 0,   unit: 'open' },
  { id: 'tongue',     label: 'Tongue',     min: 0,   max: 1,   default: 0,   unit: ''     },
];

export function defaultFacialState() {
  return Object.fromEntries(FACIAL_PARAMS.map(p => [p.id, p.default]));
}

// blend two facial states (a + b weighted)
export function blendFacial(a, b, weight = 0.5) {
  const result = {};
  FACIAL_PARAMS.forEach(({ id }) => {
    const va = a[id] ?? 0;
    const vb = b[id] ?? 0;
    result[id] = va * (1 - weight) + vb * weight;
  });
  return result;
}

// clamp all values to min/max
export function clampFacial(state) {
  const result = {};
  FACIAL_PARAMS.forEach(({ id, min, max }) => {
    result[id] = Math.max(min, Math.min(max, state[id] ?? 0));
  });
  return result;
}

// expression presets (same as triggers but here for sliders panel)
export const FACE_PRESETS = {
  neutral:   { eyebrowL:0,  eyebrowR:0,  mouthCurl:0,    mouthOpen:0,   eyeL:1,   eyeR:1   },
  happy:     { eyebrowL:5,  eyebrowR:5,  mouthCurl:0.8,  mouthOpen:0.3, cheekL:0.4, cheekR:0.4 },
  sad:       { eyebrowL:-8, eyebrowR:-8, mouthCurl:-0.7, mouthOpen:0.1, eyeL:0.8, eyeR:0.8 },
  angry:     { eyebrowL:-5, eyebrowR:-5, mouthCurl:-0.4, mouthOpen:0.2, eyeL:0.9, eyeR:0.9 },
  surprised: { eyebrowL:12, eyebrowR:12, mouthCurl:0,    mouthOpen:0.9, eyeL:1,   eyeR:1   },
  wink:      { eyebrowL:3,  eyebrowR:0,  mouthCurl:0.5,  mouthOpen:0.1, eyeL:0,   eyeR:1   },
  thinking:  { eyebrowL:8,  eyebrowR:-2, mouthCurl:0.1,  mouthOpen:0,   headTiltX:8 },
  disgusted: { eyebrowL:-3, eyebrowR:-3, mouthCurl:-0.3, noseFlare:0.6, eyeL:0.7, eyeR:0.7 },
};

// smooth transition between states
export class FacialAnimator {
  constructor(onUpdate) {
    this.current  = defaultFacialState();
    this.target   = defaultFacialState();
    this.onUpdate = onUpdate;
    this._raf     = null;
    this.speed    = 0.12; // lerp speed per frame
  }

  setTarget(state) {
    this.target = { ...this.target, ...state };
    this._ensureRunning();
  }

  applyPreset(name) {
    const preset = FACE_PRESETS[name];
    if (preset) this.setTarget(preset);
  }

  _ensureRunning() {
    if (!this._raf) this._tick();
  }

  _tick() {
    let needsUpdate = false;
    FACIAL_PARAMS.forEach(({ id }) => {
      const cur = this.current[id] ?? 0;
      const tgt = this.target[id]  ?? 0;
      const diff = tgt - cur;
      if (Math.abs(diff) > 0.001) {
        this.current[id] = cur + diff * this.speed;
        needsUpdate = true;
      } else {
        this.current[id] = tgt;
      }
    });

    if (needsUpdate) {
      this.onUpdate({ ...this.current });
      this._raf = requestAnimationFrame(() => this._tick());
    } else {
      this._raf = null;
    }
  }

  stop() {
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = null;
  }

  getState() { return { ...this.current }; }
}
