import fs from 'fs';

const seedPath = 'C:/Users/sdeva/principle-scenarios/src/seed/simulations.js';
const wcBlock  = fs.readFileSync('C:/Users/sdeva/worldcard_bs_opensource_surpasses.txt', 'utf8');
const evBlock  = fs.readFileSync('C:/Users/sdeva/entity_vitals_bs_opensource_surpasses.txt', 'utf8');

let seed = fs.readFileSync(seedPath, 'utf8');

const anchor = "simulationId: 'bs-opensource-surpasses'";
const idx = seed.indexOf(anchor);
if (idx === -1) { console.error('Could not find bsOpensourceSurpasses anchor'); process.exit(1); }

const eventsStart = seed.indexOf('  events: [', idx);
if (eventsStart === -1) { console.error('Could not find events array'); process.exit(1); }

seed = seed.slice(0, eventsStart) + wcBlock + '\n' + evBlock + '\n' + seed.slice(eventsStart);

fs.writeFileSync(seedPath, seed);
console.log('Patched bsOpensourceSurpasses with worldCard + entityVitals');
