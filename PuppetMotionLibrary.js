// =============================================================================
// PuppetMotionLibrary.js — Pre-built Motion Library
// =============================================================================
// Curated motion clips that can be applied to any character.
// Each motion is a timed keyframe sequence.
// =============================================================================

export const MOTION_LIBRARY = [
  {
    id: 'walk_loop',
    name: 'Walk Cycle',
    category: 'locomotion',
    duration: 1.0,
    loop: true,
    thumbnail: '🚶',
    keyframes: [
      { t:0,    joints: { shoulderL:{rot:-20}, shoulderR:{rot:20},  kneeL:{rot:15},  kneeR:{rot:-15} } },
      { t:0.25, joints: { shoulderL:{rot:0},   shoulderR:{rot:0},   kneeL:{rot:0},   kneeR:{rot:0}   } },
      { t:0.5,  joints: { shoulderL:{rot:20},  shoulderR:{rot:-20}, kneeL:{rot:-15}, kneeR:{rot:15}  } },
      { t:0.75, joints: { shoulderL:{rot:0},   shoulderR:{rot:0},   kneeL:{rot:0},   kneeR:{rot:0}   } },
    ]
  },
  {
    id: 'run_loop',
    name: 'Run Cycle',
    category: 'locomotion',
    duration: 0.5,
    loop: true,
    thumbnail: '🏃',
    keyframes: [
      { t:0,    joints: { shoulderL:{rot:-35}, shoulderR:{rot:35},  kneeL:{rot:30},  kneeR:{rot:-30}, chest:{rot:-5} } },
      { t:0.25, joints: { shoulderL:{rot:0},   shoulderR:{rot:0},   kneeL:{rot:0},   kneeR:{rot:0},   chest:{rot:5}  } },
      { t:0.5,  joints: { shoulderL:{rot:35},  shoulderR:{rot:-35}, kneeL:{rot:-30}, kneeR:{rot:30},  chest:{rot:-5} } },
    ]
  },
  {
    id: 'idle_breathe',
    name: 'Idle Breathe',
    category: 'idle',
    duration: 2.0,
    loop: true,
    thumbnail: '😌',
    keyframes: [
      { t:0,   joints: { chest:{dy:0},  head:{dy:0}  } },
      { t:1.0, joints: { chest:{dy:-3}, head:{dy:-1} } },
      { t:2.0, joints: { chest:{dy:0},  head:{dy:0}  } },
    ]
  },
  {
    id: 'wave_hello',
    name: 'Wave Hello',
    category: 'gesture',
    duration: 1.5,
    loop: false,
    thumbnail: '👋',
    keyframes: [
      { t:0,    joints: { shoulderR:{rot:0},   elbowR:{rot:0}   } },
      { t:0.3,  joints: { shoulderR:{rot:-70}, elbowR:{rot:20}  } },
      { t:0.6,  joints: { shoulderR:{rot:-65}, elbowR:{rot:-15} } },
      { t:0.9,  joints: { shoulderR:{rot:-70}, elbowR:{rot:20}  } },
      { t:1.2,  joints: { shoulderR:{rot:-65}, elbowR:{rot:-15} } },
      { t:1.5,  joints: { shoulderR:{rot:0},   elbowR:{rot:0}   } },
    ]
  },
  {
    id: 'jump',
    name: 'Jump',
    category: 'action',
    duration: 0.8,
    loop: false,
    thumbnail: '⬆️',
    keyframes: [
      { t:0,    joints: { hip:{dy:5},   kneeL:{rot:20},  kneeR:{rot:20}  } },
      { t:0.2,  joints: { hip:{dy:-25}, kneeL:{rot:-15}, kneeR:{rot:-15} } },
      { t:0.4,  joints: { hip:{dy:-35}, kneeL:{rot:0},   kneeR:{rot:0}   } },
      { t:0.6,  joints: { hip:{dy:-10}, kneeL:{rot:10},  kneeR:{rot:10}  } },
      { t:0.8,  joints: { hip:{dy:0},   kneeL:{rot:0},   kneeR:{rot:0}   } },
    ]
  },
  {
    id: 'sit_down',
    name: 'Sit Down',
    category: 'pose',
    duration: 0.5,
    loop: false,
    thumbnail: '🪑',
    keyframes: [
      { t:0,   joints: { hip:{dy:0},  kneeL:{rot:0},  kneeR:{rot:0},  chest:{rot:0} } },
      { t:0.5, joints: { hip:{dy:20}, kneeL:{rot:90}, kneeR:{rot:90}, chest:{rot:5} } },
    ]
  },
  {
    id: 'dance_basic',
    name: 'Dance Basic',
    category: 'dance',
    duration: 1.0,
    loop: true,
    thumbnail: '💃',
    keyframes: [
      { t:0,    joints: { chest:{dy:0,  rot:5},  shoulderL:{rot:-10}, shoulderR:{rot:10},  hip:{rot:-5} } },
      { t:0.25, joints: { chest:{dy:-5, rot:0},  shoulderL:{rot:10},  shoulderR:{rot:-10}, hip:{rot:5}  } },
      { t:0.5,  joints: { chest:{dy:0,  rot:-5}, shoulderL:{rot:-10}, shoulderR:{rot:10},  hip:{rot:-5} } },
      { t:0.75, joints: { chest:{dy:-5, rot:0},  shoulderL:{rot:10},  shoulderR:{rot:-10}, hip:{rot:5}  } },
    ]
  },
  {
    id: 'shake_head',
    name: 'Shake Head',
    category: 'gesture',
    duration: 0.8,
    loop: false,
    thumbnail: '🙅',
    keyframes: [
      { t:0,    joints: { head:{rot:0}   } },
      { t:0.2,  joints: { head:{rot:-20} } },
      { t:0.4,  joints: { head:{rot:20}  } },
      { t:0.6,  joints: { head:{rot:-15} } },
      { t:0.8,  joints: { head:{rot:0}   } },
    ]
  },
  {
    id: 'nod',
    name: 'Nod Yes',
    category: 'gesture',
    duration: 0.6,
    loop: false,
    thumbnail: '✅',
    keyframes: [
      { t:0,   joints: { head:{dy:0}  } },
      { t:0.2, joints: { head:{dy:8}  } },
      { t:0.4, joints: { head:{dy:-3} } },
      { t:0.6, joints: { head:{dy:0}  } },
    ]
  },
  {
    id: 'shrug',
    name: 'Shrug',
    category: 'gesture',
    duration: 0.8,
    loop: false,
    thumbnail: '🤷',
    keyframes: [
      { t:0,   joints: { shoulderL:{dy:0},   shoulderR:{dy:0},   chest:{dy:0}  } },
      { t:0.4, joints: { shoulderL:{dy:-12}, shoulderR:{dy:-12}, chest:{dy:-4} } },
      { t:0.8, joints: { shoulderL:{dy:0},   shoulderR:{dy:0},   chest:{dy:0}  } },
    ]
  },
];

