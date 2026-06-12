import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import Member, { COMPANY_SIZE_OPTIONS } from './models/Member.js';
import Simulation from './models/Simulation.js';
import WhatIfSubmission from './models/WhatIfSubmission.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PROD = NODE_ENV === 'production';
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-secret-change-me';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/principle-scenarios';
const COOKIE_NAME = 'memberId';
const COOKIE_OPTS = {
  httpOnly: true,
  signed: true,
  sameSite: 'lax',
  secure: IS_PROD, // Railway terminates TLS; cookies must be secure in prod
  maxAge: 1000 * 60 * 60 * 24 * 30 // 30 days
};

// Railway sits behind a proxy — trust X-Forwarded-* headers so req.secure works.
if (IS_PROD) app.set('trust proxy', 1);

app.use(cors());
app.use(express.json());
app.use(cookieParser(SESSION_SECRET));
app.use(express.static(join(__dirname, '../public')));

if (IS_PROD && SESSION_SECRET === 'dev-secret-change-me') {
  console.warn('WARNING: SESSION_SECRET is not set in production. Set it in Railway env vars.');
}

// --- Mongo connect ---
mongoose.connect(MONGODB_URI)
  .then(() => {
    // Mask credentials in the log — never print the full URI in prod.
    const safeUri = MONGODB_URI.replace(/:\/\/[^@]+@/, '://***@');
    console.log(`Connected to MongoDB: ${safeUri}`);
  })
  .catch(err => console.error('MongoDB connection error:', err.message));

// --- Helpers ---
async function getCurrentMember(req) {
  const id = req.signedCookies?.[COOKIE_NAME];
  if (!id) return null;
  if (!mongoose.isValidObjectId(id)) return null;
  return Member.findById(id);
}

function requireMember(handler) {
  return async (req, res) => {
    const member = await getCurrentMember(req);
    if (!member) return res.status(401).json({ error: 'Not signed in' });
    req.member = member;
    return handler(req, res);
  };
}

function cardShape(sim, memberId = null) {
  const last = sim.trajectory[sim.trajectory.length - 1] || null;
  return {
    id: sim.simulationId,
    title: sim.title,
    description: sim.description,
    status: sim.status,
    followerCount: sim.followers.length,
    confidenceCount: sim.confidenceVotes.length,
    confidencePct: sim.followers.length > 0
      ? Math.round((sim.confidenceVotes.length / Math.max(sim.followers.length, 1)) * 100)
      : 0,
    trajectory: sim.trajectory.map(p => ({ t: p.t, value: p.value })),
    timelines: (sim.timelines || []).map(tl => ({
      agentId: tl.agentId,
      agentName: tl.agentName,
      color: tl.color,
      trajectory: tl.trajectory.map(p => ({ t: p.t, value: p.value }))
    })),
    latest: last,
    isFollowing: memberId ? sim.followers.some(f => f.equals(memberId)) : false,
    hasVoted: memberId ? sim.confidenceVotes.some(v => v.equals(memberId)) : false,
    worldCard: sim.worldCard
      ? { fields: sim.worldCard.fields, ticks: sim.worldCard.ticks }
      : null,
    entityVitals: sim.entityVitals || [],
    updatedAt: sim.updatedAt
  };
}

// --- Health ---
app.get('/health', (req, res) => {
  res.json({
    ok: true,
    db: mongoose.connection.readyState, // 1 = connected
    uptime: process.uptime()
  });
});

// --- Auth ---
app.get('/api/me', async (req, res) => {
  try {
    const member = await getCurrentMember(req);
    if (!member) return res.status(401).json({ error: 'Not signed in' });
    res.json({ member });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/signup', async (req, res) => {
  try {
    const {
      firstName, lastName, email, jobTitle, companyName,
      companySize, country, seniorityConfirmed, termsAccepted
    } = req.body;

    // Basic field presence
    const missing = [];
    if (!firstName?.trim()) missing.push('firstName');
    if (!lastName?.trim()) missing.push('lastName');
    if (!email?.trim()) missing.push('email');
    if (!jobTitle?.trim()) missing.push('jobTitle');
    if (!companyName?.trim()) missing.push('companyName');
    if (!companySize) missing.push('companySize');
    if (!country?.trim()) missing.push('country');
    if (missing.length) {
      return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
    }

    // Eligibility gates
    if (!COMPANY_SIZE_OPTIONS.includes(companySize)) {
      return res.status(400).json({ error: 'Invalid company size' });
    }
    if (companySize === '1-499') {
      return res.status(403).json({ error: 'Principle Scenarios is for organisations with 500+ employees. We\'ll add a waitlist soon.' });
    }
    if (!seniorityConfirmed) {
      return res.status(400).json({ error: 'You must confirm you hold a decision-making leadership role.' });
    }
    if (!termsAccepted) {
      return res.status(400).json({ error: 'You must accept the Terms & Conditions.' });
    }

    const fields = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      jobTitle: jobTitle.trim(),
      companyName: companyName.trim(),
      companySize,
      country: country.trim(),
      seniorityConfirmed: true,
      termsAccepted: true
    };

    const member = await Member.findOrCreateByEmail(email, fields);
    res.cookie(COOKIE_NAME, String(member._id), COOKIE_OPTS);
    res.json({ member });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME, { ...COOKIE_OPTS, maxAge: undefined });
  res.json({ ok: true });
});

