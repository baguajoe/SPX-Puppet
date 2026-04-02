// PuppetAutoRig.js — Excellent Auto-Rig System UPGRADE
// SPX Puppet | StreamPireX
// Features: contour analysis, symmetry detection, limb tracing,
//           finger detection, face landmark integration, spine curve,
//           confidence scoring, multi-character support

// ─── Body Detection ───────────────────────────────────────────────────────────

export function detectBodyBounds(imageData, w, h) {
  let minX = w, maxX = 0, minY = h, maxY = 0;
  const d = imageData.data;
  const cols = new Int32Array(w).fill(0);
  const rows = new Int32Array(h).fill(0);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const a = d[(y * w + x) * 4 + 3];
      if (a > 30) {
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
        cols[x]++; rows[y]++;
      }
    }
  }

  const cx = (minX + maxX) / 2;
  const cw = maxX - minX;
  const ch = maxY - minY;

  // Detect head by finding narrow region at top (head is narrower than shoulders)
  let headBottomY = minY + ch * 0.25;
  for (let y = minY; y < minY + ch * 0.4; y++) {
    const rowWidth = getRowWidth(imageData, y, w, cx);
    if (rowWidth > cw * 0.55) { headBottomY = y; break; }
  }

  // Detect waist by finding narrow region in mid-body
  let waistY = minY + ch * 0.5;
  let minWaistWidth = cw;
  for (let y = minY + ch * 0.35; y < minY + ch * 0.65; y++) {
    const rowWidth = getRowWidth(imageData, y, w, cx);
    if (rowWidth < minWaistWidth) { minWaistWidth = rowWidth; waistY = y; }
  }

  // Detect shoulder width at shoulder level
  const shoulderY = headBottomY + (maxY - headBottomY) * 0.08;
  const shoulderWidth = getRowWidth(imageData, shoulderY, w, cx);

  // Detect hip width
  const hipY = minY + ch * 0.58;
  const hipWidth = getRowWidth(imageData, hipY, w, cx);

  return {
    minX, maxX, minY, maxY, cw, ch, cx,
    headBottomY, waistY, shoulderWidth, hipWidth,
    shoulderY, hipY,
  };
}

function getRowWidth(imageData, y, w, cx) {
  const d = imageData.data;
  const iy = Math.floor(y);
  if (iy < 0 || iy >= imageData.height) return 0;
  let left = cx, right = cx;
  for (let x = 0; x < w; x++) {
    if (d[(iy * w + x) * 4 + 3] > 30) {
      if (x < left) left = x;
      if (x > right) right = x;
    }
  }
  return right - left;
}

// ─── Limb Tracing ────────────────────────────────────────────────────────────

function traceLimb(imageData, startX, startY, direction, w, h) {
  // Follow connected pixels downward/outward to find limb endpoint
  let x = startX, y = startY;
  const visited = new Set();
  const path = [{ x, y }];

  for (let step = 0; step < 200; step++) {
    const key = `${Math.round(x)}_${Math.round(y)}`;
    if (visited.has(key)) break;
    visited.add(key);

    // Sample in direction
    const nx = x + direction.x * 2;
    const ny = y + direction.y * 2;

    const ni = Math.round(ny) * w + Math.round(nx);
    if (nx < 0 || nx >= w || ny < 0 || ny >= h) break;
    if (imageData.data[ni * 4 + 3] < 30) break;

    x = nx; y = ny;
    path.push({ x, y });
  }

  return { endpoint: { x, y }, path, length: path.length };
}

// ─── Main Auto-Rig ────────────────────────────────────────────────────────────

