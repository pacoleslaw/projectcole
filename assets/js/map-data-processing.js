(function () {
  'use strict';

  // --- Status configuration (shared with other modules) ---
  const STATUS_CONFIG = {
    not_started: { label: 'Not Started', color: '#9ca3af', fillColor: '#d1d5db', border: 1 },
    in_progress: { label: 'In Progress', color: '#f59e0b', fillColor: '#fde68a', border: 1 },
    completed: { label: 'Completed', color: '#3b82f6', fillColor: '#bfdbfe', border: 1 },
    validated: { label: 'Validated', color: '#8b5cf6', fillColor: '#ddd6fe', border: 1 },
    certified: { label: 'Certified', color: '#10b981', fillColor: '#a7f3d0', border: 1 }
  };

  // --- Map init ---
  let map, geoJsonData, ncrBarangayData, eaDataMap = new Map(), layerGroups = {};


  // --- Fit to all layers ---
  function fitToAllLayers() {
    const group = new L.featureGroup();
    layerGroups.ea.eachLayer(l => group.addLayer(l));
    layerGroups.ncrBarangay.eachLayer(l => group.addLayer(l));
    if (group.getLayers().length) {
      map.fitBounds(group.getBounds().pad(0.05));
    }
  }

function initMap() {
    map = L.map('leafletMap', { zoomControl: false }).setView([14.5995, 120.9842], 11);

    const cartoPolitical = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 20,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    });
    const osmPolitical = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });

    cartoPolitical.addTo(map);
    cartoPolitical.on('tileerror', () => {
      if (!map.hasLayer(osmPolitical)) {
        map.removeLayer(cartoPolitical);
        osmPolitical.addTo(map);
        showToast('Switched to OSM political fallback.');
      }
    });

    layerGroups = {
      barangay: L.layerGroup().addTo(map),
      ea: L.layerGroup().addTo(map),
      road: L.layerGroup().addTo(map),
      river: L.layerGroup().addTo(map),
      landmark: L.layerGroup().addTo(map),
      ncrBarangay: L.layerGroup().addTo(map)
    };

    document.getElementById('zoomIn').addEventListener('click', () => map.zoomIn());
    document.getElementById('zoomOut').addEventListener('click', () => map.zoomOut());
    document.getElementById('resetMap').addEventListener('click', () => {
      fitToAllLayers();
    });
  }

  // --- Load GeoJSON ---
