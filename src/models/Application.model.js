import mongoose from 'mongoose';
import { APPLICATION_STATUS } from '../constants/statuses.js';

const applicationSchema = new mongoose.Schema({
  seekerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  coverLetter: {
    type: String,
    default: '',
  },
  resumeUrl: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: Object.values(APPLICATION_STATUS),
    default: APPLICATION_STATUS.APPLIED,
  },
  appliedAt: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true,
});

// Prevent multiple applications to same job by same seeker
applicationSchema.index({ jobId: 1, seekerId: 1 }, { unique: true });
applicationSchema.index({ companyId: 1, createdAt: -1 });

export const Application = mongoose.model('Application', applicationSchema);
