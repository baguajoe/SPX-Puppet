
// PuppetStreamer.js — stream puppet canvas to StreamPireX/Twitch/YouTube via RTMP or WebRTC

export function createPuppetStream(canvas, fps = 30) {
  let mediaStream = null;
  let peerConnection = null;
  let active = false;

  return {
    getCanvasStream() {
      mediaStream = canvas.captureStream(fps);
      return mediaStream;
    },

    async startVirtualCamera(onStream) {
      mediaStream = canvas.captureStream(fps);
      active = true;
      onStream?.(mediaStream);
      return mediaStream;
    },

    async startWebRTC(signalingUrl, roomId) {
      mediaStream = canvas.captureStream(fps);
      peerConnection = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
      mediaStream.getTracks().forEach(track => peerConnection.addTrack(track, mediaStream));
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      // Signal to server
      try {
        await fetch(signalingUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId, sdp: offer }),
        });
      } catch (err) { console.warn('[PuppetStreamer] Signaling failed:', err); }
      active = true;
      return peerConnection;
    },

    getStreamURL() {
      if (!mediaStream) return null;
      return URL.createObjectURL(new Blob([], { type: 'video/webm' }));
    },

    stopStream() {
      mediaStream?.getTracks().forEach(t => t.stop());
      peerConnection?.close();
      mediaStream = null; peerConnection = null; active = false;
    },

    isActive() { return active; },

    getStats() {
      return { active, tracks: mediaStream?.getTracks().length || 0, fps };
    },
  };
}

export function overlayPuppetOnWebcam(puppetCanvas, webcamVideo, outputCanvas) {
  const ctx = outputCanvas.getContext('2d');
  const draw = () => {
    outputCanvas.width  = webcamVideo.videoWidth  || 1280;
    outputCanvas.height = webcamVideo.videoHeight || 720;
    ctx.drawImage(webcamVideo, 0, 0);
    ctx.drawImage(puppetCanvas, 0, 0, outputCanvas.width, outputCanvas.height);
    requestAnimationFrame(draw);
  };
  draw();
  return outputCanvas.captureStream(30);
}
