import mongoose from 'mongoose';

const WhatIfSubmissionSchema = new mongoose.Schema({
  submitterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
  title: { type: String, required: true, maxlength: 100 },
  description: { type: String, required: true, maxlength: 500 },
  leaderRelevance: { type: String, required: true, maxlength: 300 },
  suggestedSimulation: { type: String, default: '' },
  supportingLinks: [{ type: String }],
  status: { type: String, enum: ['pending', 'shortlisted', 'rejected'], default: 'pending' }
}, { timestamps: true });

WhatIfSubmissionSchema.index({ submitterId: 1, createdAt: -1 });
WhatIfSubmissionSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('WhatIfSubmission', WhatIfSubmissionSchema);
