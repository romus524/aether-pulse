import { useEffect, useRef } from 'react';

function loadJitsiScript() {
  return new Promise((resolve, reject) => {
    if (window.JitsiMeetExternalAPI) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://meet.jit.si/external_api.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Jitsi script'));
    document.body.appendChild(script);
  });
}

export default function ScreenShare({ roomName, displayName = 'AetherPulse Staff', onClose }) {
  const containerRef = useRef(null);
  const apiRef = useRef(null);

  useEffect(() => {
    if (!roomName) return undefined;
    let cancelled = false;

    loadJitsiScript()
      .then(() => {
        if (cancelled || !containerRef.current) return;

        apiRef.current = new window.JitsiMeetExternalAPI('meet.jit.si', {
          roomName,
          parentNode: containerRef.current,
          userInfo: { displayName },
          configOverwrite: {
            prejoinPageEnabled: false,
            startWithVideoMuted: false,
            startWithAudioMuted: false,
          },
          interfaceConfigOverwrite: {
            TOOLBAR_BUTTONS: ['microphone', 'camera', 'desktop', 'hangup', 'fullscreen', 'tileview'],
          },
        });

        apiRef.current.addEventListener('videoConferenceJoined', () => {
          apiRef.current?.executeCommand('toggleShareScreen');
        });
        apiRef.current.addEventListener('readyToClose', () => {
          onClose?.();
        });
      })
      .catch((error) => {
        console.error('Unable to load Jitsi screen share', error);
        onClose?.();
      });

    return () => {
      cancelled = true;
      apiRef.current?.dispose();
      apiRef.current = null;
    };
  }, [roomName, displayName, onClose]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '80vh', borderRadius: 12, overflow: 'hidden' }}
    />
  );
}
