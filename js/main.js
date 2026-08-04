  // Init
  applyWakeLock();
  renderHistory();
  renderDiapers();
  document.getElementById('appVersion').textContent = `v${APP_VERSION}`;
  const savedTimer = localStorage.getItem(TIMER_KEY);
  if (savedTimer) {
    const { type, start } = JSON.parse(savedTimer);
    if (durationFor(type) - (Date.now() - start) <= 0) chimePlayed = true;
    startTimer();
  }
  startMedInterval();
