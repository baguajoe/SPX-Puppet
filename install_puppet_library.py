#!/usr/bin/env python3
"""
Upgrade PuppetCharacterLibrary.js — large library with SVG-drawn characters
Run: python3 install_puppet_library.py
"""
import os

TARGET = "/workspaces/SPX-Puppet/src/utils/PuppetCharacterLibrary.js"

CODE = r'''// =============================================================================
// PuppetCharacterLibrary.js — Large Character Library UPGRADE
// SPX Puppet | StreamPireX
// 20 built-in characters across 8 categories, all SVG-drawn and fully rigged
// =============================================================================

// ─── SVG Character Renderers ──────────────────────────────────────────────────
// Each character is drawn procedurally from joint positions using SVG

export function drawCharacterSVG(char, rig, width = 400, height = 500) {
  const j = rig?.joints ?? char.joints;
  const W = width, H = height;

  // Helper — joint screen position
  const p = (name) => {
    const jt = j[name] ?? j[name.replace('left','').replace('right','').toLowerCase()];
    if (!jt) return null;
    if (jt.x <= 1 && jt.y <= 1) return { x: jt.x * W, y: jt.y * H }; // normalized
    return { x: jt.x * (W/400), y: jt.y * (H/500) }; // pixel coords scaled
  };

  const renderers = {
    cartoon:    drawCartoonCharacter,
    anime:      drawAnimeCharacter,
    realistic:  drawRealisticCharacter,
    chibi:      drawChibiCharacter,
    mechanical: drawRobotCharacter,
    stick:      drawStickCharacter,
    fantasy:    drawFantasyCharacter,
    animal:     drawAnimalCharacter,
  };

  const renderer = renderers[char.style] ?? drawCartoonCharacter;
  return renderer(char, j, W, H, p);
}

function svgLine(p1, p2, stroke, width = 3, cap = 'round') {
  if (!p1 || !p2) return '';
  return `<line x1="${p1.x.toFixed(1)}" y1="${p1.y.toFixed(1)}" x2="${p2.x.toFixed(1)}" y2="${p2.y.toFixed(1)}" stroke="${stroke}" stroke-width="${width}" stroke-linecap="${cap}"/>`;
}

function svgCircle(pt, r, fill, stroke = 'none', sw = 0) {
  if (!pt) return '';
  return `<circle cx="${pt.x.toFixed(1)}" cy="${pt.y.toFixed(1)}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
}

function svgEllipse(pt, rx, ry, fill, stroke = 'none', sw = 0) {
  if (!pt) return '';
  return `<ellipse cx="${pt.x.toFixed(1)}" cy="${pt.y.toFixed(1)}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
}

function drawCartoonCharacter(char, j, W, H, p) {
  const skin = char.skinTone ?? '#f4a261';
  const color = char.color ?? '#e63946';
  const dark = '#333';
  const head = p('head'), neck = p('neck'), chest = p('torso') ?? p('chest');
  const hip = p('hips') ?? p('hip');
  const ls = p('leftShoulder'), rs = p('rightShoulder');
  const le = p('leftElbow'), re = p('rightElbow');
  const lw = p('leftWrist'), rw = p('rightWrist');
  const lh = p('leftHip') ?? p('hip'), rh = p('rightHip') ?? p('hip');
  const lk = p('leftKnee'), rk = p('rightKnee');
  const la = p('leftAnkle') ?? p('leftToe'), ra = p('rightAnkle') ?? p('rightToe');

  const hr = head ? (j.head?.radius ?? 50) * (W/400) : 40;

  return `
    <!-- Body -->
    ${chest && hip ? `<polygon points="${(ls?.x??chest.x-40).toFixed()},${(ls?.y??chest.y).toFixed()} ${(rs?.x??chest.x+40).toFixed()},${(rs?.y??chest.y).toFixed()} ${(rh?.x??hip.x+25).toFixed()},${(rh?.y??hip.y).toFixed()} ${(lh?.x??hip.x-25).toFixed()},${(lh?.y??hip.y).toFixed()}" fill="${color}" stroke="${dark}" stroke-width="2"/>` : ''}
    <!-- Legs -->
    ${svgLine(lh, lk, skin, 18)} ${svgLine(lk, la, skin, 14)}
    ${svgLine(rh, rk, skin, 18)} ${svgLine(rk, ra, skin, 14)}
    <!-- Pants -->
    ${lk && lh ? `<line x1="${lh.x.toFixed()}" y1="${lh.y.toFixed()}" x2="${lk.x.toFixed()}" y2="${lk.y.toFixed()}" stroke="${color}" stroke-width="16" stroke-linecap="round"/>` : ''}
    ${rk && rh ? `<line x1="${rh.x.toFixed()}" y1="${rh.y.toFixed()}" x2="${rk.x.toFixed()}" y2="${rk.y.toFixed()}" stroke="${color}" stroke-width="16" stroke-linecap="round"/>` : ''}
    <!-- Shoes -->
    ${la ? svgEllipse({x:la.x-4, y:la.y+6}, 14, 7, dark) : ''}
    ${ra ? svgEllipse({x:ra.x+4, y:ra.y+6}, 14, 7, dark) : ''}
    <!-- Arms -->
    ${svgLine(ls, le, skin, 14)} ${svgLine(le, lw, skin, 11)}
    ${svgLine(rs, re, skin, 14)} ${svgLine(re, rw, skin, 11)}
    <!-- Sleeves -->
    ${ls && le ? `<line x1="${ls.x.toFixed()}" y1="${ls.y.toFixed()}" x2="${le.x.toFixed()}" y2="${le.y.toFixed()}" stroke="${color}" stroke-width="12" stroke-linecap="round"/>` : ''}
    ${rs && re ? `<line x1="${rs.x.toFixed()}" y1="${rs.y.toFixed()}" x2="${re.x.toFixed()}" y2="${re.y.toFixed()}" stroke="${color}" stroke-width="12" stroke-linecap="round"/>` : ''}
    <!-- Hands -->
    ${lw ? svgCircle(lw, 9, skin, dark, 1.5) : ''}
    ${rw ? svgCircle(rw, 9, skin, dark, 1.5) : ''}
    <!-- Neck -->
    ${svgLine(neck, chest, skin, 12)}
    <!-- Head -->
    ${head ? svgCircle(head, hr, skin, dark, 2.5) : ''}
    <!-- Eyes -->
    ${head ? `<circle cx="${(head.x-hr*0.3).toFixed()}" cy="${(head.y-hr*0.1).toFixed()}" r="${(hr*0.18).toFixed()}" fill="white" stroke="${dark}" stroke-width="1.5"/>` : ''}
    ${head ? `<circle cx="${(head.x+hr*0.3).toFixed()}" cy="${(head.y-hr*0.1).toFixed()}" r="${(hr*0.18).toFixed()}" fill="white" stroke="${dark}" stroke-width="1.5"/>` : ''}
    ${head ? `<circle cx="${(head.x-hr*0.28).toFixed()}" cy="${(head.y-hr*0.08).toFixed()}" r="${(hr*0.1).toFixed()}" fill="${dark}"/>` : ''}
    ${head ? `<circle cx="${(head.x+hr*0.28).toFixed()}" cy="${(head.y-hr*0.08).toFixed()}" r="${(hr*0.1).toFixed()}" fill="${dark}"/>` : ''}
    <!-- Smile -->
    ${head ? `<path d="M ${(head.x-hr*0.25).toFixed()} ${(head.y+hr*0.2).toFixed()} Q ${head.x.toFixed()} ${(head.y+hr*0.38).toFixed()} ${(head.x+hr*0.25).toFixed()} ${(head.y+hr*0.2).toFixed()}" fill="none" stroke="${dark}" stroke-width="2" stroke-linecap="round"/>` : ''}
    <!-- Hair -->
    ${head ? `<ellipse cx="${head.x.toFixed()}" cy="${(head.y-hr*0.6).toFixed()}" rx="${(hr*0.85).toFixed()}" ry="${(hr*0.5).toFixed()}" fill="${char.hairColor ?? '#4a2c0a'}"/>` : ''}
  `.trim();
}

function drawAnimeCharacter(char, j, W, H, p) {
  const skin = char.skinTone ?? '#ffe0b2';
  const color = char.color ?? '#9b5de5';
  const dark = '#222';
  const head = p('head'), neck = p('neck'), chest = p('torso') ?? p('chest');
  const hip = p('hips') ?? p('hip');
  const ls = p('leftShoulder'), rs = p('rightShoulder');
  const le = p('leftElbow'), re = p('rightElbow');
  const lw = p('leftWrist'), rw = p('rightWrist');
  const lh = p('leftHip') ?? p('hip'), rh = p('rightHip') ?? p('hip');
  const lk = p('leftKnee'), rk = p('rightKnee');
  const la = p('leftAnkle') ?? p('leftToe'), ra = p('rightAnkle') ?? p('rightToe');
  const hr = head ? (j.head?.radius ?? 44) * (W/400) : 36;

  return `
    <!-- Body -->
    ${chest && hip ? `<polygon points="${(ls?.x??chest.x-35).toFixed()},${(ls?.y??chest.y).toFixed()} ${(rs?.x??chest.x+35).toFixed()},${(rs?.y??chest.y).toFixed()} ${(rh?.x??hip.x+20).toFixed()},${(rh?.y??hip.y).toFixed()} ${(lh?.x??hip.x-20).toFixed()},${(lh?.y??hip.y).toFixed()}" fill="${color}" stroke="${dark}" stroke-width="1.5"/>` : ''}
    <!-- Skirt/uniform detail -->
    ${hip && la ? `<polygon points="${(hip.x-28).toFixed()},${(hip.y+5).toFixed()} ${(hip.x+28).toFixed()},${(hip.y+5).toFixed()} ${(hip.x+35).toFixed()},${(hip.y+45).toFixed()} ${(hip.x-35).toFixed()},${(hip.y+45).toFixed()}" fill="${color}" opacity="0.8"/>` : ''}
    <!-- Legs -->
    ${svgLine(lh, lk, skin, 14)} ${svgLine(lk, la, skin, 11)}
    ${svgLine(rh, rk, skin, 14)} ${svgLine(rk, ra, skin, 11)}
    <!-- Boots -->
    ${la ? `<rect x="${(la.x-10).toFixed()}" y="${(la.y-8).toFixed()}" width="20" height="20" rx="3" fill="${dark}"/>` : ''}
    ${ra ? `<rect x="${(ra.x-10).toFixed()}" y="${(ra.y-8).toFixed()}" width="20" height="20" rx="3" fill="${dark}"/>` : ''}
    <!-- Arms -->
    ${svgLine(ls, le, skin, 11)} ${svgLine(le, lw, skin, 8)}
    ${svgLine(rs, re, skin, 11)} ${svgLine(re, rw, skin, 8)}
    ${ls && le ? `<line x1="${ls.x.toFixed()}" y1="${ls.y.toFixed()}" x2="${le.x.toFixed()}" y2="${le.y.toFixed()}" stroke="${color}" stroke-width="9" stroke-linecap="round"/>` : ''}
    ${rs && re ? `<line x1="${rs.x.toFixed()}" y1="${rs.y.toFixed()}" x2="${re.x.toFixed()}" y2="${re.y.toFixed()}" stroke="${color}" stroke-width="9" stroke-linecap="round"/>` : ''}
    ${lw ? svgCircle(lw, 7, skin, dark, 1) : ''}
    ${rw ? svgCircle(rw, 7, skin, dark, 1) : ''}
    <!-- Neck -->
    ${svgLine(neck, chest, skin, 9)}
    <!-- Head — anime oval -->
    ${head ? `<ellipse cx="${head.x.toFixed()}" cy="${head.y.toFixed()}" rx="${(hr*0.85).toFixed()}" ry="${hr.toFixed()}" fill="${skin}" stroke="${dark}" stroke-width="2"/>` : ''}
    <!-- Big anime eyes -->
    ${head ? `<ellipse cx="${(head.x-hr*0.32).toFixed()}" cy="${(head.y+hr*0.05).toFixed()}" rx="${(hr*0.24).toFixed()}" ry="${(hr*0.3).toFixed()}" fill="${char.eyeColor??'#6200ea'}" stroke="${dark}" stroke-width="1.5"/>` : ''}
    ${head ? `<ellipse cx="${(head.x+hr*0.32).toFixed()}" cy="${(head.y+hr*0.05).toFixed()}" rx="${(hr*0.24).toFixed()}" ry="${(hr*0.3).toFixed()}" fill="${char.eyeColor??'#6200ea'}" stroke="${dark}" stroke-width="1.5"/>` : ''}
    ${head ? `<ellipse cx="${(head.x-hr*0.30).toFixed()}" cy="${(head.y+hr*0.02).toFixed()}" rx="${(hr*0.12).toFixed()}" ry="${(hr*0.15).toFixed()}" fill="white" opacity="0.8"/>` : ''}
    ${head ? `<ellipse cx="${(head.x+hr*0.30).toFixed()}" cy="${(head.y+hr*0.02).toFixed()}" rx="${(hr*0.12).toFixed()}" ry="${(hr*0.15).toFixed()}" fill="white" opacity="0.8"/>` : ''}
    <!-- Anime hair spikes -->
    ${head ? `<path d="M ${(head.x-hr).toFixed()} ${(head.y-hr*0.3).toFixed()} L ${(head.x-hr*1.3).toFixed()} ${(head.y-hr*1.1).toFixed()} L ${(head.x-hr*0.5).toFixed()} ${(head.y-hr*0.9).toFixed()} L ${(head.x).toFixed()} ${(head.y-hr*1.3).toFixed()} L ${(head.x+hr*0.5).toFixed()} ${(head.y-hr*0.9).toFixed()} L ${(head.x+hr*1.3).toFixed()} ${(head.y-hr*1.1).toFixed()} L ${(head.x+hr).toFixed()} ${(head.y-hr*0.3).toFixed()} Z" fill="${char.hairColor??'#1a237e'}" stroke="${dark}" stroke-width="1"/>` : ''}
    <!-- Mouth -->
    ${head ? `<path d="M ${(head.x-hr*0.15).toFixed()} ${(head.y+hr*0.45).toFixed()} Q ${head.x.toFixed()} ${(head.y+hr*0.55).toFixed()} ${(head.x+hr*0.15).toFixed()} ${(head.y+hr*0.45).toFixed()}" fill="none" stroke="${dark}" stroke-width="1.5"/>` : ''}
  `.trim();
}

function drawRealisticCharacter(char, j, W, H, p) {
  const skin = char.skinTone ?? '#f4c28b';
  const color = char.color ?? '#2a5caa';
  const dark = '#1a1a2e';
  const head = p('head'), neck = p('neck'), chest = p('torso') ?? p('chest');
  const hip = p('hips') ?? p('hip');
  const ls = p('leftShoulder'), rs = p('rightShoulder');
  const le = p('leftElbow'), re = p('rightElbow');
  const lw = p('leftWrist'), rw = p('rightWrist');
  const lh = p('leftHip') ?? p('hip'), rh = p('rightHip') ?? p('hip');
  const lk = p('leftKnee'), rk = p('rightKnee');
  const la = p('leftAnkle') ?? p('leftToe'), ra = p('rightAnkle') ?? p('rightToe');
  const hr = head ? (j.head?.radius ?? 40) * (W/400) : 32;

  return `
    <!-- Suit jacket body -->
    ${chest && hip ? `<polygon points="${(ls?.x??chest.x-38).toFixed()},${(ls?.y??chest.y).toFixed()} ${(rs?.x??chest.x+38).toFixed()},${(rs?.y??chest.y).toFixed()} ${(rh?.x??hip.x+22).toFixed()},${(rh?.y??hip.y).toFixed()} ${(lh?.x??hip.x-22).toFixed()},${(lh?.y??hip.y).toFixed()}" fill="${color}" stroke="${dark}" stroke-width="2"/>` : ''}
    <!-- Shirt/tie -->
    ${chest ? `<polygon points="${chest.x.toFixed()},${(chest.y-15).toFixed()} ${(chest.x-12).toFixed()},${(chest.y+30).toFixed()} ${(chest.x+12).toFixed()},${(chest.y+30).toFixed()}" fill="white"/>` : ''}
    ${chest ? `<polygon points="${chest.x.toFixed()},${(chest.y-5).toFixed()} ${(chest.x-4).toFixed()},${(chest.y+25).toFixed()} ${(chest.x+4).toFixed()},${(chest.y+25).toFixed()}" fill="#c62828"/>` : ''}
    <!-- Trousers -->
    ${lh && lk ? `<line x1="${lh.x.toFixed()}" y1="${lh.y.toFixed()}" x2="${lk.x.toFixed()}" y2="${lk.y.toFixed()}" stroke="${dark}" stroke-width="17" stroke-linecap="round"/>` : ''}
    ${rh && rk ? `<line x1="${rh.x.toFixed()}" y1="${rh.y.toFixed()}" x2="${rk.x.toFixed()}" y2="${rk.y.toFixed()}" stroke="${dark}" stroke-width="17" stroke-linecap="round"/>` : ''}
    ${lk && la ? `<line x1="${lk.x.toFixed()}" y1="${lk.y.toFixed()}" x2="${la.x.toFixed()}" y2="${la.y.toFixed()}" stroke="${dark}" stroke-width="13" stroke-linecap="round"/>` : ''}
    ${rk && ra ? `<line x1="${rk.x.toFixed()}" y1="${rk.y.toFixed()}" x2="${ra.x.toFixed()}" y2="${ra.y.toFixed()}" stroke="${dark}" stroke-width="13" stroke-linecap="round"/>` : ''}
    <!-- Shoes -->
    ${la ? svgEllipse({x:la.x-3, y:la.y+7}, 15, 7, '#1a1a1a') : ''}
    ${ra ? svgEllipse({x:ra.x+3, y:ra.y+7}, 15, 7, '#1a1a1a') : ''}
    <!-- Arms / Jacket sleeves -->
    ${ls && le ? `<line x1="${ls.x.toFixed()}" y1="${ls.y.toFixed()}" x2="${le.x.toFixed()}" y2="${le.y.toFixed()}" stroke="${color}" stroke-width="13" stroke-linecap="round"/>` : ''}
    ${rs && re ? `<line x1="${rs.x.toFixed()}" y1="${rs.y.toFixed()}" x2="${re.x.toFixed()}" y2="${re.y.toFixed()}" stroke="${color}" stroke-width="13" stroke-linecap="round"/>` : ''}
    ${le && lw ? `<line x1="${le.x.toFixed()}" y1="${le.y.toFixed()}" x2="${lw.x.toFixed()}" y2="${lw.y.toFixed()}" stroke="${color}" stroke-width="11" stroke-linecap="round"/>` : ''}
    ${re && rw ? `<line x1="${re.x.toFixed()}" y1="${re.y.toFixed()}" x2="${rw.x.toFixed()}" y2="${rw.y.toFixed()}" stroke="${color}" stroke-width="11" stroke-linecap="round"/>` : ''}
    ${lw ? svgCircle(lw, 9, skin, dark, 1) : ''}
    ${rw ? svgCircle(rw, 9, skin, dark, 1) : ''}
    <!-- Neck -->
    ${svgLine(neck, chest, skin, 11)}
    <!-- Head -->
    ${head ? `<ellipse cx="${head.x.toFixed()}" cy="${head.y.toFixed()}" rx="${(hr*0.9).toFixed()}" ry="${hr.toFixed()}" fill="${skin}" stroke="${dark}" stroke-width="2"/>` : ''}
    <!-- Face details -->
    ${head ? `<ellipse cx="${(head.x-hr*0.3).toFixed()}" cy="${(head.y-hr*0.08).toFixed()}" rx="${(hr*0.14).toFixed()}" ry="${(hr*0.1).toFixed()}" fill="white" stroke="${dark}" stroke-width="1"/>` : ''}
    ${head ? `<ellipse cx="${(head.x+hr*0.3).toFixed()}" cy="${(head.y-hr*0.08).toFixed()}" rx="${(hr*0.14).toFixed()}" ry="${(hr*0.1).toFixed()}" fill="white" stroke="${dark}" stroke-width="1"/>` : ''}
    ${head ? `<circle cx="${(head.x-hr*0.28).toFixed()}" cy="${(head.y-hr*0.06).toFixed()}" r="${(hr*0.07).toFixed()}" fill="#5d4037"/>` : ''}
    ${head ? `<circle cx="${(head.x+hr*0.28).toFixed()}" cy="${(head.y-hr*0.06).toFixed()}" r="${(hr*0.07).toFixed()}" fill="#5d4037"/>` : ''}
    <!-- Nose -->
    ${head ? `<path d="M ${head.x.toFixed()} ${(head.y+hr*0.1).toFixed()} Q ${(head.x+hr*0.12).toFixed()} ${(head.y+hr*0.28).toFixed()} ${(head.x-hr*0.12).toFixed()} ${(head.y+hr*0.28).toFixed()}" fill="none" stroke="${skin}" stroke-width="2" opacity="0.6"/>` : ''}
    <!-- Mouth -->
    ${head ? `<path d="M ${(head.x-hr*0.2).toFixed()} ${(head.y+hr*0.42).toFixed()} Q ${head.x.toFixed()} ${(head.y+hr*0.52).toFixed()} ${(head.x+hr*0.2).toFixed()} ${(head.y+hr*0.42).toFixed()}" fill="none" stroke="${dark}" stroke-width="1.5"/>` : ''}
    <!-- Hair -->
    ${head ? `<ellipse cx="${head.x.toFixed()}" cy="${(head.y-hr*0.55).toFixed()}" rx="${(hr*0.92).toFixed()}" ry="${(hr*0.52).toFixed()}" fill="${char.hairColor??'#3e2723'}"/>` : ''}
  `.trim();
}

function drawChibiCharacter(char, j, W, H, p) {
  const skin = char.skinTone ?? '#ffe0b2';
  const color = char.color ?? '#e91e63';
  const dark = '#222';
  const head = p('head'), neck = p('neck'), chest = p('torso') ?? p('chest');
  const hip = p('hips') ?? p('hip');
  const ls = p('leftShoulder'), rs = p('rightShoulder');
  const le = p('leftElbow'), re = p('rightElbow');
  const lw = p('leftWrist'), rw = p('rightWrist');
  const lh = p('leftHip') ?? p('hip'), rh = p('rightHip') ?? p('hip');
  const lk = p('leftKnee'), rk = p('rightKnee');
  const la = p('leftAnkle') ?? p('leftToe'), ra = p('rightAnkle') ?? p('rightToe');
  const hr = head ? (j.head?.radius ?? 60) * (W/400) : 55; // chibi has big head

  return `
    <!-- Chibi body — small and round -->
    ${chest && hip ? `<ellipse cx="${chest.x.toFixed()}" cy="${((chest.y+hip.y)/2).toFixed()}" rx="35" ry="38" fill="${color}" stroke="${dark}" stroke-width="2"/>` : ''}
    <!-- Stubby legs -->
    ${svgLine(lh, lk, skin, 16)} ${svgLine(lk, la, skin, 13)}
    ${svgLine(rh, rk, skin, 16)} ${svgLine(rk, ra, skin, 13)}
    ${la ? svgEllipse({x:la.x-2, y:la.y+6}, 12, 7, dark) : ''}
    ${ra ? svgEllipse({x:ra.x+2, y:ra.y+6}, 12, 7, dark) : ''}
    <!-- Stubby arms -->
    ${svgLine(ls, le, skin, 13)} ${svgLine(le, lw, skin, 10)}
    ${svgLine(rs, re, skin, 13)} ${svgLine(re, rw, skin, 10)}
    ${lw ? svgCircle(lw, 10, skin, dark, 1.5) : ''}
    ${rw ? svgCircle(rw, 10, skin, dark, 1.5) : ''}
    <!-- Big chibi head -->
    ${head ? svgCircle(head, hr, skin, dark, 2.5) : ''}
    <!-- Giant eyes -->
    ${head ? `<ellipse cx="${(head.x-hr*0.28).toFixed()}" cy="${(head.y+hr*0.05).toFixed()}" rx="${(hr*0.22).toFixed()}" ry="${(hr*0.25).toFixed()}" fill="${char.eyeColor??'#00bcd4'}" stroke="${dark}" stroke-width="2"/>` : ''}
    ${head ? `<ellipse cx="${(head.x+hr*0.28).toFixed()}" cy="${(head.y+hr*0.05).toFixed()}" rx="${(hr*0.22).toFixed()}" ry="${(hr*0.25).toFixed()}" fill="${char.eyeColor??'#00bcd4'}" stroke="${dark}" stroke-width="2"/>` : ''}
    ${head ? `<circle cx="${(head.x-hr*0.24).toFixed()}" cy="${(head.y+hr*0.0).toFixed()}" r="${(hr*0.1).toFixed()}" fill="white" opacity="0.9"/>` : ''}
    ${head ? `<circle cx="${(head.x+hr*0.24).toFixed()}" cy="${(head.y+hr*0.0).toFixed()}" r="${(hr*0.1).toFixed()}" fill="white" opacity="0.9"/>` : ''}
    <!-- Rosy cheeks -->
    ${head ? `<circle cx="${(head.x-hr*0.52).toFixed()}" cy="${(head.y+hr*0.28).toFixed()}" r="${(hr*0.15).toFixed()}" fill="#ffb3b3" opacity="0.6"/>` : ''}
    ${head ? `<circle cx="${(head.x+hr*0.52).toFixed()}" cy="${(head.y+hr*0.28).toFixed()}" r="${(hr*0.15).toFixed()}" fill="#ffb3b3" opacity="0.6"/>` : ''}
    <!-- Hair -->
    ${head ? `<ellipse cx="${head.x.toFixed()}" cy="${(head.y-hr*0.5).toFixed()}" rx="${(hr*0.95).toFixed()}" ry="${(hr*0.6).toFixed()}" fill="${char.hairColor??'#ff4081'}"/>` : ''}
    ${head ? `<ellipse cx="${(head.x-hr*0.8).toFixed()}" cy="${(head.y-hr*0.2).toFixed()}" rx="${(hr*0.25).toFixed()}" ry="${(hr*0.4).toFixed()}" fill="${char.hairColor??'#ff4081'}"/>` : ''}
    ${head ? `<ellipse cx="${(head.x+hr*0.8).toFixed()}" cy="${(head.y-hr*0.2).toFixed()}" rx="${(hr*0.25).toFixed()}" ry="${(hr*0.4).toFixed()}" fill="${char.hairColor??'#ff4081'}"/>` : ''}
  `.trim();
}

function drawRobotCharacter(char, j, W, H, p) {
  const metal = char.color ?? '#607d8b';
  const accent = char.accentColor ?? '#00ffc8';
  const dark = '#1a1a2e';
  const head = p('head'), neck = p('neck'), chest = p('torso') ?? p('chest');
  const hip = p('hips') ?? p('hip');
  const ls = p('leftShoulder'), rs = p('rightShoulder');
  const le = p('leftElbow'), re = p('rightElbow');
  const lw = p('leftWrist'), rw = p('rightWrist');
  const lh = p('leftHip') ?? p('hip'), rh = p('rightHip') ?? p('hip');
  const lk = p('leftKnee'), rk = p('rightKnee');
  const la = p('leftAnkle') ?? p('leftToe'), ra = p('rightAnkle') ?? p('rightToe');
  const hr = head ? (j.head?.radius ?? 42) * (W/400) : 35;

  const rect = (pt, w, h, fill, stroke=dark, sw=2, rx=4) =>
    pt ? `<rect x="${(pt.x-w/2).toFixed()}" y="${(pt.y-h/2).toFixed()}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>` : '';

  return `
    <!-- Torso box -->
    ${chest && hip ? rect({x:(chest.x+hip.x)/2, y:(chest.y+hip.y)/2}, 65, Math.abs(hip.y-chest.y)+30, metal) : ''}
    <!-- Chest panel -->
    ${chest ? `<rect x="${(chest.x-20).toFixed()}" y="${(chest.y-15).toFixed()}" width="40" height="25" rx="3" fill="${dark}" stroke="${accent}" stroke-width="1.5"/>` : ''}
    ${chest ? `<circle cx="${chest.x.toFixed()}" cy="${chest.y.toFixed()}" r="6" fill="${accent}" opacity="0.8"/>` : ''}
    <!-- Legs -->
    ${lh && lk ? rect({x:(lh.x+lk.x)/2, y:(lh.y+lk.y)/2}, 16, Math.abs(lk.y-lh.y), metal) : ''}
    ${rh && rk ? rect({x:(rh.x+rk.x)/2, y:(rh.y+rk.y)/2}, 16, Math.abs(rk.y-rh.y), metal) : ''}
    ${lk && la ? rect({x:(lk.x+la.x)/2, y:(lk.y+la.y)/2}, 13, Math.abs(la.y-lk.y), metal) : ''}
    ${rk && ra ? rect({x:(rk.x+ra.x)/2, y:(rk.y+ra.y)/2}, 13, Math.abs(ra.y-rk.y), metal) : ''}
    ${la ? rect(la, 22, 10, dark, accent, 1, 2) : ''}
    ${ra ? rect(ra, 22, 10, dark, accent, 1, 2) : ''}
    <!-- Arms -->
    ${ls && le ? rect({x:(ls.x+le.x)/2, y:(ls.y+le.y)/2}, 13, Math.hypot(le.x-ls.x,le.y-ls.y), metal) : ''}
    ${rs && re ? rect({x:(rs.x+re.x)/2, y:(rs.y+re.y)/2}, 13, Math.hypot(re.x-rs.x,re.y-rs.y), metal) : ''}
    ${le && lw ? rect({x:(le.x+lw.x)/2, y:(le.y+lw.y)/2}, 10, Math.hypot(lw.x-le.x,lw.y-le.y), metal) : ''}
    ${re && rw ? rect({x:(re.x+rw.x)/2, y:(re.y+rw.y)/2}, 10, Math.hypot(rw.x-re.x,rw.y-re.y), metal) : ''}
    ${lw ? rect(lw, 16, 16, metal, accent, 1) : ''}
    ${rw ? rect(rw, 16, 16, metal, accent, 1) : ''}
    <!-- Neck -->
    ${neck && chest ? rect({x:neck.x, y:(neck.y+chest.y)/2}, 10, Math.abs(chest.y-neck.y), metal) : ''}
    <!-- Head box -->
    ${head ? rect(head, hr*1.8, hr*1.6, metal) : ''}
    <!-- Visor -->
    ${head ? `<rect x="${(head.x-hr*0.65).toFixed()}" y="${(head.y-hr*0.2).toFixed()}" width="${(hr*1.3).toFixed()}" height="${(hr*0.4).toFixed()}" rx="3" fill="${accent}" opacity="0.7"/>` : ''}
    <!-- Antenna -->
    ${head ? `<line x1="${head.x.toFixed()}" y1="${(head.y-hr*0.8).toFixed()}" x2="${head.x.toFixed()}" y2="${(head.y-hr*1.4).toFixed()}" stroke="${metal}" stroke-width="3"/>` : ''}
    ${head ? `<circle cx="${head.x.toFixed()}" cy="${(head.y-hr*1.4).toFixed()}" r="5" fill="${accent}"/>` : ''}
  `.trim();
}

function drawStickCharacter(char, j, W, H, p) {
  const color = char.color ?? '#00ffc8';
  const dark = '#333';
  const head = p('head'), neck = p('neck'), chest = p('torso') ?? p('chest');
  const hip = p('hips') ?? p('hip');
  const ls = p('leftShoulder'), rs = p('rightShoulder');
  const le = p('leftElbow'), re = p('rightElbow');
  const lw = p('leftWrist'), rw = p('rightWrist');
  const lh = p('leftHip') ?? p('hip'), rh = p('rightHip') ?? p('hip');
  const lk = p('leftKnee'), rk = p('rightKnee');
  const la = p('leftAnkle') ?? p('leftToe'), ra = p('rightAnkle') ?? p('rightToe');
  const hr = head ? (j.head?.radius ?? 30) * (W/400) : 25;

  return `
    ${svgLine(neck, hip, color, 3)}
    ${svgLine(ls, lw, color, 3)} ${svgLine(ls, le, color, 3)} ${svgLine(le, lw, color, 3)}
    ${svgLine(rs, rw, color, 3)} ${svgLine(rs, re, color, 3)} ${svgLine(re, rw, color, 3)}
    ${svgLine(lh, la, color, 3)} ${svgLine(lh, lk, color, 3)} ${svgLine(lk, la, color, 3)}
    ${svgLine(rh, ra, color, 3)} ${svgLine(rh, rk, color, 3)} ${svgLine(rk, ra, color, 3)}
    ${head ? svgCircle(head, hr, 'none', color, 3) : ''}
    ${head ? `<circle cx="${(head.x-hr*0.3).toFixed()}" cy="${(head.y-hr*0.1).toFixed()}" r="3" fill="${color}"/>` : ''}
    ${head ? `<circle cx="${(head.x+hr*0.3).toFixed()}" cy="${(head.y-hr*0.1).toFixed()}" r="3" fill="${color}"/>` : ''}
    ${head ? `<path d="M ${(head.x-hr*0.25).toFixed()} ${(head.y+hr*0.3).toFixed()} Q ${head.x.toFixed()} ${(head.y+hr*0.5).toFixed()} ${(head.x+hr*0.25).toFixed()} ${(head.y+hr*0.3).toFixed()}" fill="none" stroke="${color}" stroke-width="2"/>` : ''}
  `.trim();
}

function drawFantasyCharacter(char, j, W, H, p) {
  // Elf/fantasy style — pointy ears, robes
  const skin = char.skinTone ?? '#c8e6c9';
  const robe = char.color ?? '#4a148c';
  const gold = '#ffd700';
  const dark = '#1a0033';
  const head = p('head'), neck = p('neck'), chest = p('torso') ?? p('chest');
  const hip = p('hips') ?? p('hip');
  const ls = p('leftShoulder'), rs = p('rightShoulder');
  const le = p('leftElbow'), re = p('rightElbow');
  const lw = p('leftWrist'), rw = p('rightWrist');
  const lh = p('leftHip') ?? p('hip'), rh = p('rightHip') ?? p('hip');
  const la = p('leftAnkle') ?? p('leftToe'), ra = p('rightAnkle') ?? p('rightToe');
  const hr = head ? (j.head?.radius ?? 38) * (W/400) : 32;

  return `
    <!-- Flowing robe -->
    ${chest && la ? `<polygon points="${(ls?.x??chest.x-40).toFixed()},${(ls?.y??chest.y).toFixed()} ${(rs?.x??chest.x+40).toFixed()},${(rs?.y??chest.y).toFixed()} ${(ra?.x??chest.x+50).toFixed()},${(ra?.y??500).toFixed()} ${(la?.x??chest.x-50).toFixed()},${(la?.y??500).toFixed()}" fill="${robe}" stroke="${dark}" stroke-width="1.5"/>` : ''}
    <!-- Robe trim -->
    ${chest && la ? `<polygon points="${(ls?.x??chest.x-40).toFixed()},${(ls?.y??chest.y).toFixed()} ${(rs?.x??chest.x+40).toFixed()},${(rs?.y??chest.y).toFixed()} ${(ra?.x??chest.x+50).toFixed()},${(ra?.y??500).toFixed()} ${(la?.x??chest.x-50).toFixed()},${(la?.y??500).toFixed()}" fill="none" stroke="${gold}" stroke-width="2"/>` : ''}
    <!-- Arms -->
    ${svgLine(ls, le, skin, 10)} ${svgLine(le, lw, skin, 8)}
    ${svgLine(rs, re, skin, 10)} ${svgLine(re, rw, skin, 8)}
    ${ls && le ? `<line x1="${ls.x.toFixed()}" y1="${ls.y.toFixed()}" x2="${le.x.toFixed()}" y2="${le.y.toFixed()}" stroke="${robe}" stroke-width="14" stroke-linecap="round" opacity="0.7"/>` : ''}
    ${lw ? svgCircle(lw, 8, skin, dark, 1) : ''}
    ${rw ? svgCircle(rw, 8, skin, dark, 1) : ''}
    <!-- Staff -->
    ${lw ? `<line x1="${lw.x.toFixed()}" y1="${lw.y.toFixed()}" x2="${(lw.x-5).toFixed()}" y2="${(lw.y-120).toFixed()}" stroke="${gold}" stroke-width="4"/>` : ''}
    ${lw ? `<circle cx="${(lw.x-5).toFixed()}" cy="${(lw.y-120).toFixed()}" r="8" fill="${gold}" opacity="0.9"/>` : ''}
    <!-- Neck -->
    ${svgLine(neck, chest, skin, 9)}
    <!-- Head -->
    ${head ? `<ellipse cx="${head.x.toFixed()}" cy="${head.y.toFixed()}" rx="${(hr*0.82).toFixed()}" ry="${hr.toFixed()}" fill="${skin}" stroke="${dark}" stroke-width="2"/>` : ''}
    <!-- Pointy elf ears -->
    ${head ? `<polygon points="${(head.x-hr*0.82).toFixed()},${(head.y-hr*0.1).toFixed()} ${(head.x-hr*1.3).toFixed()},${(head.y-hr*0.5).toFixed()} ${(head.x-hr*0.82).toFixed()},${(head.y+hr*0.2).toFixed()}" fill="${skin}" stroke="${dark}" stroke-width="1.5"/>` : ''}
    ${head ? `<polygon points="${(head.x+hr*0.82).toFixed()},${(head.y-hr*0.1).toFixed()} ${(head.x+hr*1.3).toFixed()},${(head.y-hr*0.5).toFixed()} ${(head.x+hr*0.82).toFixed()},${(head.y+hr*0.2).toFixed()}" fill="${skin}" stroke="${dark}" stroke-width="1.5"/>` : ''}
    <!-- Eyes — glowing -->
    ${head ? `<ellipse cx="${(head.x-hr*0.3).toFixed()}" cy="${(head.y-hr*0.05).toFixed()}" rx="${(hr*0.16).toFixed()}" ry="${(hr*0.12).toFixed()}" fill="#76ff03" stroke="${dark}" stroke-width="1"/>` : ''}
    ${head ? `<ellipse cx="${(head.x+hr*0.3).toFixed()}" cy="${(head.y-hr*0.05).toFixed()}" rx="${(hr*0.16).toFixed()}" ry="${(hr*0.12).toFixed()}" fill="#76ff03" stroke="${dark}" stroke-width="1"/>` : ''}
    <!-- Crown -->
    ${head ? `<path d="M ${(head.x-hr*0.6).toFixed()} ${(head.y-hr*0.85).toFixed()} L ${(head.x-hr*0.3).toFixed()} ${(head.y-hr*1.15).toFixed()} L ${head.x.toFixed()} ${(head.y-hr*0.85).toFixed()} L ${(head.x+hr*0.3).toFixed()} ${(head.y-hr*1.15).toFixed()} L ${(head.x+hr*0.6).toFixed()} ${(head.y-hr*0.85).toFixed()}" fill="none" stroke="${gold}" stroke-width="3"/>` : ''}
    <!-- Hair -->
    ${head ? `<ellipse cx="${head.x.toFixed()}" cy="${(head.y-hr*0.6).toFixed()}" rx="${(hr*0.85).toFixed()}" ry="${(hr*0.5).toFixed()}" fill="${char.hairColor??'#b0bec5'}"/>` : ''}
  `.trim();
}

function drawAnimalCharacter(char, j, W, H, p) {
  const fur = char.skinTone ?? '#f4a261';
  const color = char.color ?? '#e9c46a';
  const dark = '#3e2723';
  const head = p('head'), neck = p('neck'), chest = p('torso') ?? p('chest');
  const hip = p('hips') ?? p('hip');
  const ls = p('leftShoulder'), rs = p('rightShoulder');
  const le = p('leftElbow'), re = p('rightElbow');
  const lw = p('leftWrist'), rw = p('rightWrist');
  const lh = p('leftHip') ?? p('hip'), rh = p('rightHip') ?? p('hip');
  const lk = p('leftKnee'), rk = p('rightKnee');
  const la = p('leftAnkle') ?? p('leftToe'), ra = p('rightAnkle') ?? p('rightToe');
  const hr = head ? (j.head?.radius ?? 48) * (W/400) : 40;

  return `
    <!-- Body -->
    ${chest && hip ? `<ellipse cx="${((chest.x+hip.x)/2).toFixed()}" cy="${((chest.y+hip.y)/2).toFixed()}" rx="38" ry="${(Math.abs(hip.y-chest.y)/2+15).toFixed()}" fill="${fur}" stroke="${dark}" stroke-width="2"/>` : ''}
    <!-- Tail -->
    ${hip ? `<path d="M ${hip.x.toFixed()} ${hip.y.toFixed()} Q ${(hip.x+60).toFixed()} ${(hip.y-30).toFixed()} ${(hip.x+50).toFixed()} ${(hip.y-80).toFixed()}" fill="none" stroke="${color}" stroke-width="12" stroke-linecap="round"/>` : ''}
    <!-- Legs -->
    ${svgLine(lh, lk, fur, 16)} ${svgLine(lk, la, fur, 13)}
    ${svgLine(rh, rk, fur, 16)} ${svgLine(rk, ra, fur, 13)}
    ${la ? svgCircle(la, 10, dark) : ''}
    ${ra ? svgCircle(ra, 10, dark) : ''}
    <!-- Arms -->
    ${svgLine(ls, le, fur, 13)} ${svgLine(le, lw, fur, 10)}
    ${svgLine(rs, re, fur, 13)} ${svgLine(re, rw, fur, 10)}
    ${lw ? svgCircle(lw, 9, fur, dark, 1.5) : ''}
    ${rw ? svgCircle(rw, 9, fur, dark, 1.5) : ''}
    <!-- Neck -->
    ${svgLine(neck, chest, fur, 12)}
    <!-- Head — round animal -->
    ${head ? svgCircle(head, hr, fur, dark, 2.5) : ''}
    <!-- Animal ears -->
    ${head ? `<ellipse cx="${(head.x-hr*0.6).toFixed()}" cy="${(head.y-hr*0.9).toFixed()}" rx="${(hr*0.22).toFixed()}" ry="${(hr*0.35).toFixed()}" fill="${fur}" stroke="${dark}" stroke-width="2"/>` : ''}
    ${head ? `<ellipse cx="${(head.x+hr*0.6).toFixed()}" cy="${(head.y-hr*0.9).toFixed()}" rx="${(hr*0.22).toFixed()}" ry="${(hr*0.35).toFixed()}" fill="${fur}" stroke="${dark}" stroke-width="2"/>` : ''}
    ${head ? `<ellipse cx="${(head.x-hr*0.6).toFixed()}" cy="${(head.y-hr*0.9).toFixed()}" rx="${(hr*0.12).toFixed()}" ry="${(hr*0.22).toFixed()}" fill="#ffccbc"/>` : ''}
    ${head ? `<ellipse cx="${(head.x+hr*0.6).toFixed()}" cy="${(head.y-hr*0.9).toFixed()}" rx="${(hr*0.12).toFixed()}" ry="${(hr*0.22).toFixed()}" fill="#ffccbc"/>` : ''}
    <!-- Eyes -->
    ${head ? svgCircle({x:head.x-hr*0.3, y:head.y-hr*0.08}, hr*0.18, 'white', dark, 1.5) : ''}
    ${head ? svgCircle({x:head.x+hr*0.3, y:head.y-hr*0.08}, hr*0.18, 'white', dark, 1.5) : ''}
    ${head ? svgCircle({x:head.x-hr*0.28, y:head.y-hr*0.06}, hr*0.1, dark) : ''}
    ${head ? svgCircle({x:head.x+hr*0.28, y:head.y-hr*0.06}, hr*0.1, dark) : ''}
    <!-- Nose -->
    ${head ? `<ellipse cx="${head.x.toFixed()}" cy="${(head.y+hr*0.25).toFixed()}" rx="${(hr*0.14).toFixed()}" ry="${(hr*0.09).toFixed()}" fill="#e91e63"/>` : ''}
    <!-- Whiskers -->
    ${head ? `<line x1="${(head.x-hr*0.15).toFixed()}" y1="${(head.y+hr*0.25).toFixed()}" x2="${(head.x-hr*0.75).toFixed()}" y2="${(head.y+hr*0.18).toFixed()}" stroke="${dark}" stroke-width="1.5" opacity="0.6"/>` : ''}
    ${head ? `<line x1="${(head.x+hr*0.15).toFixed()}" y1="${(head.y+hr*0.25).toFixed()}" x2="${(head.x+hr*0.75).toFixed()}" y2="${(head.y+hr*0.18).toFixed()}" stroke="${dark}" stroke-width="1.5" opacity="0.6"/>` : ''}
  `.trim();
}

// ─── SVG wrapper ──────────────────────────────────────────────────────────────

export function renderCharacterToSVGString(char, rig, width = 400, height = 500) {
  const body = drawCharacterSVG(char, rig, width, height);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${body}</svg>`;
}

export function renderCharacterToDataURL(char, rig, width = 400, height = 500) {
  const svg = renderCharacterToSVGString(char, rig, width, height);
  return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
}

// ─── Built-in Characters (20 total) ──────────────────────────────────────────

const BASE_JOINTS = (cx=200, scale=1) => ({
  head:          { x: cx,           y: 70*scale,  radius: 40*scale },
  neck:          { x: cx,           y: 125*scale, radius: 8*scale  },
  torso:         { x: cx,           y: 200*scale, radius: 12*scale },
  spine1:        { x: cx,           y: 165*scale, radius: 7*scale  },
  spine2:        { x: cx,           y: 185*scale, radius: 7*scale  },
  hips:          { x: cx,           y: 255*scale, radius: 12*scale },
  leftShoulder:  { x: cx-55*scale,  y: 150*scale, radius: 10*scale },
  rightShoulder: { x: cx+55*scale,  y: 150*scale, radius: 10*scale },
  leftElbow:     { x: cx-75*scale,  y: 205*scale, radius: 8*scale  },
  rightElbow:    { x: cx+75*scale,  y: 205*scale, radius: 8*scale  },
  leftWrist:     { x: cx-80*scale,  y: 258*scale, radius: 6*scale  },
  rightWrist:    { x: cx+80*scale,  y: 258*scale, radius: 6*scale  },
  leftHip:       { x: cx-28*scale,  y: 260*scale, radius: 8*scale  },
  rightHip:      { x: cx+28*scale,  y: 260*scale, radius: 8*scale  },
  leftKnee:      { x: cx-30*scale,  y: 340*scale, radius: 8*scale  },
  rightKnee:     { x: cx+30*scale,  y: 340*scale, radius: 8*scale  },
  leftAnkle:     { x: cx-32*scale,  y: 415*scale, radius: 6*scale  },
  rightAnkle:    { x: cx+32*scale,  y: 415*scale, radius: 6*scale  },
  leftToe:       { x: cx-40*scale,  y: 435*scale, radius: 5*scale  },
  rightToe:      { x: cx+40*scale,  y: 435*scale, radius: 5*scale  },
});

export const BUILT_IN_CHARACTERS = [
  // ── Professional ──
  { id:'char_reporter',    name:'News Reporter',    category:'professional', thumbnail:'📺', style:'realistic',  color:'#2a5caa', skinTone:'#f4c28b', hairColor:'#3e2723', joints: BASE_JOINTS(200) },
  { id:'char_teacher',     name:'Teacher',          category:'professional', thumbnail:'📚', style:'realistic',  color:'#1b5e20', skinTone:'#ffe0b2', hairColor:'#4e342e', joints: BASE_JOINTS(200) },
  { id:'char_doctor',      name:'Doctor',           category:'professional', thumbnail:'👨‍⚕️', style:'realistic', color:'#e0e0e0', skinTone:'#ffccbc', hairColor:'#212121', joints: BASE_JOINTS(200) },
  { id:'char_musician',    name:'Musician',         category:'professional', thumbnail:'🎸', style:'realistic',  color:'#212121', skinTone:'#a1887f', hairColor:'#212121', joints: BASE_JOINTS(200) },

  // ── Cartoon ──
  { id:'char_hero',        name:'Cartoon Hero',     category:'cartoon',      thumbnail:'🦸', style:'cartoon',    color:'#e63946', skinTone:'#f4a261', hairColor:'#4a2c0a', joints: BASE_JOINTS(200) },
  { id:'char_villain',     name:'Villain',          category:'cartoon',      thumbnail:'😈', style:'cartoon',    color:'#4a148c', skinTone:'#c5e1a5', hairColor:'#b71c1c', joints: BASE_JOINTS(200) },
  { id:'char_sidekick',    name:'Sidekick',         category:'cartoon',      thumbnail:'🤝', style:'cartoon',    color:'#ff6f00', skinTone:'#ffe0b2', hairColor:'#795548', joints: BASE_JOINTS(200, 0.88) },

  // ── Anime ──
  { id:'char_anime_hero',  name:'Anime Hero',       category:'anime',        thumbnail:'⚔️', style:'anime',     color:'#1565c0', skinTone:'#ffe0b2', hairColor:'#1a237e', eyeColor:'#2196f3', joints: BASE_JOINTS(200) },
  { id:'char_anime_girl',  name:'Anime Girl',       category:'anime',        thumbnail:'🌸', style:'anime',     color:'#e91e63', skinTone:'#fff3e0', hairColor:'#f48fb1', eyeColor:'#e91e63', joints: BASE_JOINTS(200, 0.92) },
  { id:'char_ninja',       name:'Ninja',            category:'anime',        thumbnail:'🥷', style:'anime',     color:'#212121', skinTone:'#ffe0b2', hairColor:'#212121', eyeColor:'#f44336', joints: BASE_JOINTS(200) },

  // ── Chibi ──
  { id:'char_chibi_girl',  name:'Chibi Girl',       category:'chibi',        thumbnail:'🎀', style:'chibi',     color:'#e91e63', skinTone:'#fff3e0', hairColor:'#ff4081', eyeColor:'#00bcd4', joints: BASE_JOINTS(200, 0.75) },
  { id:'char_chibi_boy',   name:'Chibi Boy',        category:'chibi',        thumbnail:'⚡', style:'chibi',     color:'#1565c0', skinTone:'#ffe0b2', hairColor:'#795548', eyeColor:'#4caf50', joints: BASE_JOINTS(200, 0.75) },

  // ── Sci-Fi ──
  { id:'char_robot',       name:'Robot',            category:'sci-fi',       thumbnail:'🤖', style:'mechanical', color:'#607d8b', accentColor:'#00ffc8', joints: BASE_JOINTS(200) },
  { id:'char_cyborg',      name:'Cyborg',           category:'sci-fi',       thumbnail:'🦾', style:'mechanical', color:'#37474f', accentColor:'#ff6f00', skinTone:'#f4c28b', joints: BASE_JOINTS(200) },
  { id:'char_alien',       name:'Alien',            category:'sci-fi',       thumbnail:'👽', style:'cartoon',   color:'#388e3c', skinTone:'#a5d6a7', hairColor:'#1b5e20', joints: BASE_JOINTS(200) },

  // ── Fantasy ──
  { id:'char_elf',         name:'Elf Mage',         category:'fantasy',      thumbnail:'🧝', style:'fantasy',   color:'#4a148c', skinTone:'#c8e6c9', hairColor:'#b0bec5', joints: BASE_JOINTS(200) },
  { id:'char_warrior',     name:'Warrior',          category:'fantasy',      thumbnail:'⚔️', style:'fantasy',  color:'#b71c1c', skinTone:'#f4c28b', hairColor:'#212121', joints: BASE_JOINTS(200) },

  // ── Animal ──
  { id:'char_fox',         name:'Fox',              category:'animal',       thumbnail:'🦊', style:'animal',    color:'#ff6f00', skinTone:'#ffcc02', joints: BASE_JOINTS(200) },
  { id:'char_cat',         name:'Cat',              category:'animal',       thumbnail:'🐱', style:'animal',    color:'#9e9e9e', skinTone:'#e0e0e0', joints: BASE_JOINTS(200, 0.85) },

  // ── Stick ──
  { id:'char_stick',       name:'Stick Figure',     category:'minimal',      thumbnail:'🕺', style:'stick',     color:'#00ffc8', joints: BASE_JOINTS(200) },
];

// ─── Library Functions ────────────────────────────────────────────────────────

export function getCategories() {
  return [...new Set(BUILT_IN_CHARACTERS.map(c => c.category))];
}

export function getByCategory(cat) {
  return cat === 'all' ? BUILT_IN_CHARACTERS : BUILT_IN_CHARACTERS.filter(c => c.category === cat);
}

export function getById(id) {
  return BUILT_IN_CHARACTERS.find(c => c.id === id) ?? null;
}

export function searchCharacters(query) {
  const q = query.toLowerCase();
  return BUILT_IN_CHARACTERS.filter(c =>
    c.name.toLowerCase().includes(q) ||
    c.category.toLowerCase().includes(q) ||
    c.style.toLowerCase().includes(q)
  );
}

export function getCharacterThumbnailDataURL(charId, size = 120) {
  const char = getById(charId);
  if (!char) return null;
  const rig = { joints: char.joints };
  return renderCharacterToDataURL(char, rig, size, Math.round(size * 1.25));
}

// ─── Sprite Sheet I/O (preserved from original) ───────────────────────────────

export function exportSpriteSheet(frames, frameW, frameH, cols = 8) {
  const rows = Math.ceil(frames.length / cols);
  const canvas = document.createElement('canvas');
  canvas.width = frameW * cols; canvas.height = frameH * rows;
  const ctx = canvas.getContext('2d');
  frames.forEach((fc, i) => {
    ctx.drawImage(fc, (i%cols)*frameW, Math.floor(i/cols)*frameH, frameW, frameH);
  });
  return canvas;
}

export async function importSpriteSheet(file, frameW, frameH) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const cols = Math.floor(img.naturalWidth/frameW);
      const rows = Math.floor(img.naturalHeight/frameH);
      const frames = [];
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const fc = document.createElement('canvas');
        fc.width = frameW; fc.height = frameH;
        fc.getContext('2d').drawImage(img, c*frameW, r*frameH, frameW, frameH, 0, 0, frameW, frameH);
        frames.push(fc.toDataURL('image/png'));
      }
      URL.revokeObjectURL(url);
      resolve({ frames, cols, rows, total: frames.length });
    };
    img.onerror = reject;
    img.src = url;
  });
}

// ─── Bone Templates (preserved + expanded) ───────────────────────────────────

export const BONE_TEMPLATES = {
  humanoid:   { name:'Humanoid',    description:'Standard human — works with auto-rig',      boneCount:24 },
  quadruped:  { name:'Quadruped',   description:'Four-legged animal skeleton',                boneCount:20 },
  bird:       { name:'Bird/Winged', description:'Wings instead of arms',                      boneCount:16 },
  snake:      { name:'Serpentine',  description:'Spine chain for snake/worm characters',      boneCount:20 },
  chibi:      { name:'Chibi',       description:'Big head, small body proportions',           boneCount:18 },
  mechanical: { name:'Mechanical',  description:'Robot/mech with rigid segments',             boneCount:22 },
  fantasy:    { name:'Fantasy',     description:'Elf/magic character with extended joints',   boneCount:24 },
};

export default {
  BUILT_IN_CHARACTERS, BONE_TEMPLATES,
  getCategories, getByCategory, getById, searchCharacters,
  drawCharacterSVG, renderCharacterToSVGString, renderCharacterToDataURL,
  getCharacterThumbnailDataURL, exportSpriteSheet, importSpriteSheet,
};
'''

with open(TARGET, 'w') as f:
    f.write(CODE)

print(f"✅ {TARGET}")
print(f"   {len(CODE.splitlines())} lines")
print(f"""
🎉 Character Library upgraded:

  20 built-in characters across 8 categories:
    Professional: News Reporter, Teacher, Doctor, Musician
    Cartoon:      Hero, Villain, Sidekick
    Anime:        Anime Hero, Anime Girl, Ninja
    Chibi:        Chibi Girl, Chibi Boy
    Sci-Fi:       Robot, Cyborg, Alien
    Fantasy:      Elf Mage, Warrior
    Animal:       Fox, Cat
    Minimal:      Stick Figure

  SVG renderers for all 8 styles:
    cartoon, anime, realistic, chibi, mechanical, stick, fantasy, animal

  New functions:
    getById(id), searchCharacters(query)
    renderCharacterToSVGString(), renderCharacterToDataURL()
    getCharacterThumbnailDataURL() — instant preview thumbnails

Run: npm run build 2>&1 | grep "error" | head -10
Then: git add -A && git commit -m "feat: character library — 20 characters, 8 styles, SVG renderers" && git push
""")
