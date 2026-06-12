import fs from 'fs';
import path from 'path';

const base = 'C:/Users/sdeva/principle-scenarios/simulations/grok_final_simulations/bs_cable_attacks/world_card';

const fields = [
  'Ai Capability','Ai Investment','Hyperscaler Capex','Enterprise Ai Revenue',
  'Market Concentration','Cost Per Token Change Pct','Ai Regulation Pressure',
  'Agentic Ai Penetration','Us China Ai Gap','Ai Sentiment','Nasdaq Index',
  'Interest Rates','Energy Costs','Tariff Rate','Us Gdp Growth Rate',
  'World Trade Growth Yoy','Labor Gdp Share','Task Level Productivity Multiplier',
  'Operational To Announced Gw Ratio','Operational To Contracted Gw Ratio',
  'Gpu Install Yield Pct','Depreciation Capex Lag Quarters',
  'Narrative Reality Pressure Index','Local Opposition Active Count',
  'Interconnection Constrained States Count'
];

const keyMap = {
  'Ai Capability':'ai_capability','Ai Investment':'ai_investment',
  'Hyperscaler Capex':'hyperscaler_capex','Enterprise Ai Revenue':'enterprise_ai_revenue',
  'Market Concentration':'market_concentration','Cost Per Token Change Pct':'cost_per_token_change_pct',
  'Ai Regulation Pressure':'ai_regulation_pressure','Agentic Ai Penetration':'agentic_ai_penetration',
  'Us China Ai Gap':'us_china_ai_gap','Ai Sentiment':'ai_sentiment','Nasdaq Index':'nasdaq_index',
  'Interest Rates':'interest_rates','Energy Costs':'energy_costs','Tariff Rate':'tariff_rate',
  'Us Gdp Growth Rate':'us_gdp_growth_rate','World Trade Growth Yoy':'world_trade_growth_yoy',
  'Labor Gdp Share':'labor_gdp_share','Task Level Productivity Multiplier':'task_level_productivity_multiplier',
  'Operational To Announced Gw Ratio':'operational_to_announced_gw_ratio',
  'Operational To Contracted Gw Ratio':'operational_to_contracted_gw_ratio',
  'Gpu Install Yield Pct':'gpu_install_yield_pct','Depreciation Capex Lag Quarters':'depreciation_capex_lag_quarters',
  'Narrative Reality Pressure Index':'narrative_reality_pressure_index',
  'Local Opposition Active Count':'local_opposition_active_count',
  'Interconnection Constrained States Count':'interconnection_constrained_states_count'
};

const tickObjs = [];
for (let t = 0; t <= 8; t++) {
  const wc = JSON.parse(fs.readFileSync(path.join(base, `World-Tick-${t}.json`)));
  const vals = {};
  fields.forEach(f => { vals[f] = wc[keyMap[f]]; });
  tickObjs.push({
    tick: t,
    values: vals,
    agentOutcomes: wc.agent_specific_outcomes || [],
    landscapeSummary: wc.competitive_landscape_summary || ''
  });
}

// Emit as a JS const for pasting into simulations.js
// Using JSON.stringify for safety then wrapping in the cableTickDate calls
const out = tickObjs.map(t => {
  const vals = JSON.stringify(t.values);
  const outcomes = JSON.stringify(t.agentOutcomes);
  const summary = JSON.stringify(t.landscapeSummary);
  return `      { tick: ${t.tick}, t: cableTickDate(${t.tick}), values: ${vals},\n        agentOutcomes: ${outcomes},\n        landscapeSummary: ${summary} }`;
}).join(',\n');

const block = `  worldCard: {
    fields: ${JSON.stringify(fields, null, 4).split('\n').map((l,i)=>i===0?l:'    '+l).join('\n')},
    ticks: [
${out}
    ]
  },`;

fs.writeFileSync('C:/Users/sdeva/worldcard_block.txt', block);
console.log('Written', block.length, 'chars');
