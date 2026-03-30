// =============================================================================
// PuppetCharacterLibrary.js — Built-in Characters + Sprite Sheet I/O
// =============================================================================

// ── built-in character templates ─────────────────────────────────────────────
export const BUILT_IN_CHARACTERS = [
  {
    id: 'char_reporter',
    name: 'News Reporter',
    category: 'professional',
    thumbnail: '📺',
    style: 'realistic',
    joints: {
      head:      { x: 200, y: 80,  radius: 40 },
      neck:      { x: 200, y: 135, radius: 8  },
      chest:     { x: 200, y: 175, radius: 12 },
      hip:       { x: 200, y: 250, radius: 12 },
      shoulderL: { x: 145, y: 165, radius: 10 },
      shoulderR: { x: 255, y: 165, radius: 10 },
      elbowL:    { x: 125, y: 220, radius: 8  },
      elbowR:    { x: 275, y: 220, radius: 8  },
      wristL:    { x: 115, y: 270, radius: 6  },
      wristR:    { x: 285, y: 270, radius: 6  },
      kneeL:     { x: 175, y: 330, radius: 8  },
      kneeR:     { x: 225, y: 330, radius: 8  },
      footL:     { x: 165, y: 400, radius: 6  },
      footR:     { x: 235, y: 400, radius: 6  },
    },
    color: '#2a5caa',
    skinTone: '#f4c28b',
  },
  {
    id: 'char_cartoon',
    name: 'Cartoon Hero',
    category: 'cartoon',
    thumbnail: '🦸',
    style: 'cartoon',
    joints: {
      head:      { x: 200, y: 70,  radius: 50 },
      neck:      { x: 200, y: 130, radius: 10 },
      chest:     { x: 200, y: 175, radius: 15 },
      hip:       { x: 200, y: 255, radius: 13 },
      shoulderL: { x: 135, y: 160, radius: 12 },
      shoulderR: { x: 265, y: 160, radius: 12 },
      elbowL:    { x: 110, y: 220, radius: 10 },
      elbowR:    { x: 290, y: 220, radius: 10 },
      wristL:    { x: 100, y: 275, radius: 8  },
      wristR:    { x: 300, y: 275, radius: 8  },
      kneeL:     { x: 170, y: 340, radius: 10 },
      kneeR:     { x: 230, y: 340, radius: 10 },
      footL:     { x: 160, y: 415, radius: 8  },
      footR:     { x: 240, y: 415, radius: 8  },
    },
    color: '#e63946',
    skinTone: '#f4a261',
  },
  {
    id: 'char_anime',
    name: 'Anime Character',
    category: 'anime',
    thumbnail: '✨',
    style: 'anime',
    joints: {
      head:      { x: 200, y: 68,  radius: 44 },
      neck:      { x: 200, y: 125, radius: 7  },
      chest:     { x: 200, y: 165, radius: 11 },
      hip:       { x: 200, y: 240, radius: 11 },
      shoulderL: { x: 148, y: 158, radius: 9  },
      shoulderR: { x: 252, y: 158, radius: 9  },
      elbowL:    { x: 128, y: 210, radius: 7  },
      elbowR:    { x: 272, y: 210, radius: 7  },
      wristL:    { x: 118, y: 258, radius: 5  },
      wristR:    { x: 282, y: 258, radius: 5  },
      kneeL:     { x: 176, y: 320, radius: 7  },
      kneeR:     { x: 224, y: 320, radius: 7  },
      footL:     { x: 168, y: 395, radius: 5  },
      footR:     { x: 232, y: 395, radius: 5  },
    },
    color: '#9b5de5',
    skinTone: '#ffe0b2',
  },
  {
    id: 'char_robot',
    name: 'Robot',
    category: 'sci-fi',
    thumbnail: '🤖',
    style: 'mechanical',
    joints: {
      head:      { x: 200, y: 75,  radius: 42 },
      neck:      { x: 200, y: 128, radius: 10 },
      chest:     { x: 200, y: 178, radius: 18 },
      hip:       { x: 200, y: 258, radius: 14 },
      shoulderL: { x: 138, y: 162, radius: 13 },
      shoulderR: { x: 262, y: 162, radius: 13 },
      elbowL:    { x: 112, y: 220, radius: 11 },
      elbowR:    { x: 288, y: 220, radius: 11 },
      wristL:    { x: 102, y: 272, radius: 9  },
      wristR:    { x: 298, y: 272, radius: 9  },
      kneeL:     { x: 172, y: 342, radius: 11 },
      kneeR:     { x: 228, y: 342, radius: 11 },
      footL:     { x: 162, y: 418, radius: 9  },
      footR:     { x: 238, y: 418, radius: 9  },
    },
    color: '#457b9d',
    skinTone: '#a8dadc',
  },
  {
    id: 'char_animal',
    name: 'Animal Character',
    category: 'animal',
    thumbnail: '🐾',
    style: 'cartoon',
    joints: {
      head:      { x: 200, y: 72,  radius: 48 },
      neck:      { x: 200, y: 132, radius: 9  },
      chest:     { x: 200, y: 172, radius: 13 },
      hip:       { x: 200, y: 248, radius: 13 },
      shoulderL: { x: 142, y: 162, radius: 11 },
      shoulderR: { x: 258, y: 162, radius: 11 },
      elbowL:    { x: 118, y: 215, radius: 9  },
      elbowR:    { x: 282, y: 215, radius: 9  },
      wristL:    { x: 108, y: 264, radius: 7  },
      wristR:    { x: 292, y: 264, radius: 7  },
      kneeL:     { x: 173, y: 330, radius: 9  },
      kneeR:     { x: 227, y: 330, radius: 9  },
      footL:     { x: 163, y: 405, radius: 7  },
      footR:     { x: 237, y: 405, radius: 7  },
    },
    color: '#e9c46a',
    skinTone: '#f4a261',
  },
];

