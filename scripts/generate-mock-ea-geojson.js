/* eslint-disable no-console */
'use strict';

/**
 * Generates mock_data.geojson by augmenting each EA feature from ea_data.geojson.
 * Geometry and fid/geocode are preserved; only properties are added/derived.
 *
 * Output: mock_data.geojson
 */

const fs = require('fs');
const path = require('path');

const INPUT = path.join(__dirname, '..', 'ea_data.geojson');
const OUTPUT = path.join(__dirname, '..', 'mock_data.geojson');

function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t += 0x6D2B79F5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStringToSeed(str) {
  // Simple deterministic hash
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function safeInt(n, fallback = 0) {
  const v = Number(n);
  return Number.isFinite(v) ? Math.trunc(v) : fallback;
}

function parseBGYGeo(bgyGeo) {
  // NCR barangay geocodes in your data look like 8060MMKKBBBBBB??
  // In your ea_data, BGY_GEO starts with 80601 (NCR -> City/mun) followed by muni digits.
  // We'll use a deterministic but consistent mapping by splitting:
  // - munCode = first 5 digits after leading '80601'/'80602' etc from the string length.
  // Your sample: 80601035000000 (len 14)
  // We'll interpret:
  //   region = 80600 (NCR)
  //   city_mun = bgyGeo.slice(0, 7) (roughly 80601xx)
  //   barangay = bgyGeo.slice(7) (rest)
  const s = String(bgyGeo || '');
  if (s.length < 8) return { cityCode: '', barangayCode: '' };
  const cityCode = s.slice(0, 7);
  const barangayCode = s.slice(7);
  return { cityCode, barangayCode };
}

function makeLabels(cityCode) {
  // cityCode is something like 8060103 / 8060117 / etc (from prefix of BGY_GEO)
  // We'll create readable labels but keep deterministic mapping.
  const known = new Map([
    ['8060101', 'Caloocan'],
    ['8060102', 'Manila'],
    ['8060103', 'Makati'],
    ['8060104', 'Pasay'],
    ['8060105', 'Quezon City'],
    ['8060106', 'San Juan'],
    ['8060107', 'Pasig'],
    ['8060108', 'Mandaluyong'],
    ['8060109', 'Marikina'],
    ['8060110', 'Valenzuela'],
    ['8060111', 'Las Piñas'],
    ['8060112', 'Muntinlupa'],
    ['8060113', 'Parañaque'],
    ['8060114', 'Taguig'],
  ]);
  // cityCode length 7; for known map we expect 7? Use first 6 digits? We'll just try first 6-7.
  const asKey = cityCode.startsWith('80601') ? cityCode : cityCode;
  return known.get(asKey) || `CityMun ${cityCode.slice(-3)}`;
}

function makeBarangayLabel(barangayCode) {
  // Create barangay label in a stable way.
  // barangayCode in sample looks like 5000000 etc; we’ll map last 2 digits.
  const last2 = Number(String(barangayCode || '').slice(-2)) || 0;
  const n = (last2 % 20) + 1;
  return `Barangay ${n.toString().padStart(2, '0')}`;
}

function generateHouseholdMath(rng, basePop, baseHU) {
  // Correlated synthetic totals.
  // Occupied HU should not exceed total HU.
  const occupiedRatio = 0.85 + (rng() - 0.5) * 0.25; // around 0.85
  const occupied = Math.max(0, Math.min(baseHU, Math.round(baseHU * occupiedRatio)));
  const vacant = Math.max(0, baseHU - occupied);

  // Household size approx: pop / occupied
  const avgHHsize = 4.3 + (rng() - 0.5) * 1.2;
  const households = Math.max(1, Math.round(occupied * avgHHsize));
  const householdLeft = Math.round(households * (0.45 + (rng() - 0.5) * 0.2));
  const householdRight = Math.max(0, households - householdLeft);

  return {
    totalPopulation: basePop,
    totalHousingUnits: baseHU,
    occupiedHousingUnits: occupied,
    vacantHousingUnits: vacant,
    totalHousehold: households,
    householdLeft,
    householdRight,
  };
}

async function main() {
  if (!fs.existsSync(INPUT)) {
    console.error('Missing ea_data.geojson at', INPUT);
    process.exit(1);
  }

  const ea = JSON.parse(fs.readFileSync(INPUT, 'utf8'));
  if (!ea?.features?.length) {
    console.error('No features in ea_data.geojson');
    process.exit(1);
  }

  const out = {
    type: 'FeatureCollection',
    name: 'mock_data',
    crs: ea.crs || { type: 'name', properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' } },
    features: [],
  };

  for (let i = 0; i < ea.features.length; i++) {
    const f = ea.features[i];
    const props = { ...(f.properties || {}) };

    const geocode = String(props.Geocode || props.geocode || `EA_${i + 1}`);
    const { cityCode, barangayCode } = parseBGYGeo(props.BGY_GEO);

    // NCR only.
    props.region = 'NCR';

    const cityLabel = makeLabels(cityCode);
    props.city_mun = cityLabel;

    const provinceLabel = 'Metro Manila';
    props.province = provinceLabel;

    // Dashboard sometimes uses barangay or BGY_GEO.
    const barangayLabel = props.BGY_GEO ? makeBarangayLabel(barangayCode) : 'Barangay';
    props.barangay = barangayLabel;

    // Deterministic RNG per feature.
    const rng = mulberry32(hashStringToSeed(geocode));

    // Base population/housing scaling per cityCode bucket.
    // Make cities somewhat different while staying correlated.
    const cityFactor = 0.6 + (rng() * 0.8);

    const basePop = Math.round(450 + cityFactor * (rng() * 2800)); // ~450..~3100
    const baseHU = Math.round(90 + cityFactor * (rng() * 650)); // ~90..~650

    const math = generateHouseholdMath(rng, basePop, baseHU);

    // Economic-ish / demographic-ish fields (optional but useful for future wiring)
    const employedRatio = 0.55 + (rng() - 0.5) * 0.18;
    const laborForceRatio = 0.62 + (rng() - 0.5) * 0.12;

    const laborForcePopulation = Math.max(0, Math.round(math.totalPopulation * laborForceRatio));
    const employedPopulation = Math.max(0, Math.round(laborForcePopulation * employedRatio));
    const unemployedPopulation = Math.max(0, laborForcePopulation - employedPopulation);

    // Age group (7 bins) for pyramid-like charts (optional wiring)
    const ageWeights = [0.14, 0.13, 0.17, 0.18, 0.16, 0.14, 0.08];
    const ageJitter = ageWeights.map(w => Math.max(0.01, w * (0.85 + rng() * 0.3)));
    const sumW = ageJitter.reduce((a, b) => a + b, 0);
    const norm = ageJitter.map(w => w / sumW);

    const ageGroups = ['0-4', '5-9', '10-14', '15-19', '20-39', '40-64', '65+'];
    const ageCounts = norm.map(w => Math.max(0, Math.round(math.totalPopulation * w)));
    // Fix rounding drift
    const drift = math.totalPopulation - ageCounts.reduce((a, b) => a + b, 0);
    if (ageCounts.length && drift !== 0) ageCounts[0] += drift;

    const maleRatio = 0.49 + (rng() - 0.5) * 0.06;
    const totalMale = Math.max(0, Math.round(math.totalPopulation * maleRatio));
    const totalFemale = Math.max(0, math.totalPopulation - totalMale);

    const maleByAge = ageCounts.map(c => Math.max(0, Math.round(c * (maleRatio + (rng() - 0.5) * 0.03))));

    // Fix rounding per bucket
    const maleDrift = totalMale - maleByAge.reduce((a, b) => a + b, 0);
    if (maleByAge.length && maleDrift !== 0) maleByAge[maleByAge.length - 1] += maleDrift;

    const femaleByAge = ageCounts.map((c, idx) => Math.max(0, c - maleByAge[idx]));

    // Housing type ratios: regular vs special (optional)
    const specialHuRatio = 0.25 + (rng() - 0.5) * 0.08;
    const specialHU = Math.max(0, Math.min(math.totalHousingUnits, Math.round(math.totalHousingUnits * specialHuRatio)));
    const regularHU = Math.max(0, math.totalHousingUnits - specialHU);

    // Special breakdown: nur/diplomatic/vacation/vacant
    const nurRatio = 0.26 + (rng() - 0.5) * 0.12;
    const diplomaticRatio = 0.06 + (rng() - 0.5) * 0.04;
    const vacationRatio = 0.26 + (rng() - 0.5) * 0.14;

    let nur = Math.max(0, Math.round(specialHU * nurRatio));
    let diplomatic = Math.max(0, Math.round(specialHU * diplomaticRatio));
    let vacation = Math.max(0, Math.round(specialHU * vacationRatio));
    let vacant = Math.max(0, specialHU - nur - diplomatic - vacation);

    // Regular HU status breakdown: complete/refused/terminated/other
    const refusedRatio = 0.07 + (rng() - 0.5) * 0.04;
    const terminatedRatio = 0.035 + (rng() - 0.5) * 0.03;
    const otherRatio = 0.15 + (rng() - 0.5) * 0.06;

    let refused = Math.max(0, Math.round(regularHU * refusedRatio));
    let terminated = Math.max(0, Math.round(regularHU * terminatedRatio));
    let other = Math.max(0, Math.round(regularHU * otherRatio));
    let complete = Math.max(0, regularHU - refused - terminated - other);

    // Poverty incidence-ish
    const povertyIncidence = Math.max(0.5, Math.min(55, 10 + (rng() - 0.5) * 22 + (1 - cityFactor) * 12));
    const averageIncome = Math.max(5000, Math.round(25000 * (1 + (rng() - 0.5) * 0.4) * cityFactor));

    // Progress/status (dashboard uses legend filters; map filters are based on status from map-data-processing.js)
    // We'll add progress fields for future wiring.
    const completionPct = Math.max(0, Math.min(100, Math.round(100 - (rng() * 75))));

    // Assign properties
    props.total_population = math.totalPopulation;
    props.male_population = totalMale;
    props.female_population = totalFemale;

    props.age_0_4 = ageCounts[0];
    props.age_5_9 = ageCounts[1];
    props.age_10_14 = ageCounts[2];
    props.age_15_19 = ageCounts[3];
    props.age_20_39 = ageCounts[4];
    props.age_40_64 = ageCounts[5];
    props.age_65_plus = ageCounts[6];

    props.employed_population = employedPopulation;
    props.unemployed_population = unemployedPopulation;
    props.labor_force_population = laborForcePopulation;

    props.total_housing_units = math.totalHousingUnits;
    props.occupied_housing_units = math.occupiedHousingUnits;
    props.vacant_housing_units = math.vacantHousingUnits;

    // Special & regular HU breakdown
    props.special_hu_total = specialHU;
    props.regular_hu_total = regularHU;
    props.special_hu_nur = nur;
    props.special_hu_diplomatic = diplomatic;
    props.special_hu_vacation = vacation;
    props.special_hu_vacant = vacant;

    props.regular_hu_complete = complete;
    props.regular_hu_refused = refused;
    props.regular_hu_terminated = terminated;
    props.regular_hu_other = other;

    // Households
    props.total_household = math.totalHousehold;
    props.household_left = math.householdLeft;
    props.household_right = math.householdRight;

    // Economic
    props.poverty_incidence = Number(povertyIncidence.toFixed(1));
    props.average_income = averageIncome;

    // Progress
    props.progress_percentage = completionPct;
    props.completed_interviews = Math.round((completionPct / 100) * (20 + rng() * 180));
    props.pending_interviews = Math.round((1 - completionPct / 100) * (20 + rng() * 180));

    out.features.push({
      type: 'Feature',
      geometry: f.geometry,
      properties: props,
    });
  }

  fs.writeFileSync(OUTPUT, JSON.stringify(out));
  console.log(`Wrote ${out.features.length} features to ${OUTPUT}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

