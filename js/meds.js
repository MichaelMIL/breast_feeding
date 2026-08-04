  // ── Medications ──
  const MED_KEY = 'medList';
  let medInterval = null;
  const medAlerted = new Set(); // IDs that have already fired their "due" alert
  let currentTakeMedId = null;

  function getMeds() { return JSON.parse(localStorage.getItem(MED_KEY) || '[]'); }
  function saveMeds(list) { localStorage.setItem(MED_KEY, JSON.stringify(list)); }

  function localDatetimeValueMed(ts) {
    const d = new Date(ts);
    const pad = n => String(n).padStart(2,'0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function openAddMed() {
    document.getElementById('medNameInput').value = '';
    document.getElementById('medIntervalInput').value = '6';
    document.getElementById('addMedOverlay').classList.add('open');
    setTimeout(() => document.getElementById('medNameInput').focus(), 80);
  }
  function closeAddMed() {
    document.getElementById('addMedOverlay').classList.remove('open');
  }
  function saveNewMed() {
    const name = document.getElementById('medNameInput').value.trim();
    const hours = parseFloat(document.getElementById('medIntervalInput').value);
    if (!name) { alert('Please enter a medication name.'); return; }
    if (!hours || hours <= 0) { alert('Please enter a valid interval.'); return; }
    const meds = getMeds();
    meds.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name,
      intervalHours: hours,
      lastTaken: null
    });
    saveMeds(meds);
    closeAddMed();
    renderMeds();
  }

  function takeNowImmediate(id) {
    unlockAudio();
    const meds = getMeds();
    const med = meds.find(m => m.id === id);
    if (!med) return;
    const time = Date.now();
    med.lastTaken = time;
    saveMeds(meds);
    medAlerted.delete(id);
    addMedHistory({ medName: med.name, time });
    renderMeds();
    renderHistory();
  }

  function openTakeMed(id) {
    const med = getMeds().find(m => m.id === id);
    if (!med) return;
    currentTakeMedId = id;
    document.getElementById('takeMedName').textContent = med.name;
    document.getElementById('takeMedTimeInput').value = localDatetimeValueMed(Date.now());
    document.getElementById('takeMedOverlay').classList.add('open');
  }

  function closeTakeMed() {
    document.getElementById('takeMedOverlay').classList.remove('open');
    currentTakeMedId = null;
  }

  function confirmTakeMed() {
    if (!currentTakeMedId) return;
    unlockAudio();
    const meds = getMeds();
    const med = meds.find(m => m.id === currentTakeMedId);
    if (!med) { closeTakeMed(); return; }
    const timeVal = document.getElementById('takeMedTimeInput').value;
    const time = timeVal ? new Date(timeVal).getTime() : Date.now();
    med.lastTaken = time;
    saveMeds(meds);
    medAlerted.delete(currentTakeMedId);
    addMedHistory({ medName: med.name, time });
    closeTakeMed();
    renderMeds();
    renderHistory();
  }

  function deleteMed(id) {
    if (!confirm(t('removeThisMed'))) return;
    const meds = getMeds().filter(m => m.id !== id);
    saveMeds(meds);
    medAlerted.delete(id);
    renderMeds();
  }

  function fmtCountdown(ms) {
    if (ms <= 0) return t('dueNow');
    const totalSecs = Math.floor(ms / 1000);
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    if (h > 0) return `${h}h ${String(m).padStart(2,'0')}m`;
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }

  function renderMeds() {
    const list = document.getElementById('medList');
    if (!list) return;
    const meds = getMeds();
    if (meds.length === 0) {
      list.innerHTML = `<div class="med-empty">${t('noMeds').replace('\n','<br>')}</div>`;
      return;
    }
    const now = Date.now();
    const lang = getLang();
    const locale = lang === 'he' ? 'he-IL' : undefined;
    list.innerHTML = meds.map(med => {
      const intervalMs = med.intervalHours * 3600 * 1000;
      const remaining  = med.lastTaken ? (med.lastTaken + intervalMs) - now : 0;
      const isDue      = remaining <= 0;
      const countdownClass = isDue ? 'due' : 'ok';
      const countdownText  = isDue ? t('dueNow') : fmtCountdown(remaining);

      // Track due state (no audio/flash for meds — card turns red instead)
      if (isDue && !medAlerted.has(med.id)) {
        medAlerted.add(med.id);
      } else if (!isDue && medAlerted.has(med.id)) {
        medAlerted.delete(med.id);
      }

      const lastTakenText = med.lastTaken
        ? t('lastTaken') + ' ' + new Date(med.lastTaken).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
        : t('notYetTaken');

      return `<div class="med-card">
        <div class="med-card-top">
          <div>
            <div class="med-name">${escHtml(med.name)}</div>
            <div class="med-interval">${t('everyH', med.intervalHours)}</div>
          </div>
          <button class="med-delete-btn" onclick="deleteMed('${med.id}')" aria-label="Delete">✕</button>
        </div>
        <div class="med-countdown ${countdownClass}">${countdownText}</div>
        <div class="med-card-bottom">
          <span class="med-last">${lastTakenText}</span>
          <div class="take-btn-group">
            <button class="take-btn" onclick="takeNowImmediate('${med.id}')">${t('takeNow')}</button>
            <button class="take-other-btn" onclick="openTakeMed('${med.id}')" aria-label="${t('takeOtherTime')}">⏱</button>
          </div>
        </div>
      </div>`;
    }).join('');
  }

  function startMedInterval() {
    if (medInterval) clearInterval(medInterval);
    medInterval = setInterval(() => {
      // Only re-render if the meds tab is active (avoids unnecessary DOM work)
      if (document.getElementById('page-meds').classList.contains('active')) {
        renderMeds();
      } else {
        // Still check for alerts even when tab is hidden
        const meds = getMeds();
        const now = Date.now();
        meds.forEach(med => {
          const intervalMs = med.intervalHours * 3600 * 1000;
          const remaining  = med.lastTaken ? (med.lastTaken + intervalMs) - now : 0;
          if (remaining <= 0 && !medAlerted.has(med.id)) {
            medAlerted.add(med.id);
          }
        });
      }
    }, 5000);
  }