export function getByCategory(cat) {
  return MOTION_LIBRARY.filter(m => m.category === cat);
}

export function getCategories() {
  return [...new Set(MOTION_LIBRARY.map(m => m.category))];
}

// ── interpolate between two keyframes ────────────────────────────────────────
export function interpolateKeyframes(kfA, kfB, t) {
  const result = {};
  const allJoints = new Set([
    ...Object.keys(kfA.joints || {}),
    ...Object.keys(kfB.joints || {}),
  ]);
  allJoints.forEach(joint => {
    const a = kfA.joints?.[joint] || {};
    const b = kfB.joints?.[joint] || {};
    result[joint] = {};
    const allProps = new Set([...Object.keys(a), ...Object.keys(b)]);
    allProps.forEach(prop => {
      const va = a[prop] ?? 0;
      const vb = b[prop] ?? 0;
      result[joint][prop] = va + (vb - va) * t;
    });
  });
  return result;
}

// ── motion player ─────────────────────────────────────────────────────────────
export class MotionPlayer {
  constructor(onFrame) {
    this.onFrame  = onFrame;
    this.current  = null;
    this._raf     = null;
    this._startT  = null;
  }

  play(motionId) {
    const motion = MOTION_LIBRARY.find(m => m.id === motionId);
    if (!motion) return;
    this.stop();
    this.current = motion;
    this._startT = performance.now();
    this._tick();
  }

  _tick() {
    const motion   = this.current;
    const elapsed  = (performance.now() - this._startT) / 1000;
    const duration = motion.duration;
    let   t        = elapsed % duration;
    if (!motion.loop && elapsed >= duration) {
      this.stop();
      return;
    }

    // find surrounding keyframes
    const kfs = motion.keyframes;
    let kfA = kfs[0], kfB = kfs[kfs.length - 1];
    for (let i = 0; i < kfs.length - 1; i++) {
      if (t >= kfs[i].t && t <= kfs[i+1].t) {
        kfA = kfs[i];
        kfB = kfs[i+1];
        break;
      }
    }
    const span   = kfB.t - kfA.t || 0.001;
    const alpha  = Math.max(0, Math.min(1, (t - kfA.t) / span));
    const frame  = interpolateKeyframes(kfA, kfB, alpha);
    this.onFrame(frame, motion.id);

    this._raf = requestAnimationFrame(() => this._tick());
  }

  stop() {
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf    = null;
    this.current = null;
  }

  isPlaying() { return !!this.current; }
}
