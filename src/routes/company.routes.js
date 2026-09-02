import { Router } from 'express';
import {
  registerCompany,
  getMyCompany,
  updateMyCompany,
  getAllCompanies,
  getCompanyById,
  uploadCompanyLogo,
} from '../controllers/company.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/rbac.middleware.js';
import { upload } from '../middlewares/upload.middleware.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

// Public routes
router.get('/', getAllCompanies);
router.get('/:id', getCompanyById);

// Recruiter routes
router.post('/', authenticate, authorize(ROLES.RECRUITER), registerCompany);
router.get('/my/profile', authenticate, authorize(ROLES.RECRUITER), getMyCompany);
router.put('/my/profile', authenticate, authorize(ROLES.RECRUITER), updateMyCompany);
router.post('/my/logo', authenticate, authorize(ROLES.RECRUITER), upload.single('logo'), uploadCompanyLogo);

export default router;