// --- Simulations ---
app.get('/api/simulations', async (req, res) => {
  try {
    const filter = req.query.filter || 'recommended';
    const member = await getCurrentMember(req);
    const memberId = member?._id || null;

    let query = Simulation.find({});
    if (filter === 'following') {
      if (!member) return res.status(401).json({ error: 'Sign in to view followed simulations' });
      query = Simulation.find({ followers: member._id });
    }

    let sims = await query.exec();

    if (filter === 'latest') {
      sims.sort((a, b) => b.updatedAt - a.updatedAt);
    } else if (filter === 'recommended') {
      sims.sort((a, b) => b.followers.length - a.followers.length);
    }

    res.json({ simulations: sims.map(s => cardShape(s, memberId)) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/simulations/:id', async (req, res) => {
  try {
    const sim = await Simulation.findOne({ simulationId: req.params.id });
    if (!sim) return res.status(404).json({ error: 'Simulation not found' });

    const member = await getCurrentMember(req);
    const memberId = member?._id || null;
    const card = cardShape(sim, memberId);

    res.json({
      simulation: {
        ...card,
        events: sim.events.sort((a, b) => a.timestamp - b.timestamp)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/simulations/:id/follow', requireMember(async (req, res) => {
  try {
    const sim = await Simulation.findOne({ simulationId: req.params.id });
    if (!sim) return res.status(404).json({ error: 'Simulation not found' });

    const idx = sim.followers.findIndex(f => f.equals(req.member._id));
    if (idx >= 0) {
      sim.followers.splice(idx, 1);
    } else {
      sim.followers.push(req.member._id);
    }
    await sim.save();

    res.json({
      followerCount: sim.followers.length,
      isFollowing: idx < 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}));

app.post('/api/simulations/:id/confidence', requireMember(async (req, res) => {
  try {
    const sim = await Simulation.findOne({ simulationId: req.params.id });
    if (!sim) return res.status(404).json({ error: 'Simulation not found' });

    const idx = sim.confidenceVotes.findIndex(v => v.equals(req.member._id));
    if (idx >= 0) {
      sim.confidenceVotes.splice(idx, 1);
    } else {
      sim.confidenceVotes.push(req.member._id);
    }
    await sim.save();

    res.json({
      confidenceCount: sim.confidenceVotes.length,
      confidencePct: sim.followers.length > 0
        ? Math.round((sim.confidenceVotes.length / Math.max(sim.followers.length, 1)) * 100)
        : 0,
      hasVoted: idx < 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}));

// --- What-If submissions ---
app.post('/api/whatifs', requireMember(async (req, res) => {
  try {
    const { title, description, leaderRelevance, suggestedSimulation, supportingLinks } = req.body;

    const missing = [];
    if (!title?.trim()) missing.push('title');
    if (!description?.trim()) missing.push('description');
    if (!leaderRelevance?.trim()) missing.push('leaderRelevance');
    if (missing.length) {
      return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
    }

    if (title.length > 100) return res.status(400).json({ error: 'Title max 100 characters' });
    if (description.length > 500) return res.status(400).json({ error: 'Description max 500 characters' });
    if (leaderRelevance.length > 300) return res.status(400).json({ error: 'Why a leader should care: max 300 characters' });

    const links = Array.isArray(supportingLinks)
      ? supportingLinks.map(s => String(s).trim()).filter(Boolean)
      : (typeof supportingLinks === 'string' && supportingLinks.trim()
          ? supportingLinks.split(/\s+/).filter(Boolean)
          : []);

    const submission = await WhatIfSubmission.create({
      submitterId: req.member._id,
      title: title.trim(),
      description: description.trim(),
      leaderRelevance: leaderRelevance.trim(),
      suggestedSimulation: (suggestedSimulation || '').trim(),
      supportingLinks: links
    });

    res.json({ ok: true, submission });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}));

app.get('/api/whatifs/mine', requireMember(async (req, res) => {
  try {
    const submissions = await WhatIfSubmission
      .find({ submitterId: req.member._id })
      .sort({ createdAt: -1 });
    res.json({ submissions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}));

// --- Start ---
app.listen(PORT, () => {
  console.log(`Principle Scenarios running at http://localhost:${PORT}`);
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing connections...');
  await mongoose.disconnect();
  process.exit(0);
});
