import { cacheService } from '../../config/redis';
import { prisma } from '../../config/db';

export interface ActiveSession {
  sessionId: string;
  userId: string;
  deviceName: string;
  ipAddress: string;
  loginAt: string;
}

export interface RevocationInfo {
  reason: 'CONCURRENT_LOGIN' | 'SYSTEM_MAINTENANCE' | 'MANUAL';
  newDevice?: string;
  newIp?: string;
  loginAt?: string;
  message?: string;
}

export interface MaintenanceState {
  isMaintenance: boolean;
  startedAt: string | null;
  startedBy: string | null;
  lastEndedAt: string | null;
}

// In-memory fallback / quick lookup stores
const activeSessions = new Map<string, ActiveSession>(); // userId -> ActiveSession
const revokedSessions = new Map<string, RevocationInfo>(); // sessionId -> RevocationInfo

let currentMaintenanceState: MaintenanceState = {
  isMaintenance: false,
  startedAt: null,
  startedBy: null,
  lastEndedAt: null
};

/**
 * Phân tích User-Agent thành tên thiết bị / trình duyệt thân thiện
 */
export function parseUserAgent(uaString?: string): string {
  if (!uaString) return 'Thiết bị không xác định';

  let browser = 'Trình duyệt Web';
  if (/CocCoc|coc_coc/i.test(uaString)) {
    browser = 'Cốc Cốc';
  } else if (/Edg\//i.test(uaString)) {
    browser = 'Microsoft Edge';
  } else if (/Chrome\//i.test(uaString) && !/Edg\//i.test(uaString)) {
    browser = 'Google Chrome';
  } else if (/Safari\//i.test(uaString) && !/Chrome\//i.test(uaString)) {
    browser = 'Apple Safari';
  } else if (/Firefox\//i.test(uaString)) {
    browser = 'Mozilla Firefox';
  } else if (/OPR|Opera/i.test(uaString)) {
    browser = 'Opera';
  } else if (/Zalo/i.test(uaString)) {
    browser = 'Zalo App Browser';
  }

  let os = 'Thiết bị';
  if (/Windows NT 10.0/i.test(uaString)) {
    os = 'Windows 10/11';
  } else if (/Windows NT/i.test(uaString)) {
    os = 'Windows';
  } else if (/iPhone/i.test(uaString)) {
    os = 'Apple iPhone (iOS)';
  } else if (/iPad/i.test(uaString)) {
    os = 'Apple iPad (iPadOS)';
  } else if (/Mac OS X/i.test(uaString)) {
    os = 'Apple macOS';
  } else if (/Android/i.test(uaString)) {
    os = 'Điện thoại Android';
  } else if (/Linux/i.test(uaString)) {
    os = 'Linux';
  }

  return `${browser} trên ${os}`;
}

/**
 * Chuẩn hóa địa chỉ IP
 */
export function cleanIpAddress(rawIp?: string): string {
  if (!rawIp) return 'Không xác định';
  // Lấy IP đầu tiên nếu qua chuỗi reverse proxy
  let ip = rawIp.split(',')[0].trim();
  if (ip.startsWith('::ffff:')) {
    ip = ip.replace('::ffff:', '');
  }
  if (ip === '::1' || ip === '127.0.0.1') {
    return '127.0.0.1 (Nội bộ / Máy hiện tại)';
  }
  return ip;
}

export class SystemService {
  /**
   * Lưu phiên đăng nhập mới và thu hồi phiên cũ (nếu có)
   */
  async setActiveSession(
    userId: string,
    sessionId: string,
    deviceName: string,
    ipAddress: string
  ): Promise<void> {
    const existing = activeSessions.get(userId);
    const loginAt = new Date().toISOString();

    // Nếu đã có phiên trước đó khác sessionId -> Thu hồi phiên cũ do đăng nhập trùng lặp
    if (existing && existing.sessionId !== sessionId) {
      const revocation: RevocationInfo = {
        reason: 'CONCURRENT_LOGIN',
        newDevice: deviceName,
        newIp: ipAddress,
        loginAt,
        message: `Tài khoản vừa được đăng nhập trên ${deviceName} tại IP ${ipAddress}.`
      };
      revokedSessions.set(existing.sessionId, revocation);
      await cacheService.set(`revoked_session:${existing.sessionId}`, revocation, 86400);
    }

    const sessionData: ActiveSession = {
      sessionId,
      userId,
      deviceName,
      ipAddress,
      loginAt
    };

    activeSessions.set(userId, sessionData);
    await cacheService.set(`active_session:${userId}`, sessionData, 7 * 86400);
  }

