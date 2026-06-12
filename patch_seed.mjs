import fs from 'fs';

const seedPath = 'C:/Users/sdeva/principle-scenarios/src/seed/simulations.js';
const blockPath = 'C:/Users/sdeva/worldcard_block.txt';

let seed = fs.readFileSync(seedPath, 'utf8');
const newBlock = fs.readFileSync(blockPath, 'utf8');

// Replace both existing worldCard blocks (they're identical) with the new enriched one
// Match from "  worldCard: {" up to the closing "}," that ends the worldCard object
const wcRegex = /  worldCard: \{[\s\S]*?\n  \},\n/g;
const matches = seed.match(wcRegex);
console.log('Found', matches ? matches.length : 0, 'worldCard blocks to replace');

seed = seed.replace(wcRegex, newBlock + '\n');
fs.writeFileSync(seedPath, seed);
console.log('Seed patched successfully');
