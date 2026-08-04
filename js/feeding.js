  function fmtDuration(ms) {
    if (!ms || ms <= 0) return '';
    const totalSecs = Math.floor(ms / 1000);
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  }

  function setLastEntryDuration(ms) {
    const entries = getLog();
    if (entries.length > 0 && !entries[0].duration) {
      entries[0].duration = ms;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    }
  }

  function record(side, type) {
    unlockAudio();
    chimePlayed = false;
    const entries = getLog();
    // Save elapsed time for the session that's ending
    const prevRaw = localStorage.getItem(TIMER_KEY);
    if (prevRaw && entries.length > 0 && !entries[0].duration) {
      entries[0].duration = Date.now() - JSON.parse(prevRaw).start;
    }
    entries.unshift({ side, type, time: Date.now() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    // Pumping is logged but does NOT start/reset the feeding countdown timer
    if (type !== 'pump') {
      localStorage.setItem(TIMER_KEY, JSON.stringify({ side, type, start: Date.now() }));
      startTimer();
    }
    renderHistory();
  }

  function buildHistoryItem(e, locale) {
    const d    = new Date(e.time);
    const time = d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    const date = d.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
    const icons = { pee:'💧', poop:'💩', both:'💧💩' };

    if (e.kind === 'feed') {
      const durStr = e.duration ? ` · ${fmtDuration(e.duration)}` : '';
      return `<div class="history-item">
        <div class="history-dot ${e.side}"></div>
        <span class="history-type feed">${t('feed')}</span>
        <span class="history-side ${e.side}">${t(e.side)}</span>
        <span>${date}</span>
        <span class="history-time">${time}${durStr}</span>
      </div>`;
    }
    if (e.kind === 'pump') {
      const durStr = e.duration ? ` · ${fmtDuration(e.duration)}` : '';
      return `<div class="history-item">
        <div class="history-dot pump-${e.side}"></div>
        <span class="history-type pump">${t('pump')}</span>
        <span class="history-side pump-${e.side}">${t(e.side)}</span>
        <span>${date}</span>
        <span class="history-time">${time}${durStr}</span>
      </div>`;
    }
    if (e.kind === 'diaper') {
      const icon  = icons[e.dtype] || '🩲';
      const label = e.dtype === 'pee' ? t('pee') : e.dtype === 'poop' ? t('poop') : t('bothLabel');
      return `<div class="history-item">
        <div class="history-dot" style="background:#c09010"></div>
        <span class="history-type" style="background:#fffde8;color:#c09010">${t('diaper')}</span>
        <span class="history-side" style="color:#c09010">${icon} ${label}</span>
        <span>${date}</span>
        <span class="history-time">${time}</span>
      </div>`;
    }
    if (e.kind === 'med') {
      return `<div class="history-item">
        <div class="history-dot" style="background:#6070c0"></div>
        <span class="history-type" style="background:#eef0ff;color:#5060b0">${t('med')}</span>
        <span class="history-side" style="color:#5060b0;font-size:0.82rem;flex:1">${escHtml(e.medName)}</span>
        <span>${date}</span>
        <span class="history-time">${time}</span>
      </div>`;
    }
    return '';
  }

  function renderHistory() {
    const list = document.getElementById('historyList');
    const locale = getLang() === 'he' ? 'he-IL' : undefined;

    // Tracker tab: only feeding and pumping
    const all = [];
    getLog().forEach(e => all.push({ kind: e.type === 'pump' ? 'pump' : 'feed', side: e.side, time: e.time, duration: e.duration }));
    all.sort((a,b) => b.time - a.time);

    list.innerHTML = all.length
      ? all.map(e => buildHistoryItem(e, locale)).join('')
      : `<div class="empty-state">${t('noSessions')}</div>`;
  }

  function openFullHistory() {
    renderFullHistory();
    document.getElementById('historyOverlay').classList.add('open');
  }
  function closeFullHistory() {
    document.getElementById('historyOverlay').classList.remove('open');
  }
  function renderFullHistory() {
    const list = document.getElementById('fullHistoryList');
    const locale = getLang() === 'he' ? 'he-IL' : undefined;

    const all = [];
    getLog().forEach(e => all.push({ kind: e.type === 'pump' ? 'pump' : 'feed', side: e.side, time: e.time, duration: e.duration }));
    getDiapers().forEach(d => all.push({ kind: 'diaper', dtype: d.type, time: d.time }));
    getMedHistory().forEach(m => all.push({ kind: 'med', medName: m.medName, time: m.time }));
    all.sort((a,b) => b.time - a.time);

    list.innerHTML = all.length
      ? all.map(e => buildHistoryItem(e, locale)).join('')
      : `<div class="empty-state">${t('noSessions')}</div>`;
  }

  function exportCSV() {
    const entries = getLog();
    if (entries.length === 0) { alert(t('noData')); return; }
    const rows = [['Date', 'Time', 'Type', 'Side', 'Unix Timestamp']];
    entries.forEach(e => {
      const d    = new Date(e.time);
      const date = d.toLocaleDateString([], { year: 'numeric', month: '2-digit', day: '2-digit' });
      const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const type = (e.type || 'feed').charAt(0).toUpperCase() + (e.type || 'feed').slice(1);
      const side = e.side.charAt(0).toUpperCase() + e.side.slice(1);
      rows.push([date, time, type, side, e.time]);
    });
    const csv  = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    const now = new Date();
    const ts  = now.toISOString().slice(0,16).replace('T','_').replace(':','-');
    a.download = `feeding-log-${ts}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function clearHistory() {
    if (!confirm(t('clearAllConfirm'))) return;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TIMER_KEY);
    if (timerInterval) clearInterval(timerInterval);
    resetTimerUI();
    renderHistory();
  }
