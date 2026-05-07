(function () {
  'use strict';

  // Shared set of active status filters is owned by main.js.
  function getActiveStatuses() {
    return window.__ACTIVE_STATUSES__ || new Set();
  }

  function getMapLayerGroups() {
    return window.MapDataProcessing?.getLayerGroups?.() || null;
  }

  function getGeoJsonData() {
    // Embedded data is defined in ea_dashboard.html
    return window.EMBEDDED_EA_DATA || null;
  }

  // --- Populate filters from data ---
  function populateFiltersFromGeoJson(geoJsonData) {
    if (!geoJsonData) return;

    const regions = new Set();
    const provinces = new Set();
    const cityMuns = new Set();
    const barangays = new Set();

    geoJsonData.features.forEach(f => {
      const p = f.properties || {};
      if (p.region) regions.add(p.region);
      if (p.province) provinces.add(p.province);
      if (p.city_mun) cityMuns.add(p.city_mun);

      // Use BGY_GEO for barangay filtering when barangay name is not present
      if (p.barangay) barangays.add(p.barangay);
      else if (p.BGY_GEO) barangays.add(p.BGY_GEO);
    });

    const fillSelect = (sel, items) => {
      if (!sel) return;
      const current = sel.value;
      sel.innerHTML = '<option value="">All</option>';
      Array.from(items).sort().forEach(item => {
        const opt = document.createElement('option');
        opt.value = item;
        opt.textContent = item;
        sel.appendChild(opt);
      });
      sel.value = current;
    };

    fillSelect(document.getElementById('filterRegion'), regions);
    fillSelect(document.getElementById('filterProvince'), provinces);
    fillSelect(document.getElementById('filterCityMun'), cityMuns);
    fillSelect(document.getElementById('filterBarangay'), barangays);
  }

  // --- Special Housing Unit Breakdown ---
  function updateSpecialHUStats(data, container = '.special-hu-breakdown-card') {
    const total = (data.nur || 0) + (data.diplomatic || 0) + (data.vacation || 0) + (data.vacant || 0);
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    const scale = circumference / 100;

    const nurPct = total > 0 ? (data.nur / total) * 100 : 0;
    const diplomaticPct = total > 0 ? (data.diplomatic / total) * 100 : 0;
    const vacationPct = total > 0 ? (data.vacation / total) * 100 : 0;
    const vacantPct = total > 0 ? (data.vacant / total) * 100 : 0;

    const nurDash = nurPct * scale;
    const diplomaticDash = (nurPct + diplomaticPct) * scale;
    const vacationDash = (nurPct + diplomaticPct + vacationPct) * scale;

    const nurSeg = document.querySelector(`${container} #donut-nur-special`);
    const diplomaticSeg = document.querySelector(`${container} #donut-diplomatic-special`);
    const vacationSeg = document.querySelector(`${container} #donut-vacation-special`);
    const vacantSeg = document.querySelector(`${container} #donut-vacant-special`);
    const totalText = document.querySelector(`${container} .donut-total`);
    const tableRows = document.querySelectorAll(`${container} .breakdown-table tbody tr`);

    if (nurSeg) nurSeg.setAttribute('stroke-dasharray', `${nurDash} ${circumference}`);
    if (diplomaticSeg) diplomaticSeg.setAttribute('stroke-dasharray', `${diplomaticDash} ${circumference}`);
    if (vacationSeg) vacationSeg.setAttribute('stroke-dasharray', `${vacationDash} ${circumference}`);
    if (vacantSeg) {
      const offset = (100 - vacantPct) * scale;
      vacantSeg.setAttribute('stroke-dasharray', `${circumference - offset} ${circumference}`);
      vacantSeg.setAttribute('stroke-dashoffset', `-${offset}`);
    }

    if (totalText) totalText.textContent = total.toLocaleString();

    if (tableRows.length >= 4) {
      tableRows[0].querySelector('.count').textContent = data.nur?.toLocaleString() || 0;
      tableRows[0].querySelector('.pct').textContent = nurPct.toFixed(1) + '%';
      tableRows[1].querySelector('.count').textContent = data.diplomatic?.toLocaleString() || 0;
      tableRows[1].querySelector('.pct').textContent = diplomaticPct.toFixed(1) + '%';
      tableRows[2].querySelector('.count').textContent = data.vacation?.toLocaleString() || 0;
      tableRows[2].querySelector('.pct').textContent = vacationPct.toFixed(1) + '%';
      tableRows[3].querySelector('.count').textContent = data.vacant?.toLocaleString() || 0;
      tableRows[3].querySelector('.pct').textContent = vacantPct.toFixed(1) + '%';
    }
  }

  // --- Regular Housing Unit Breakdown ---
  function updateRegularHUStats(data, container = '.regular-hu-breakdown-card') {
    const total = (data.complete || 0) + (data.refused || 0) + (data.terminated || 0) + (data.other || 0);
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    const scale = circumference / 100;

    const completePct = total > 0 ? (data.complete / total) * 100 : 0;
    const refusedPct = total > 0 ? (data.refused / total) * 100 : 0;
    const terminatedPct = total > 0 ? (data.terminated / total) * 100 : 0;
    const otherPct = total > 0 ? (data.other / total) * 100 : 0;

    const completeDash = completePct * scale;
    const refusedDash = (completePct + refusedPct) * scale;
    const terminatedDash = (completePct + refusedPct + terminatedPct) * scale;

    const completeSeg = document.querySelector(`${container} #donut-complete-reg`);
    const refusedSeg = document.querySelector(`${container} #donut-refused-reg`);
    const terminatedSeg = document.querySelector(`${container} #donut-terminated-reg`);
    const otherSeg = document.querySelector(`${container} #donut-other-reg`);
    const totalText = document.querySelector(`${container} .donut-total`);
    const tableRows = document.querySelectorAll(`${container} .breakdown-table tbody tr`);

    if (completeSeg) completeSeg.setAttribute('stroke-dasharray', `${completeDash} ${circumference}`);
    if (refusedSeg) refusedSeg.setAttribute('stroke-dasharray', `${refusedDash} ${circumference}`);
    if (terminatedSeg) terminatedSeg.setAttribute('stroke-dasharray', `${terminatedDash} ${circumference}`);
    if (otherSeg) {
      const offset = (100 - otherPct) * scale;
      otherSeg.setAttribute('stroke-dasharray', `${circumference - offset} ${circumference}`);
      otherSeg.setAttribute('stroke-dashoffset', `-${offset}`);
    }

    if (totalText) totalText.textContent = total.toLocaleString();

    if (tableRows.length >= 4) {
      tableRows[0].querySelector('.count').textContent = data.complete?.toLocaleString() || 0;
      tableRows[0].querySelector('.pct').textContent = completePct.toFixed(1) + '%';
      tableRows[1].querySelector('.count').textContent = data.refused?.toLocaleString() || 0;
      tableRows[1].querySelector('.pct').textContent = refusedPct.toFixed(1) + '%';
      tableRows[2].querySelector('.count').textContent = data.terminated?.toLocaleString() || 0;
      tableRows[2].querySelector('.pct').textContent = terminatedPct.toFixed(1) + '%';
      tableRows[3].querySelector('.count').textContent = data.other?.toLocaleString() || 0;
      tableRows[3].querySelector('.pct').textContent = otherPct.toFixed(1) + '%';
    }
  }

  // --- Status Summary Cards (for dashboard) ---
  function updateStatusCards(statusData) {
    const cards = document.querySelectorAll('.status-card');
    const totalEA = statusData.totalEA || 1248;

    cards.forEach(card => {
      const key = card.classList[1]; // e.g., 'total', 'pending'
      const data = statusData.statuses?.[key];
      if (data) {
        card.querySelector('.status-value').textContent = data.count.toLocaleString();
        card.querySelector('.status-percent').textContent = data.pct.toFixed(1) + '%';
      }
    });
  }

  // --- Population Pyramid ---
  function updatePyramidChart(data) {
    const maleBars = document.querySelectorAll('.pyramid-chart .male-bars rect');
    const femaleBars = document.querySelectorAll('.pyramid-chart .female-bars rect');

    (data.male || []).forEach((width, i) => {
      if (maleBars[i]) maleBars[i].setAttribute('width', Math.min(width, 150));
    });
    (data.female || []).forEach((width, i) => {
      if (femaleBars[i]) femaleBars[i].setAttribute('width', Math.min(width, 150));
    });
  }

  // --- Geotagging Summary Stats ---
  function updateGeotaggingStats() {
    // Demo data model — replace with your real data source
    const geotaggingData = {
      regular: { tagged: 1248, total: 1600 },
      new: { tagged: 342, total: 760 },
      ooc: { tagged: 86, total: 139 },
      tra: { tagged: 24, total: 26 }
    };

    function setCard(key, data) {
      const pct = data.total > 0 ? Math.round((data.tagged / data.total) * 100) : 0;
      const countEl = document.getElementById('geo' + key + 'Count');
      const pctEl = document.getElementById('geo' + key + 'Pct');
      const barEl = document.getElementById('geo' + key + 'Bar');

      if (countEl) countEl.textContent = data.tagged.toLocaleString();
      if (pctEl) pctEl.textContent = pct + '%';
      if (barEl) barEl.style.width = pct + '%';
    }

    setCard('Regular', geotaggingData.regular);
    setCard('New', geotaggingData.new);
    setCard('Ooc', geotaggingData.ooc);
    setCard('Tra', geotaggingData.tra);
  }

  // --- Statistics based on visible map layers ---
  function updateStatsFromMap() {
    const mapObj = window.MapDataProcessing;
    const groups = mapObj?.getLayerGroups?.();
    const map = mapObj?.getMap?.();

    if (!groups?.ea || !map) return;

    const visibleEAs = [];
    groups.ea.eachLayer(l => {
      if (map.hasLayer(l)) visibleEAs.push(l.eaData);
    });

    const total = visibleEAs.length;
    const counts = { not_started: 0, in_progress: 0, completed: 0, validated: 0, certified: 0 };
    let totalCompletion = 0;
    let bottleneckCount = 0;

    visibleEAs.forEach(d => {
      counts[d.status]++;
      totalCompletion += d.completionRate;
      if (d.completionRate < 25) bottleneckCount++;
    });

    const statTotal = document.getElementById('statTotal');
    const statCompleted = document.getElementById('statCompleted');
    const statValidated = document.getElementById('statValidated');
    const statCertified = document.getElementById('statCertified');

    if (statTotal) statTotal.textContent = total;
    if (statCompleted) statCompleted.textContent = counts.completed;
    if (statValidated) statValidated.textContent = counts.validated;
    if (statCertified) statCertified.textContent = counts.certified;

    const avg = total > 0 ? Math.round(totalCompletion / total) : 0;
    const circle = document.getElementById('avgProgressCircle');
    const radius = 32;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (avg / 100) * circumference;

    if (circle) circle.style.strokeDashoffset = offset;

    // Color by average
    let color = '#9ca3af';
    if (avg >= 90) color = '#10b981';
    else if (avg >= 70) color = '#3b82f6';
    else if (avg >= 40) color = '#f59e0b';
    else color = '#ef4444';

    if (circle) circle.setAttribute('stroke', color);

    const avgText = document.getElementById('avgProgressText');
    if (avgText) {
      avgText.textContent = avg + '%';
      avgText.style.color = color;
    }

    const alertBox = document.getElementById('bottleneckAlert');
    const bottleneckText = document.getElementById('bottleneckText');

    if (alertBox && bottleneckText) {
      if (bottleneckCount > 0) {
        alertBox.style.display = 'block';
        bottleneckText.textContent = `${bottleneckCount} area(s) with < 25% completion require attention.`;
      } else {
        alertBox.style.display = 'none';
      }
    }
  }

  // --- Apply filters (geographic + status legend) ---
  function applyFilters() {
    const mapObj = window.MapDataProcessing;
    const groups = mapObj?.getLayerGroups?.();
    const map = mapObj?.getMap?.();
    if (!groups?.ea || !map) return;

    const region = document.getElementById('filterRegion')?.value || '';
    const province = document.getElementById('filterProvince')?.value || '';
    const cityMun = document.getElementById('filterCityMun')?.value || '';
    const barangay = document.getElementById('filterBarangay')?.value || '';

    const selectedEA = window.__SELECTED_EA__ || null;

    const activeStatuses = getActiveStatuses();


    groups.ea.eachLayer(layer => {
      const p = layer.featureRef?.properties || {};
      const d = layer.eaData;

      let show = true;

      if (region && p.region !== region) show = false;
      if (province && p.province !== province) show = false;
      if (cityMun && p.city_mun !== cityMun) show = false;

      const bgyValue = p.barangay || p.BGY_GEO || '';
      if (barangay && bgyValue !== barangay) show = false;

      // MAIN FILTER NOW = LEGEND ITEMS
      if (!activeStatuses.has(d.status)) show = false;

      // EA-Level selection filter (from EA dropdown)
      if (selectedEA && String(d.id) !== String(selectedEA)) show = false;


      if (show) {
        if (!map.hasLayer(layer)) map.addLayer(layer);
      } else {
        if (map.hasLayer(layer)) map.removeLayer(layer);
      }
    });

    updateStatsFromMap();
  }

  function initDataProcessing() {
    // Export API to main.js
    window.DataProcessing = {
      populateFiltersFromGeoJson,
      applyFilters,
      updateStatsFromMap,
      updateGeotaggingStats
    };

    // When map layers are ready, populate filters and compute initial stats
    document.addEventListener('ea-layers-ready', () => {
      const geoJsonData = getGeoJsonData();
      populateFiltersFromGeoJson(geoJsonData);
      updateStatsFromMap();
      updateGeotaggingStats();
    });

    // When NCR barangay is clicked, main.js will listen to bgy-selected and call applyFilters
    document.addEventListener('bgy-selected', (e) => {
      // keep hook; main.js will handle updating date/status filters
      // no-op here
    });
  }

  initDataProcessing();
})();
