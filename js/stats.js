  // Stats — collapsible section state (not persisted; default collapsed)
  const sectionState = { feeding: false, diapers: false, meds: false };

  function toggleSection(id) {
    sectionState[id] = !sectionState[id];
    applySectionState(id);
  }

  function applySectionState(id) {
    const body = document.getElementById('section-' + id);
    const chev = document.getElementById('chev-' + id);
    if (!body || !chev) return;
    body.classList.toggle('open', sectionState[id]);
    chev.style.transform = sectionState[id] ? 'rotate(180deg)' : '';
  }

  function fmtTimeAgo(ts) {
    const locale = getLang() === 'he' ? 'he-IL' : undefined;
    const ms = Date.now() - ts;
    const h  = Math.floor(ms / 3600000);
    const m  = Math.floor((ms % 3600000) / 60000);
    if (h >= 48) return Math.floor(h / 24) + 'd ago';
    if (h >= 1)  return `${h}h ${m}m ago`;
    if (m >= 1)  return `${m}m ago`;
    return '< 1m ago';
  }

  function renderStats() {
    const entries = getLog();
    const now     = new Date();
    const lang    = getLang();
    const locale  = lang === 'he' ? 'he-IL' : undefined;

    const todayStr = now.toDateString();
    const weekAgo  = now - 7 * 24 * 3600 * 1000;

    // ── Feeding ───────────────────────────────────────────────
    const todayAll   = entries.filter(e => new Date(e.time).toDateString() === todayStr);
    const weekAll    = entries.filter(e => e.time >= weekAgo);
    const todayFeeds = todayAll.filter(e => (e.type||'feed') === 'feed').length;
    const todayPumps = todayAll.filter(e => e.type === 'pump').length;

    const sorted = [...entries].sort((a,b) => a.time - b.time);
    let avgMs = null;
    if (sorted.length >= 2) {
      const diffs = sorted.slice(1).map((e,i) => e.time - sorted[i].time);
      avgMs = diffs.reduce((a,b) => a+b, 0) / diffs.length;
    }

    const total      = entries.length;
    const leftCount  = entries.filter(e => e.side === 'left').length;
    const rightCount = entries.filter(e => e.side === 'right').length;
    const feedCount  = entries.filter(e => (e.type||'feed') === 'feed').length;
    const pumpCount  = entries.filter(e => e.type === 'pump').length;

    setText('st-today',     todayAll.length);
    setText('st-today-sub', t('feedSub', todayFeeds, todayPumps));
    setText('st-week',      weekAll.length);
    setText('st-week-sub',  t('weekSub', weekAll.length));
    setText('st-total',     total);
    setText('st-total-sub', t('feedSub', feedCount, pumpCount));

    if (avgMs !== null) {
      const h = Math.floor(avgMs / 3600000);
      const m = Math.floor((avgMs % 3600000) / 60000);
      setText('st-interval', h > 0 ? `${h}h ${m}m` : `${m}m`);
    } else {
      setText('st-interval', '—');
    }

    const lr  = leftCount + rightCount || 1;
    const fp  = feedCount + pumpCount  || 1;
    const lp  = Math.round(leftCount  / lr * 100);
    const rp  = Math.round(rightCount / lr * 100);
    const fdp = Math.round(feedCount  / fp * 100);
    const pp  = Math.round(pumpCount  / fp * 100);

    setBar('st-left-bar',  lp);  setText('st-left-pct',  total ? lp  + '%' : '—');
    setBar('st-right-bar', rp);  setText('st-right-pct', total ? rp  + '%' : '—');
    setBar('st-feed-bar',  fdp); setText('st-feed-pct',  total ? fdp + '%' : '—');
    setBar('st-pump-bar',  pp);  setText('st-pump-pct',  total ? pp  + '%' : '—');

    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      const ds = d.toDateString();
      days.push({ label: d.toLocaleDateString(locale, {weekday:'short'}),
                  count: entries.filter(e => new Date(e.time).toDateString() === ds).length });
    }
    const maxCount = Math.max(...days.map(d => d.count), 1);
    document.getElementById('st-chart').innerHTML = days.map(d => `
      <div class="chart-col">
        <div class="chart-num">${d.count || ''}</div>
        <div class="chart-bar-wrap">
          <div class="chart-bar${d.count === 0 ? ' zero' : ''}" style="height:${Math.round(d.count/maxCount*72)}px"></div>
        </div>
        <div class="chart-day">${d.label}</div>
      </div>`).join('');

    // ── Diapers ───────────────────────────────────────────────
    const diapers    = getDiapers();
    const dToday     = diapers.filter(d => new Date(d.time).toDateString() === todayStr);
    const dWeek      = diapers.filter(d => d.time >= weekAgo);
    const dPeeCount  = diapers.filter(d => d.type === 'pee'  || d.type === 'both').length;
    const dPoopCount = diapers.filter(d => d.type === 'poop' || d.type === 'both').length;
    const dTotal     = diapers.length || 1;

    setText('st-diaper-today', dToday.length);
    const todayPee  = dToday.filter(d => d.type==='pee'||d.type==='both').length;
    const todayPoop = dToday.filter(d => d.type==='poop'||d.type==='both').length;
    setText('st-diaper-today-sub', `💧${todayPee} · 💩${todayPoop}`);
    setText('st-diaper-week',     dWeek.length);
    setText('st-diaper-week-sub', t('avgPerDay', dWeek.length ? (dWeek.length/7).toFixed(1) : 0));

    const peePct  = Math.round(dPeeCount  / dTotal * 100);
    const poopPct = Math.round(dPoopCount / dTotal * 100);
    setBar('st-pee-bar',  peePct);  setText('st-pee-pct',  diapers.length ? peePct  + '%' : '—');
    setBar('st-poop-bar', poopPct); setText('st-poop-pct', diapers.length ? poopPct + '%' : '—');

    const ddays = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      const ds = d.toDateString();
      ddays.push({ label: d.toLocaleDateString(locale, {weekday:'short'}),
                   count: diapers.filter(d => new Date(d.time).toDateString() === ds).length });
    }
    const dMax = Math.max(...ddays.map(d => d.count), 1);
    document.getElementById('st-diaper-chart').innerHTML = ddays.map(d => `
      <div class="chart-col">
        <div class="chart-num">${d.count || ''}</div>
        <div class="chart-bar-wrap">
          <div class="chart-bar${d.count === 0 ? ' zero' : ''}" style="height:${Math.round(d.count/dMax*72)}px;background:linear-gradient(180deg,#f0d060,#c09010)"></div>
        </div>
        <div class="chart-day">${d.label}</div>
      </div>`).join('');

    // ── Medications ───────────────────────────────────────────
    const medHistory = getMedHistory();
    const mToday     = medHistory.filter(m => new Date(m.time).toDateString() === todayStr);
    const mWeek      = medHistory.filter(m => m.time >= weekAgo);

    setText('st-med-today',     mToday.length);
    const todayGroups = {};
    mToday.forEach(m => { todayGroups[m.medName] = (todayGroups[m.medName] || 0) + 1; });
    setText('st-med-today-sub', Object.entries(todayGroups).map(([n,c]) => `${n}×${c}`).join(' · ') || '—');
    setText('st-med-week',      mWeek.length);
    setText('st-med-week-sub',  t('avgPerDay', mWeek.length ? (mWeek.length/7).toFixed(1) : 0));

    // 7-day med chart
    const mdays = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      const ds = d.toDateString();
      mdays.push({ label: d.toLocaleDateString(locale, {weekday:'short'}),
                   count: medHistory.filter(m => new Date(m.time).toDateString() === ds).length });
    }
    const mMax = Math.max(...mdays.map(d => d.count), 1);
    document.getElementById('st-med-chart').innerHTML = mdays.map(d => `
      <div class="chart-col">
        <div class="chart-num">${d.count || ''}</div>
        <div class="chart-bar-wrap">
          <div class="chart-bar${d.count === 0 ? ' zero' : ''}" style="height:${Math.round(d.count/mMax*72)}px;background:linear-gradient(180deg,#b0a0f0,#6050b0)"></div>
        </div>
        <div class="chart-day">${d.label}</div>
      </div>`).join('');

    // Per-med enhanced breakdown
    const meds = getMeds();
    const breakdownEl = document.getElementById('st-med-breakdown');
    if (!meds.length) {
      breakdownEl.innerHTML = `<div style="color:var(--text-sub);font-size:0.85rem;padding:8px 0;">${t('noMedHistory')}</div>`;
    } else {
      const perMedWeek   = meds.map(med => mWeek.filter(m => m.medName === med.name).length);
      const maxWeekDoses = Math.max(1, ...perMedWeek);

      breakdownEl.innerHTML = meds.map((med, i) => {
        const weekCount  = perMedWeek[i];
        const todayCount = mToday.filter(m => m.medName === med.name).length;
        const barPct     = Math.round(weekCount / maxWeekDoses * 100);

        let lastStr;
        if (med.lastTaken) {
          const lt      = new Date(med.lastTaken);
          const isToday = lt.toDateString() === todayStr;
          const tStr    = lt.toLocaleTimeString(locale, {hour:'2-digit', minute:'2-digit'});
          const dStr    = lt.toLocaleDateString(locale, {month:'short', day:'numeric'});
          lastStr = isToday ? `${t('lastTaken')} ${tStr} (${fmtTimeAgo(med.lastTaken)})` : `${t('lastTaken')} ${dStr} ${tStr}`;
        } else {
          lastStr = t('notYetTaken');
        }

        return `<div class="med-stat-row">
          <div class="med-stat-header">
            <span class="med-stat-name">${escHtml(med.name)}</span>
            <span class="med-stat-badge">${weekCount} ${t('weekDoses')}</span>
          </div>
          <div class="split-track" style="margin:5px 0 4px;">
            <div class="split-fill" style="width:${barPct}%;background:linear-gradient(90deg,#b0a0f0,#6050b0);transition:width 0.4s;border-radius:99px;"></div>
          </div>
          <div class="med-stat-info">${t('everyH', med.intervalHours)} · ${t('todayDoses', todayCount)} · ${lastStr}</div>
        </div>`;
      }).join('');
    }

    // Re-apply collapse state (DOM may have been rebuilt by navigation)
    ['feeding','diapers','meds'].forEach(applySectionState);
  }
