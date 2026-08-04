  // Wake lock
  let wakeLock = null;
  let wakeLockHeartbeat = null;

  function setWakeLockStatus(text, color) {
    const el = document.getElementById('wakeLockStatus');
    if (el) { el.textContent = text; el.style.color = color; }
  }

  async function acquireWakeLock() {
    if (!('wakeLock' in navigator)) {
      setWakeLockStatus('Not supported by this browser', '#e0a060');
      return;
    }
    if (document.visibilityState !== 'visible') return;
    if (wakeLock && !wakeLock.released) return; // already held
    try {
      wakeLock = await navigator.wakeLock.request('screen');
      setWakeLockStatus('Active — screen will stay on', '#2d7a4a');
      // Re-acquire immediately if the browser drops it
      wakeLock.addEventListener('release', () => {
        setWakeLockStatus('Released — reacquiring…', '#c0724a');
        if (document.visibilityState === 'visible' && getConfig().keepAwake !== false) {
          setTimeout(acquireWakeLock, 300);
        }
      });
    } catch (e) {
      setWakeLockStatus('Could not lock: ' + e.message, '#c05050');
    }
  }

  function releaseWakeLock() {
    if (wakeLockHeartbeat) { clearInterval(wakeLockHeartbeat); wakeLockHeartbeat = null; }
    if (wakeLock && !wakeLock.released) wakeLock.release();
    wakeLock = null;
    setWakeLockStatus('Disabled', '#bbb');
  }

  async function applyWakeLock() {
    const enabled = getConfig().keepAwake !== false;
    if (enabled) {
      await acquireWakeLock();
      // Heartbeat: recheck every 20s — some browsers silently drop the lock
      if (!wakeLockHeartbeat) {
        wakeLockHeartbeat = setInterval(() => {
          if (getConfig().keepAwake !== false) acquireWakeLock();
        }, 20000);
      }
    } else {
      releaseWakeLock();
    }
  }

  // Re-acquire whenever the page becomes visible again
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && getConfig().keepAwake !== false) {
      acquireWakeLock();
    }
  });
  window.addEventListener('focus', () => {
    if (getConfig().keepAwake !== false) acquireWakeLock();
  });
