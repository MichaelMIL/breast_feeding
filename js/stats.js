  // Stats
  function renderStats() {
    const entries = getLog();
    const now     = new Date();

    const todayStr  = now.toDateString();
    const weekAgo   = now - 7 * 24 * 3600 * 1000;

    const todayAll  = entries.filter(e => new Date(e.time).toDateString() === todayStr);
    const weekAll   = entries.filter(e => e.time >= weekAgo);

    const todayFeeds = todayAll.filter(e => (e.type||'feed') === 'feed').length;
    const todayPumps = todayAll.filter(e => e.type === 'pump').length;

    // avg interval (all time, sorted chronologically)
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

    // set values
    setText('st-today', todayAll.length);
    setText('st-today-sub', `${todayFeeds} feed · ${todayPumps} pump`);
    setText('st-week', weekAll.length);
    setText('st-week-sub', `avg ${weekAll.length ? (weekAll.length/7).toFixed(1) : 0}/day`);
    setText('st-total', total);
    setText('st-total-sub', `${feedCount} feed · ${pumpCount} pump`);

    if (avgMs !== null) {
      const h = Math.floor(avgMs / 3600000);
      const m = Math.floor((avgMs % 3600000) / 60000);
      setText('st-interval', h > 0 ? `${h}h ${m}m` : `${m}m`);
    } else {
      setText('st-interval', '—');
    }

    // splits
    const lr = leftCount + rightCount || 1;
    const fp = feedCount + pumpCount  || 1;
    const lp = Math.round(leftCount  / lr * 100);
    const rp = Math.round(rightCount / lr * 100);
    const fdp = Math.round(feedCount / fp * 100);
    const pp  = Math.round(pumpCount / fp * 100);

    setBar('st-left-bar',  lp);  setText('st-left-pct',  total ? lp  + '%' : '—');
    setBar('st-right-bar', rp);  setText('st-right-pct', total ? rp  + '%' : '—');
    setBar('st-feed-bar',  fdp); setText('st-feed-pct',  total ? fdp + '%' : '—');
    setBar('st-pump-bar',  pp);  setText('st-pump-pct',  total ? pp  + '%' : '—');

    // 7-day feeding bar chart
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      const ds = d.toDateString();
      days.push({
        label: d.toLocaleDateString([], {weekday: 'short'}),
        count: entries.filter(e => new Date(e.time).toDateString() === ds).length
      });
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

    // Diaper stats
    const diapers     = getDiapers();
    const dToday      = diapers.filter(d => new Date(d.time).toDateString() === todayStr);
    const dWeek       = diapers.filter(d => d.time >= weekAgo);
    const dPeeCount   = diapers.filter(d => d.type === 'pee'  || d.type === 'both').length;
    const dPoopCount  = diapers.filter(d => d.type === 'poop' || d.type === 'both').length;
    const dTotal      = diapers.length || 1;

    setText('st-diaper-today', dToday.length);
    const todayPee = dToday.filter(d => d.type==='pee'||d.type==='both').length;
    const todayPoop= dToday.filter(d => d.type==='poop'||d.type==='both').length;
    setText('st-diaper-today-sub', `💧${todayPee} · 💩${todayPoop}`);
    setText('st-diaper-week', dWeek.length);
    setText('st-diaper-week-sub', `avg ${dWeek.length ? (dWeek.length/7).toFixed(1) : 0}/day`);

    const peePct  = Math.round(dPeeCount  / dTotal * 100);
    const poopPct = Math.round(dPoopCount / dTotal * 100);
    setBar('st-pee-bar',  peePct);  setText('st-pee-pct',  diapers.length ? peePct  + '%' : '—');
    setBar('st-poop-bar', poopPct); setText('st-poop-pct', diapers.length ? poopPct + '%' : '—');

    // 7-day diaper chart
    const ddays = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      const ds = d.toDateString();
      ddays.push({
        label: d.toLocaleDateString([], {weekday: 'short'}),
        count: diapers.filter(d => new Date(d.time).toDateString() === ds).length
      });
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
  }
