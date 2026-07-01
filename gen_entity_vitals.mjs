import fs from 'fs';
import path from 'path';

const simName = process.argv[2] || 'bs_cable_attacks';
const agentsDir = `C:/Users/sdeva/principle-scenarios/simulations/grok_final_simulations/${simName}/agents`;
const outPath   = `C:/Users/sdeva/entity_vitals_${simName}.txt`;

// ── Agent-to-category mapping ──────────────────────────────────────────────
const AGENT_CATEGORY = {
  openai: 'foundation_models', anthropic: 'foundation_models',
  'google-deepmind': 'foundation_models', 'meta-ai': 'foundation_models',
  xai: 'foundation_models', deepseek: 'foundation_models', mistral: 'foundation_models',
  aws: 'cloud_hyperscalers', 'microsoft-azure': 'cloud_hyperscalers',
  'google-cloud': 'cloud_hyperscalers', 'oracle-oci': 'cloud_hyperscalers',
  nvidia: 'chipmakers', amd: 'chipmakers', broadcom: 'chipmakers',
  intel: 'chipmakers', cerebras: 'chipmakers', groq: 'chipmakers', sambanova: 'chipmakers',
  coreweave: 'compute_infra', crusoe: 'compute_infra',
  'lambda-labs': 'compute_infra', nebius: 'compute_infra',
  databricks: 'data_infra', snowflake: 'data_infra',
  mongodb: 'data_infra', pinecone: 'data_infra',
  palantir: 'enterprise_ai_platforms', salesforce: 'enterprise_ai_platforms',
  servicenow: 'enterprise_ai_platforms', sap: 'enterprise_ai_platforms',
  cohere: 'enterprise_ai_platforms', 'microsoft-copilot': 'enterprise_ai_platforms',
  cursor: 'ai_native_apps', perplexity: 'ai_native_apps', glean: 'ai_native_apps',
  cognition: 'ai_native_apps', sierra: 'ai_native_apps',
  intercom: 'ai_native_apps', decagon: 'ai_native_apps',
  harvey: 'ai_distribution_tooling', 'hugging-face': 'ai_distribution_tooling',
  'scale-ai': 'ai_distribution_tooling', 'together-ai': 'ai_distribution_tooling',
  apple: 'ai_distribution_tooling', clay: 'ai_distribution_tooling',
  mercor: 'ai_distribution_tooling',
};

function extractVal(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number') return v;
  if (typeof v === 'string') return v;
  if (typeof v === 'boolean') return v;
  if (typeof v === 'object') {
    const num = v.current ?? v.value ?? v.score ?? v.proposed;
    return num !== undefined ? num : null;
  }
  return null;
}

function isMarketFactor(agentId) {
  return agentId.startsWith('meta-') && agentId !== 'meta-ai';
}

const agentDirs = fs.readdirSync(agentsDir);
const entries = [];

for (const dirName of agentDirs) {
  const match = dirName.match(/^.+\s--\s(.+)$/);
  if (!match) continue;
  const agentId = match[1].trim();
  const displayName = dirName.replace(/\s--\s.+$/, '').trim();

  const isMeta = isMarketFactor(agentId);
  const category = isMeta ? agentId : (AGENT_CATEGORY[agentId] || 'unknown');

  const agentPath = path.join(agentsDir, dirName);
  const tickFiles = fs.readdirSync(agentPath)
    .filter(f => f.match(/^State-Tick-\d+\.json$/))
    .sort((a, b) => parseInt(a.match(/(\d+)/)[1]) - parseInt(b.match(/(\d+)/)[1]));

  if (tickFiles.length === 0) continue;

  const ticks = [];
  for (const tf of tickFiles) {
    const tickNum = parseInt(tf.match(/(\d+)/)[1]);
    let raw;
    try { raw = JSON.parse(fs.readFileSync(path.join(agentPath, tf), 'utf8').replace(/^﻿/, '')); }
    catch { continue; }

    const state = {};
    for (const [k, v] of Object.entries(raw)) {
      if (k === 'tick') continue;
      const val = extractVal(v);
      if (val !== null) state[k] = val;
    }

    ticks.push({ tick: tickNum, state });
  }

  if (ticks.length === 0) continue;
  entries.push({ agentId, displayName, isMeta, category, ticks });
}

// ── Render as JS block ─────────────────────────────────────────────────────
function renderState(state) {
  const lines = Object.entries(state).map(([k, v]) => {
    if (typeof v === 'string') return `              ${k}: ${JSON.stringify(v)}`;
    return `              ${k}: ${v}`;
  });
  return `{\n${lines.join(',\n')}\n            }`;
}

const evLines = entries.map(({ agentId, displayName, isMeta, category, ticks }) => {
  const tickLines = ticks.map(({ tick, state }) =>
    `          { tick: ${tick}, state: ${renderState(state)} }`
  ).join(',\n');

  return `    {
      agentId: ${JSON.stringify(agentId)},
      name: ${JSON.stringify(displayName)},
      category: ${JSON.stringify(category)},
      isMeta: ${isMeta},
      ticks: [
${tickLines}
      ],
    }`;
});

const block = `  entityVitals: [\n${evLines.join(',\n')}\n  ],\n`;
fs.writeFileSync(outPath, block, 'utf8');
console.log(`Written ${entries.length} agents → ${outPath}`);
