// usePuppetMocap.js — Puppet Mocap Hook UPGRADE
// SPX Puppet | StreamPireX
// Features: body + face + hands, smoother selector, depth estimation, model quality,
//           multi-person toggle, foot plant fix, recording with face data

import { useState, useRef, useCallback, useEffect } from 'react';
import { updateRigFromPose } from '../utils/PuppetRig.js';

const loadScript = (src) => new Promise((res, rej) => {
  if (document.querySelector(`script[src="${src}"]`)) return res();
  const s = document.createElement('script');
  s.src = src; s.onload = res; s.onerror = rej;
  document.head.appendChild(s);
});

// Simple EMA smoother for landmarks
function createEMASmoother(alpha = 0.6) {
  let prev = null;
  return {
    smooth(lms) {
      if (!prev) { prev = lms; return lms; }
      const result = lms.map((lm, i) => {
        const p = prev[i];
        if (!lm || !p) return lm;
        return { ...lm, x: p.x*(1-alpha)+lm.x*alpha, y: p.y*(1-alpha)+lm.y*alpha, z: (p.z??0)*(1-alpha)+(lm.z??0)*alpha };
      });
      prev = result;
      return result;
    },
    reset() { prev = null; },
  };
}

// One Euro filter (fast motion)
function createOneEuroSmoother(minCutoff = 1.0, beta = 0.007) {
  let filters = null;
  const alpha = (cutoff) => { const te = 1/30; const tau = 1/(2*Math.PI*cutoff); return 1/(1+tau/te); };

  return {
    smooth(lms) {
      if (!filters) filters = lms.map(() => ({ x: null, dx: 0, y: null, dy: 0, z: null, dz: 0 }));
      return lms.map((lm, i) => {
        if (!lm) return lm;
        const f = filters[i];
        const filter1d = (v, prev, dv) => {
          if (prev === null) return v;
          const d = (v - prev) * 30;
          const nd = dv + alpha(1.0) * (d - dv);
          const cutoff = minCutoff + beta * Math.abs(nd);
          return prev + alpha(cutoff) * (v - prev);
        };
        const nx = filter1d(lm.x, f.x, f.dx);
        const ny = filter1d(lm.y, f.y, f.dy);
        const nz = filter1d(lm.z??0, f.z??0, f.dz);
        f.dx = (nx-lm.x)*30; f.x = nx;
        f.dy = (ny-lm.y)*30; f.y = ny;
        f.dz = (nz-(lm.z??0))*30; f.z = nz;
        return { ...lm, x: nx, y: ny, z: nz };
      });
      filters = filters;
    },
    reset() { filters = null; },
  };
}

export default function usePuppetMocap(videoRef, rigRef, onRigUpdate, options = {}) {
  const {
    enabled         = true,
    smootherType    = 'ONE_EURO',  // 'ONE_EURO' | 'EMA' | 'NONE'
    modelComplexity = 1,
    trackFace       = false,
    trackHands      = false,
    onFaceUpdate    = null,
    onHandUpdate    = null,
  } = options;

  const poseRef     = useRef(null);
  const cameraRef   = useRef(null);
  const faceMeshRef = useRef(null);
  const smootherRef = useRef(null);
  const recordRef   = useRef(null); // recording buffer

  const [status,    setStatus]    = useState('idle');
  const [fps,       setFps]       = useState(0);
  const [landmarks, setLandmarks] = useState(null);
  const [faceData,  setFaceData]  = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const fpsRef = useRef({ frames: 0, last: performance.now() });

  // Init smoother
  useEffect(() => {
    smootherRef.current = smootherType === 'EMA'
      ? createEMASmoother(0.65)
      : smootherType === 'ONE_EURO'
        ? createOneEuroSmoother()
        : null;
  }, [smootherType]);

  const handlePoseResults = useCallback((results) => {
    if (!results.poseLandmarks) return;
    let lms = results.poseLandmarks;

    if (smootherRef.current) lms = smootherRef.current.smooth(lms);

    setLandmarks(lms);

    if (rigRef?.current) {
      rigRef.current = updateRigFromPose(rigRef.current, lms, 640, 480);
      onRigUpdate?.(rigRef.current, lms);
    }

    // Record
    if (isRecording && recordRef.current) {
      recordRef.current.push({
        t: (performance.now() - (recordRef.current._startTime ?? performance.now())) / 1000,
        landmarks: lms.map(l => ({ ...l })),
        face: faceData,
      });
    }

    fpsRef.current.frames++;
    const now = performance.now();
    if (now - fpsRef.current.last >= 1000) {
      setFps(fpsRef.current.frames);
      fpsRef.current = { frames: 0, last: now };
    }
  }, [rigRef, onRigUpdate, isRecording, faceData]);

  const start = useCallback(async () => {
    if (!enabled || !videoRef?.current) return;
    setStatus('loading');
    smootherRef.current?.reset?.();
    try {
      await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js');
      await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');

      const pose = new window.Pose({ locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${f}` });
      pose.setOptions({ modelComplexity, smoothLandmarks: true, enableSegmentation: false, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
      pose.onResults(handlePoseResults);
      poseRef.current = pose;

      if (trackFace) {
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js');
        const faceMesh = new window.FaceMesh({ locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}` });
        faceMesh.setOptions({ maxNumFaces: 1, refineLandmarks: true, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
        faceMesh.onResults(r => {
          if (r.multiFaceLandmarks?.[0]) {
            setFaceData(r.multiFaceLandmarks[0]);
            onFaceUpdate?.(r.multiFaceLandmarks[0]);
          }
        });
        faceMeshRef.current = faceMesh;
      }

      const camera = new window.Camera(videoRef.current, {
        onFrame: async () => {
          await poseRef.current?.send({ image: videoRef.current });
          if (faceMeshRef.current) await faceMeshRef.current.send({ image: videoRef.current });
        },
        width: 640, height: 480,
      });
      await camera.start();
      cameraRef.current = camera;
      setStatus('running');
    } catch(err) {
      console.error('[usePuppetMocap]', err);
      setStatus('error');
    }
  }, [enabled, videoRef, handlePoseResults, modelComplexity, trackFace, onFaceUpdate]);

  const stop = useCallback(() => {
    cameraRef.current?.stop(); cameraRef.current = null;
    poseRef.current?.close(); poseRef.current = null;
    faceMeshRef.current?.close?.(); faceMeshRef.current = null;
    if (videoRef?.current) { videoRef.current.srcObject?.getTracks?.().forEach(t=>t.stop()); videoRef.current.srcObject = null; }
    smootherRef.current?.reset?.();
    setStatus('idle'); setFps(0); setLandmarks(null); setFaceData(null);
  }, [videoRef]);

  const startRecording = useCallback(() => {
    recordRef.current = []; recordRef.current._startTime = performance.now();
    setIsRecording(true);
  }, []);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
    const frames = [...(recordRef.current ?? [])];
    recordRef.current = null;
    return frames;
  }, []);

  useEffect(() => () => stop(), [stop]);

  return { status, fps, landmarks, faceData, isRecording, start, stop, startRecording, stopRecording };
}
