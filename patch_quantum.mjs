import fs from 'fs';

const seedPath = 'C:/Users/sdeva/principle-scenarios/src/seed/simulations.js';
const evBlock  = fs.readFileSync('C:/Users/sdeva/entity_vitals_bs_quantum_rsa.txt', 'utf8');

let seed = fs.readFileSync(seedPath, 'utf8');

const anchor = "simulationId: 'bs-quantum-rsa'";
const idx = seed.indexOf(anchor);
if (idx === -1) { console.error('Could not find bsQuantumRsa anchor'); process.exit(1); }

const eventsStart = seed.indexOf('  events: [', idx);
if (eventsStart === -1) { console.error('Could not find events array'); process.exit(1); }

// No worldCard for this sim — only entityVitals
seed = seed.slice(0, eventsStart) + evBlock + '\n' + seed.slice(eventsStart);

fs.writeFileSync(seedPath, seed);
console.log('Patched bsQuantumRsa with entityVitals (no worldCard)');