export function getCategories() {
  return [...new Set(BUILT_IN_CHARACTERS.map(c => c.category))];
}

export function getByCategory(cat) {
  return BUILT_IN_CHARACTERS.filter(c => c.category === cat);
}

// ── sprite sheet export ───────────────────────────────────────────────────────
export function exportSpriteSheet(frames, frameW, frameH, cols = 8) {
  const rows   = Math.ceil(frames.length / cols);
  const canvas = document.createElement('canvas');
  canvas.width  = frameW * cols;
  canvas.height = frameH * rows;
  const ctx = canvas.getContext('2d');

  frames.forEach((frameCanvas, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    ctx.drawImage(frameCanvas, col * frameW, row * frameH, frameW, frameH);
  });

  return canvas;
}

// ── sprite sheet import ───────────────────────────────────────────────────────
export async function importSpriteSheet(file, frameW, frameH) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const cols   = Math.floor(img.naturalWidth  / frameW);
      const rows   = Math.floor(img.naturalHeight / frameH);
      const frames = [];

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const fc  = document.createElement('canvas');
          fc.width  = frameW;
          fc.height = frameH;
          const ctx = fc.getContext('2d');
          ctx.drawImage(img, c * frameW, r * frameH, frameW, frameH, 0, 0, frameW, frameH);
          frames.push(fc.toDataURL('image/png'));
        }
      }
      URL.revokeObjectURL(url);
      resolve({ frames, cols, rows, total: frames.length });
    };
    img.onerror = reject;
    img.src     = url;
  });
}

// ── bone template presets ─────────────────────────────────────────────────────
export const BONE_TEMPLATES = {
  humanoid: {
    name: 'Humanoid (G3)',
    description: 'Standard human proportions — works with auto-rig',
    boneCount: 14,
  },
  quadruped: {
    name: 'Quadruped',
    description: 'Four-legged animal skeleton',
    boneCount: 16,
  },
  bird: {
    name: 'Bird / Winged',
    description: 'Wings instead of arms',
    boneCount: 12,
  },
  snake: {
    name: 'Serpentine',
    description: 'Spine chain for snake/worm characters',
    boneCount: 20,
  },
};
