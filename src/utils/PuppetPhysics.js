// PuppetPhysics.js — Physics UPGRADE
// SPX Puppet | StreamPireX
// Features: spring chains, wind, collision, secondary motion, jiggle bones, verlet integration

// ─── Verlet Spring Chain ──────────────────────────────────────────────────────

export function createPhysicsLayer(points, options = {}) {
  const { stiffness=0.3, damping=0.85, gravity=0.3, windX=0, windY=0, colliders=[] } = options;
  return {
    points: points.map(p => ({
      ...p, vx: 0, vy: 0,
      px: p.x, py: p.y, // previous position (verlet)
      pinned: p.pinned || false,
      mass: p.mass ?? 1.0,
    })),
    stiffness, damping, gravity, windX, windY, colliders,
    restPositions: points.map(p => ({ x: p.x, y: p.y })),
    constraints: [], // distance constraints between non-adjacent points
  };
}

export function stepPhysicsLayer(layer, dt = 1/60) {
  const pts = layer.points.map(p => ({ ...p }));
  const { stiffness, damping, gravity, windX, windY, colliders } = layer;

  pts.forEach((p, i) => {
    if (p.pinned) return;

    // Verlet integration
    const ax = (windX + (layer.restPositions[i].x - p.x) * stiffness) / p.mass;
    const ay = (gravity + windY + (layer.restPositions[i].y - p.y) * stiffness) / p.mass;

    const newX = p.x + (p.x - p.px) * damping + ax * dt * dt * 3600;
    const newY = p.y + (p.y - p.py) * damping + ay * dt * dt * 3600;

    p.px = p.x; p.py = p.y;
    p.x = newX; p.y = newY;

    // Collider response
    colliders.forEach(c => {
      if (c.type === 'circle') {
        const dx = p.x - c.x, dy = p.y - c.y;
        const d = Math.sqrt(dx*dx + dy*dy);
        if (d < c.radius) {
          const norm = d || 1;
          p.x = c.x + (dx/norm) * c.radius;
          p.y = c.y + (dy/norm) * c.radius;
          p.px = p.x; p.py = p.y; // kill velocity at collision
        }
      } else if (c.type === 'ground') {
        if (p.y > c.y) { p.y = c.y; p.py = p.y + (p.py - p.y) * 0.3; } // bounce
      }
    });
  });

  // Constraint solving (distance constraints)
  for (let iter = 0; iter < 3; iter++) {
    layer.constraints.forEach(({ a, b, restLen }) => {
      const pa = pts[a], pb = pts[b];
      if (!pa || !pb) return;
      const dx = pb.x - pa.x, dy = pb.y - pa.y;
      const d = Math.sqrt(dx*dx + dy*dy) || 0.001;
      const diff = (d - restLen) / d * 0.5;
      if (!pa.pinned) { pa.x += dx * diff; pa.y += dy * diff; }
      if (!pb.pinned) { pb.x -= dx * diff; pb.y -= dy * diff; }
    });
  }

  return { ...layer, points: pts };
}

// ─── Wind System ─────────────────────────────────────────────────────────────

export function createWindSystem(options = {}) {
  const { baseStrengthX = 0, baseStrengthY = 0, gustFreq = 0.5, gustAmplitude = 0.5 } = options;
  let time = 0;

  return {
    update(dt) {
      time += dt;
      const gust = Math.sin(time * gustFreq * Math.PI * 2) * gustAmplitude;
      const turbulence = (Math.random() - 0.5) * 0.1;
      return {
        x: baseStrengthX + gust + turbulence,
        y: baseStrengthY + Math.cos(time * gustFreq * 0.7 * Math.PI * 2) * gustAmplitude * 0.3,
      };
    },
    setBaseWind(x, y) { options.baseStrengthX = x; options.baseStrengthY = y; },
  };
}

// ─── Jiggle Bone ─────────────────────────────────────────────────────────────

export function createJiggleBone(options = {}) {
  const { stiffness = 0.2, damping = 0.8, maxStretch = 0.3 } = options;
  let vel = { x: 0, y: 0 };
  let pos = null;

  return {
    update(targetX, targetY, dt = 1/60) {
      if (!pos) { pos = { x: targetX, y: targetY }; return pos; }

      const springX = (targetX - pos.x) * stiffness;
      const springY = (targetY - pos.y) * stiffness;

      vel.x = (vel.x + springX) * damping;
      vel.y = (vel.y + springY) * damping;

      pos.x += vel.x;
      pos.y += vel.y;

      // Clamp max stretch
      const dx = pos.x - targetX, dy = pos.y - targetY;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist > maxStretch) {
        const scale = maxStretch / dist;
        pos.x = targetX + dx * scale;
        pos.y = targetY + dy * scale;
      }

      return { ...pos };
    },
    reset() { pos = null; vel = { x: 0, y: 0 }; },
  };
}

// ─── Secondary Motion (follow-through) ───────────────────────────────────────

export function createSecondaryMotion(options = {}) {
  const { lag = 0.15, overshoot = 0.1 } = options;
  let prev = null, velocity = { x: 0, y: 0 };

  return {
    update(primaryX, primaryY) {
      if (!prev) { prev = { x: primaryX, y: primaryY }; return prev; }

      // Spring-damper toward primary with overshoot
      const dx = primaryX - prev.x;
      const dy = primaryY - prev.y;

      velocity.x = velocity.x * (1 - lag) + dx * lag;
      velocity.y = velocity.y * (1 - lag) + dy * lag;

      prev.x += velocity.x;
      prev.y += velocity.y;

      return {
        x: prev.x + velocity.x * overshoot,
        y: prev.y + velocity.y * overshoot,
      };
    },
    reset() { prev = null; velocity = { x: 0, y: 0 }; },
  };
}

// ─── Cloth / Hair presets ─────────────────────────────────────────────────────

export function createHairPhysics(points) {
  return createPhysicsLayer(points, { stiffness: 0.08, damping: 0.92, gravity: 0.4 });
}

export function createClothPhysics(points) {
  return createPhysicsLayer(points, { stiffness: 0.15, damping: 0.88, gravity: 0.25 });
}

export function createLooseCloth(points) {
  return createPhysicsLayer(points, { stiffness: 0.05, damping: 0.95, gravity: 0.2 });
}

export default { createPhysicsLayer, stepPhysicsLayer, createWindSystem, createJiggleBone, createSecondaryMotion, createHairPhysics, createClothPhysics };

export function applyWindToLayer(layer, windX, windY) {
  return { ...layer, windX, windY };
}

export function applyWindToLayer(layer, windX, windY) {
  return { ...layer, windX, windY };
}
