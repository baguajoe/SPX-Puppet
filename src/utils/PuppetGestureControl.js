
// PuppetGestureControl.js — hand gestures trigger expressions and actions

export const GESTURES = {
  FIST:       'fist',
  OPEN_HAND:  'open_hand',
  PINCH:      'pinch',
  THUMBS_UP:  'thumbs_up',
  THUMBS_DOWN:'thumbs_down',
  PEACE:      'peace',
  POINT:      'point',
};

function dist3(a, b) {
  return Math.sqrt((a.x-b.x)**2 + (a.y-b.y)**2 + ((a.z||0)-(b.z||0))**2);
}

export function detectGesture(handLandmarks) {
  if (!handLandmarks || handLandmarks.length < 21) return null;
  const lms = handLandmarks;
  const palmSize = dist3(lms[0], lms[9]);

  const fingerExtended = (tip, pip) => dist3(lms[tip], lms[0]) > dist3(lms[pip], lms[0]) * 1.1;
  const thumbUp = dist3(lms[4], lms[0]) > palmSize * 1.2;
  const indexUp  = fingerExtended(8,  6);
  const middleUp = fingerExtended(12, 10);
  const ringUp   = fingerExtended(16, 14);
  const pinkyUp  = fingerExtended(20, 18);

  const pinch = dist3(lms[4], lms[8]) < palmSize * 0.35;
  const fist  = !indexUp && !middleUp && !ringUp && !pinkyUp;
  const open  = indexUp && middleUp && ringUp && pinkyUp;

  if (pinch)               return GESTURES.PINCH;
  if (fist)                return GESTURES.FIST;
  if (open)                return GESTURES.OPEN_HAND;
  if (thumbUp && !indexUp) return GESTURES.THUMBS_UP;
  if (!thumbUp && !indexUp && !middleUp && !ringUp && !pinkyUp) return GESTURES.THUMBS_DOWN;
  if (indexUp && middleUp && !ringUp && !pinkyUp) return GESTURES.PEACE;
  if (indexUp && !middleUp && !ringUp && !pinkyUp) return GESTURES.POINT;
  return null;
}

export const GESTURE_ACTIONS = {
  [GESTURES.FIST]:        { expression:'angry',     label:'😠 Angry' },
  [GESTURES.OPEN_HAND]:   { expression:'happy',     label:'😊 Happy' },
  [GESTURES.PINCH]:       { expression:'surprised', label:'😲 Surprised' },
  [GESTURES.THUMBS_UP]:   { expression:'happy',     label:'👍 Happy' },
  [GESTURES.THUMBS_DOWN]: { expression:'sad',       label:'👎 Sad' },
  [GESTURES.PEACE]:       { expression:'cool',      label:'✌️ Cool' },
  [GESTURES.POINT]:       { expression:'neutral',   label:'👆 Neutral' },
};

export function createGestureController() {
  let lastGesture = null;
  let debounceTimer = null;
  const DEBOUNCE_MS = 500;

  return {
    update(handLandmarks, onGesture) {
      const gesture = detectGesture(handLandmarks);
      if (gesture && gesture !== lastGesture) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          lastGesture = gesture;
          const action = GESTURE_ACTIONS[gesture];
          if (action) onGesture?.(gesture, action);
        }, DEBOUNCE_MS);
      }
      return gesture;
    },
    reset() { lastGesture = null; clearTimeout(debounceTimer); },
  };
}
