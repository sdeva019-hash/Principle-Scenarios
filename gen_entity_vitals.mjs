import fs from 'fs';
import path from 'path';

// Usage: node gen_entity_vitals.mjs <sim_folder_name>
// e.g.:  node gen_entity_vitals.mjs bs_cable_attacks
const simName = process.argv[2] || 'bs_cable_attacks';
const base = `C:/Users/sdeva/principle-scenarios/simulations/grok_final_simulations/${simName}/agents`;

const agentDirs = fs.readdirSync(base).filter(d =>
  fs.statSync(path.join(base, d)).isDirectory()
);

function isMarketFactor(agentId) {
  return agentId.startsWith('meta-') && agentId !== 'meta-ai';
}

function extractNum(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number') return v;
  if (typeof v === 'object' && v !== null) {
    // Handle {current, proposed, ...} schema
    const n = v.current ?? v.value ?? v.score ?? null;
    return typeof n === 'number' ? n : null;
  }
  const parsed = parseFloat(v);
  return isNaN(parsed) ? null : parsed;
}

const entities = [];

for (const dir of agentDirs) {
  // dir format: "Name -- agent-id"
  const match = dir.match(/^(.+) -- (.+)$/);
  if (!match) continue;
  const [, name, agentId] = match;
  const isMeta = isMarketFactor(agentId);

  const ticks = [];
  for (let t = 0; t <= 8; t++) {
    const stateFile = path.join(base, dir, `State-Tick-${t}.json`);
    if (!fs.existsSync(stateFile)) continue;
    try {
      const s = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
      if (isMeta) {
        ticks.push({
          tick: t,
          pressure:   extractNum(s.pressure),
          volatility: extractNum(s.volatility),
          momentum:   extractNum(s.momentum),
        });
      } else {
        ticks.push({
          tick: t,
          market_power:   extractNum(s.market_power),
          technical_edge: extractNum(s.technical_edge),
          momentum:       extractNum(s.momentum),
        });
      }
    } catch (e) {
      // skip missing/corrupt files
    }
  }

  entities.push({ agentId, name, isMeta, ticks });
}

// Sort: companies first (alphabetical), then metas (alphabetical)
entities.sort((a, b) => {
  if (a.isMeta !== b.isMeta) return a.isMeta ? 1 : -1;
  return a.name.localeCompare(b.name);
});

// Output as a JS literal block for patching into simulations.js
const ticksStr = (ticks) => JSON.stringify(ticks);

const lines = entities.map(e =>
  `      { agentId: ${JSON.stringify(e.agentId)}, name: ${JSON.stringify(e.name)}, isMeta: ${e.isMeta}, ticks: ${ticksStr(e.ticks)} }`
);

const block = `  entityVitals: [\n${lines.join(',\n')}\n  ],`;

const outPath = `C:/Users/sdeva/entity_vitals_${simName}.txt`;
fs.writeFileSync(outPath, block);
console.log(`Written ${entities.length} entities, ${block.length} chars → ${outPath}`);
