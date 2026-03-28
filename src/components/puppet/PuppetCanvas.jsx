
// PuppetCanvas.jsx — main 2D canvas, renders character + skeleton overlay
import React, { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { MOUTH_SHAPES } from '../../utils/PuppetLipSync.js';

function drawStickFigure(ctx, rig, w, h, mouthShape) {
  if (!rig) return;
  const j = rig.joints;
  const px = (name) => j[name] ? j[name].x * w : null;
  const py = (name) => j[name] ? j[name].y * h : null;

  // Bones
  ctx.strokeStyle = '#00ffc8'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  rig.bones.forEach(([a, b]) => {
    const ax = px(a), ay = py(a), bx = px(b), by = py(b);
    if (ax === null || bx === null) return;
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
  });

  // Joints
  ctx.fillStyle = '#FF6600';
  Object.values(j).forEach(joint => {
    ctx.beginPath();
    ctx.arc(joint.x * w, joint.y * h, 5, 0, Math.PI * 2);
    ctx.fill();
  });

  // Head circle
  const hx = px('head'), hy = py('head');
  if (hx !== null) {
    const r = w * 0.06;
    ctx.strokeStyle = '#00ffc8'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(hx, hy, r, 0, Math.PI * 2); ctx.stroke();

    // Eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(hx - r*0.3, hy - r*0.15, r*0.12, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(hx + r*0.3, hy - r*0.15, r*0.12, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(hx - r*0.3, hy - r*0.15, r*0.06, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(hx + r*0.3, hy - r*0.15, r*0.06, 0, Math.PI*2); ctx.fill();

    // Mouth
    const mo = mouthShape?.openness ?? 0;
    const mw = (mouthShape?.width ?? 1) * r * 0.5;
    ctx.strokeStyle = '#ff6b6b'; ctx.lineWidth = 2;
    ctx.beginPath();
    if (mo < 0.05) {
      ctx.arc(hx, hy + r * 0.3, mw, 0, Math.PI);
    } else {
      ctx.ellipse(hx, hy + r * 0.3, mw, mo * r * 0.8, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#cc2200';
      ctx.fill();
    }
    ctx.stroke();
  }
}

function drawImageCharacter(ctx, character, rig, w, h, mouthShape) {
  if (!character?.image) return;
  const img = character.image;
  const scale = character.scale || 1;
  const cx = (character.position?.x ?? 0.5) * w;
  const cy = (character.position?.y ?? 0.5) * h;
  const dw = img.width * scale;
  const dh = img.height * scale;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(character.rotation || 0);
  ctx.globalAlpha = character.opacity ?? 1;
  ctx.drawImage(img, -dw/2, -dh/2, dw, dh);
  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawSkeletonOverlay(ctx, rig, w, h, showSkeleton) {
  if (!rig || !showSkeleton) return;
  const j = rig.joints;

  ctx.strokeStyle = 'rgba(0,255,200,0.5)'; ctx.lineWidth = 1.5;
  rig.bones.forEach(([a, b]) => {
    const ja = j[a], jb = j[b];
    if (!ja || !jb) return;
    ctx.beginPath(); ctx.moveTo(ja.x * w, ja.y * h); ctx.lineTo(jb.x * w, jb.y * h); ctx.stroke();
  });

  Object.values(j).forEach(joint => {
    ctx.beginPath();
    ctx.arc(joint.x * w, joint.y * h, 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,102,0,0.8)'; ctx.fill();
  });
}

const PuppetCanvas = forwardRef(function PuppetCanvas(
  { characters = [], activeRig, mouthShape, expression, showSkeleton = true, showGrid = true, scene, onCanvasReady },
  ref
) {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);

  useImperativeHandle(ref, () => ({
    getCanvas: () => canvasRef.current,
    getDataURL: () => canvasRef.current?.toDataURL('image/png'),
  }));

  useEffect(() => {
    if (canvasRef.current && onCanvasReady) onCanvasReady(canvasRef.current);
  }, [onCanvasReady]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    // Scene background
    if (scene && scene.gradient) {
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      scene.gradient.forEach((color, i) => grad.addColorStop(i / (scene.gradient.length - 1), color));
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = (scene && scene.bg) || '#06060f';
    }
    ctx.fillRect(0, 0, W, H);

    // Floor line
    if (scene && scene.showFloor) {
      ctx.strokeStyle = scene.floorColor || '#1a1a2e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, H * 0.85);
      ctx.lineTo(W, H * 0.85);
      ctx.stroke();
    }

    // Grid overlay
    if (showGrid) {
      ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
      for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
    }

    // Draw characters
    characters.forEach(char => {
      if (!char.visible) return;
      if (char.builtin === 'stick') {
        drawStickFigure(ctx, activeRig, W, H, mouthShape);
      } else {
        drawImageCharacter(ctx, char, activeRig, W, H, mouthShape);
        if (showSkeleton && activeRig) drawSkeletonOverlay(ctx, activeRig, W, H, true);
      }
    });

    // Empty state
    if (characters.length === 0) {
      ctx.fillStyle = 'rgba(107,114,128,0.3)';
      ctx.font = '14px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.fillText('Import a character or add a built-in', W/2, H/2 - 10);
      ctx.fillText('PNG · SVG · GLB · Stick Figure', W/2, H/2 + 16);
    }

    rafRef.current = requestAnimationFrame(draw);
  }, [characters, activeRig, mouthShape, showSkeleton, showGrid, scene]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw]);

  // Resize canvas to parent
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      canvas.width  = width;
      canvas.height = height;
    });
    ro.observe(canvas.parentElement);
    return () => ro.disconnect();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width:'100%', height:'100%', display:'block' }}
    />
  );
});

export default PuppetCanvas;
