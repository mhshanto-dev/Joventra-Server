import { Router } from 'express';
import {
  getAllUsers,
  changeUserRole,
  toggleUserStatus,
  getAllCompaniesAdmin,
  approveCompany,
  rejectCompany,
} from '../controllers/admin.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/rbac.middleware.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

router.use(authenticate, authorize(ROLES.ADMIN));

// User management
router.get('/users', getAllUsers);
router.patch('/users/:id/role', changeUserRole);
router.patch('/users/:id/status', toggleUserStatus);

// Company management
router.get('/companies', getAllCompaniesAdmin);
router.patch('/companies/:id/approve', approveCompany);
router.patch('/companies/:id/reject', rejectCompany);

export default router;
