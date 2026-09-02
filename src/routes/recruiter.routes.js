import { Router } from 'express';
import {
  getRecruiterStats,
  getApplicantsPerJobAnalytics,
  getRecentApplications,
  getJobPlanUsage,
} from '../controllers/recruiter.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/rbac.middleware.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

router.use(authenticate, authorize(ROLES.RECRUITER));

router.get('/stats', getRecruiterStats);
router.get('/analytics/applicants', getApplicantsPerJobAnalytics);
router.get('/recent-applications', getRecentApplications);
router.get('/plan-usage', getJobPlanUsage);

export default router;
