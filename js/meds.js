  // ── Medications ──
  const MED_KEY = 'medList';
  let medInterval = null;
  const medAlerted = new Set(); // IDs that have already fired their "due" alert

  function getMeds() { return JSON.parse(localStorage.getItem(MED_KEY) || '[]'); }
  function saveMeds(list) { localStorage.setItem(MED_KEY, JSON.stringify(list)); }

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

  function takeMed(id) {
    unlockAudio();
    const meds = getMeds();
    const med = meds.find(m => m.id === id);
    if (!med) return;
    med.lastTaken = Date.now();
    saveMeds(meds);
    // Reset alert so it can fire again next cycle
    medAlerted.delete(id);
    renderMeds();
  }

  function deleteMed(id) {
    if (!confirm('Remove this medication?')) return;
    const meds = getMeds().filter(m => m.id !== id);
    saveMeds(meds);
    medAlerted.delete(id);
    renderMeds();
  }

  function fmtCountdown(ms) {
    if (ms <= 0) return 'Due now!';
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
      list.innerHTML = '<div class="med-empty">No medications added yet.<br>Tap + to add one.</div>';
      return;
    }
    const now = Date.now();
    list.innerHTML = meds.map(med => {
      const intervalMs = med.intervalHours * 3600 * 1000;
      const remaining  = med.lastTaken ? (med.lastTaken + intervalMs) - now : 0;
      const isDue      = remaining <= 0;
      const countdownClass = isDue ? 'due' : 'ok';
      const countdownText  = isDue ? 'Due now!' : fmtCountdown(remaining);

      // Fire alert once per due event
      if (isDue && !medAlerted.has(med.id)) {
        medAlerted.add(med.id);
        playChime();
        triggerAlert();
      } else if (!isDue && medAlerted.has(med.id)) {
        // Med was taken, clear alert flag so next due fires again
        medAlerted.delete(med.id);
      }

      const lastTakenText = med.lastTaken
        ? 'Last taken: ' + new Date(med.lastTaken).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : 'Not yet taken';

      return `<div class="med-card">
        <div class="med-card-top">
          <div>
            <div class="med-name">${escHtml(med.name)}</div>
            <div class="med-interval">Every ${med.intervalHours}h</div>
          </div>
          <button class="med-delete-btn" onclick="deleteMed('${med.id}')" aria-label="Delete">✕</button>
        </div>
        <div class="med-countdown ${countdownClass}">${countdownText}</div>
        <div class="med-card-bottom">
          <span class="med-last">${lastTakenText}</span>
          <button class="take-btn" onclick="takeMed('${med.id}')">Take now</button>
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
            playChime();
            triggerAlert();
          }
        });
      }
    }, 5000);
  }
