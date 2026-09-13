import { Router } from 'express';
import { dashboardController } from './dashboard.controller';
import { authGuard } from '../../common/guards/auth.guard';

const router = Router();

router.use(authGuard);

router.get('/overview', dashboardController.getExecutiveOverview);
router.get('/revenue-volume', dashboardController.getRevenueAndVolume);
router.get('/profit', dashboardController.getProfitDashboard);

export default router;
