  // ── Diapers ──
  const DIAPER_KEY = 'diaperLog';
  let selectedDtype = null;

  function getDiapers() { return JSON.parse(localStorage.getItem(DIAPER_KEY) || '[]'); }
  function saveDiapers(list) { localStorage.setItem(DIAPER_KEY, JSON.stringify(list)); }

  function openAddDiaper() {
    selectedDtype = null;
    ['pee','poop','both'].forEach(t => document.getElementById('dtype-' + t).className = 'dtype-btn');
    document.getElementById('diaperOverlay').classList.add('open');
  }
  function closeDiaperModal() {
    document.getElementById('diaperOverlay').classList.remove('open');
  }
  function selectDtype(type) {
    selectedDtype = type;
    ['pee','poop','both'].forEach(t => {
      const el = document.getElementById('dtype-' + t);
      el.className = 'dtype-btn' + (t === type ? ' selected-' + t : '');
    });
  }
  function saveDiaper() {
    if (!selectedDtype) { alert('Please select pee, poop, or both.'); return; }
    const list = getDiapers();
    list.unshift({ type: selectedDtype, time: Date.now() });
    saveDiapers(list);
    closeDiaperModal();
    renderDiapers();
  }

  function renderDiapers() {
    const list   = getDiapers();
    const icons  = { pee:'💧', poop:'💩', both:'💧💩' };
    const labels = { pee:'Pee', poop:'Poop', both:'Pee + Poop' };
    const el = document.getElementById('diaperList');
    if (!list.length) { el.innerHTML = '<div class="empty-state">No diaper changes logged yet</div>'; return; }
    el.innerHTML = list.map((d,i) => {
      const dt   = new Date(d.time);
      const time = dt.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
      const date = dt.toLocaleDateString([], {month:'short', day:'numeric'});
      return `<div class="diaper-item">
        <span class="diaper-icon">${icons[d.type]}</span>
        <span class="diaper-type ${d.type}">${labels[d.type]}</span>
        <span class="diaper-time">${date} ${time}</span>
        <button class="diaper-del" onclick="deleteDiaper(${i})">✕</button>
      </div>`;
    }).join('');
  }

  function deleteDiaper(idx) {
    const list = getDiapers();
    list.splice(idx, 1);
    saveDiapers(list);
    renderDiapers();
  }
