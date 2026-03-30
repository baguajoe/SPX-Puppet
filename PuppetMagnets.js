// =============================================================================
// PuppetMagnets.js — Magnet / Snap System
// =============================================================================
// Snap limbs to scene objects (grab a door handle, sit in a chair, hold a mic)
// Each magnet has a position, radius, and target joint.
// =============================================================================

export class MagnetSystem {
  constructor() {
    this.magnets = [];   // [{ id, x, y, radius, joint, label, active, snapStrength }]
    this.snapped = {};   // joint → magnetId
  }

  addMagnet({ x, y, radius = 30, joint = 'wristR', label = 'Magnet', snapStrength = 1.0 }) {
    const id = `mag_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
    this.magnets.push({ id, x, y, radius, joint, label, active: true, snapStrength });
    return id;
  }

  removeMagnet(id) {
    this.magnets = this.magnets.filter(m => m.id !== id);
    // release any snapped joints
    Object.entries(this.snapped).forEach(([joint, mid]) => {
      if (mid === id) delete this.snapped[joint];
    });
  }

  updateMagnet(id, props) {
    const m = this.magnets.find(m => m.id === id);
    if (m) Object.assign(m, props);
  }

  // call each frame with current joint positions
  // returns { jointName: { x, y } } overrides
  tick(jointPositions) {
    const overrides = {};

    this.magnets.forEach(magnet => {
      if (!magnet.active) return;
      const pos = jointPositions[magnet.joint];
      if (!pos) return;

      const dx   = magnet.x - pos.x;
      const dy   = magnet.y - pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < magnet.radius) {
        // within snap zone — apply pull
        const strength = magnet.snapStrength;
        if (dist < magnet.radius * 0.3) {
          // full snap
          overrides[magnet.joint] = { x: magnet.x, y: magnet.y };
          this.snapped[magnet.joint] = magnet.id;
        } else {
          // partial pull
          const t = 1 - (dist / magnet.radius);
          overrides[magnet.joint] = {
            x: pos.x + dx * t * strength,
            y: pos.y + dy * t * strength,
          };
        }
      } else if (this.snapped[magnet.joint] === magnet.id) {
        // was snapped, now out of range — release
        delete this.snapped[magnet.joint];
      }
    });

    return overrides;
  }

  isSnapped(joint) { return !!this.snapped[joint]; }
  getSnappedMagnet(joint) { return this.snapped[joint] ? this.magnets.find(m => m.id === this.snapped[joint]) : null; }

  // scene object presets
  static chairPreset(x, y) {
    return [
      { x: x - 20, y: y, radius: 35, joint: 'kneeL',  label: 'Chair L', snapStrength: 0.8 },
      { x: x + 20, y: y, radius: 35, joint: 'kneeR',  label: 'Chair R', snapStrength: 0.8 },
      { x: x,      y: y - 60, radius: 30, joint: 'hip', label: 'Seat',  snapStrength: 0.9 },
    ];
  }

  static micPreset(x, y) {
    return [
      { x, y, radius: 40, joint: 'wristR', label: 'Mic', snapStrength: 1.0 },
    ];
  }

  static doorHandlePreset(x, y) {
    return [
      { x, y, radius: 35, joint: 'wristR', label: 'Door Handle', snapStrength: 1.0 },
    ];
  }

  static deskPreset(x, y) {
    return [
      { x: x - 30, y, radius: 40, joint: 'wristL', label: 'Desk L', snapStrength: 0.7 },
      { x: x + 30, y, radius: 40, joint: 'wristR', label: 'Desk R', snapStrength: 0.7 },
    ];
  }

  serialize() { return this.magnets; }
  deserialize(data) { this.magnets = data; }
}
