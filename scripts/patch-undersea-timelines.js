import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Simulation from '../src/models/Simulation.js';

dotenv.config();

const PALETTE = [
  '#60a5fa','#f97316','#34d399','#a78bfa','#fb7185',
  '#fbbf24','#22d3ee','#e879f9','#4ade80','#f472b6',
  '#38bdf8','#fb923c','#a3e635','#818cf8','#2dd4bf',
  '#facc15','#c084fc','#86efac','#fda4af','#67e8f9',
  '#f43f5e','#84cc16','#0ea5e9','#d946ef','#10b981',
];

function cableTickDate(n) {
  const d = new Date('2026-05-30T00:00:00.000Z');
  d.setDate(d.getDate() + n * 90);
  return d;
}

const CABLE_AGENTS = [
  { id:'amd',                      name:'AMD',                           ticks:[85,86,85,83,82,85,87,89,91] },
  { id:'anthropic',                name:'Anthropic',                     ticks:[97,98,95,92,89,85,80,78,75] },
  { id:'apple',                    name:'Apple Intelligence',            ticks:[74,75,76,77,75,75,76,77,78] },
  { id:'aws',                      name:'AWS',                           ticks:[88,87,83,81,79,76,74,72,71] },
  { id:'broadcom',                 name:'Broadcom',                      ticks:[93,95,94,91,90,86,82,76,71] },
  { id:'cerebras',                 name:'Cerebras',                      ticks:[85,87,88,86,87,83,79,80,78] },
  { id:'clay',                     name:'Clay',                          ticks:[85,84,83,82,84,85,86,87,88] },
  { id:'cognition',                name:'Cognition (Devin)',             ticks:[92,88,90,91,94,95,93,91,89] },
  { id:'cohere',                   name:'Cohere',                        ticks:[78,79,81,80,79,80,79,76,78] },
  { id:'meta-consulting',          name:'Consulting Firms',              ticks:[72,76,74,76,78,80,82,84,85] },
  { id:'coreweave',                name:'CoreWeave',                     ticks:[90,88,86,84,85,81,76,71,65] },
  { id:'crusoe',                   name:'Crusoe Energy',                 ticks:[90,91,89,87,88,84,80,76,72] },
  { id:'cursor',                   name:'Cursor',                        ticks:[95,96,95,93,91,89,87,88,87] },
  { id:'meta-dc-construction',     name:'Data Center Construction',      ticks:[68,69,73,76,79,85,90,94,97] },
  { id:'databricks',               name:'Databricks',                    ticks:[92,91,90,89,89,88,84,82,79] },
  { id:'decagon',                  name:'Decagon',                       ticks:[72,73,76,75,73,72,69,70,71] },
  { id:'deepseek',                 name:'DeepSeek',                      ticks:[82,84,87,88,89,90,91,89,90] },
  { id:'meta-energy-infra',        name:'Energy Infrastructure',         ticks:[70,72,74,73,71,69,67,64,62] },
  { id:'meta-f500-buyers',         name:'US Enterprises (F500)',         ticks:[65,66,68,63,59,54,49,44,39] },
  { id:'glean',                    name:'Glean',                         ticks:[78,81,85,89,87,90,91,92,94] },
  { id:'google-cloud',             name:'Google Cloud',                  ticks:[92,93,94,94,92,93,94,94,93] },
  { id:'google-deepmind',          name:'Google DeepMind',               ticks:[91,88,87,88,86,87,88,87,85] },
  { id:'meta-gov-regulators',      name:'Government Regulators',         ticks:[62,64,66,63,66,67,70,72,76] },
  { id:'meta-grid-utilities',      name:'Grid Operators & Utilities',    ticks:[62,66,68,69,71,74,77,79,80] },
  { id:'groq',                     name:'Groq',                          ticks:[50,51,53,56,55,57,51,47,43] },
  { id:'harvey',                   name:'Harvey',                        ticks:[82,84,85,86,87,88,89,90,91] },
  { id:'hugging-face',             name:'Hugging Face',                  ticks:[70,69,71,73,74,76,77,79,81] },
  { id:'intel',                    name:'Intel',                         ticks:[45,46,47,46,45,44,45,44,43] },
  { id:'intercom',                 name:'Intercom',                      ticks:[80,79,81,80,83,82,84,85,83] },
  { id:'lambda-labs',              name:'Lambda',                        ticks:[72,75,73,70,69,65,62,60,55] },
  { id:'meta-local-politics',      name:'Local Politics & Permitting',   ticks:[60,64,68,68,71,75,80,85,88] },
  { id:'meta-capital-markets',     name:'Capital Markets Sentiment',     ticks:[72,74,66,58,54,46,42,38,34] },
  { id:'mercor',                   name:'Mercor',                        ticks:[65,67,69,71,71,72,73,75,77] },
  { id:'meta-ai',                  name:'Meta AI',                       ticks:[72,74,75,77,78,79,77,78,77] },
  { id:'microsoft-azure',          name:'Microsoft Azure',               ticks:[90,92,90,88,87,84,82,81,80] },
  { id:'microsoft-copilot',        name:'Microsoft Copilot',             ticks:[82,81,78,75,74,71,67,66,64] },
  { id:'mistral',                  name:'Mistral',                       ticks:[74,76,75,79,80,83,82,81,77] },
  { id:'mongodb',                  name:'MongoDB',                       ticks:[62,64,66,67,68,67,68,69,68] },
  { id:'nebius',                   name:'Nebius',                        ticks:[93,91,93,94,95,96,97,98,99] },
  { id:'nvidia',                   name:'NVIDIA',                        ticks:[97,96,95,93,92,88,85,81,78] },
  { id:'meta-open-source',         name:'Open Source Community',         ticks:[78,80,82,80,81,80,81,79,80] },
  { id:'openai',                   name:'OpenAI',                        ticks:[82,80,79,77,78,76,74,73,70] },
  { id:'oracle-oci',               name:'Oracle Cloud (OCI)',            ticks:[78,80,83,86,88,90,91,92,91] },
  { id:'palantir',                 name:'Palantir',                      ticks:[97,96,97,96,95,96,98,99,100] },
  { id:'perplexity',               name:'Perplexity',                    ticks:[85,84,82,80,81,79,77,75,72] },
  { id:'pinecone',                 name:'Pinecone',                      ticks:[48,46,44,43,42,39,36,37,35] },
  { id:'salesforce',               name:'Salesforce',                    ticks:[72,75,77,80,81,83,84,85,83] },
  { id:'sambanova',                name:'SambaNova',                     ticks:[52,55,58,60,61,63,64,66,67] },
  { id:'sap',                      name:'SAP',                           ticks:[73,76,78,81,84,85,87,89,90] },
  { id:'scale-ai',                 name:'Scale AI',                      ticks:[65,66,69,72,73,74,75,77,78] },
  { id:'servicenow',               name:'ServiceNow',                    ticks:[80,82,84,86,88,90,92,94,96] },
  { id:'sierra',                   name:'Sierra',                        ticks:[82,79,84,85,87,84,85,84,82] },
  { id:'snowflake',                name:'Snowflake',                     ticks:[80,81,82,83,83,85,87,88,89] },
  { id:'meta-sovereign-ai',        name:'Sovereign AI & Wealth Funds',   ticks:[78,82,81,83,81,84,86,87,89] },
  { id:'meta-outsourcers',         name:'Software Outsourcers',          ticks:[45,61,64,67,70,72,74,76,79] },
  { id:'meta-talent-labor',        name:'Talent & Labor Market',         ticks:[62,74,76,74,68,64,58,52,46] },
  { id:'together-ai',              name:'Together AI',                   ticks:[82,79,80,78,77,79,78,74,70] },
  { id:'meta-training-infra',      name:'AI Training Infrastructure',    ticks:[82,80,81,79,76,72,70,68,64] },
  { id:'meta-legacy-saas',         name:'US Legacy Tech/SaaS',           ticks:[55,60,62,66,68,70,72,74,76] },
  { id:'meta-smb-midmarket',       name:'US Midmarket & SMB',            ticks:[58,62,64,61,59,54,42,38,34] },
  { id:'meta-vertical-finance',    name:'Vertical AI: Finance',          ticks:[68,79,74,72,74,71,69,71,73] },
  { id:'meta-vertical-healthcare', name:'Vertical AI: Healthcare',       ticks:[70,72,71,73,71,69,66,61,56] },
  { id:'meta-vertical-industrial', name:'Vertical AI: Industrial',       ticks:[65,68,70,68,66,67,64,62,61] },
  { id:'meta-ai-vcs',              name:'Top-Tier AI VCs',               ticks:[75,79,72,63,57,42,34,28,22] },
  { id:'xai',                      name:'xAI',                           ticks:[75,77,74,72,70,69,67,65,64] },
];

const timelines = CABLE_AGENTS.map(({ id, name, ticks }, idx) => ({
  agentId: id,
  agentName: name,
  color: PALETTE[idx % PALETTE.length],
  trajectory: ticks
    .map((m, i) => m !== null ? { t: cableTickDate(i), value: +(m / 100).toFixed(3), label: `Tick ${i}` } : null)
    .filter(Boolean)
}));

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/principle-scenarios';

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const result = await Simulation.updateOne(
    { simulationId: 'undersea-cable-sabotage' },
    { $set: { timelines } }
  );

  console.log(`Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);
  console.log(`Set ${timelines.length} agent timelines on undersea-cable-sabotage`);
  await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
