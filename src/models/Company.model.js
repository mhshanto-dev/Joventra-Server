import mongoose from 'mongoose';
import { COMPANY_STATUS } from '../constants/statuses.js';

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  industry: {
    type: String,
    required: [true, 'Industry is required'],
    trim: true,
  },
  website: {
    type: String,
    default: '',
    trim: true,
  },
  location: {
    city: { type: String, default: '' },
    country: { type: String, default: '' },
  },
  employeeCount: {
    type: String,
    default: '1-10',
  },
  logoUrl: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: Object.values(COMPANY_STATUS),
    default: COMPANY_STATUS.PENDING,
  },
  recruiterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  }
}, {
  timestamps: true,
});

export const Company = mongoose.model('Company', companySchema);
