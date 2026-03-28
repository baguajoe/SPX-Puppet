
// PuppetImporter.js — load PNG/SVG/GLB, auto-segment into body part layers

export const BODY_PARTS = ['head','torso','leftArm','rightArm','leftLeg','rightLeg','leftHand','rightHand','leftFoot','rightFoot'];

export function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ img, url, width: img.width, height: img.height, name: file.name });
    img.onerror = reject;
    img.src = url;
  });
}

export function autoSegmentCharacter(img, joints) {
  // Create canvas for the full image
  const canvas = document.createElement('canvas');
  canvas.width = img.width; canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  const W = img.width, H = img.height;

  // Define body part bounding boxes based on joint positions (normalized)
  const parts = {};
  const pad = 0.08;

  const region = (name, x1, y1, x2, y2) => {
    const cx = Math.max(0, Math.floor(x1 * W));
    const cy = Math.max(0, Math.floor(y1 * H));
    const cw = Math.min(W - cx, Math.ceil((x2 - x1) * W));
    const ch = Math.min(H - cy, Math.ceil((y2 - y1) * H));
    if (cw <= 0 || ch <= 0) return null;
    const partCanvas = document.createElement('canvas');
    partCanvas.width = cw; partCanvas.height = ch;
    const pCtx = partCanvas.getContext('2d');
    pCtx.drawImage(canvas, cx, cy, cw, ch, 0, 0, cw, ch);
    return { canvas: partCanvas, x: cx, y: cy, w: cw, h: ch, name };
  };

  const j = joints;
  parts.head    = region('head',    0.3, 0.0, 0.7, 0.2);
  parts.torso   = region('torso',   0.25, 0.18, 0.75, 0.65);
  parts.leftArm = region('leftArm', 0.0, 0.2, 0.35, 0.65);
  parts.rightArm= region('rightArm',0.65, 0.2, 1.0, 0.65);
  parts.leftLeg = region('leftLeg', 0.15, 0.6, 0.5, 1.0);
  parts.rightLeg= region('rightLeg',0.5, 0.6, 0.85, 1.0);

  return parts;
}

export function createCharacterFromImage(img, name = 'Character') {
  return {
    id: crypto.randomUUID(),
    name,
    image: img,
    parts: null, // populated after segmentation
    rig: null,   // populated after rig creation
    position: { x: 0, y: 0 },
    scale: 1,
    rotation: 0,
    visible: true,
    opacity: 1,
  };
}

export function createBuiltinCharacter(type = 'stick') {
  return {
    id: crypto.randomUUID(),
    name: type === 'stick' ? 'Stick Figure' : 'Shape Character',
    image: null,
    builtin: type,
    parts: null,
    rig: null,
    position: { x: 0.5, y: 0.5 },
    scale: 1,
    rotation: 0,
    visible: true,
    opacity: 1,
  };
}
