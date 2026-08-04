  const APP_VERSION = "1.10";
  const STORAGE_KEY = 'feedingLog';
  const TIMER_KEY   = 'feedingTimer';
  const CFG_KEY     = 'feedingConfig';

  function getConfig() {
    const saved = JSON.parse(localStorage.getItem(CFG_KEY) || '{}');
    return {
      feedMins:  saved.feedMins  ?? 20,
      pumpMins:  saved.pumpMins  ?? 5,
      keepAwake: saved.keepAwake ?? true,
    };
  }

  function durationFor(type) {
    const cfg = getConfig();
    return (type === 'pump' ? cfg.pumpMins : cfg.feedMins) * 60 * 1000;
  }

  function getLog() { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }

  function setText(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }
  function setBar(id, pct)  { const el = document.getElementById(id); if (el) el.style.width = pct + '%'; }

  function escHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
