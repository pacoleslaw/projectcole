/**
 * Chart-Gauges.js - Custom SVG Charts for EA Dashboard
 * Implements: Half-gauge (Special HU), Donut charts (Regular HU status), Pyramid (gender/age)
 */

class ChartGauges {
  constructor() {
    this.initGauges();
  }

  initGauges() {
    this.initHalfGauge('specialGauge');
    this.initDonutGauge('regularGauge');
    this.animatePyramid();
  }

  // Half-gauge for Special Housing Units (bottom half circle)
  initHalfGauge(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Clear existing content
    container.innerHTML = `
      <svg class="half-gauge-chart" viewBox="0 0 160 100" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#3b82f6"/>
            <stop offset="50%" stop-color="#8b5cf6"/>
            <stop offset="100%" stop-color="#10b981"/>
          </linearGradient>
        </defs>
        <!-- Background arc -->
        <path class="gauge-bg" d="M 20 80 A 60 60 0 0 1 140 80 L 140 90 L 20 90 Z" 
              stroke="#e5e7eb" stroke-width="16" fill="none"/>
        
        <!-- Segments: NUR, Diplomatic, Vacation, Vacant -->
        <path class="gauge-segment" data-segment="0" stroke="url(#gaugeGradient)" stroke-width="16" stroke-linecap="round" 
              path="M 20 80 A 60 60 0 0 1 80 80" stroke-dasharray="94.2 94.2"/>
        <path class="gauge-segment" data-segment="1" stroke="#8b5cf6" stroke-width="16" stroke-linecap="round" 
              path="M 20 80 A 60 60 0 0 1 80 80" stroke-dasharray="47.1 47.1" stroke-dashoffset="-94.2"/>
        <path class="gauge-segment" data-segment="2" stroke="#f59e0b" stroke-width="16" stroke-linecap="round" 
              path="M 20 80 A 60 60 0 0 1 80 80" stroke-dasharray="70.7 70.7" stroke-dashoffset="-141.3"/>
        <path class="gauge-segment" data-segment="3" stroke="#ef4444" stroke-width="16" stroke-linecap="round" 
              path="M 20 80 A 60 60 0 0 1 80 80" stroke-dasharray="94.2 94.2" stroke-dashoffset="-212"/>

        <!-- Labels -->
        <text class="gauge-total" x="80" y="75" text-anchor="middle" font-size="18" font-weight="700" fill="#1f2937">234</text>
        <text class="gauge-label" x="80" y="95" text-anchor="middle" font-size="11" fill="#6b7280">Special HU</text>
        
        <!-- Segment labels -->
        <text class="segment-label" x="50" y="68" font-size="9" fill="white">NUR</text>
        <text class="segment-label" x="65" y="68" font-size="9" fill="white">DIP</text>
        <text class="segment-label" x="82" y="68" font-size="9" fill="white">VAC</text>
        <text class="segment-label" x="110" y="68" font-size="9" fill="white">VNT</text>
      </svg>
    `;

    // Update with real data
    this.updateSpecialGauge();
  }

  updateSpecialGauge() {
    const data = window.dashboardData?.specialHU || {nur:45, diplomatic:12, vacation:67, vacant:110};
    const total = Object.values(data).reduce((a,b)=>a+b, 0);
    const segments = [
      {value: data.nur/total * 188.4, color: '#3b82f6', offset: 0},
      {value: data.diplomatic/total * 188.4, color: '#8b5cf6', offset: 94.2},
      {value: data.vacation/total * 188.4, color: '#f59e0b', offset: 141.3},
      {value: data.vacant/total * 188.4, color: '#ef4444', offset: 0}
    ];

    segments.forEach((seg, i) => {
      const path = document.querySelector(`[data-segment="${i}"]`);
      if (path) {
        path.style.strokeDasharray = `${seg.value} ${188.4}`;
        path.style.strokeDashoffset = `-${seg.offset}`;
        path.style.stroke = seg.color;
      }
    });

    const totalEl = document.querySelector('#specialGauge .gauge-total');
    if (totalEl) totalEl.textContent = total;
  }

