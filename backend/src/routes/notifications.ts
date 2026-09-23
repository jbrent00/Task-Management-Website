import { Router } from 'express';
import { getNotifications, markNotificationsRead } from '../controllers/notifications';
import { asyncRoute } from './asyncRoute';

const router = Router();
router.get('/', asyncRoute(getNotifications));
router.post('/read', asyncRoute(markNotificationsRead));
export default router;
