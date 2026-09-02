import { Router } from 'express';
import {
  saveJob,
  unsaveJob,
  getSavedJobs,
  checkJobSaved,
} from '../controllers/savedJob.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/rbac.middleware.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

router.use(authenticate, authorize(ROLES.SEEKER));

router.get('/', getSavedJobs);
router.get('/check/:jobId', checkJobSaved);
router.post('/save/:jobId', saveJob);
router.delete('/unsave/:jobId', unsaveJob);

export default router;
