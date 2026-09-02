import { Router } from 'express';
import {
  getSeekerStats,
  getSeekerRecentActivity,
  getSeekerPlanUsage,
} from '../controllers/seeker.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/rbac.middleware.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

router.use(authenticate, authorize(ROLES.SEEKER));

router.get('/stats', getSeekerStats);
router.get('/recent-activity', getSeekerRecentActivity);
router.get('/plan-usage', getSeekerPlanUsage);

export default router;