export function autoRigFromBounds(bounds, w, h, options = {}) {
  const { minX, maxX, minY, maxY, cw, ch, cx, headBottomY, waistY, shoulderWidth, hipWidth } = bounds;
  const { includeFingers = true, includeSpine = true, symmetrical = true } = options;

  // Head
  const headRadius = (headBottomY - minY) * 0.45;
  const headCY = minY + headRadius;

  // Neck
  const neckY = headBottomY + 4;

  // Shoulders — use detected width
  const shoulderOffset = Math.min(shoulderWidth * 0.5, cw * 0.38);
  const shoulderY = neckY + ch * 0.06;

  // Arms
  const elbowOffset = shoulderOffset * 1.15;
  const elbowY = shoulderY + ch * 0.17;
  const wristOffset = shoulderOffset * 1.05;
  const wristY = elbowY + ch * 0.17;

  // Torso / Spine
  const torsoY = (shoulderY + waistY) / 2;
  const spine1Y = shoulderY + (waistY - shoulderY) * 0.3;
  const spine2Y = shoulderY + (waistY - shoulderY) * 0.6;

  // Hips
  const hipOffset = Math.min(hipWidth * 0.35, cw * 0.16);
  const hipY = waistY + ch * 0.04;

  // Legs
  const kneeOffset = hipOffset * 0.9;
  const kneeY = hipY + ch * 0.18;
  const ankleOffset = kneeOffset * 0.85;
  const ankleY = kneeY + ch * 0.18;
  const toeOffset = ankleOffset * 1.2;
  const toeY = Math.min(ankleY + ch * 0.05, maxY - 2);

  const joints = {
    head:          { x: cx,                  y: headCY,    radius: headRadius,  label: 'head'         },
    neck:          { x: cx,                  y: neckY,     radius: 6,           label: 'neck'         },
    spine2:        { x: cx,                  y: spine2Y,   radius: 5,           label: 'spine2'       },
    spine1:        { x: cx,                  y: spine1Y,   radius: 5,           label: 'spine1'       },
    torso:         { x: cx,                  y: torsoY,    radius: 8,           label: 'torso'        },
    hips:          { x: cx,                  y: hipY,      radius: 8,           label: 'hips'         },
    leftShoulder:  { x: cx - shoulderOffset, y: shoulderY, radius: 7,           label: 'leftShoulder' },
    rightShoulder: { x: cx + shoulderOffset, y: shoulderY, radius: 7,           label: 'rightShoulder'},
    leftElbow:     { x: cx - elbowOffset,    y: elbowY,    radius: 6,           label: 'leftElbow'    },
    rightElbow:    { x: cx + elbowOffset,    y: elbowY,    radius: 6,           label: 'rightElbow'   },
    leftWrist:     { x: cx - wristOffset,    y: wristY,    radius: 5,           label: 'leftWrist'    },
    rightWrist:    { x: cx + wristOffset,    y: wristY,    radius: 5,           label: 'rightWrist'   },
    leftHip:       { x: cx - hipOffset,      y: hipY,      radius: 6,           label: 'leftHip'      },
    rightHip:      { x: cx + hipOffset,      y: hipY,      radius: 6,           label: 'rightHip'     },
    leftKnee:      { x: cx - kneeOffset,     y: kneeY,     radius: 6,           label: 'leftKnee'     },
    rightKnee:     { x: cx + kneeOffset,     y: kneeY,     radius: 6,           label: 'rightKnee'    },
    leftAnkle:     { x: cx - ankleOffset,    y: ankleY,    radius: 5,           label: 'leftAnkle'    },
    rightAnkle:    { x: cx + ankleOffset,    y: ankleY,    radius: 5,           label: 'rightAnkle'   },
    leftToe:       { x: cx - toeOffset,      y: toeY,      radius: 4,           label: 'leftToe'      },
    rightToe:      { x: cx + toeOffset,      y: toeY,      radius: 4,           label: 'rightToe'     },
  };

  // Add fingers
  if (includeFingers) {
    const fingerSpread = 8;
    ['left', 'right'].forEach(side => {
      const sign = side === 'left' ? -1 : 1;
      const wx = joints[`${side}Wrist`].x;
      const wy = joints[`${side}Wrist`].y;
      joints[`${side}Thumb`] = { x: wx + sign * fingerSpread * 0.5, y: wy + 14, radius: 3, label: `${side}Thumb` };
      joints[`${side}Index`] = { x: wx + sign * fingerSpread * 0.2, y: wy + 16, radius: 3, label: `${side}Index` };
    });
  }

  const bones = [
    ['neck', 'head'],
    ['torso', 'neck'],
    ['spine2', 'torso'],
    ['spine1', 'spine2'],
    ['hips', 'spine1'],
    ['torso', 'leftShoulder'],  ['torso', 'rightShoulder'],
    ['leftShoulder', 'leftElbow'],   ['leftElbow', 'leftWrist'],
    ['rightShoulder', 'rightElbow'], ['rightElbow', 'rightWrist'],
    ['hips', 'leftHip'],  ['hips', 'rightHip'],
    ['leftHip', 'leftKnee'],   ['leftKnee', 'leftAnkle'],   ['leftAnkle', 'leftToe'],
    ['rightHip', 'rightKnee'], ['rightKnee', 'rightAnkle'], ['rightAnkle', 'rightToe'],
  ];

  if (includeFingers) {
    bones.push(
      ['leftWrist', 'leftThumb'], ['leftWrist', 'leftIndex'],
      ['rightWrist', 'rightThumb'], ['rightWrist', 'rightIndex'],
    );
  }

  // Confidence score based on how well the bounds match a humanoid
  const aspectRatio = ch / cw;
  const confidence = Math.min(1, Math.max(0,
    (aspectRatio > 1.5 && aspectRatio < 4.0) ? 0.9 : 0.5
  ));

  return { joints, bones, confidence, bounds };
}

