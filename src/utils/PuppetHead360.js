
// PuppetHead360.js — 360 degree head turn via sprite swapping
export const HEAD_ANGLES = {
  front:      { range: [-22, 22],   label: 'Front' },
  halfLeft:   { range: [-67, -22],  label: 'Half Left' },
  fullLeft:   { range: [-180, -67], label: 'Full Left' },
  halfRight:  { range: [22, 67],    label: 'Half Right' },
  fullRight:  { range: [67, 180],   label: 'Full Right' },
};

export function getHeadAngle(leftEar, rightEar, nose) {
  if (!leftEar || !rightEar || !nose) return 0;
  // Estimate yaw from ear visibility difference + nose position
  const earDiff = rightEar.x - leftEar.x;
  const noseCenter = nose.x - (leftEar.x + rightEar.x) / 2;
  return Math.atan2(noseCenter, Math.abs(earDiff) + 0.01) * (180 / Math.PI);
}

export function getHeadDirection(angleDeg) {
  for (const [dir, { range }] of Object.entries(HEAD_ANGLES)) {
    if (angleDeg >= range[0] && angleDeg < range[1]) return dir;
  }
  return 'front';
}

export function createHead360Rig(sprites = {}) {
  // sprites: { front, halfLeft, fullLeft, halfRight, fullRight }
  return { sprites, currentDirection: 'front', angle: 0 };
}

export function updateHead360(head360Rig, poseLandmarks, faceLandmarks) {
  if (!poseLandmarks) return head360Rig;
  const nose     = poseLandmarks[0];
  const leftEar  = poseLandmarks[7];
  const rightEar = poseLandmarks[8];
  const angle    = getHeadAngle(leftEar, rightEar, nose);
  const dir      = getHeadDirection(angle);
  return { ...head360Rig, angle, currentDirection: dir };
}

export function drawHead360(ctx, head360Rig, x, y, size) {
  const { sprites, currentDirection } = head360Rig;
  const sprite = sprites[currentDirection] || sprites.front;
  if (sprite && sprite.complete) {
    ctx.drawImage(sprite, x - size/2, y - size/2, size, size);
  } else {
    // Fallback: draw direction indicator
    ctx.fillStyle = '#00ffc8';
    ctx.font = `${size * 0.4}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText({ front:'😊', halfLeft:'😏', fullLeft:'😤', halfRight:'🙄', fullRight:'😒' }[currentDirection] || '😊', x, y + size*0.15);
  }
}
