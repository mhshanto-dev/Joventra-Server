import { Router } from 'express';
import {
  createJob,
  getAllJobs,
  getFeaturedJobs,
  getJobById,
  getSimilarJobs,
  getRecruiterJobs,
  updateJob,
  toggleJobStatus,
  deleteJob,
} from '../controllers/job.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/rbac.middleware.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

// Public routes
router.get('/', getAllJobs);
router.get('/featured', getFeaturedJobs);
router.get('/similar/:id', getSimilarJobs);
router.get('/:id', getJobById);

// Recruiter routes
router.post('/', authenticate, authorize(ROLES.RECRUITER), createJob);
router.get('/recruiter/my-jobs', authenticate, authorize(ROLES.RECRUITER), getRecruiterJobs);
router.put('/:id', authenticate, authorize(ROLES.RECRUITER), updateJob);
router.patch('/:id/toggle-status', authenticate, authorize(ROLES.RECRUITER), toggleJobStatus);
router.delete('/:id', authenticate, authorize(ROLES.RECRUITER), deleteJob);

export default router;
