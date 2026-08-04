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
