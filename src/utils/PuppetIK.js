// PuppetIK.js — Inverse Kinematics UPGRADE
// SPX Puppet | StreamPireX
// Features: FABRIK 2D/3D, 2-bone analytic IK, joint constraints, angle limits, pole vectors

// ─── FABRIK 2D (existing, enhanced with constraints) ──────────────────────────

export function createIKChain(joints, options = {}) {
  return {
    joints: joints.map(j => ({
      x: j.x, y: j.y,
      minAngle: j.minAngle ?? -Math.PI,
      maxAngle: j.maxAngle ?? Math.PI,
      stiffness: j.stiffness ?? 0,
    })),
    iterations: options.iterations ?? 15,
    tolerance:  options.tolerance  ?? 0.5,
    constrainAngles: options.constrainAngles ?? false,
  };
}

export function solveFABRIK(chain, targetX, targetY) {
  const pts    = chain.joints.map(j => ({ x: j.x, y: j.y }));
  const joints = chain.joints;
  const lengths = [];

  for (let i = 0; i < pts.length - 1; i++) {
    lengths.push(dist2(pts[i], pts[i+1]));
  }

  const root = { x: pts[0].x, y: pts[0].y };
  const target = { x: targetX, y: targetY };

  // Check reach
  const totalLen = lengths.reduce((a, b) => a + b, 0);
  if (dist2(root, target) > totalLen) {
    // Fully extended toward target
    for (let i = 0; i < pts.length - 1; i++) {
      const d = dist2(pts[i], target);
      const t = lengths[i] / d;
      pts[i+1] = lerp2(pts[i], target, t);
    }
    return pts;
  }

  for (let iter = 0; iter < chain.iterations; iter++) {
    // Forward pass
    pts[pts.length - 1] = { ...target };
    for (let i = pts.length - 2; i >= 0; i--) {
      const d = dist2(pts[i+1], pts[i]) || 0.001;
      pts[i] = lerp2(pts[i+1], pts[i], lengths[i] / d);
    }

    // Backward pass
    pts[0] = { ...root };
    for (let i = 0; i < pts.length - 1; i++) {
      const d = dist2(pts[i], pts[i+1]) || 0.001;
      pts[i+1] = lerp2(pts[i], pts[i+1], lengths[i] / d);

      // Apply angle constraints
      if (chain.constrainAngles && i > 0) {
        const prevAngle = Math.atan2(pts[i].y - pts[i-1].y, pts[i].x - pts[i-1].x);
        let   currAngle = Math.atan2(pts[i+1].y - pts[i].y, pts[i+1].x - pts[i].x);
        const relAngle  = normalizeAngle(currAngle - prevAngle);
        const clamped   = Math.max(joints[i].minAngle, Math.min(joints[i].maxAngle, relAngle));
        if (Math.abs(clamped - relAngle) > 0.001) {
          const newAngle = prevAngle + clamped;
          pts[i+1] = {
            x: pts[i].x + Math.cos(newAngle) * lengths[i],
            y: pts[i].y + Math.sin(newAngle) * lengths[i],
          };
        }
      }
    }

    if (dist2(pts[pts.length-1], target) < chain.tolerance) break;
  }

  return pts;
}

// ─── 2-Bone Analytic IK (faster for arms/legs) ───────────────────────────────

export function solveTwoBoneIK(root, mid, end, target, poleAngle = 0) {
  const upperLen = dist2(root, mid);
  const lowerLen = dist2(mid, end);
  const totalLen = upperLen + lowerLen;
  const rootToTarget = dist2(root, target);

  const angle = Math.atan2(target.y - root.y, target.x - root.x);

  if (rootToTarget >= totalLen) {
    // Fully extended
    return {
      mid: { x: root.x + Math.cos(angle) * upperLen, y: root.y + Math.sin(angle) * upperLen },
      end: target,
    };
  }

  // Law of cosines
  const cosA = Math.max(-1, Math.min(1,
    (upperLen*upperLen + rootToTarget*rootToTarget - lowerLen*lowerLen) / (2 * upperLen * rootToTarget)
  ));
  const a1 = Math.acos(cosA);
  const midAngle = angle - a1 + poleAngle;

  const newMid = {
    x: root.x + Math.cos(midAngle) * upperLen,
    y: root.y + Math.sin(midAngle) * upperLen,
  };

  return { mid: newMid, end: target };
}

// ─── CCD (Cyclic Coordinate Descent) — better for spine chains ───────────────

