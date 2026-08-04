  let timerInterval = null;
  let chimePlayed = false;

  function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(tick, 500);
    tick();
  }

  function stopTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = null;
    localStorage.removeItem(TIMER_KEY);
    chimePlayed = false;
    resetTimerUI();
  }

  function tick() {
    const raw = localStorage.getItem(TIMER_KEY);
    if (!raw) { resetTimerUI(); return; }
    const { side, type, start } = JSON.parse(raw);
    const remaining = durationFor(type) - (Date.now() - start);

    const typeLabel = type === 'pump' ? t('pumped') : t('fed');
    const sideLabel = t(side);
    document.getElementById('timerSide').textContent = `${t('lastFed')} ${typeLabel} ${sideLabel}`;

    const dispEl = document.getElementById('timerDisplay');
    document.getElementById('stopBtn').textContent = t('stopBtn');
    document.getElementById('stopBtn').style.display = 'inline-block';
    if (remaining <= 0) {
      if (!chimePlayed) { chimePlayed = true; playChime(); triggerAlert(); }
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
