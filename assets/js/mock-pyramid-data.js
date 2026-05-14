/**
 * Mock data for the Population Pyramid (gender by 5-year age groups).
 * Used by main.js / data-processing.js to render the SVG pyramid chart.
 */

(function () {
  'use strict';

  // 17 age bracket: 0-4, 5-9, ..., 80-84 (5-year groups)
  // Values represent counts (can be replaced by real survey data later).
  const ageGroups = [
    '80-84', '75-79', '70-74', '65-69', '60-64', '55-59',
'50-54', '45-49', '40-44', '35-39', '30-34', '25-29',
'20-24', '15-19', '10-14', '5-9', '0-4'
  ];

  // Male and Female counts per age bracket.
  const male = [
    118, 140, 160, 175, 168, 155,
    150, 142, 130, 118, 105, 92,
    85, 78, 70, 55, 33
  ];

  const female = [
    112, 135, 158, 170, 172, 160,
    152, 145, 138, 125, 110, 98,
    92, 84, 76, 60, 41
  ];

  window.MOCK_PYRAMID_DATA = {
    ageGroups,
    male,
    female
  };
})();

