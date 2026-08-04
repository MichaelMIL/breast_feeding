  // Settings
  function openSettings() {
    const cfg = getConfig();
    document.getElementById('cfgFeed').value       = cfg.feedMins;
    document.getElementById('cfgPump').value       = cfg.pumpMins;
    document.getElementById('cfgWakeLock').checked = cfg.keepAwake;
    document.getElementById('cfgNightMode').checked = cfg.nightMode !== false;
    updateLangBtns();
    document.getElementById('overlay').classList.add('open');
  }
  function closeSettings() {
    document.getElementById('overlay').classList.remove('open');
  }
  function saveSettings() {
    const feedMins  = Math.max(1, parseInt(document.getElementById('cfgFeed').value) || 20);
    const pumpMins  = Math.max(1, parseInt(document.getElementById('cfgPump').value) || 5);
    const keepAwake = document.getElementById('cfgWakeLock').checked;
    const nightMode = document.getElementById('cfgNightMode').checked;
    localStorage.setItem(CFG_KEY, JSON.stringify({ feedMins, pumpMins, keepAwake, nightMode }));
    applyWakeLock();
    applyTheme();
    closeSettings();
  }

  function switchLang(lang) {
    setLang(lang);
    applyLang();
    updateLangBtns();
  }

  function updateLangBtns() {
    const lang = getLang();
    document.getElementById('langEn').className = 'lang-btn' + (lang === 'en' ? ' active' : '');
    document.getElementById('langHe').className = 'lang-btn' + (lang === 'he' ? ' active' : '');
  }

  function resetApp() {
    if (!confirm(t('resetConfirm'))) return;
    [STORAGE_KEY, TIMER_KEY, DIAPER_KEY, MED_KEY, MED_HISTORY_KEY, LAST_FEED_KEY].forEach(k => localStorage.removeItem(k));
    if (timerInterval) clearInterval(timerInterval);
    resetTimerUI();
    renderHistory();
    renderMeds();
    renderDiapers();
    closeSettings();
  }

  function triggerImportCSV() {
    document.getElementById('importCsvInput').click();
  }

  function importCSV(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const lines = e.target.result.trim().split('\n');
      if (lines.length < 2) { alert(t('importNoData')); return; }
      const imported = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',');
        if (cols.length < 5) continue;
        const ts   = parseInt(cols[4].trim());
        const type = (cols[2] || '').trim().toLowerCase();
        const side = (cols[3] || '').trim().toLowerCase();
        if (isNaN(ts) || !['feed','pump'].includes(type) || !['left','right'].includes(side)) continue;
        imported.push({ side, type, time: ts });
      }
      if (!imported.length) { alert(t('importNoValid')); event.target.value = ''; return; }
      const existing   = getLog();
      const existingTs = new Set(existing.map(e => e.time));
      const newEntries = imported.filter(e => !existingTs.has(e.time));
      const merged     = [...existing, ...newEntries].sort((a,b) => b.time - a.time);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      renderHistory();
      alert(t('importSuccess', newEntries.length));
      event.target.value = '';
      closeSettings();
    };
    reader.readAsText(file);
  }
