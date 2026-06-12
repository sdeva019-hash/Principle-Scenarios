import fs from 'fs';
import path from 'path';

const base = 'C:/Users/sdeva/principle-scenarios/simulations/grok_final_simulations/bs_cable_attacks/agents';
const samples = [
  'AMD -- amd',
  'Cerebras -- cerebras',
  'CoreWeave -- coreweave',
  'Energy Infrastructure -- meta-energy-infra',
  'Government Regulators -- meta-gov-regulators',
  'Top-Tier AI VCs -- meta-ai-vcs',
  'Talent & Labor Market -- meta-talent-labor'
];

for (const s of samples) {
  try {
    const d = JSON.parse(fs.readFileSync(path.join(base, s, 'State-Tick-0.json')));
    const keys = Object.keys(d).filter(k => k !== 'tick');
    console.log(`${s}: ${keys.join(', ')}`);
    console.log(`  vitals: market_power=${d.market_power} technical_edge=${d.technical_edge} pressure=${d.pressure} volatility=${d.volatility} momentum=${d.momentum}`);
  } catch(e) { console.log(`${s}: ERROR ${e.message}`); }
}
