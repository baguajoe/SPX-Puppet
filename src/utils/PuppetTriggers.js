// =============================================================================
// PuppetTriggers.js — Replay / Trigger System
// =============================================================================
// Assign animations, expressions, sounds to keyboard keys.
// Fire on demand during live performance or recording.
// =============================================================================

export const DEFAULT_TRIGGERS = [
  { key: '1', label: 'Wave',       action: 'cycle:wave',       color: '#00ffc8' },
  { key: '2', label: 'Jump',       action: 'cycle:jump',       color: '#00ffc8' },
  { key: '3', label: 'Sit',        action: 'cycle:sit',        color: '#00ffc8' },
  { key: '4', label: 'Walk',       action: 'cycle:walk',       color: '#FF6600' },
  { key: '5', label: 'Run',        action: 'cycle:run',        color: '#FF6600' },
  { key: '6', label: 'Talk',       action: 'cycle:talk',       color: '#FF6600' },
  { key: '7', label: 'Happy',      action: 'expr:happy',       color: '#ffdd00' },
  { key: '8', label: 'Sad',        action: 'expr:sad',         color: '#ffdd00' },
  { key: '9', label: 'Angry',      action: 'expr:angry',       color: '#ff4444' },
  { key: '0', label: 'Surprised',  action: 'expr:surprised',   color: '#ff4444' },
  { key: 'q', label: 'Wink',       action: 'expr:wink',        color: '#aa88ff' },
  { key: 'w', label: 'Thinking',   action: 'expr:thinking',    color: '#aa88ff' },
];

export const EXPRESSION_PRESETS = {
  happy:     { eyebrowL: 5,  eyebrowR: 5,  mouthCurl: 0.8,  mouthOpen: 0.3, cheekL: 0.4, cheekR: 0.4 },
  sad:       { eyebrowL: -8, eyebrowR: -8, mouthCurl: -0.7, mouthOpen: 0.1, cheekL: 0,   cheekR: 0   },
  angry:     { eyebrowL: -5, eyebrowR: -5, mouthCurl: -0.4, mouthOpen: 0.2, cheekL: 0.2, cheekR: 0.2 },
  surprised: { eyebrowL: 10, eyebrowR: 10, mouthCurl: 0,    mouthOpen: 0.9, cheekL: 0.1, cheekR: 0.1 },
  wink:      { eyebrowL: 3,  eyebrowR: 0,  mouthCurl: 0.5,  mouthOpen: 0.1, eyeL: 0,     eyeR: 1     },
  thinking:  { eyebrowL: 8,  eyebrowR: -2, mouthCurl: 0.1,  mouthOpen: 0,   cheekL: 0,   cheekR: 0   },
  neutral:   { eyebrowL: 0,  eyebrowR: 0,  mouthCurl: 0,    mouthOpen: 0,   cheekL: 0,   cheekR: 0   },
};

export class TriggerEngine {
  constructor({ onCycle, onExpression, onStatus } = {}) {
    this.triggers    = [...DEFAULT_TRIGGERS];
    this.onCycle     = onCycle     || (() => {});
    this.onExpression= onExpression|| (() => {});
    this.onStatus    = onStatus    || (() => {});
    this._handler    = null;
    this._active     = false;
  }

  start() {
    if (this._active) return;
    this._active = true;
    this._handler = (e) => {
      // ignore when typing in inputs
      if (['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)) return;
      this.fire(e.key.toLowerCase());
    };
    window.addEventListener('keydown', this._handler);
  }

  stop() {
    if (this._handler) window.removeEventListener('keydown', this._handler);
    this._active  = false;
    this._handler = null;
  }

  fire(key) {
    const trigger = this.triggers.find(t => t.key === key);
    if (!trigger) return;

    const [type, name] = trigger.action.split(':');
    if (type === 'cycle') {
      this.onCycle(name);
      this.onStatus(`▶ ${trigger.label}`);
    } else if (type === 'expr') {
      const preset = EXPRESSION_PRESETS[name];
      if (preset) {
        this.onExpression(preset);
        this.onStatus(`😊 ${trigger.label}`);
      }
    }
  }

  setTrigger(index, trigger) {
    this.triggers[index] = { ...this.triggers[index], ...trigger };
  }

  addTrigger(trigger) {
    this.triggers.push(trigger);
  }

  removeTrigger(index) {
    this.triggers.splice(index, 1);
  }

  serialize() { return this.triggers; }
  deserialize(data) { this.triggers = data; }
}
