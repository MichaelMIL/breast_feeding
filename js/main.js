  // Init
  function applyTheme() {
    const cfg = getConfig();
    document.documentElement.setAttribute('data-theme', cfg.nightMode !== false ? 'dark' : 'light');
  }

  applyTheme();
  applyLang();
  updateLangBtns();
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

  // Seed default medications on first launch
  if (getMeds().length === 0) {
    saveMeds([
      { id: 'default-ibu', name: 'Ibuprofen', intervalHours: 8,  lastTaken: null },
      { id: 'default-aca', name: 'Acamol',    intervalHours: 6,  lastTaken: null },
      { id: 'default-opt', name: 'Optalgin',  intervalHours: 6,  lastTaken: null },
    ]);
    renderMeds();
  }
