import fs from 'fs';

const seedPath = 'C:/Users/sdeva/principle-scenarios/src/seed/simulations.js';
const blockPath = 'C:/Users/sdeva/entity_vitals_bs_cable_attacks.txt';

let seed = fs.readFileSync(seedPath, 'utf8');
const newBlock = fs.readFileSync(blockPath, 'utf8');

// Remove any existing entityVitals block
const existingRe = /  entityVitals: \[[\s\S]*?\n  \],\n/g;
const existing = seed.match(existingRe);
if (existing) {
  console.log('Removing', existing.length, 'existing entityVitals blocks');
  seed = seed.replace(existingRe, '');
}

// Insert before the closing "}" of each simulation object.
// Each simulation object ends with "  }," or "  }" near worldCard.
// We insert entityVitals right after the worldCard block closes.
const wcEndRe = /(  worldCard: \{[\s\S]*?\n  \},\n)/g;
let count = 0;
seed = seed.replace(wcEndRe, (match) => {
  count++;
  return match + newBlock + '\n';
});
console.log('Inserted entityVitals into', count, 'simulation objects');

fs.writeFileSync(seedPath, seed);
console.log('Seed patched successfully');