async function loadGeoJson() {
    try {
      // Load external ea_data.geojson first
      const eaResponse = await fetch('assets/data/ea_data.geojson');
      if (eaResponse.ok) {
        geoJsonData = await eaResponse.json();
      } else {
        // Fallback to embedded data
        geoJsonData = window.EMBEDDED_EA_DATA || window.ea_data;
      }
      
      if (!geoJsonData || !geoJsonData.features || geoJsonData.features.length === 0) {
        console.error('No EA data found in ea_data.geojson or fallback');
        showToast('No EA data available');
        return null;
      }
      console.log('Loaded EA data:', geoJsonData.features.length, 'features from', eaResponse.ok ? 'ea_data.geojson' : 'embedded');
      showToast(`Map data loaded: ${geoJsonData.features.length} EAs`);
      return geoJsonData;
    } catch (err) {
      console.error('loadGeoJson error:', err);
      showToast('Failed to load map data. Check console.');
      return null;
    }
  }

  async function loadNcrBarangays() {
    try {
       // Load external ncr_bgy.geojson first
      const ncrResponse = await fetch('assets/data/ncr_bgy.geojson');
      if (ncrResponse.ok) {
        geoJsonData = await ncrResponse.json();
      } else {
        // Fallback to embedded data
        geoJsonData = window.EMBEDDED_NCR_DATA || window.ncr_bgy;
      }

      

      // const ncrData = EMBEDDED_NCR_DATA || window.ncr_bgy;
      // if (!ncrData || !ncrData.features) {
      //   console.warn('No NCR data found');
      //   return;
      // }

      layerGroups.ncrBarangay.clearLayers();



      
      // Ensure variable exists (previously referenced an undefined global)
      const ncrData = geoJsonData;
      if (!ncrData?.features) {
        console.warn('No NCR features loaded');
        showToast('No NCR barangay boundaries available');
        return;
      }

          ncrData.features.forEach(feature => {
        const geom = feature.geometry;
        if (!geom) return;
        const props = feature.properties || {};
        const name = props.name || props.BARANGAY || props.barangay || 'Barangay';

        if (geom.type === 'Polygon' || geom.type === 'MultiPolygon') {
          const latLngs = toLatLngs(geom.coordinates);

          const poly = L.polygon(latLngs, {
            color: '#4f46e5',
            weight: 1.5,
            fillColor: '#4f46e5',
            fillOpacity: 0.06,
            dashArray: '4,6'
          });

          const popupContent = `
            <div style="font-size:1rem;font-weight:700;margin-bottom:.3rem;">${name}</div>
            <div style="font-size:.85rem;color:#666;">Geocode: ${props.geocode || 'N/A'}</div>
            <div style="font-size:.8rem;color:#888;margin-top:.3rem;">Click to filter by this barangay</div>
          `;

          poly.bindPopup(popupContent);

          poly.on('mouseover', function() {
            this.setStyle({ weight: 3, fillOpacity: 0.18 });
          });
          poly.on('mouseout', function() {
            this.setStyle({ weight: 1.5, fillOpacity: 0.06 });
          });
          poly.on('click', function() {
            const sel = document.getElementById('filterBarangay');
            if (sel) {
              const exists = Array.from(sel.options).some(o => o.value === name);
              if (exists) {
                sel.value = name;
                applyFilters();
                showToast('Filtered to ' + name);
              } else {
                showToast(name + ' not available in EA filter list');
              }
            }
          });

          poly.addTo(layerGroups.ncrBarangay);
        }
      });

      showToast('NCR barangay boundaries loaded');
    } catch (err) {
      console.warn('Failed to load ncr_bgy.geojson:', err);
    }
  }

  function toLatLngs(coords) {
    if (!coords || !Array.isArray(coords)) return coords;
    // Base case: [lon, lat] array of numbers
    if (typeof coords[0] === 'number') {
      return [coords[1], coords[0]];
    }
    // Recursive case: array of coordinates or rings
    return coords.map(c => toLatLngs(c));
  }

  // --- Populate filters from data ---
  function populateFilters() {
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

  // --- Build map layers ---
  function buildLayers() {
    if (!geoJsonData || !geoJsonData.features) return;

    // Clear existing
    Object.values(layerGroups).forEach(g => g.clearLayers());
    eaDataMap.clear();

    const features = geoJsonData.features;
    let eaIndex = 0;

    features.forEach((feature) => {
      const geom = feature.geometry;

      // ea_data.geojson contains only EA boundaries as Polygon or MultiPolygon
      if (geom.type === 'Polygon' || geom.type === 'MultiPolygon') {
        const synthetic = generateEAData(feature, eaIndex++);

        function generateEAData(feature, index) {
          const props = feature.properties || {};
          const statuses = ['not_started', 'in_progress', 'completed', 'validated', 'certified'];
          const status = statuses[index % statuses.length];
          const cfg = STATUS_CONFIG[status];
          const completionRate = Math.max(0, Math.round(100 - (index % 90)));
          
          return {
            id: props.Geocode || `EA_${index + 1}`,
            status: status,
            completionRate: completionRate,
            lastUpdate: new Date(Date.now() - (index * 86400000)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            totalHU: Math.round(Math.random() * 150 + 50),
            form2Submitted: Math.round(completionRate / 100 * (Math.random() * 100 + 800)),
            form3Submitted: Math.round(completionRate / 100 * (Math.random() * 80 + 600))
          };
        }

        eaDataMap.set(feature, synthetic);

        const cfg = STATUS_CONFIG[synthetic.status];
        const isHighlight = ['completed','validated','certified'].includes(synthetic.status);
        const isBottleneck = synthetic.completionRate < 25;

        const poly = L.polygon(toLatLngs(geom.coordinates), {
          color: cfg.color,
          weight: cfg.border,
          fillColor: cfg.fillColor,
          fillOpacity: isBottleneck ? 0.55 : 0.35,
          dashArray: isHighlight ? null : '4,6',
          className: isBottleneck ? 'bottleneck-poly' : ''
        });

        // Tooltip using actual EA properties
        const props = feature.properties || {};
        const tooltipContent = `
          <h4>${props.name || 'EA Boundary'}</h4>
          <div>
            <span class="badge" style="background:${cfg.fillColor};color:${cfg.color};">${cfg.label}</span>
          </div>
          <div>Completion Rate</div>
          <div class="progress-mini"><div class="progress-mini-bar" style="width:${synthetic.completionRate}%;background:${cfg.color};"></div></div>
          <div style="text-align:right;font-size:.75rem;color:var(--muted);">${synthetic.completionRate}%</div>
          <div class="meta">Last Updated: ${synthetic.lastUpdate}</div>
          <div class="meta">Geocode: ${props.Geocode || 'N/A'}   BGY: ${props.BGY_GEO || 'N/A'}</div>
        `;

        poly.bindTooltip(tooltipContent, {
          permanent: false, direction: 'top', offset: [0, -10],
          className: 'leaflet-tooltip-custom', opacity: 1
        });

        poly.on('mouseover', function() {
          this.setStyle({ weight: cfg.border + 2, fillOpacity: Math.min(0.7, (isBottleneck ? 0.55 : 0.35) + 0.2) });
        });
        poly.on('mouseout', function() {
          this.setStyle({ weight: cfg.border, fillOpacity: isBottleneck ? 0.55 : 0.35 });
        });

        // Store refs for filtering
        poly.featureRef = feature;
        poly.eaData = synthetic;
        poly.addTo(layerGroups.ea);
      }
    });

    // Fit to EA bounds
    const eaGroup = new L.featureGroup();
    layerGroups.ea.eachLayer(l => eaGroup.addLayer(l));
    if (eaGroup.getLayers().length) {
      map.fitBounds(eaGroup.getBounds().pad(0.05));
    }

    populateFilters();

    document.dispatchEvent(new CustomEvent('ea-layers-ready'));
  }

  // --- Public API ---
  window.MapDataProcessing = {
    STATUS_CONFIG,
    initMapAndLayers: async () => {
      initMap();
      await loadGeoJson();
      buildLayers();
      await loadNcrBarangays();
      fitToAllLayers();
    },
    reloadLayers: () => {
      if (!map) return;
      map.invalidateSize();
      buildLayers();
      loadNcrBarangays();
      fitToAllLayers();
    },
    getLayerGroups: () => layerGroups,
    getMap: () => map,
    getVisibleEAData: () => {
      const visible = [];
      layerGroups.ea.eachLayer(l => map.hasLayer(l) && visible.push(l.eaData));
      return visible;
    }
  };

  // Toast fallback
  function showToast(msg) {
    const toast = document.getElementById('toast');
    if (toast) {
      toast.textContent = msg;
      toast.classList.add('show');
      setTimeout(()=>toast.classList.remove('show'), 2500);
    }
  }
})();

