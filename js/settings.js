  // Settings
  function openSettings() {
    const cfg = getConfig();
    document.getElementById('cfgFeed').value      = cfg.feedMins;
    document.getElementById('cfgPump').value      = cfg.pumpMins;
    document.getElementById('cfgWakeLock').checked = cfg.keepAwake;
    document.getElementById('overlay').classList.add('open');
  }
  function closeSettings() {
    document.getElementById('overlay').classList.remove('open');
  }
  function saveSettings() {
    const feedMins  = Math.max(1, parseInt(document.getElementById('cfgFeed').value) || 20);
    const pumpMins  = Math.max(1, parseInt(document.getElementById('cfgPump').value) || 5);
    const keepAwake = document.getElementById('cfgWakeLock').checked;
    localStorage.setItem(CFG_KEY, JSON.stringify({ feedMins, pumpMins, keepAwake }));
    applyWakeLock();
    closeSettings();
  }
