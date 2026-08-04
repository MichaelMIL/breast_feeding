  let audioCtx = null;

  function unlockAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    // iOS requires playing a real (silent) buffer inside the user-gesture call
    // to fully unlock the context for later async playback
    const buf = audioCtx.createBuffer(1, 1, 22050);
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    src.connect(audioCtx.destination);
    src.start(0);
    if (audioCtx.state === 'suspended') audioCtx.resume();
  }

  function playChime() {
    if (!audioCtx) return;
    // resume() in case the browser suspended the context while in background
    audioCtx.resume().then(() => {
      // Three ascending notes: A4 → C#5 → E5 (gentle major arpeggio)
      [[440, 0], [554, 0.28], [659, 0.56]].forEach(([freq, delay]) => {
        const osc  = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.value = freq;
        const t = audioCtx.currentTime + delay;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.28, t + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
        osc.start(t);
        osc.stop(t + 1.4);
      });
    });
  }

  function triggerAlert() {
    // Vibration pattern (works on Android; iOS Safari ignores silently)
    if ('vibrate' in navigator) navigator.vibrate([600, 150, 600, 150, 800]);
    // Screen flash (works everywhere, including iOS silent mode)
    const el = document.getElementById('flashOverlay');
    el.classList.remove('go');
    void el.offsetWidth; // force reflow to restart animation
    el.classList.add('go');
  }