  // Donut chart for Regular HU Status
  initDonutGauge(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <svg class="donut-chart" viewBox="0 0 160 160">
        <defs>
          <linearGradient id="donutGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#10b981"/>
            <stop offset="50%" stop-color="#059669"/>
            <stop offset="100%" stop-color="#047857"/>
          </linearGradient>
        </defs>
        <!-- Background -->
        <circle class="donut-bg" cx="80" cy="80" r="64" stroke-width="20"/>
        
        <!-- Segments: Complete, Refused, Terminated, Other -->
        <circle class="donut-segment complete" cx="80" cy="80" r="64" stroke="#10b981" stroke-width="20" 
                stroke-dasharray="402 402" stroke-linecap="round"/>
        <circle class="donut-segment refused" cx="80" cy="80" r="64" stroke="#ef4444" stroke-width="20" 
                stroke-dasharray="98 98" stroke-dashoffset="-402"/>
        <circle class="donut-segment terminated" cx="80" cy="80" r="64" stroke="#f59e0b" stroke-width="20" 
                stroke-dasharray="56 56" stroke-dashoffset="-500"/>
        <circle class="donut-segment other" cx="80" cy="80" r="64" stroke="#6b7280" stroke-width="20" 
                stroke-dasharray="197 197" stroke-dashoffset="-556"/>

        <!-- Center text -->
        <text class="donut-total" x="80" y="75" text-anchor="middle" font-size="20" font-weight="700" fill="#1f2937">2450</text>
        <text class="donut-label" x="80" y="92" text-anchor="middle" font-size="12" fill="#6b7280">Regular HU</text>
      </svg>
    `;

    this.updateRegularGauge();
  }

  updateRegularGauge() {
    const data = window.dashboardData?.regularHU || {complete:1892, refused:156, terminated:89, other:313};
    const total = Object.values(data).reduce((a,b)=>a+b, 0);
    const circumference = 402;
    const segments = [
      {value: data.complete/total * circumference},
      {value: data.refused/total * circumference, offset: circumference},
      {value: data.terminated/total * circumference, offset: circumference + 98},
      {value: data.other/total * circumference, offset: circumference + 154}
    ];

    ['complete','refused','terminated','other'].forEach((type,i) => {
      const circle = document.querySelector(`.donut-segment.${type}`);
      if (circle) {
        circle.style.strokeDasharray = `${segments[i].value} ${circumference}`;
        circle.style.strokeDashoffset = `-${segments[i].offset || 0}`;
      }
    });

    const totalEl = document.querySelector('#regularGauge .donut-total');
    if (totalEl) totalEl.textContent = total;
  }

  // Animate Pyramid Chart
  animatePyramid() {
    const pyramid = document.querySelector('.pyramid-chart');
    if (!pyramid) return;

    // Animate bars with stagger
    const bars = pyramid.querySelectorAll('rect');
    bars.forEach((bar, i) => {
      bar.style.opacity = '0';
      bar.style.transform = 'scaleX(0)';
      setTimeout(() => {
        bar.style.transition = 'opacity 0.6s ease, transform 0.8s cubic-bezier(0.25,0.46,0.45,0.94)';
        bar.style.opacity = '0.85';
        bar.style.transform = 'scaleX(1)';
      }, i * 50);
    });
  }

  // Public update method
  updateAll() {
    this.updateSpecialGauge();
    this.updateRegularGauge();
    this.animatePyramid();
  }
}

// Initialize when DOM ready
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    window.chartGauges = new ChartGauges();
    
    // Listen for parent messages (iframe communication)
    window.addEventListener('message', (e) => {
      if (e.data.type === 'UPDATE_EA_DATA') {
        window.dashboardData = e.data.payload;
        window.chartGauges?.updateAll();
      }
    });
  });
}

// Export for script.js
if (typeof module !== 'undefined') {
  module.exports = ChartGauges;
}

