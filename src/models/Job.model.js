import mongoose from 'mongoose';
import { JOB_STATUS, JOB_TYPES, JOB_CATEGORIES } from '../constants/statuses.js';

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    trim: true,
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  recruiterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: JOB_CATEGORIES,
  },
  jobType: {
    type: String,
    required: [true, 'Job type is required'],
    enum: JOB_TYPES,
    default: 'Full-time',
  },
  salaryMin: {
    type: Number,
    required: true,
    min: 0,
  },
  salaryMax: {
    type: Number,
    required: true,
    min: 0,
  },
  currency: {
    type: String,
    default: 'USD',
  },
  location: {
    city: { type: String, default: '' },
    country: { type: String, default: '' },
  },
  isRemote: {
    type: Boolean,
    default: false,
  },
  deadline: {
    type: Date,
    required: [true, 'Application deadline is required'],
  },
  responsibilities: {
    type: String,
    required: [true, 'Responsibilities are required'],
  },
  requirements: {
    type: String,
    required: [true, 'Requirements are required'],
  },
  benefits: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: Object.values(JOB_STATUS),
    default: JOB_STATUS.ACTIVE,
  },
  applicationCount: {
    type: Number,
    default: 0,
  }
}, {
  timestamps: true,
});

// Full text search index
jobSchema.index({ title: 'text', responsibilities: 'text', requirements: 'text' });
jobSchema.index({ status: 1, category: 1, jobType: 1, createdAt: -1 });

export const Job = mongoose.model('Job', jobSchema);
