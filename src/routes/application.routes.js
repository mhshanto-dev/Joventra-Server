import { Router } from 'express';
import {
  applyToJob,
  getMyApplications,
  getJobApplicants,
  updateApplicationStatus,
  getApplicationStats,
} from '../controllers/application.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/rbac.middleware.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

// Seeker routes
router.post('/apply/:jobId', authenticate, authorize(ROLES.SEEKER), applyToJob);
router.get('/my-applications', authenticate, authorize(ROLES.SEEKER), getMyApplications);
router.get('/stats', authenticate, authorize(ROLES.SEEKER), getApplicationStats);

// Recruiter routes
router.get('/job/:jobId/applicants', authenticate, authorize(ROLES.RECRUITER), getJobApplicants);
router.patch('/:id/status', authenticate, authorize(ROLES.RECRUITER), updateApplicationStatus);

export default router;
