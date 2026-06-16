import fs from 'fs';

const seedPath = 'C:/Users/sdeva/principle-scenarios/src/seed/simulations.js';
const wcBlock  = fs.readFileSync('C:/Users/sdeva/worldcard_bs_deepfake_crisis.txt', 'utf8');
const evBlock  = fs.readFileSync('C:/Users/sdeva/entity_vitals_bs_deepfake_crisis.txt', 'utf8');

let seed = fs.readFileSync(seedPath, 'utf8');

// Find the bsDeepfakeCrisis object — inject worldCard + entityVitals before its closing "events: [" section
// Strategy: find the closing of the events array for bsDeepfakeCrisis and insert before the closing brace
// Anchor: the deepfake object ends with the last event then "]," then "};"
// We'll find "bs-deepfake-crisis" and then find the first events array close after it
const anchor = "simulationId: 'bs-deepfake-crisis'";
const idx = seed.indexOf(anchor);
if (idx === -1) { console.error('Could not find bsDeepfakeCrisis anchor'); process.exit(1); }

// Find "  events: [" after the anchor
const eventsStart = seed.indexOf('  events: [', idx);
if (eventsStart === -1) { console.error('Could not find events array'); process.exit(1); }

// Insert worldCard + entityVitals before the events block
const insertion = wcBlock + '\n' + evBlock + '\n';
seed = seed.slice(0, eventsStart) + insertion + seed.slice(eventsStart);

fs.writeFileSync(seedPath, seed);
console.log('Patched bsDeepfakeCrisis with worldCard + entityVitals');
