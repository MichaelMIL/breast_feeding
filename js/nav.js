  // Tab switching
  function showTab(tab) {
    ['tracker','stats','meds','diaper'].forEach(t => {
      document.getElementById('page-' + t).classList.toggle('active', tab === t);
      document.getElementById('nav-'  + t).classList.toggle('active', tab === t);
    });
    if (tab === 'tracker') renderHistory();
    if (tab === 'stats')   renderStats();
    if (tab === 'meds')    renderMeds();
    if (tab === 'diaper')  renderDiapers();
  }
