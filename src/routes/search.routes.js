import { Router } from 'express';
import {
  getAutocompleteSuggestions,
  getFilterOptions,
} from '../controllers/search.controller.js';

const router = Router();

router.get('/autocomplete', getAutocompleteSuggestions);
router.get('/filters', getFilterOptions);

export default router;
