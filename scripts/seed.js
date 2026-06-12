import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Simulation from '../src/models/Simulation.js';
import simulations from '../src/seed/simulations.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/principle-scenarios';

async function main() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const result = await Simulation.deleteMany({});
    console.log(`Cleared ${result.deletedCount} existing simulations`);

    const inserted = await Simulation.insertMany(simulations);
    console.log(`Inserted ${inserted.length} simulations:`);
    inserted.forEach(s => console.log(`  - ${s.simulationId}: ${s.title}`));

    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

main();
