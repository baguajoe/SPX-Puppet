
// PuppetRig.js — joint system, bone hierarchy, deformation math

export const JOINT_NAMES = [
  'head','neck','leftShoulder','rightShoulder',
  'leftElbow','rightElbow','leftWrist','rightWrist',
  'torso','hips',
  'leftKnee','rightKnee','leftAnkle','rightAnkle',
];

// MediaPipe Pose landmark index → puppet joint
export const MP_TO_JOINT = {
  0:  'head',
  11: 'leftShoulder',  12: 'rightShoulder',
  13: 'leftElbow',     14: 'rightElbow',
  15: 'leftWrist',     16: 'rightWrist',
  23: 'hips',
  25: 'leftKnee',      26: 'rightKnee',
  27: 'leftAnkle',     28: 'rightAnkle',
};

export function createRig(imageWidth, imageHeight) {
  // Default T-pose joint positions (normalized 0-1)
  return {
    joints: {
      head:          { x: 0.5,  y: 0.08, visible: true },
      neck:          { x: 0.5,  y: 0.18, visible: true },
      leftShoulder:  { x: 0.35, y: 0.25, visible: true },
      rightShoulder: { x: 0.65, y: 0.25, visible: true },
      leftElbow:     { x: 0.25, y: 0.42, visible: true },
      rightElbow:    { x: 0.75, y: 0.42, visible: true },
      leftWrist:     { x: 0.18, y: 0.58, visible: true },
      rightWrist:    { x: 0.82, y: 0.58, visible: true },
      torso:         { x: 0.5,  y: 0.45, visible: true },
      hips:          { x: 0.5,  y: 0.62, visible: true },
      leftKnee:      { x: 0.4,  y: 0.76, visible: true },
      rightKnee:     { x: 0.6,  y: 0.76, visible: true },
      leftAnkle:     { x: 0.38, y: 0.92, visible: true },
      rightAnkle:    { x: 0.62, y: 0.92, visible: true },
    },
    bones: [
      ['head','neck'],
      ['neck','leftShoulder'],['neck','rightShoulder'],
      ['leftShoulder','leftElbow'],['leftElbow','leftWrist'],
      ['rightShoulder','rightElbow'],['rightElbow','rightWrist'],
      ['neck','torso'],['torso','hips'],
      ['hips','leftKnee'],['leftKnee','leftAnkle'],
      ['hips','rightKnee'],['rightKnee','rightAnkle'],
    ],
    imageWidth,
    imageHeight,
  };
}

export function updateRigFromPose(rig, poseLandmarks, canvasWidth, canvasHeight) {
  if (!poseLandmarks || !rig) return rig;
  const updated = { ...rig, joints: { ...rig.joints } };

  Object.entries(MP_TO_JOINT).forEach(([idx, jointName]) => {
    const lm = poseLandmarks[parseInt(idx)];
    if (!lm || (lm.visibility !== undefined && lm.visibility < 0.3)) return;
    updated.joints[jointName] = {
      x: lm.x,
      y: lm.y,
      visible: true,
    };
  });

  // Derive neck from shoulders
  const ls = updated.joints.leftShoulder;
  const rs = updated.joints.rightShoulder;
  if (ls && rs) {
    updated.joints.neck = { x: (ls.x + rs.x) / 2, y: (ls.y + rs.y) / 2 - 0.05, visible: true };
  }

  // Derive torso from shoulders + hips
  const hips = updated.joints.hips;
  const neck = updated.joints.neck;
  if (hips && neck) {
    updated.joints.torso = { x: (hips.x + neck.x) / 2, y: (hips.y + neck.y) / 2, visible: true };
  }

  return updated;
}

export function getBoneAngle(rig, boneA, boneB) {
  const a = rig.joints[boneA];
  const b = rig.joints[boneB];
  if (!a || !b) return 0;
  return Math.atan2(b.y - a.y, b.x - a.x);
}

export function getJointScreenPos(rig, jointName, canvasW, canvasH) {
  const j = rig.joints[jointName];
  if (!j) return null;
  return { x: j.x * canvasW, y: j.y * canvasH };
}

export function serializeRig(rig) {
  return JSON.stringify(rig);
}

export function deserializeRig(json) {
  return JSON.parse(json);
}
