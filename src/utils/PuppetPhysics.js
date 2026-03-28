
// PuppetPhysics.js — physics for hair/cloth layers (spring simulation)

export function createPhysicsLayer(points, { stiffness=0.3, damping=0.85, gravity=0.3 } = {}) {
  return {
    points: points.map(p => ({ ...p, vx:0, vy:0, pinned: p.pinned || false })),
    stiffness, damping, gravity,
    restPositions: points.map(p => ({ x:p.x, y:p.y })),
  };
}

export function stepPhysicsLayer(layer, dt = 1/60) {
  const pts = layer.points;
  pts.forEach((p, i) => {
    if (p.pinned) return;
    // Gravity
    p.vy += layer.gravity * dt * 60;
    // Spring toward rest position
    const rx = layer.restPositions[i].x;
    const ry = layer.restPositions[i].y;
    p.vx += (rx - p.x) * layer.stiffness;
    p.vy += (ry - p.y) * layer.stiffness;
    // Damping
    p.vx *= layer.damping;
    p.vy *= layer.damping;
    // Integrate
    p.x += p.vx * dt * 60;
    p.y += p.vy * dt * 60;
  });
  return { ...layer, points: [...pts] };
}

export function applyWindToLayer(layer, { strength=0.02, time=0 } = {}) {
  layer.points.forEach(p => {
    if (!p.pinned) {
      p.vx += Math.sin(time * 2 + p.y * 5) * strength;
      p.vy += Math.cos(time * 3 + p.x * 5) * strength * 0.3;
    }
  });
  return layer;
}

export function drawPhysicsLayer(ctx, layer, color='#8b6914', width=3) {
  const pts = layer.points;
  if (pts.length < 2) return;
  ctx.strokeStyle = color; ctx.lineWidth = width;
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) {
    ctx.lineTo(pts[i].x, pts[i].y);
  }
  ctx.stroke();
}

export function createHairLayer(anchorX, anchorY, segments=8, length=60) {
  const points = [];
  for (let i = 0; i <= segments; i++) {
    points.push({ x: anchorX, y: anchorY + (i * length / segments), pinned: i === 0 });
  }
  return createPhysicsLayer(points, { stiffness:0.15, damping:0.88, gravity:0.15 });
}

export function createCapeLayer(anchorX, anchorY, width=80, segments=6) {
  const points = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    points.push({ x: anchorX - width/2 + t*width, y: anchorY, pinned: true });
  }
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    points.push({ x: anchorX - width/2 + t*width, y: anchorY + 80, pinned: false });
  }
  return createPhysicsLayer(points, { stiffness:0.1, damping:0.9, gravity:0.2 });
}
