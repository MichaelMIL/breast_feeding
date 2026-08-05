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

  function parseCsvLine(line) {
    const cols = [];
    let cur = '', inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQ) {
        if (ch === '"' && line[i+1] === '"') { cur += '"'; i++; }
        else if (ch === '"') { inQ = false; }
        else { cur += ch; }
      } else {
        if (ch === '"') { inQ = true; }
        else if (ch === ',') { cols.push(cur.trim()); cur = ''; }
        else { cur += ch; }
      }
    }
    cols.push(cur.trim());
    return cols;
  }

  function importCSV(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const lines = e.target.result.split('\n').map(l => l.trim()).filter(l => l);
      if (!lines.length) { alert(t('importNoData')); return; }

      let section = null;
      let counts  = { feeding: 0, diapers: 0, meds: 0, medHistory: 0 };
      let newFeeding = [], newDiapers = [], newMeds = [], newMedHistory = [];
      let newSettings = null;
      let isHeader = false;

      for (const line of lines) {
        if (line.startsWith('### ') && line.endsWith(' ###')) {
          section = line.slice(4, -4).toUpperCase();
          isHeader = true;
          continue;
        }
        if (isHeader) { isHeader = false; continue; } // skip column header row

        const cols = parseCsvLine(line);
        if (section === 'SETTINGS') {
          if (cols.length >= 5) {
            newSettings = {
              feedMins:  parseInt(cols[0]) || 20,
              pumpMins:  parseInt(cols[1]) || 5,
              keepAwake: cols[2] === 'true',
              nightMode: cols[3] === 'true',
              lang:      cols[4] || 'en',
            };
          }
        } else if (section === 'FEEDING') {
          if (cols.length >= 6) {
            const ts   = parseInt(cols[5]);
            const type = (cols[2] || '').toLowerCase();
            const side = (cols[3] || '').toLowerCase();
            const dur  = parseInt(cols[4]) || undefined;
            if (!isNaN(ts) && ['feed','pump'].includes(type) && ['left','right'].includes(side)) {
              newFeeding.push({ side, type, time: ts, ...(dur ? { duration: dur } : {}) });
              counts.feeding++;
            }
          }
        } else if (section === 'DIAPERS') {
          if (cols.length >= 4) {
            const ts   = parseInt(cols[3]);
            const type = (cols[2] || '').toLowerCase();
            if (!isNaN(ts) && ['pee','poop','both'].includes(type)) {
              newDiapers.push({ type, time: ts });
              counts.diapers++;
            }
          }
        } else if (section === 'MEDICATIONS') {
          if (cols.length >= 3) {
            const id      = cols[0];
            const name    = cols[1];
            const interval = parseFloat(cols[2]);
            const lastTaken = parseInt(cols[3]) || null;
            if (id && name && !isNaN(interval)) {
              newMeds.push({ id, name, intervalHours: interval, ...(lastTaken ? { lastTaken } : {}) });
              counts.meds++;
            }
          }
        } else if (section === 'MED HISTORY') {
          if (cols.length >= 4) {
            const medName = cols[0];
            const ts      = parseInt(cols[3]);
            if (medName && !isNaN(ts)) {
              newMedHistory.push({ medName, time: ts });
              counts.medHistory++;
            }
          }
        }
      }

      const totalImported = counts.feeding + counts.diapers + counts.meds + counts.medHistory;
      if (!totalImported && !newSettings) { alert(t('importNoValid')); event.target.value = ''; return; }

      // Merge feeding
      if (newFeeding.length) {
        const existing   = getLog();
        const existingTs = new Set(existing.map(x => x.time));
        const merged     = [...existing, ...newFeeding.filter(x => !existingTs.has(x.time))].sort((a,b) => b.time - a.time);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      }
      // Merge diapers
      if (newDiapers.length) {
        const existing   = getDiapers();
        const existingTs = new Set(existing.map(x => x.time));
        const merged     = [...existing, ...newDiapers.filter(x => !existingTs.has(x.time))].sort((a,b) => b.time - a.time);
        localStorage.setItem(DIAPER_KEY, JSON.stringify(merged));
      }
      // Replace meds list (imported definitions win)
      if (newMeds.length) {
        localStorage.setItem(MED_KEY, JSON.stringify(newMeds));
      }
      // Merge med history
      if (newMedHistory.length) {
        const existing   = getMedHistory();
        const existingTs = new Set(existing.map(x => x.time));
        const merged     = [...existing, ...newMedHistory.filter(x => !existingTs.has(x.time))].sort((a,b) => b.time - a.time);
        localStorage.setItem(MED_HISTORY_KEY, JSON.stringify(merged));
      }
      // Restore settings
      if (newSettings) {
        const { lang, ...cfgFields } = newSettings;
        localStorage.setItem(CFG_KEY, JSON.stringify(cfgFields));
        setLang(lang);
      }

      applyTheme();
      applyLang();
      updateLangBtns();
      applyWakeLock();
      resetTimerUI();
      renderHistory();
      renderMeds();
      renderDiapers();

      alert(t('importSuccess', totalImported));
      event.target.value = '';
      closeSettings();
    };
    reader.readAsText(file);
  }
