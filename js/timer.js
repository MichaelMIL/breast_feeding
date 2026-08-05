  let timerInterval = null;
  let chimePlayed = false;

  function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(tick, 500);
    tick();
  }

  function stopTimer() {
    const raw = localStorage.getItem(TIMER_KEY);
    if (raw) {
      const { start } = JSON.parse(raw);
      setLastEntryDuration(Date.now() - start);
    }
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = null;
    localStorage.removeItem(TIMER_KEY);
    chimePlayed = false;
    resetTimerUI();
    renderHistory();
  }

  function tick() {
    const raw = localStorage.getItem(TIMER_KEY);
    if (!raw) { resetTimerUI(); return; }
    const { side, type, start } = JSON.parse(raw);
    const remaining = durationFor(type) - (Date.now() - start);

    const lastFeedSide = localStorage.getItem(LAST_FEED_KEY);
    document.getElementById('timerSide').textContent = lastFeedSide
      ? `${t('lastFed')} ${t('fed')} ${t(lastFeedSide)}`
      : '—';

    const dispEl = document.getElementById('timerDisplay');
    document.getElementById('stopBtn').textContent = t('stopBtn');
    document.getElementById('stopBtn').style.display = 'inline-block';
    if (remaining <= 0) {
      if (!chimePlayed) {
        chimePlayed = true;
        playChime();
        triggerAlert();
        setLastEntryDuration(durationFor(type));
        renderHistory();
      }
      dispEl.textContent = t('feedNow');
      dispEl.className = 'timer-display done';
    } else {
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      dispEl.textContent = `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
      dispEl.className = 'timer-display running';
    }
  }

  function resetTimerUI() {
    document.getElementById('timerSide').textContent = '—';
    const d = document.getElementById('timerDisplay');
    d.textContent = '—'; d.className = 'timer-display';
    document.getElementById('stopBtn').style.display = 'none';
  }
