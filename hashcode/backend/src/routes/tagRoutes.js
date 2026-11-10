import { Router } from 'express';
import { getTags, getTag } from '../controllers/tagController.js';

const router = Router();

router.get('/', getTags);
router.get('/:slug', getTag);

export default router;