  /**
   * Kiểm tra phiên có đang hoạt động hợp lệ không
   */
  async isSessionActive(userId: string, sessionId: string): Promise<boolean> {
    let session: ActiveSession | null | undefined = activeSessions.get(userId);
    if (!session) {
      session = await cacheService.get<ActiveSession>(`active_session:${userId}`);
      if (session) {
        activeSessions.set(userId, session);
      }
    }

    if (!session) {
      return true; // Nếu chưa lưu phiên (legacy token), cho phép hoạt động để không gãy phiên cũ
    }

    return session.sessionId === sessionId;
  }

  /**
   * Lấy thông tin thu hồi phiên (ví dụ thiết bị nào vừa đăng nhập đè lên)
   */
  async getRevocationInfo(sessionId: string, userId?: string): Promise<RevocationInfo | null> {
    let info: RevocationInfo | null | undefined = revokedSessions.get(sessionId);
    if (!info) {
      info = await cacheService.get<RevocationInfo>(`revoked_session:${sessionId}`);
    }

    if (!info && userId) {
      // Nếu không tìm thấy theo sessionId nhưng phiên hiện tại của user đã bị thay thế
      const active = activeSessions.get(userId) || (await cacheService.get<ActiveSession>(`active_session:${userId}`));
      if (active && active.sessionId !== sessionId) {
        return {
          reason: 'CONCURRENT_LOGIN',
          newDevice: active.deviceName,
          newIp: active.ipAddress,
          loginAt: active.loginAt,
          message: `Tài khoản vừa được đăng nhập trên ${active.deviceName} tại IP ${active.ipAddress}.`
        };
      }
    }

    return info || null;
  }

  /**
   * Đăng xuất thủ công một phiên
   */
  async removeSession(userId: string): Promise<void> {
    activeSessions.delete(userId);
    await cacheService.del(`active_session:${userId}`);
  }

  /**
   * Lấy trạng thái Chế độ Bảo trì hệ thống
   */
  async getMaintenanceState(): Promise<MaintenanceState> {
    const cached = await cacheService.get<MaintenanceState>('system_maintenance_state');
    if (cached) {
      currentMaintenanceState = cached;
    }
    return currentMaintenanceState;
  }

  /**
   * Bật / Tắt chế độ bảo trì
   */
  async setMaintenance(
    enable: boolean,
    adminUserId: string,
    adminName: string
  ): Promise<MaintenanceState> {
    if (enable) {
      currentMaintenanceState = {
        isMaintenance: true,
        startedAt: new Date().toISOString(),
        startedBy: adminName,
        lastEndedAt: currentMaintenanceState.lastEndedAt
      };

      // Khi bật bảo trì: Đăng xuất toàn bộ các tài khoản khác (ngoại trừ Admin hiện tại)
      for (const [uid, sess] of activeSessions.entries()) {
        if (uid !== adminUserId) {
          revokedSessions.set(sess.sessionId, {
            reason: 'SYSTEM_MAINTENANCE',
            message: 'Hệ thống đã chuyển sang Chế độ Bảo trì nâng cấp. Phiên làm việc tạm thời bị đăng xuất.'
          });
          activeSessions.delete(uid);
          await cacheService.del(`active_session:${uid}`);
        }
      }
    } else {
      currentMaintenanceState = {
        isMaintenance: false,
        startedAt: null,
        startedBy: null,
        lastEndedAt: new Date().toISOString()
      };
    }

    await cacheService.set('system_maintenance_state', currentMaintenanceState, 30 * 86400);

    // Ghi audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: adminUserId,
          action: enable ? 'ENABLE_MAINTENANCE' : 'DISABLE_MAINTENANCE',
          entityType: 'System',
          entityId: 'MAINTENANCE',
          newValue: currentMaintenanceState as any
        }
      });
    } catch (err) {
      console.error('AuditLog maintenance error:', err);
    }

    return currentMaintenanceState;
  }
}

export const systemService = new SystemService();
