import { Router } from 'express';
import {
  updateProfile,
  getSeekerProfile,
  updateSeekerProfile,
  uploadResume,
  uploadAvatar
} from '../controllers/user.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/rbac.middleware.js';
import { upload } from '../middlewares/upload.middleware.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

router.put('/profile', authenticate, updateProfile);
router.post('/avatar', authenticate, upload.single('avatar'), uploadAvatar);

// Seeker specific profile routes
router.get('/seeker-profile', authenticate, authorize(ROLES.SEEKER), getSeekerProfile);
router.put('/seeker-profile', authenticate, authorize(ROLES.SEEKER), updateSeekerProfile);
router.post('/upload-resume', authenticate, authorize(ROLES.SEEKER), upload.single('resume'), uploadResume);

export default router;