export function solveCCD(points, lengths, targetX, targetY, iterations = 10) {
  const pts = points.map(p => ({ ...p }));
  const target = { x: targetX, y: targetY };

  for (let iter = 0; iter < iterations; iter++) {
    for (let i = pts.length - 2; i >= 0; i--) {
      const toEnd    = Math.atan2(pts[pts.length-1].y - pts[i].y, pts[pts.length-1].x - pts[i].x);
      const toTarget = Math.atan2(target.y - pts[i].y, target.x - pts[i].x);
      const delta    = normalizeAngle(toTarget - toEnd);

      // Rotate all joints from i+1 onward
      for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[j].x - pts[i].x;
        const dy = pts[j].y - pts[i].y;
        pts[j] = {
          x: pts[i].x + dx * Math.cos(delta) - dy * Math.sin(delta),
          y: pts[i].y + dx * Math.sin(delta) + dy * Math.cos(delta),
        };
      }
    }
    if (dist2(pts[pts.length-1], target) < 0.5) break;
  }
  return pts;
}

// ─── Joint Constraint Helpers ─────────────────────────────────────────────────

export function createJointConstraint(minAngleDeg, maxAngleDeg, axis = 'z') {
  return {
    min: (minAngleDeg * Math.PI) / 180,
    max: (maxAngleDeg * Math.PI) / 180,
    axis,
  };
}

export function applyJointConstraint(angle, constraint) {
  return Math.max(constraint.min, Math.min(constraint.max, normalizeAngle(angle)));
}

// Preset constraints for human puppet joints
export const HUMAN_CONSTRAINTS = {
  elbow:    createJointConstraint(0, 145),
  knee:     createJointConstraint(0, 160),
  shoulder: createJointConstraint(-90, 180),
  hip:      createJointConstraint(-30, 120),
  spine:    createJointConstraint(-20, 20),
  neck:     createJointConstraint(-45, 45),
  wrist:    createJointConstraint(-70, 70),
  ankle:    createJointConstraint(-40, 40),
};

// ─── Pole Vector ──────────────────────────────────────────────────────────────

export function computePoleAngle(root, poleTarget) {
  return Math.atan2(poleTarget.y - root.y, poleTarget.x - root.x);
}

// ─── Full IK Rig Solver ───────────────────────────────────────────────────────

export class PuppetIKRig {
  constructor() {
    this.chains = new Map();
  }

  addChain(name, joints, options = {}) {
    this.chains.set(name, createIKChain(joints, options));
  }

  solve(name, targetX, targetY, poleX = null, poleY = null) {
    const chain = this.chains.get(name);
    if (!chain) return null;

    if (chain.joints.length === 3 && poleX !== null) {
      const [root, mid, end] = chain.joints;
      const poleAngle = computePoleAngle(root, { x: poleX, y: poleY });
      return solveTwoBoneIK(root, mid, end, { x: targetX, y: targetY }, poleAngle);
    }

    return solveFABRIK(chain, targetX, targetY);
  }

  updateChainRoot(name, x, y) {
    const chain = this.chains.get(name);
    if (chain) { chain.joints[0].x = x; chain.joints[0].y = y; }
  }

  getChain(name) { return this.chains.get(name); }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function dist2(a, b) { return Math.sqrt((a.x-b.x)**2 + (a.y-b.y)**2); }
function lerp2(a, b, t) { return { x: a.x + (b.x-a.x)*t, y: a.y + (b.y-a.y)*t }; }
function normalizeAngle(a) { while (a > Math.PI) a -= Math.PI*2; while (a < -Math.PI) a += Math.PI*2; return a; }

export default { createIKChain, solveFABRIK, solveTwoBoneIK, solveCCD, PuppetIKRig, HUMAN_CONSTRAINTS };

export function createArmIK(shoulderX, shoulderY, upperLen = 80, lowerLen = 75) {
  return createIKChain([
    { x: shoulderX, y: shoulderY },
    { x: shoulderX + upperLen, y: shoulderY },
    { x: shoulderX + upperLen + lowerLen, y: shoulderY },
  ], { constrainAngles: true, iterations: 15 });
}

export function createLegIK(hipX, hipY, upperLen = 90, lowerLen = 85) {
  return createIKChain([
    { x: hipX, y: hipY },
    { x: hipX, y: hipY + upperLen },
    { x: hipX, y: hipY + upperLen + lowerLen },
  ], { constrainAngles: true, iterations: 15 });
}

export function drawIKChain(ctx, points, color = '#00ffc8', radius = 4) {
  if (!points?.length) return;
  ctx.strokeStyle = color; ctx.lineWidth = 2;
  for (let i = 0; i < points.length - 1; i++) {
    ctx.beginPath(); ctx.moveTo(points[i].x, points[i].y); ctx.lineTo(points[i+1].x, points[i+1].y); ctx.stroke();
  }
  points.forEach(p => { ctx.beginPath(); ctx.arc(p.x, p.y, radius, 0, Math.PI*2); ctx.fillStyle = color; ctx.fill(); });
}
