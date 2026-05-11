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
    const svg = document.querySelector('.pyramid-chart');
    if (!svg) return;

    const maleBars = svg.querySelectorAll('.male-bars rect');
    const femaleBars = svg.querySelectorAll('.female-bars rect');

    // If the SVG doesn't contain bar rects yet, render a simple mock pyramid.
    if (!maleBars.length || !femaleBars.length) {
      renderPyramidChart(svg, data);
      return;
    }

    (data.male || []).forEach((width, i) => {
      if (maleBars[i]) maleBars[i].setAttribute('width', Math.min(width, 150));
    });
    (data.female || []).forEach((width, i) => {
      if (femaleBars[i]) femaleBars[i].setAttribute('width', Math.min(width, 150));
    });
  }

  function renderPyramidChart(svg, data) {
    // Clear previous content
    svg.innerHTML = '';

    const width = 500;
    const height = 400;
    const centerX = 250;
    const topMargin = 20;
    const bottomMargin = 20;
    const usableHeight = height - topMargin - bottomMargin;

    const ageGroups = data.ageGroups || [];
    const male = data.male || [];
    const female = data.female || [];

    const buckets = Math.max(male.length, female.length, ageGroups.length);
    const barGap = 4;
    const barHeight = Math.floor((usableHeight - (buckets - 1) * barGap) / buckets);
    const maxVal = Math.max(1, ...male, ...female);
    const maxBarWidth = 150;

    // X/Y axis labels + background center line
    // Y label (left side, rotated)
    const yAxisLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    yAxisLabel.setAttribute('x', 18);
    yAxisLabel.setAttribute('y', (topMargin + height - bottomMargin) / 2);
    yAxisLabel.setAttribute('font-size', '12');
    yAxisLabel.setAttribute('fill', '#6b7280');
    yAxisLabel.setAttribute('text-anchor', 'middle');
    yAxisLabel.setAttribute('transform', `rotate(-90 18 ${(topMargin + height - bottomMargin) / 2})`);
    yAxisLabel.textContent = 'Population (count)';
    svg.appendChild(yAxisLabel);

      // X label (bottom)
    const xAxisLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    xAxisLabel.setAttribute('x', centerX);
    xAxisLabel.setAttribute('y', height - 16);
    xAxisLabel.setAttribute('font-size', '12');
    xAxisLabel.setAttribute('fill', '#6b7280');
    xAxisLabel.setAttribute('text-anchor', 'middle');
    xAxisLabel.textContent = 'Gender';
    svg.appendChild(xAxisLabel);

    // Bottom percentage ticks (0%..100%)
    const ticks = [0, 20, 40, 60, 80, 100];
    const tickColor = '#6b7280';
    const tickFontSize = '10';
    ticks.forEach(pct => {
      const x = centerX + (pct / 100) * maxBarWidth;

      const tickText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      tickText.setAttribute('x', x);
      tickText.setAttribute('y', height - 4);
      tickText.setAttribute('font-size', tickFontSize);
      tickText.setAttribute('fill', tickColor);
      tickText.setAttribute('text-anchor', 'start');
      tickText.textContent = pct + '%';
      svg.appendChild(tickText);

      // mirror left labels too (so both sides show)
      const xL = centerX - (pct / 100) * maxBarWidth;
      const tickTextL = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      tickTextL.setAttribute('x', xL);
      tickTextL.setAttribute('y', height - 4);
      tickTextL.setAttribute('font-size', tickFontSize);
      tickTextL.setAttribute('fill', tickColor);
      tickTextL.setAttribute('text-anchor', 'end');
      tickTextL.textContent = pct + '%';
      svg.appendChild(tickTextL);
    });


    const centerLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    centerLine.setAttribute('x1', centerX);
    centerLine.setAttribute('y1', topMargin);
    centerLine.setAttribute('x2', centerX);
    centerLine.setAttribute('y2', height - bottomMargin);
    centerLine.setAttribute('stroke', '#e5e7eb');
    centerLine.setAttribute('stroke-width', '1');
    svg.appendChild(centerLine);


    const maleGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    maleGroup.setAttribute('class', 'male-bars');
    svg.appendChild(maleGroup);

    const femaleGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    femaleGroup.setAttribute('class', 'female-bars');
    svg.appendChild(femaleGroup);

    for (let i = 0; i < buckets; i++) {
      const y = topMargin + i * (barHeight + barGap);

      const mVal = male[i] ?? 0;
      const fVal = female[i] ?? 0;

      const mW = (mVal / maxVal) * maxBarWidth;
      const fW = (fVal / maxVal) * maxBarWidth;

      // Male: left side (grow left)
      const mRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      mRect.setAttribute('x', centerX - mW);
      mRect.setAttribute('y', y);
      mRect.setAttribute('width', mW);
      mRect.setAttribute('height', barHeight);
      mRect.setAttribute('fill', '#3b82f6');
      mRect.setAttribute('opacity', '0.85');
      mRect.setAttribute('rx', '2');
      maleGroup.appendChild(mRect);

      // Female: right side
      const fRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      fRect.setAttribute('x', centerX);
      fRect.setAttribute('y', y);
      fRect.setAttribute('width', fW);
      fRect.setAttribute('height', barHeight);
      fRect.setAttribute('fill', '#10b981');
      fRect.setAttribute('opacity', '0.85');
      fRect.setAttribute('rx', '2');
      femaleGroup.appendChild(fRect);

      // Age label (light) + count numbers on the sides
      // Left side: Male count
      const maleCountText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      maleCountText.setAttribute('x', centerX - mW - 6);
      maleCountText.setAttribute('y', y + barHeight - 2);
      maleCountText.setAttribute('text-anchor', 'end');
      maleCountText.setAttribute('font-size', '9');
      maleCountText.setAttribute('fill', '#3b82f6');
      maleCountText.textContent = mVal ? String(mVal) : '';
      svg.appendChild(maleCountText);

      // Center: Age group
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', centerX);
      label.setAttribute('y', y + barHeight - 2);
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('font-size', '9');
      label.setAttribute('fill', '#6b7280');
      label.textContent = ageGroups[i] || '';
      svg.appendChild(label);

      // Right side: Female count
      const femaleCountText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      femaleCountText.setAttribute('x', centerX + fW + 6);
      femaleCountText.setAttribute('y', y + barHeight - 2);
      femaleCountText.setAttribute('text-anchor', 'start');
      femaleCountText.setAttribute('font-size', '9');
      femaleCountText.setAttribute('fill', '#10b981');
      femaleCountText.textContent = fVal ? String(fVal) : '';
      svg.appendChild(femaleCountText);

    }
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
      updateGeotaggingStats,
      updatePyramidChart
    };

    // When map layers are ready, populate filters and compute initial stats
    document.addEventListener('ea-layers-ready', () => {
      const geoJsonData = getGeoJsonData();
      populateFiltersFromGeoJson(geoJsonData);
      updateStatsFromMap();
      updateGeotaggingStats();

      // Render mock pyramid immediately if available.
      if (window.MOCK_PYRAMID_DATA) {
        updatePyramidChart(window.MOCK_PYRAMID_DATA);
      }
    });


    // When NCR barangay is clicked, main.js will listen to bgy-selected and call applyFilters
    document.addEventListener('bgy-selected', (e) => {
      // keep hook; main.js will handle updating date/status filters
      // no-op here
    });
  }

  initDataProcessing();
})();
