import { Router } from 'express';
import { createUser, getUsers, login, updatePermissions } from '../controllers/authController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.post('/login', login);
router.get('/users', requireAuth, requireRole('admin'), getUsers);
router.post('/users', requireAuth, requireRole('admin'), createUser);
router.put('/users/:id/permissions', requireAuth, requireRole('admin'), updatePermissions);
export default router;