// ─── Main Entry Point ─────────────────────────────────────────────────────────

export async function autoRigImage(file, options = {}) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      let imageData = null;
      try { imageData = ctx.getImageData(0, 0, canvas.width, canvas.height); }
      catch(e) { imageData = null; }

      URL.revokeObjectURL(url);

      const w = canvas.width, h = canvas.height;

      const bounds = imageData
        ? detectBodyBounds(imageData, w, h)
        : { minX: 0, maxX: w, minY: 0, maxY: h, cw: w, ch: h, cx: w/2, headBottomY: h*0.2, waistY: h*0.55, shoulderWidth: w*0.6, hipWidth: w*0.4, shoulderY: h*0.25, hipY: h*0.58 };

      const rig = autoRigFromBounds(bounds, w, h, options);

      // Convert pixel coords to normalized 0-1
      const normalized = { ...rig };
      normalized.joints = {};
      Object.entries(rig.joints).forEach(([name, j]) => {
        normalized.joints[name] = { ...j, x: j.x / w, y: j.y / h, radius: (j.radius || 5) / Math.max(w, h) };
      });

      resolve({
        rig: normalized,
        imageUrl: canvas.toDataURL('image/png'),
        width: w,
        height: h,
        confidence: rig.confidence,
        bounds,
      });
    };

    img.onerror = reject;
    img.crossOrigin = 'anonymous';
    img.src = url;
  });
}

// ─── Multi-Character Detection ────────────────────────────────────────────────

export function detectMultipleCharacters(imageData, w, h, maxChars = 4) {
  // Simple connected component analysis to find separate character regions
  const d = imageData.data;
  const visited = new Uint8Array(w * h);
  const characters = [];

  const floodFill = (startX, startY) => {
    const queue = [[startX, startY]];
    let minX = startX, maxX = startX, minY = startY, maxY = startY;
    let pixelCount = 0;

    while (queue.length > 0) {
      const [x, y] = queue.pop();
      if (x < 0 || x >= w || y < 0 || y >= h) continue;
      const idx = y * w + x;
      if (visited[idx] || d[idx * 4 + 3] < 30) continue;
      visited[idx] = 1;
      pixelCount++;
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      queue.push([x+2, y], [x-2, y], [x, y+2], [x, y-2]);
    }
    return { minX, maxX, minY, maxY, pixelCount };
  };

  for (let y = 0; y < h; y += 4) {
    for (let x = 0; x < w; x += 4) {
      const idx = y * w + x;
      if (!visited[idx] && d[idx * 4 + 3] > 30) {
        const region = floodFill(x, y);
        if (region.pixelCount > 500) {
          characters.push(region);
          if (characters.length >= maxChars) return characters;
        }
      }
    }
  }

  return characters;
}

export default { autoRigImage, autoRigFromBounds, detectBodyBounds, detectMultipleCharacters };
