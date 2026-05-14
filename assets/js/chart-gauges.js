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
    <svg class="half-gauge-chart" viewBox="0 0 220 150">
      
      <!-- Background -->
      <path
        d="M 30 110 A 80 80 0 0 1 190 110"
        fill="none"
        stroke="#e5e7eb"
        stroke-width="18"
        stroke-linecap="round"
        pathLength="100"
      />

      <!-- NUR -->
      <path
        id="seg-nur"
        d="M 30 110 A 80 80 0 0 1 190 110"
        fill="none"
        stroke="#10b981"
        stroke-width="18"
        stroke-linecap="round"
        pathLength="100"
      />

      <!-- Diplomatic -->
      <path
        id="seg-diplomatic"
        d="M 30 110 A 80 80 0 0 1 190 110"
        fill="none"
        stroke="#3b82f6"
        stroke-width="18"
        stroke-linecap="butt"
        pathLength="100"
      />

      <!-- Vacation -->
      <path
        id="seg-vacation"
        d="M 30 110 A 80 80 0 0 1 190 110"
        fill="none"
        stroke="#f59e0b"
        stroke-width="18"
        stroke-linecap="butt"
        pathLength="100"
      />

      <!-- Vacant -->
      <path
        id="seg-vacant"
        d="M 30 110 A 80 80 0 0 1 190 110"
        fill="none"
        stroke="#ef4444"
        stroke-width="18"
        stroke-linecap="butt"
        pathLength="100"
      />

      <!-- Total -->
      <text
        class="gauge-total"
        x="110"
        y="88"
        text-anchor="middle"
        dominant-baseline="middle"
        font-size="30"
        font-weight="800"
        fill="#111827"
      >
        0
      </text>

      <text
        class="gauge-label"
        x="110"
        y="108"
        text-anchor="middle"
        dominant-baseline="middle"
        font-size="13"
        fill="#6b7280"
      >
        Special HU
      </text>
    </svg>
  `;

  this.updateSpecialGauge();
}

 updateSpecialGauge() {
  const data = window.dashboardData?.specialHU || {
    nur: 12,
    diplomatic: 3,
    vacation: 5,
    vacant: 8
  };

  const total =
    data.nur +
    data.diplomatic +
    data.vacation +
    data.vacant;

  if (!total) return;

  const values = [
    {
      id: 'seg-nur',
      value: data.nur,
      color: '#10b981'
    },
    {
      id: 'seg-diplomatic',
      value: data.diplomatic,
      color: '#3b82f6'
    },
    {
      id: 'seg-vacation',
      value: data.vacation,
      color: '#f59e0b'
    },
    {
      id: 'seg-vacant',
      value: data.vacant,
      color: '#ef4444'
    }
  ];

  let offset = 0;

  values.forEach(seg => {
    const pct = (seg.value / total) * 100;

    const el = document.getElementById(seg.id);

    if (!el) return;

    el.setAttribute(
      'stroke-dasharray',
      `${pct} ${100 - pct}`
    );

    el.setAttribute(
      'stroke-dashoffset',
      `${-offset}`
    );

    offset += pct;
  });

  const totalEl = document.querySelector(
    '#specialGauge .gauge-total'
  );

  if (totalEl) {
    totalEl.textContent = total.toLocaleString();
  }
}

initDonutGauge(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <svg class="half-gauge-chart" viewBox="0 0 220 150">

      <!-- Background -->
      <path
        d="M 30 110 A 80 80 0 0 1 190 110"
        fill="none"
        stroke="#e5e7eb"
        stroke-width="18"
        stroke-linecap="round"
        pathLength="100"
      />

      <!-- Complete -->
      <path
        id="reg-complete"
        d="M 30 110 A 80 80 0 0 1 190 110"
        fill="none"
        stroke="#10b981"
        stroke-width="18"
        stroke-linecap="round"
        pathLength="100"
      />

      <!-- Refused -->
      <path
        id="reg-refused"
        d="M 30 110 A 80 80 0 0 1 190 110"
        fill="none"
        stroke="#3b82f6"
        stroke-width="18"
        stroke-linecap="butt"
        pathLength="100"
      />

      <!-- Terminated -->
      <path
        id="reg-terminated"
        d="M 30 110 A 80 80 0 0 1 190 110"
        fill="none"
        stroke="#f59e0b"
        stroke-width="18"
        stroke-linecap="butt"
        pathLength="100"
      />

      <!-- Other -->
      <path
        id="reg-other"
        d="M 30 110 A 80 80 0 0 1 190 110"
        fill="none"
        stroke="#6b7280"
        stroke-width="18"
        stroke-linecap="butt"
        pathLength="100"
      />

      <!-- Total -->
      <text
        class="gauge-total"
        x="110"
        y="88"
        text-anchor="middle"
        dominant-baseline="middle"
        font-size="30"
        font-weight="800"
        fill="#111827"
      >
        0
      </text>

      <text
        class="gauge-label"
        x="110"
        y="108"
        text-anchor="middle"
        dominant-baseline="middle"
        font-size="13"
        fill="#6b7280"
      >
        Regular HU
      </text>

    </svg>
  `;

  this.updateDonutGauge();
}

updateDonutGauge() {
  const data = window.dashboardData?.regularHU || {
    complete: 1156,
    refused: 45,
    terminated: 23,
    other: 24
  };

  const total =
    data.complete +
    data.refused +
    data.terminated +
    data.other;

  if (!total) return;

  const segments = [
    {
      id: 'reg-complete',
      value: data.complete
    },
    {
      id: 'reg-refused',
      value: data.refused
    },
    {
      id: 'reg-terminated',
      value: data.terminated
    },
    {
      id: 'reg-other',
      value: data.other
    }
  ];

  let offset = 0;

  segments.forEach(seg => {
    const pct = (seg.value / total) * 100;

    const el = document.getElementById(seg.id);

    if (!el) return;

    el.setAttribute(
      'stroke-dasharray',
      `${pct} ${100 - pct}`
    );

    el.setAttribute(
      'stroke-dashoffset',
      `${-offset}`
    );

    offset += pct;
  });

  const totalEl = document.querySelector(
    '#regularGauge .gauge-total'
  );

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