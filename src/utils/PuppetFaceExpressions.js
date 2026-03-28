
// PuppetFaceExpressions.js — FaceMesh landmarks → expressions

const loadScript = (src) => new Promise((res, rej) => {
  if (document.querySelector(`script[src="${src}"]`)) return res();
  const s = document.createElement('script');
  s.src = src; s.onload = res; s.onerror = rej;
  document.head.appendChild(s);
});

export const EXPRESSIONS = {
  neutral:   { jawOpen: 0,    leftBlink: 0,    rightBlink: 0,    browRaise: 0,    smile: 0 },
  happy:     { jawOpen: 0.15, leftBlink: 0,    rightBlink: 0,    browRaise: 0.3,  smile: 1 },
  surprised: { jawOpen: 0.6,  leftBlink: 0,    rightBlink: 0,    browRaise: 0.8,  smile: 0 },
  sad:       { jawOpen: 0,    leftBlink: 0,    rightBlink: 0,    browRaise: -0.3, smile: -0.5 },
  angry:     { jawOpen: 0.1,  leftBlink: 0,    rightBlink: 0,    browRaise: -0.5, smile: -0.3 },
  wink:      { jawOpen: 0,    leftBlink: 1,    rightBlink: 0,    browRaise: 0.2,  smile: 0.5 },
};

function dist(a, b) {
  return Math.sqrt((a.x-b.x)**2 + (a.y-b.y)**2);
}

export function extractExpression(faceLandmarks) {
  if (!faceLandmarks || faceLandmarks.length < 468) return EXPRESSIONS.neutral;
  const lms = faceLandmarks;
  const lipDist    = dist(lms[13], lms[14]);
  const eyeWidth   = dist(lms[33], lms[133]);
  const jawOpen    = Math.min(1, lipDist / (eyeWidth * 1.5 + 0.001));
  const leftEyeH   = dist(lms[159], lms[145]);
  const rightEyeH  = dist(lms[386], lms[374]);
  const leftEyeW   = dist(lms[33],  lms[133]);
  const rightEyeW  = dist(lms[263], lms[362]);
  const leftBlink  = 1 - Math.min(1, leftEyeH  / (leftEyeW  * 0.35 + 0.001));
  const rightBlink = 1 - Math.min(1, rightEyeH / (rightEyeW * 0.35 + 0.001));
  const browRaise  = Math.max(0, Math.min(1, (lms[159].y - lms[66].y) * 8));
  const mouthW     = dist(lms[61], lms[291]);
  const smile      = Math.max(-1, Math.min(1, (mouthW / (eyeWidth + 0.001) - 0.8) * 3));
  return { jawOpen, leftBlink, rightBlink, browRaise, smile };
}

export function createFaceExpressionEngine() {
  let faceMesh = null;
  let camera   = null;
  let running  = false;
  let current  = { ...EXPRESSIONS.neutral };

  return {
    async start(videoEl, onExpression) {
      await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js');
      await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');

      faceMesh = new window.FaceMesh({
        locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}`,
      });
      faceMesh.setOptions({ maxNumFaces:1, refineLandmarks:true, minDetectionConfidence:0.5, minTrackingConfidence:0.5 });
      faceMesh.onResults(results => {
        if (!results.multiFaceLandmarks?.[0]) return;
        current = extractExpression(results.multiFaceLandmarks[0]);
        onExpression?.(current, results.multiFaceLandmarks[0]);
      });

      camera = new window.Camera(videoEl, {
        onFrame: async () => { await faceMesh.send({ image: videoEl }); },
        width: 640, height: 480,
      });
      await camera.start();
      running = true;
    },

    stop() {
      camera?.stop(); camera = null; faceMesh = null; running = false;
      current = { ...EXPRESSIONS.neutral };
    },

    getCurrent() { return current; },
    isRunning()  { return running; },
  };
}

export function drawExpressionOnCharacter(ctx, expression, headX, headY, headSize) {
  const { jawOpen=0, leftBlink=0, rightBlink=0, browRaise=0, smile=0 } = expression;
  const r = headSize / 2;

  // Eyes
  const eyeY  = headY - r * 0.15;
  const leftX = headX - r * 0.3;
  const rightX= headX + r * 0.3;
  const eyeH  = r * 0.12 * (1 - leftBlink * 0.95);
  const eyeHR = r * 0.12 * (1 - rightBlink * 0.95);

  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.ellipse(leftX,  eyeY, r*0.12, eyeH,  0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(rightX, eyeY, r*0.12, eyeHR, 0, 0, Math.PI*2); ctx.fill();

  // Pupils
  if (leftBlink < 0.7) {
    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.arc(leftX,  eyeY, r*0.06, 0, Math.PI*2); ctx.fill();
  }
  if (rightBlink < 0.7) {
    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.arc(rightX, eyeY, r*0.06, 0, Math.PI*2); ctx.fill();
  }

  // Brows
  ctx.strokeStyle = '#333'; ctx.lineWidth = r * 0.06;
  const browY = eyeY - r * 0.22 - browRaise * r * 0.1;
  ctx.beginPath(); ctx.moveTo(leftX  - r*0.15, browY); ctx.lineTo(leftX  + r*0.15, browY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(rightX - r*0.15, browY); ctx.lineTo(rightX + r*0.15, browY); ctx.stroke();

  // Mouth
  const mouthY  = headY + r * 0.3;
  const mouthW  = r * 0.4;
  const mouthH  = jawOpen * r * 0.4;
  ctx.strokeStyle = '#cc3333'; ctx.lineWidth = r * 0.05;
  if (jawOpen > 0.05) {
    ctx.fillStyle = '#cc2200';
    ctx.beginPath();
    ctx.ellipse(headX, mouthY, mouthW, mouthH, 0, 0, Math.PI*2);
    ctx.fill(); ctx.stroke();
  } else {
    const smileAmt = smile * r * 0.15;
    ctx.beginPath();
    ctx.moveTo(headX - mouthW, mouthY);
    ctx.quadraticCurveTo(headX, mouthY + smileAmt, headX + mouthW, mouthY);
    ctx.stroke();
  }
}
