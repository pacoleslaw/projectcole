(function () {
  'use strict';

  // --- Shared state ---
  window.__ACTIVE_STATUSES__ = new Set([
    "not_started", "in_progress", "completed", "validated", "certified"
  ]);

  // --- Toast utility ---
  function showToast(msg) {
    const toastEl = document.getElementById('toast');
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    setTimeout(() => toastEl.classList.remove('show'), 2200);
  }

  // --- Sidebar toggle ---
  function initSidebar() {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    if (!menuToggle || !sidebar) return;

    menuToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      sidebar.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
      if (sidebar.classList.contains('open') && 
          !sidebar.contains(e.target) && 
          e.target !== menuToggle) {
        sidebar.classList.remove('open');
      }
    });
  }

  // --- Tab switching ---
  function initTabs() {
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.id.replace('-btn', '');
        
        // Remove active from all
        document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        
        // Activate clicked
        btn.classList.add('active');
        document.getElementById(targetTab).classList.add('active');
        
        // Refresh stats + MAP VISIBILITY FIX on Map tab (tab2)
        if (targetTab === 'tab2') {
          setTimeout(() => {
            const mapObj = window.MapDataProcessing;
            if (mapObj?.reloadLayers) {
              mapObj.reloadLayers();
            } else if (mapObj?.getMap) {
              const map = mapObj.getMap();
              if (map) map.invalidateSize();
            }
          }, 150);
          
          if (window.DataProcessing?.updateStatsFromMap) {
            window.DataProcessing.updateStatsFromMap();
          }
          if (window.DataProcessing?.updateGeotaggingStats) {
            window.DataProcessing.updateGeotaggingStats();
          }
        }
      });
    });
  }

  // --- Legend toggle (MAIN STATUS FILTER) ---
  function initLegend() {
    document.querySelectorAll(".legend-item").forEach(item => {
      item.addEventListener("click", () => {
        const status = item.dataset.status;
        const activeStatuses = window.__ACTIVE_STATUSES__;

        if (activeStatuses.has(status)) {
          activeStatuses.delete(status);
          item.classList.add("disabled");
        } else {
          activeStatuses.add(status);
          item.classList.remove("disabled");
        }

        // Trigger filter update
        if (window.DataProcessing?.applyFilters) {
          window.DataProcessing.applyFilters();
        }
      });
    });
  }

  // --- Geographic filter handlers ---
  function initFilters() {
    ['filterRegion', 'filterProvince', 'filterCityMun', 'filterBarangay'].forEach(id => {

      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('change', () => {
          if (window.DataProcessing?.applyFilters) {
            window.DataProcessing.applyFilters();
          }
        });
      }
    });

    // Reset filters
    const resetBtn = document.getElementById('resetFilters');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        ['filterRegion', 'filterProvince', 'filterCityMun', 'filterBarangay'].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.value = '';
        });

        // Clear EA search selection (if wired)
        const eaSearch = document.getElementById('eaSearch');
        const eaClearBtn = document.getElementById('eaClearBtn');
        if (eaSearch) eaSearch.value = '';
        if (eaClearBtn) {
          // selection state is handled by DataProcessing
          eaClearBtn.disabled = false;
        }
        window.__SELECTED_EA__ = null;
        const eaSelectedLabel = document.getElementById('eaSelectedLabel');
        if (eaSelectedLabel) eaSelectedLabel.textContent = 'All EAs';
        const eaDropdown = document.getElementById('eaDropdown');
        if (eaDropdown) eaDropdown.classList.add('hidden');


        // Reset legend
        window.__ACTIVE_STATUSES__.clear();
        window.__ACTIVE_STATUSES__.add("not_started");
        window.__ACTIVE_STATUSES__.add("in_progress");
        window.__ACTIVE_STATUSES__.add("completed");
        window.__ACTIVE_STATUSES__.add("validated");
        window.__ACTIVE_STATUSES__.add("certified");

        document.querySelectorAll(".legend-item").forEach(item => {
          item.classList.remove("disabled");
        });

        if (window.DataProcessing?.applyFilters) {
          window.DataProcessing.applyFilters();
        }
        showToast('Filters reset');
      });
    }
  }

  // --- Layer toggles (static aside + FAB panel) ---
  function initLayerToggles() {
    const initCheckboxesIn = (containerEl) => {
      if (!containerEl) return;
      containerEl.querySelectorAll('input[type="checkbox"][data-layer]').forEach(cb => {
        cb.addEventListener('change', () => {
          const layerKey = cb.dataset.layer;
          const mapObj = window.MapDataProcessing;
          const group = mapObj?.getLayerGroups?.()[layerKey];
          const map = mapObj?.getMap?.();

          if (!group || !map) return;

          if (cb.checked) {
            map.addLayer(group);
          } else {
            map.removeLayer(group);
          }

          cb.closest('.status-chip')?.classList.toggle('active', cb.checked);
        });
      });
    };

    initCheckboxesIn(document.getElementById('layerToggles'));
    initCheckboxesIn(document.getElementById('layerTogglesFab'));
  }




  // --- Layers FAB / panel open-close (outside click + Escape) ---

  function initLayersFab() {
    const fab = document.getElementById('layersToggle');
    const panel = document.getElementById('layersPanel');
    const closeBtn = document.getElementById('layersClose');

    if (!fab || !panel) return;

    const open = () => {
      fab.setAttribute('aria-expanded', 'true');
      panel.classList.remove('hidden');
    };

    const close = () => {
      fab.setAttribute('aria-expanded', 'false');
      panel.classList.add('hidden');
    };

    // Initial state
    if (fab.getAttribute('aria-expanded') === 'true') {
      open();
    } else {
      close();
    }

    fab.addEventListener('click', (e) => {
      e.stopPropagation();
      if (fab.getAttribute('aria-expanded') === 'true') close();
      else open();
    });

    closeBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      close();
    });

    document.addEventListener('click', (e) => {
      if (fab.getAttribute('aria-expanded') !== 'true') return;
      const t = e.target;
      if (panel.contains(t) || fab.contains(t) || closeBtn?.contains(t)) return;
      close();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (fab.getAttribute('aria-expanded') !== 'true') return;
      close();
      fab.focus?.();
    });
  }


  // --- NCR Barangay click handler ---
  function initNcrBarangayFilter() {
    document.addEventListener('bgy-selected', (e) => {
      const sel = document.getElementById('filterBarangay');
      if (sel) {
        sel.value = e.detail.name;
        if (window.DataProcessing?.applyFilters) {
          window.DataProcessing.applyFilters();
        }
      }
    });
  }


  // --- Demo data for empty tables ---
  function populateDemoTables() {
    // Form 2 & 3 Stats (presentation widget values)
    const form23Stats = document.getElementById('form23Stats');
    if (form23Stats) {
      // Populate demo values into the new card skeleton nodes.
      const setText = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
      };

      // Demo totals/metrics (replace with real wiring if/when available)
      setText('form23TotalCoveredArea', '1,248');
      setText('form23RegularHousingUnits', '892');
      setText('form23SpecialHousingUnits', '356');
      setText('form23MaxBuildingPerBuilding', '24');
      setText('form23MaxHouseholdPerHousingUnit', '6');
      setText('form23TotalHousehold', '2,104');
      setText('form23HouseholdLeft', '1,080');
      setText('form23HouseholdRight', '1,024');
    }

    // Special Housing Units Table
    const specialHuTable = document.getElementById('specialHuTable');
    if (specialHuTable) {
      specialHuTable.innerHTML = `
        <tr><td>001</td><td>NUR</td><td>12</td></tr>
        <tr><td>002</td><td>Diplomatic</td><td>3</td></tr>
        <tr><td>003</td><td>Vacation</td><td>5</td></tr>
        <tr><td>004</td><td>Vacant</td><td>8</td></tr>
      `;
    }

    // Regular Housing Units Table
    const regularHuTable = document.getElementById('regularHuTable');
    if (regularHuTable) {
      regularHuTable.innerHTML = `
        <tr><td>Complete</td><td>1,156</td></tr>
        <tr><td>Refused</td><td>45</td></tr>
        <tr><td>Terminated</td><td>23</td></tr>
        <tr><td>Other</td><td>24</td></tr>
      `;
    }
  }

  // --- Main bootstrap sequence ---
  async function bootstrap() {
    // Init UI first
    initSidebar();
    initTabs();
    initLegend();
    initFilters();
    initLayerToggles();
    initLayersFab();
    initNcrBarangayFilter();

    populateDemoTables();

    // Wait for map module to load & init
    if (window.MapDataProcessing?.initMapAndLayers) {
      await window.MapDataProcessing.initMapAndLayers();

      // Wait for layers ready, then init data processing
      document.addEventListener('ea-layers-ready', () => {
        if (window.DataProcessing) {
          showToast('Dashboard fully loaded');
        }
      }, { once: true });
    } else {
      console.warn('MapDataProcessing not ready - retrying...');
      setTimeout(bootstrap, 100);
    }
  }

  // Init when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }

  // Expose for debugging
  window.MainDashboard = {
    showToast,
    getActiveStatuses: () => window.__ACTIVE_STATUSES__
  };
})();

