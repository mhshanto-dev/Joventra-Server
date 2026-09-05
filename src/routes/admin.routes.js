import { Router } from 'express';
import {
  getAllUsers,
  changeUserRole,
  toggleUserStatus,
  deleteUserAdmin,
  getAllCompaniesAdmin,
  approveCompany,
  rejectCompany,
  getAllJobsAdmin,
  removeJobAdmin,
  getPlatformStats,
  getUserGrowthAnalytics,
  getJobsPerCategoryAnalytics,
  getRecentPayments,
} from '../controllers/admin.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/rbac.middleware.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

router.use(authenticate, authorize(ROLES.ADMIN));

// Platform stats & charts
router.get('/stats', getPlatformStats);
router.get('/analytics/users', getUserGrowthAnalytics);
router.get('/analytics/jobs', getJobsPerCategoryAnalytics);
router.get('/analytics/payments', getRecentPayments);

// User management
router.get('/users', getAllUsers);
router.patch('/users/:id/role', changeUserRole);
router.patch('/users/:id/status', toggleUserStatus);
router.delete('/users/:id', deleteUserAdmin);

// Company management
router.get('/companies', getAllCompaniesAdmin);
router.patch('/companies/:id/approve', approveCompany);
router.patch('/companies/:id/reject', rejectCompany);

// Job moderation
router.get('/jobs', getAllJobsAdmin);
router.delete('/jobs/:id', removeJobAdmin);

export default router;
