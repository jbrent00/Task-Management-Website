import { Router } from 'express';
import { acceptInvitation, declineInvitation, getMyInvitations } from '../controllers/projectInvitations';
import { asyncRoute } from './asyncRoute';

const router = Router();
router.get('/', asyncRoute(getMyInvitations));
router.post('/:invitationId/accept', asyncRoute(acceptInvitation));
router.post('/:invitationId/decline', asyncRoute(declineInvitation));
export default router;
