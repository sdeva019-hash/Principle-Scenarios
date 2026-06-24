import mongoose from 'mongoose';

const TrajectoryPointSchema = new mongoose.Schema({
  t: { type: Date, required: true },
  value: { type: Number, required: true, min: 0, max: 1 },
  label: { type: String, default: '' }
}, { _id: false });

const EventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  timestamp: { type: Date, required: true },
  impact: { type: String, enum: ['up', 'down', 'neutral'], default: 'neutral' },
  branchedNewPossibility: { type: Boolean, default: false }
}, { _id: false });

const AgentTimelineSchema = new mongoose.Schema({
  agentId:   { type: String, required: true },
  agentName: { type: String, required: true },
  color:     { type: String, default: '#60a5fa' },
  trajectory: [TrajectoryPointSchema]
}, { _id: false });

const WorldCardTickSchema = new mongoose.Schema({
  tick: { type: Number, required: true },
  t:    { type: Date,   required: true },
  values: { type: mongoose.Schema.Types.Mixed, default: {} },
  agentOutcomes:    [{ type: String }],
  landscapeSummary: { type: String, default: '' }
}, { _id: false });

const EntityVitalsTickSchema = new mongoose.Schema({
  tick:  { type: Number, required: true },
  state: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { _id: false });

const EntityVitalsSchema = new mongoose.Schema({
  agentId:  { type: String, required: true },
  name:     { type: String, required: true },
  category: { type: String, default: 'unknown' },
  isMeta:   { type: Boolean, default: false },
  ticks:    [EntityVitalsTickSchema],
}, { _id: false });

const SimulationSchema = new mongoose.Schema({
  simulationId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['live', 'concluded', 'upcoming'], default: 'live' },
  trajectory: [TrajectoryPointSchema],
  timelines: [AgentTimelineSchema],
  events: [EventSchema],
  worldCard: {
    fields: [{ type: String }],
    ticks:  [WorldCardTickSchema]
  },
  entityVitals: [EntityVitalsSchema],
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Member' }],
  confidenceVotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Member' }]
}, { timestamps: true });

SimulationSchema.index({ status: 1, updatedAt: -1 });

export default mongoose.model('Simulation', SimulationSchema);
