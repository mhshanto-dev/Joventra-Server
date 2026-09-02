import mongoose from 'mongoose';

const seekerProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  headline: {
    type: String,
    default: '',
    trim: true,
  },
  bio: {
    type: String,
    default: '',
  },
  skills: [{
    type: String,
    trim: true,
  }],
  resumeUrl: {
    type: String,
    default: '',
  },
  resumeOriginalName: {
    type: String,
    default: '',
  },
  savedJobs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
  }],
  socialLinks: {
    linkedin: { type: String, default: '' },
    github: { type: String, default: '' },
    portfolio: { type: String, default: '' },
  }
}, {
  timestamps: true,
});

export const SeekerProfile = mongoose.model('SeekerProfile', seekerProfileSchema);
