
// PuppetIK.js — inverse kinematics for hands/feet planting

export function createIKChain(joints, { iterations=10, tolerance=0.01 } = {}) {
  return { joints: joints.map(j => ({ ...j })), iterations, tolerance };
}

export function solveFABRIK(chain, targetX, targetY) {
  const pts = chain.joints.map(j => ({ x:j.x, y:j.y }));
  const lengths = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const dx = pts[i+1].x - pts[i].x;
    const dy = pts[i+1].y - pts[i].y;
    lengths.push(Math.sqrt(dx*dx + dy*dy));
  }
  const root = { x: pts[0].x, y: pts[0].y };
  for (let iter = 0; iter < chain.iterations; iter++) {
    // Forward pass
    pts[pts.length-1] = { x: targetX, y: targetY };
    for (let i = pts.length-2; i >= 0; i--) {
      const dx = pts[i].x - pts[i+1].x;
      const dy = pts[i].y - pts[i+1].y;
      const d  = Math.sqrt(dx*dx + dy*dy) || 0.001;
      pts[i] = { x: pts[i+1].x + dx/d * lengths[i], y: pts[i+1].y + dy/d * lengths[i] };
    }
    // Backward pass
    pts[0] = { ...root };
    for (let i = 0; i < pts.length-1; i++) {
      const dx = pts[i+1].x - pts[i].x;
      const dy = pts[i+1].y - pts[i].y;
      const d  = Math.sqrt(dx*dx + dy*dy) || 0.001;
      pts[i+1] = { x: pts[i].x + dx/d * lengths[i], y: pts[i].y + dy/d * lengths[i] };
    }
    const ex = pts[pts.length-1].x - targetX;
    const ey = pts[pts.length-1].y - targetY;
    if (Math.sqrt(ex*ex + ey*ey) < chain.tolerance) break;
  }
  return { ...chain, joints: pts };
}

export function createArmIK(shoulderX, shoulderY, upperLen=60, lowerLen=55) {
  return createIKChain([
    { x: shoulderX, y: shoulderY },
    { x: shoulderX, y: shoulderY + upperLen },
    { x: shoulderX, y: shoulderY + upperLen + lowerLen },
  ]);
}

export function createLegIK(hipX, hipY, upperLen=70, lowerLen=65) {
  return createIKChain([
    { x: hipX, y: hipY },
    { x: hipX, y: hipY + upperLen },
    { x: hipX, y: hipY + upperLen + lowerLen },
  ]);
}

export function drawIKChain(ctx, chain, color='#00ffc8', width=3) {
  const pts = chain.joints;
  if (pts.length < 2) return;
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.stroke();
  pts.forEach(p => { ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI*2); ctx.fillStyle = '#FF6600'; ctx.fill(); });
}
