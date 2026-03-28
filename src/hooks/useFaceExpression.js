
// useFaceExpression.js — FaceMesh hook for expression tracking
import { useState, useRef, useCallback, useEffect } from 'react';
import { createFaceExpressionEngine, EXPRESSIONS } from '../utils/PuppetFaceExpressions.js';

export default function useFaceExpression(videoRef, enabled = true) {
  const engineRef  = useRef(null);
  const [expression, setExpression] = useState({ ...EXPRESSIONS.neutral });
  const [faceLandmarks, setFaceLandmarks] = useState(null);
  const [status, setStatus] = useState('idle');

  const start = useCallback(async () => {
    if (!enabled || !videoRef?.current) return;
    setStatus('loading');
    try {
      const engine = createFaceExpressionEngine();
      await engine.start(videoRef.current, (expr, lms) => {
        setExpression(expr);
        setFaceLandmarks(lms);
      });
      engineRef.current = engine;
      setStatus('running');
    } catch (err) {
      console.error('[useFaceExpression]', err);
      setStatus('error');
    }
  }, [enabled, videoRef]);

  const stop = useCallback(() => {
    engineRef.current?.stop();
    engineRef.current = null;
    setExpression({ ...EXPRESSIONS.neutral });
    setFaceLandmarks(null);
    setStatus('idle');
  }, []);

  useEffect(() => () => stop(), [stop]);

  return { expression, faceLandmarks, status, start, stop };
}
