/**
 * replace_entity_vitals.mjs <sim-id>
 * e.g.: node replace_entity_vitals.mjs bs-cable-attacks
 *
 * Replaces the entityVitals: [...] block for the given sim in simulations.js
 * using the corresponding entity_vitals_<folder>.txt file.
 */
import fs from 'fs';

const simId  = process.argv[2];  // e.g. 'bs-cable-attacks'

// Map sim IDs to folder names and seed anchors
const SIM_MAP = {
  'undersea-cable-sabotage':      { folder: 'bs_cable_attacks',        anchor: "simulationId: 'undersea-cable-sabotage'" },
  'bs-taiwan-strait-cable-attacks': { folder: 'bs_cable_attacks',      anchor: "simulationId: 'bs-taiwan-strait-cable-attacks'" },
  'bs-deepfake-crisis':           { folder: 'bs_deepfake_crisis',      anchor: "simulationId: 'bs-deepfake-crisis'" },
  'bs-opensource-surpasses':      { folder: 'bs_opensource_surpasses', anchor: "simulationId: 'bs-opensource-surpasses'" },
  'bs-quantum-rsa':               { folder: 'bs_quantum_rsa',          anchor: "simulationId: 'bs-quantum-rsa'" },
};

if (!simId || !SIM_MAP[simId]) {
  console.error('Usage: node replace_entity_vitals.mjs <sim-id>');
  console.error('Valid IDs:', Object.keys(SIM_MAP).join(', '));
  process.exit(1);
}

const { folder, anchor } = SIM_MAP[simId];
const evPath   = `C:/Users/sdeva/entity_vitals_${folder}.txt`;
const seedPath = 'C:/Users/sdeva/principle-scenarios/src/seed/simulations.js';

if (!fs.existsSync(evPath)) {
  console.error(`Entity vitals file not found: ${evPath}`);
  console.error(`Run: node gen_entity_vitals.mjs ${folder}`);
  process.exit(1);
}

const evBlock = fs.readFileSync(evPath, 'utf8');
let seed = fs.readFileSync(seedPath, 'utf8');

// Find the simulation block starting at the anchor
const anchorIdx = seed.indexOf(anchor);
if (anchorIdx === -1) { console.error(`Anchor not found: ${anchor}`); process.exit(1); }

// Find entityVitals: [ after the anchor
const evStart = seed.indexOf('  entityVitals: [', anchorIdx);
if (evStart === -1) { console.error('entityVitals block not found'); process.exit(1); }

// Find the closing ], by tracking bracket depth
let depth = 0;
let i = evStart + '  entityVitals: '.length;
let evEnd = -1;
while (i < seed.length) {
  if (seed[i] === '[') depth++;
  else if (seed[i] === ']') {
    depth--;
    if (depth === 0) { evEnd = i + 1; break; }
  }
  i++;
}

if (evEnd === -1) { console.error('Could not find closing ] for entityVitals'); process.exit(1); }

// Also consume the trailing comma + newline if present
let tail = evEnd;
if (seed[tail] === ',') tail++;
if (seed[tail] === '\n') tail++;

// Replace
seed = seed.slice(0, evStart) + evBlock + seed.slice(tail);
fs.writeFileSync(seedPath, seed);
console.log(`Replaced entityVitals for ${simId}`);
