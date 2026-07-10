const test = require('node:test');
const assert = require('node:assert/strict');
const { getModel } = require('../popup.js');

test('prefers the primary Passport model over a related TrailSport variant', () => {
  const pageText = [
    '2026 Passport TrailSport Elite',
    'The 2026 Passport is more rugged and capable.',
    'CR-V AWD TrailSport is also mentioned in a comparison block.'
  ].join(' ');

    const availableModels = [
        "Accord",
        "Accord Hybrid",
        "Accord Hybrid Sport/Touring",
        "Accord SE",
        "Civic 4Dr",
        "Civic 5Dr",
        "CR-V AWD",
        "CR-V AWD TrailSport",
        "CR-V e-FCEV",
        "CR-V FWD",
        "HR-V AWD",
        "HR-V FWD",
        "Odyssey",
        "Passport AWD",
        "Passport AWD Trailsport",
        "Pilot AWD",
        "Pilot AWD Touring/Elite/Black",
        "Pilot AWD TrailSport",
        "Pilot FWD",
        "Prelude",
        "Prologue AWD",
        "Prologue FWD",
        "Ridgeline AWD",
        "Ridgeline AWD TrailSport"
    ]

    assert.equal(getModel(pageText, availableModels), 'Passport');
});
