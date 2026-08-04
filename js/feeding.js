  function record(side, type) {
    unlockAudio();
    chimePlayed = false;
    const entries = getLog();
    entries.unshift({ side, type, time: Date.now() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    localStorage.setItem(TIMER_KEY, JSON.stringify({ side, type, start: Date.now() }));
    renderHistory();
    startTimer();
  }

  function renderHistory() {
    const list = document.getElementById('historyList');
    const entries = getLog();
    if (entries.length === 0) {
      list.innerHTML = '<div class="empty-state">No sessions logged yet</div>';
      return;
    }
    list.innerHTML = entries.map(e => {
      const d    = new Date(e.time);
      const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const date = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
      const type = e.type || 'feed';
      const dotClass  = type === 'pump' ? `pump-${e.side}` : e.side;
      const sideClass = type === 'pump' ? `pump-${e.side}` : e.side;
      const sideLabel = e.side.charAt(0).toUpperCase() + e.side.slice(1);
      const typeLabel = type === 'pump' ? 'Pump' : 'Feed';
      return `<div class="history-item">
        <div class="history-dot ${dotClass}"></div>
        <span class="history-type ${type}">${typeLabel}</span>
        <span class="history-side ${sideClass}">${sideLabel}</span>
        <span>${date}</span>
        <span class="history-time">${time}</span>
      </div>`;
    }).join('');
  }

  function exportCSV() {
    const entries = getLog();
    if (entries.length === 0) { alert('No data to export.'); return; }
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
    if (!confirm('Clear all history?')) return;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TIMER_KEY);
    if (timerInterval) clearInterval(timerInterval);
    resetTimerUI();
    renderHistory();
  }
