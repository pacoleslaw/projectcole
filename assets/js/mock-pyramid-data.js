/**
 * Mock data for the Population Pyramid (gender by 5-year age groups).
 * Updated to exactly match the requested screenshot configuration (13 age intervals).
 */

(function () {
  'use strict';

  // Exactly 13 age intervals from top to bottom per screenshot specifications
  const ageGroups = [
    '60>',
    '55 - 59',
    '50 - 54',
    '45 - 49',
    '40 -44',
    '35 - 39',
    '30 - 34',
    '25 - 29',
    '20 - 24',
    '15 - 19',
    '10 - 14',
    '5 - 9',
    '<5'
  ];

  // Proportional values scaled to match the visual bar lengths in the reference image
  const male = [
    11, 10, 13, 14, 17, 21, 17, 30, 34, 23, 49, 38, 45
  ];

  const female = [
    12, 12, 15, 19, 22, 23, 19, 34, 29, 26, 51, 42, 48
  ];

  window.MOCK_PYRAMID_DATA = {
    ageGroups,
    male,
    female
  };
})();
