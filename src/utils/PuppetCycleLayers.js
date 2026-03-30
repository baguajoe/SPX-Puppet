// =============================================================================
// PuppetCycleLayers.js — Animation Cycle Engine
// =============================================================================
// Walk, run, idle, blink, talk cycles that trigger from motion/keyboard/state.
// Each cycle is a keyframe sequence that loops.
// =============================================================================

// ── cycle definitions ─────────────────────────────────────────────────────────
// Each frame: { joint: { dx, dy, rotation }, duration_ms }

export const CYCLES = {

  idle: {
    fps: 2,
    loop: true,
    frames: [
      { chest: { dy: 0,  rot: 0   }, head: { dy: 0,  rot: 0   } },
      { chest: { dy: -2, rot: 0   }, head: { dy: -1, rot: 0   } },
      { chest: { dy: 0,  rot: 0   }, head: { dy: 0,  rot: 0   } },
      { chest: { dy: 1,  rot: 0   }, head: { dy: 0,  rot: 0   } },
    ]
  },

  walk: {
    fps: 8,
    loop: true,
    frames: [
      { shoulderL:{rot:-20}, shoulderR:{rot:20},  kneeL:{rot:15},  kneeR:{rot:-15}, chest:{dy:0}  },
      { shoulderL:{rot:-10}, shoulderR:{rot:10},  kneeL:{rot:5},   kneeR:{rot:-5},  chest:{dy:-3} },
      { shoulderL:{rot:0},   shoulderR:{rot:0},   kneeL:{rot:0},   kneeR:{rot:0},   chest:{dy:0}  },
      { shoulderL:{rot:10},  shoulderR:{rot:-10}, kneeL:{rot:-5},  kneeR:{rot:5},   chest:{dy:-3} },
      { shoulderL:{rot:20},  shoulderR:{rot:-20}, kneeL:{rot:-15}, kneeR:{rot:15},  chest:{dy:0}  },
      { shoulderL:{rot:10},  shoulderR:{rot:-10}, kneeL:{rot:-5},  kneeR:{rot:5},   chest:{dy:-3} },
      { shoulderL:{rot:0},   shoulderR:{rot:0},   kneeL:{rot:0},   kneeR:{rot:0},   chest:{dy:0}  },
      { shoulderL:{rot:-10}, shoulderR:{rot:10},  kneeL:{rot:5},   kneeR:{rot:-5},  chest:{dy:-3} },
    ]
  },

  run: {
    fps: 12,
    loop: true,
    frames: [
      { shoulderL:{rot:-35}, shoulderR:{rot:35},  kneeL:{rot:30},  kneeR:{rot:-30}, chest:{dy:0,  rot:-5} },
      { shoulderL:{rot:-15}, shoulderR:{rot:15},  kneeL:{rot:10},  kneeR:{rot:-10}, chest:{dy:-5, rot:0}  },
      { shoulderL:{rot:0},   shoulderR:{rot:0},   kneeL:{rot:0},   kneeR:{rot:0},   chest:{dy:0,  rot:5}  },
      { shoulderL:{rot:15},  shoulderR:{rot:-15}, kneeL:{rot:-10}, kneeR:{rot:10},  chest:{dy:-5, rot:0}  },
      { shoulderL:{rot:35},  shoulderR:{rot:-35}, kneeL:{rot:-30}, kneeR:{rot:30},  chest:{dy:0,  rot:-5} },
      { shoulderL:{rot:15},  shoulderR:{rot:-15}, kneeL:{rot:-10}, kneeR:{rot:10},  chest:{dy:-5, rot:0}  },
    ]
  },

  blink: {
    fps: 24,
    loop: false,
    frames: [
      { eyeL: { scale: 1.0 }, eyeR: { scale: 1.0 } },
      { eyeL: { scale: 0.5 }, eyeR: { scale: 0.5 } },
      { eyeL: { scale: 0.1 }, eyeR: { scale: 0.1 } },
      { eyeL: { scale: 0.5 }, eyeR: { scale: 0.5 } },
      { eyeL: { scale: 1.0 }, eyeR: { scale: 1.0 } },
    ]
  },

  talk: {
    fps: 12,
    loop: true,
    frames: [
      { mouth: { open: 0.0 }, head: { rot: 0   } },
      { mouth: { open: 0.6 }, head: { rot: 2   } },
      { mouth: { open: 0.3 }, head: { rot: 0   } },
      { mouth: { open: 0.8 }, head: { rot: -2  } },
      { mouth: { open: 0.2 }, head: { rot: 0   } },
      { mouth: { open: 0.5 }, head: { rot: 1   } },
    ]
  },

  wave: {
    fps: 8,
    loop: true,
    frames: [
      { shoulderR: { rot: -60 }, elbowR: { rot: 20  } },
      { shoulderR: { rot: -70 }, elbowR: { rot: -10 } },
      { shoulderR: { rot: -60 }, elbowR: { rot: 20  } },
      { shoulderR: { rot: -70 }, elbowR: { rot: -10 } },
    ]
  },

  sit: {
    fps: 1,
    loop: false,
    frames: [
      { hip: { dy: 20 }, kneeL: { rot: 90 }, kneeR: { rot: 90 }, chest: { rot: 5 } },
    ]
  },

  jump: {
    fps: 12,
    loop: false,
    frames: [
      { hip: { dy: 5  }, kneeL: { rot: 20  }, kneeR: { rot: 20  }, chest: { dy: 0  } },
      { hip: { dy: -20}, kneeL: { rot: -10 }, kneeR: { rot: -10 }, chest: { dy: -5 } },
      { hip: { dy: -30}, kneeL: { rot: 0   }, kneeR: { rot: 0   }, chest: { dy: -8 } },
      { hip: { dy: -20}, kneeL: { rot: 5   }, kneeR: { rot: 5   }, chest: { dy: -5 } },
      { hip: { dy: 0  }, kneeL: { rot: 15  }, kneeR: { rot: 15  }, chest: { dy: 0  } },
      { hip: { dy: 5  }, kneeL: { rot: 20  }, kneeR: { rot: 20  }, chest: { dy: 2  } },
      { hip: { dy: 0  }, kneeL: { rot: 0   }, kneeR: { rot: 0   }, chest: { dy: 0  } },
    ]
  },
};

