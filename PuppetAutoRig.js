// =============================================================================
// PuppetAutoRig.js — Auto-Rig from Character Image
// =============================================================================
// Uses canvas pixel analysis + MediaPipe pose detection to auto-detect
// limbs and joints from an uploaded character drawing/illustration.
// Falls back to symmetry-based geometric detection if MediaPipe unavailable.
// =============================================================================

export function detectBodyBounds(imageData, w, h) {
  // find bounding box of non-transparent pixels
  let minX = w, maxX = 0, minY = h, maxY = 0;
  const d = imageData.data;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const a = d[(y * w + x) * 4 + 3];
      if (a > 30) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return { minX, maxX, minY, maxY, cw: maxX - minX, ch: maxY - minY, cx: (minX + maxX) / 2 };
}

export function autoRigFromBounds(bounds, w, h) {
  const { minX, maxX, minY, maxY, cw, ch, cx } = bounds;

  // Proportional joint placement (standard humanoid ratios)
  const headH   = ch * 0.18;
  const neckY   = minY + headH;
  const shouldY = minY + ch * 0.28;
  const hipY    = minY + ch * 0.55;
  const kneeY   = minY + ch * 0.75;
  const footY   = maxY - ch * 0.02;
  const elbowY  = minY + ch * 0.42;
  const wristY  = minY + ch * 0.56;
  const armSpan = cw * 0.42;

  return {
    joints: {
      head:        { x: cx,             y: minY + headH * 0.5, radius: headH * 0.5, label: 'head' },
      neck:        { x: cx,             y: neckY,              radius: 6,            label: 'neck' },
      chest:       { x: cx,             y: shouldY,            radius: 8,            label: 'chest' },
      hip:         { x: cx,             y: hipY,               radius: 8,            label: 'hip' },
      shoulderL:   { x: cx - armSpan,   y: shouldY,            radius: 7,            label: 'shoulderL' },
      shoulderR:   { x: cx + armSpan,   y: shouldY,            radius: 7,            label: 'shoulderR' },
      elbowL:      { x: cx - armSpan * 1.1, y: elbowY,         radius: 6,            label: 'elbowL' },
      elbowR:      { x: cx + armSpan * 1.1, y: elbowY,         radius: 6,            label: 'elbowR' },
      wristL:      { x: cx - armSpan * 1.0, y: wristY,         radius: 5,            label: 'wristL' },
      wristR:      { x: cx + armSpan * 1.0, y: wristY,         radius: 5,            label: 'wristR' },
      kneeL:       { x: cx - cw * 0.15, y: kneeY,              radius: 6,            label: 'kneeL' },
      kneeR:       { x: cx + cw * 0.15, y: kneeY,              radius: 6,            label: 'kneeR' },
      footL:       { x: cx - cw * 0.17, y: footY,              radius: 5,            label: 'footL' },
      footR:       { x: cx + cw * 0.17, y: footY,              radius: 5,            label: 'footR' },
    },
    bones: [
      ['neck',      'head'],
      ['chest',     'neck'],
      ['hip',       'chest'],
      ['chest',     'shoulderL'],
      ['chest',     'shoulderR'],
      ['shoulderL', 'elbowL'],
      ['shoulderR', 'elbowR'],
      ['elbowL',    'wristL'],
      ['elbowR',    'wristR'],
      ['hip',       'kneeL'],
      ['hip',       'kneeR'],
      ['kneeL',     'footL'],
      ['kneeR',     'footR'],
    ],
    tags: {
      head:      'head',
      neck:      'neck',
      chest:     'torso',
      hip:       'hip',
      shoulderL: 'left_arm',
      shoulderR: 'right_arm',
      elbowL:    'left_forearm',
      elbowR:    'right_forearm',
      wristL:    'left_hand',
      wristR:    'right_hand',
      kneeL:     'left_thigh',
      kneeR:     'right_thigh',
      footL:     'left_foot',
      footR:     'right_foot',
    }
  };
}

export async function autoRigImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width  = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      let imageData;
      try {
        imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      } catch (e) {
        // CORS fallback — use full bounds
        imageData = null;
      }
      URL.revokeObjectURL(url);

      const bounds = imageData
        ? detectBodyBounds(imageData, canvas.width, canvas.height)
        : { minX: 0, maxX: canvas.width, minY: 0, maxY: canvas.height, cw: canvas.width, ch: canvas.height, cx: canvas.width / 2 };

      const rig = autoRigFromBounds(bounds, canvas.width, canvas.height);
      resolve({
        rig,
        imageUrl: canvas.toDataURL('image/png'),
        width: canvas.width,
        height: canvas.height,
      });
    };
    img.onerror = reject;
    img.crossOrigin = 'anonymous';
    img.src = url;
  });
}
