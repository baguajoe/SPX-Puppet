
// usePuppetMocap.js — webcam → MediaPipe pose → puppet rig update
import { useState, useRef, useCallback, useEffect } from 'react';
import { updateRigFromPose } from '../utils/PuppetRig.js';

const loadScript = (src) => new Promise((res, rej) => {
  if (document.querySelector(`script[src="${src}"]`)) return res();
  const s = document.createElement('script');
  s.src = src; s.onload = res; s.onerror = rej;
  document.head.appendChild(s);
});

export default function usePuppetMocap(videoRef, rigRef, onRigUpdate, enabled = true) {
  const poseRef    = useRef(null);
  const cameraRef  = useRef(null);
  const [status, setStatus]   = useState('idle');
  const [fps, setFps]         = useState(0);
  const [landmarks, setLandmarks] = useState(null);
  const fpsRef = useRef({ frames: 0, last: performance.now() });

  const start = useCallback(async () => {
    if (!enabled || !videoRef?.current) return;
    setStatus('loading');
    try {
      await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js');
      await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');

      const pose = new window.Pose({
        locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${f}`,
      });
      pose.setOptions({ modelComplexity: 1, smoothLandmarks: true, enableSegmentation: false, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });

      pose.onResults((results) => {
        if (!results.poseLandmarks) return;
        const lms = results.poseLandmarks;
        setLandmarks(lms);

        // Update rig
        if (rigRef?.current) {
          rigRef.current = updateRigFromPose(rigRef.current, lms, 640, 480);
          onRigUpdate?.(rigRef.current);
        }

        // FPS
        fpsRef.current.frames++;
        const now = performance.now();
        if (now - fpsRef.current.last >= 1000) {
          setFps(fpsRef.current.frames);
          fpsRef.current = { frames: 0, last: now };
        }
      });

      poseRef.current = pose;

      const camera = new window.Camera(videoRef.current, {
        onFrame: async () => { await poseRef.current?.send({ image: videoRef.current }); },
        width: 640, height: 480,
      });
      await camera.start();
      cameraRef.current = camera;
      setStatus('running');
    } catch (err) {
      console.error('[usePuppetMocap]', err);
      setStatus('error');
    }
  }, [enabled, videoRef, rigRef, onRigUpdate]);

  const stop = useCallback(() => {
    cameraRef.current?.stop(); cameraRef.current = null;
    poseRef.current?.close(); poseRef.current = null;
    if (videoRef?.current) videoRef.current.srcObject = null;
    setStatus('idle'); setFps(0); setLandmarks(null);
  }, [videoRef]);

  useEffect(() => () => stop(), [stop]);

  return { status, fps, landmarks, start, stop };
}
