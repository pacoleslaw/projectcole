// chart-gauges.js

class ChartGauges {
  constructor() {
    this.initGauges();
  }

  initGauges() {
    this.initHalfGauge('specialGauge');
    this.initDonutGauge('regularGauge');
  }

  initHalfGauge(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <svg class="half-gauge-chart" viewBox="0 0 280 155">
        <!-- Background Arc -->
        <path
          d="M 45 135 A 95 95 0 0 1 235 135"
          fill="none"
          stroke="#f1f5f9"
          stroke-width="20"
          stroke-linecap="butt"
          pathLength="100"
        />

        <!-- Segments -->
        <path
          id="seg-hsn77777"
          d="M 45 135 A 95 95 0 0 1 235 135"
          fill="none"
          stroke="#9e9e9e"
          stroke-width="20"
          stroke-linecap="butt"
          pathLength="100"
        />
        <path
          id="seg-hsn88888"
          d="M 45 135 A 95 95 0 0 1 235 135"
          fill="none"
          stroke="#fcc12d"
          stroke-width="20"
          stroke-linecap="butt"
          pathLength="100"
        />
        <path
          id="seg-hsn88889"
          d="M 45 135 A 95 95 0 0 1 235 135"
          fill="none"
          stroke="#7344ff"
          stroke-width="20"
          stroke-linecap="butt"
          pathLength="100"
        />
        <path
          id="seg-hsn99999"
          d="M 45 135 A 95 95 0 0 1 235 135"
          fill="none"
          stroke="#1bc5bd"
          stroke-width="20"
          stroke-linecap="butt"
          pathLength="100"
        />

        <!-- Percentage Labels placed around the outer edge with zero clipping -->
        <text x="32" y="85" font-size="11" font-weight="600" fill="#64748b" text-anchor="end">24.96%</text>
        <text x="85" y="18" font-size="11" font-weight="600" fill="#64748b" text-anchor="middle">24.96%</text>
        <text x="195" y="18" font-size="11" font-weight="600" fill="#64748b" text-anchor="middle">24.96%</text>
        <text x="248" y="85" font-size="11" font-weight="600" fill="#64748b" text-anchor="start">25.12%</text>

        <!-- Center Total Texts -->
        <text
          class="gauge-total-value"
          x="140"
          y="105"
          text-anchor="middle"
          font-size="30"
          font-weight="800"
          fill="#0f172a"
        >625</text>
        <text
          x="140"
          y="125"
          text-anchor="middle"
          font-size="12"
          font-weight="500"
          fill="#64748b"
        >Total</text>
      </svg>
    `;

    this.updateSpecialGauge();
  }

  updateSpecialGauge() {
    const data = window.dashboardData?.specialHU || {
      hsn77777: 156,
      hsn88888: 156,
      hsn88889: 156,
      hsn99999: 157
    };

    const total = data.hsn77777 + data.hsn88888 + data.hsn88889 + data.hsn99999;
    if (!total) return;

    const values = [
      { id: 'seg-hsn77777', value: data.hsn77777 },
      { id: 'seg-hsn88888', value: data.hsn88888 },
      { id: 'seg-hsn88889', value: data.hsn88889 },
      { id: 'seg-hsn99999', value: data.hsn99999 }
    ];

    let offset = 0;
    values.forEach(seg => {
      const pct = (seg.value / total) * 100;
      const el = document.getElementById(seg.id);
      if (!el) return;
      el.setAttribute('stroke-dasharray', `${pct} ${100 - pct}`);
      el.setAttribute('stroke-dashoffset', `${-offset}`);
      offset += pct;
    });

    const totalEl = document.querySelector('#specialGauge .gauge-total-value');
    if (totalEl) {
      totalEl.textContent = total.toLocaleString();
    }
  }

  initDonutGauge(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <svg class="half-gauge-chart" viewBox="0 0 280 155">
        <!-- Background Arc -->
        <path
          d="M 45 135 A 95 95 0 0 1 235 135"
          fill="none"
          stroke="#f1f5f9"
          stroke-width="20"
          stroke-linecap="butt"
          pathLength="100"
        />

        <!-- Segments -->
        <path
          id="reg-complete"
          d="M 45 135 A 95 95 0 0 1 235 135"
          fill="none"
          stroke="#1bc5bd"
          stroke-width="20"
          stroke-linecap="butt"
          pathLength="100"
        />
        <path
          id="reg-refused"
          d="M 45 135 A 95 95 0 0 1 235 135"
          fill="none"
          stroke="#7344ff"
          stroke-width="20"
          stroke-linecap="butt"
          pathLength="100"
        />
        <path
          id="reg-terminated"
          d="M 45 135 A 95 95 0 0 1 235 135"
          fill="none"
          stroke="#ff5252"
          stroke-width="20"
          stroke-linecap="butt"
          pathLength="100"
        />

        <!-- Percentage Labels placed around the outer edge with zero clipping -->
        <text x="32" y="75" font-size="11" font-weight="600" fill="#64748b" text-anchor="end">33.28%</text>
        <text x="140" y="18" font-size="11" font-weight="600" fill="#64748b" text-anchor="middle">33.28%</text>
        <text x="248" y="75" font-size="11" font-weight="600" fill="#64748b" text-anchor="start">33.44%</text>

        <!-- Center Total Texts -->
        <text
          class="gauge-total-value"
          x="140"
          y="105"
          text-anchor="middle"
          font-size="30"
          font-weight="800"
          fill="#0f172a"
        >625</text>
        <text
          x="140"
          y="125"
          text-anchor="middle"
          font-size="12"
          font-weight="500"
          fill="#64748b"
        >Total</text>
      </svg>
    `;

    this.updateDonutGauge();
  }

  updateDonutGauge() {
    const data = window.dashboardData?.regularHU || {
      complete: 208,
      refused: 208,
      terminated: 209
    };

    const total = data.complete + data.refused + data.terminated;
    if (!total) return;

    const segments = [
      { id: 'reg-complete', value: data.complete },
      { id: 'reg-refused', value: data.refused },
      { id: 'reg-terminated', value: data.terminated }
    ];

    let offset = 0;
    segments.forEach(seg => {
      const pct = (seg.value / total) * 100;
      const el = document.getElementById(seg.id);
      if (!el) return;
      el.setAttribute('stroke-dasharray', `${pct} ${100 - pct}`);
      el.setAttribute('stroke-dashoffset', `${-offset}`);
      offset += pct;
    });

    const totalEl = document.querySelector('#regularGauge .gauge-total-value');
    if (totalEl) {
      totalEl.textContent = total.toLocaleString();
    }
  }
}

/* =========================================================
   INIT
========================================================= */
window.addEventListener('DOMContentLoaded', () => {
  window.ChartGaugeInstance = new ChartGauges();
});