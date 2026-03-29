// PuppetStreamPireXBridge.js — Send puppet animations/recordings to StreamPireX

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'https://streampirex-production.up.railway.app';

function getAuth() {
  const t = localStorage.getItem('jwt-token') || localStorage.getItem('token') || '';
  return { 'Authorization': `Bearer ${t}` };
}

export async function uploadPuppetRecording(blob, filename = 'puppet_recording.webm', meta = {}) {
  const form = new FormData();
  form.append('file', blob, filename);
  form.append('folder', 'puppet');
  form.append('meta', JSON.stringify({ ...meta, source: 'spx-puppet', exportedAt: Date.now() }));
  const res = await fetch(`${BACKEND}/api/r2/upload`, { method: 'POST', headers: getAuth(), body: form });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  return await res.json();
}

export async function savePuppetProject(projectData, name = 'puppet_project') {
  const blob = new Blob([JSON.stringify(projectData)], { type: 'application/json' });
  const form = new FormData();
  form.append('file', blob, name + '.json');
  form.append('folder', 'puppet/projects');
  const res = await fetch(`${BACKEND}/api/r2/upload`, { method: 'POST', headers: getAuth(), body: form });
  if (!res.ok) throw new Error(`Save failed: ${res.status}`);
  return await res.json();
}

export async function listPuppetProjects() {
  const res = await fetch(`${BACKEND}/api/r2/list?folder=puppet/projects`, { headers: { ...getAuth(), 'Content-Type': 'application/json' } });
  if (!res.ok) throw new Error(`List failed: ${res.status}`);
  return await res.json();
}

export function notifyStreamPireX(url, name, type = 'puppet') {
  try {
    const lib = JSON.parse(localStorage.getItem('spx_puppet_library') || '[]');
    lib.unshift({ url, name, type, addedAt: Date.now() });
    localStorage.setItem('spx_puppet_library', JSON.stringify(lib.slice(0, 50)));
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'SPX_PUPPET_READY', url, name }, '*');
    }
  } catch(e) { console.warn('SPX notify failed:', e); }
}