// ── cycle player ──────────────────────────────────────────────────────────────
export class CyclePlayer {
  constructor() {
    this.active    = {};   // cycleName → { frame, timer, intervalId }
    this.listeners = [];
  }

  on(fn) { this.listeners.push(fn); }
  emit(name, frame) { this.listeners.forEach(fn => fn(name, frame)); }

  play(name) {
    if (this.active[name]) return;
    const cycle = CYCLES[name];
    if (!cycle) return;

    let frame = 0;
    const ms  = 1000 / cycle.fps;

    const tick = () => {
      this.emit(name, cycle.frames[frame]);
      frame++;
      if (frame >= cycle.frames.length) {
        if (cycle.loop) {
          frame = 0;
        } else {
          this.stop(name);
          return;
        }
      }
    };

    tick();
    const id = setInterval(tick, ms);
    this.active[name] = { frame, intervalId: id };
  }

  stop(name) {
    if (!this.active[name]) return;
    clearInterval(this.active[name].intervalId);
    delete this.active[name];
  }

  stopAll() {
    Object.keys(this.active).forEach(n => this.stop(n));
  }

  isPlaying(name) { return !!this.active[name]; }

  toggle(name) {
    this.isPlaying(name) ? this.stop(name) : this.play(name);
  }
}

// Auto-blink: fires blink every 3-6 seconds
export function startAutoBlink(player) {
  const fire = () => {
    player.play('blink');
    setTimeout(fire, 3000 + Math.random() * 3000);
  };
  setTimeout(fire, 2000 + Math.random() * 2000);
}
