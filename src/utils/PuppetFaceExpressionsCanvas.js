// PuppetFaceExpressionsCanvas.js — canvas drawing for face expressions
export function drawExpressionOnCharacter(ctx, expression, headX, headY, headSize) {
  const { jawOpen=0, leftBlink=0, rightBlink=0, browRaise=0, smile=0 } = expression;
  const r = headSize / 2;
  const eyeY   = headY - r * 0.15;
  const leftX  = headX - r * 0.3;
  const rightX = headX + r * 0.3;

  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.ellipse(leftX,  eyeY, r*0.12, Math.max(0.01, r*0.12*(1-leftBlink*0.95)),  0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(rightX, eyeY, r*0.12, Math.max(0.01, r*0.12*(1-rightBlink*0.95)), 0, 0, Math.PI*2); ctx.fill();

  if (leftBlink < 0.7)  { ctx.fillStyle='#222'; ctx.beginPath(); ctx.arc(leftX,  eyeY, r*0.06, 0, Math.PI*2); ctx.fill(); }
  if (rightBlink < 0.7) { ctx.fillStyle='#222'; ctx.beginPath(); ctx.arc(rightX, eyeY, r*0.06, 0, Math.PI*2); ctx.fill(); }

  ctx.strokeStyle='#333'; ctx.lineWidth=r*0.06;
  const browY = eyeY - r*0.22 - browRaise*r*0.1;
  ctx.beginPath(); ctx.moveTo(leftX-r*0.15, browY); ctx.lineTo(leftX+r*0.15, browY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(rightX-r*0.15, browY); ctx.lineTo(rightX+r*0.15, browY); ctx.stroke();

  const mouthY = headY + r*0.3, mouthW = r*0.4, mouthH = jawOpen*r*0.4;
  ctx.strokeStyle='#cc3333'; ctx.lineWidth=r*0.05;
  if (jawOpen > 0.05) {
    ctx.fillStyle='#cc2200'; ctx.beginPath(); ctx.ellipse(headX, mouthY, mouthW, mouthH, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.moveTo(headX-mouthW, mouthY); ctx.quadraticCurveTo(headX, mouthY+smile*r*0.15, headX+mouthW, mouthY); ctx.stroke();
  }
}
