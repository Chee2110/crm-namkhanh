import { Router } from 'express';
import { systemController } from './system.controller';
import { authGuard } from '../../common/guards/auth.guard';

const router = Router();

// Lấy trạng thái bảo trì (Công khai, dùng cho cả trang đăng nhập & người dùng chưa login)
router.get('/maintenance/status', (req, res) => systemController.getMaintenanceStatus(req, res));

// Bật / tắt bảo trì (Yêu cầu đăng nhập & quyền ADMIN)
router.post('/maintenance/toggle', authGuard, (req, res) => systemController.toggleMaintenance(req, res));

// Heartbeat kiểm tra tính toàn vẹn của phiên (Đăng nhập trùng thiết bị / bảo trì)
router.get('/session-check', authGuard, (req, res) => systemController.checkSession(req, res));

export default router;
