import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/db';

export class AuthService {
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: {
        department: true,
        userRoles: {
          include: {
            role: {
              include: {
                permissions: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      throw new Error('Email hoặc mật khẩu không chính xác');
    }

    if (user.status !== 'ACTIVE') {
      throw new Error('Tài khoản đã bị tạm dừng hoạt động. Vui lòng liên hệ Quản trị viên');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new Error('Email hoặc mật khẩu không chính xác');
    }

    const roles = user.userRoles.map((ur: any) => ur.role.code);

    // Gộp permissions
    const permissionMap = new Map<string, {
      moduleCode: string;
      canRead: boolean;
      canCreate: boolean;
      canUpdate: boolean;
      canDelete: boolean;
      dataScope: string;
    }>();

    for (const ur of user.userRoles as any[]) {
      for (const p of ur.role.permissions) {
        const existing = permissionMap.get(p.moduleCode);
        if (!existing) {
          permissionMap.set(p.moduleCode, {
            moduleCode: p.moduleCode,
            canRead: p.canRead,
            canCreate: p.canCreate,
            canUpdate: p.canUpdate,
            canDelete: p.canDelete,
            dataScope: p.dataScope
          });
        } else {
          existing.canRead = existing.canRead || p.canRead;
          existing.canCreate = existing.canCreate || p.canCreate;
          existing.canUpdate = existing.canUpdate || p.canUpdate;
          existing.canDelete = existing.canDelete || p.canDelete;
          if (p.dataScope === 'ALL' || existing.dataScope === 'ALL') {
            existing.dataScope = 'ALL';
          } else if (p.dataScope === 'DEPARTMENT' || existing.dataScope === 'DEPARTMENT') {
            existing.dataScope = 'DEPARTMENT';
          }
        }
      }
    }

    const secret = process.env.JWT_SECRET || 'crm_namkhanh_super_secret_jwt_key_2026';
    const token = jwt.sign(
      { userId: user.id, email: user.email, roles },
      secret,
      { expiresIn: '7d' }
    );

    // Ghi audit log đăng nhập
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        entityType: 'User',
        entityId: user.id,
        newValue: { email: user.email, time: new Date().toISOString() }
      }
    });

    const isSalaryAuthorized = roles.includes('ADMIN') || roles.includes('CEO');

    return {
      token,
      user: {
        id: user.id,
        code: user.code,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        department: user.department ? { id: user.department.id, code: user.department.code, name: user.department.name } : null,
        roles,
        basicSalary: isSalaryAuthorized ? user.basicSalary : undefined,
        allowance: isSalaryAuthorized ? user.allowance : undefined,
        permissions: Array.from(permissionMap.values())
      }
    };
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        department: true,
        userRoles: {
          include: {
            role: {
              include: {
                permissions: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      throw new Error('Người dùng không tồn tại');
    }

    const roles = user.userRoles.map((ur: any) => ur.role.code);
    const isSalaryAuthorized = roles.includes('ADMIN') || roles.includes('CEO');

    const permissionMap = new Map<string, any>();
    for (const ur of user.userRoles as any[]) {
      for (const p of ur.role.permissions) {
        const existing = permissionMap.get(p.moduleCode);
        if (!existing) {
          permissionMap.set(p.moduleCode, { ...p });
        } else {
          existing.canRead = existing.canRead || p.canRead;
          existing.canCreate = existing.canCreate || p.canCreate;
          existing.canUpdate = existing.canUpdate || p.canUpdate;
          existing.canDelete = existing.canDelete || p.canDelete;
        }
      }
    }

    return {
      id: user.id,
      code: user.code,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      department: user.department ? { id: user.department.id, code: user.department.code, name: user.department.name } : null,
      roles,
      basicSalary: isSalaryAuthorized ? user.basicSalary : undefined,
      allowance: isSalaryAuthorized ? user.allowance : undefined,
      permissions: Array.from(permissionMap.values())
    };
  }

  // Quên mật khẩu & kiểm tra tài khoản hợp lệ
  async forgotPassword(email: string) {
    const trimmedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: trimmedEmail }
    });

    if (!user) {
      throw new Error('Email không tồn tại trong hệ thống CRM Nam Khánh');
    }

    if (user.status !== 'ACTIVE') {
      throw new Error('Tài khoản đã bị tạm dừng hoạt động. Vui lòng liên hệ Quản trị viên');
    }

    return {
      message: `Tài khoản ${trimmedEmail} hợp lệ. Bạn có thể tiến hành đặt lại mật khẩu mới.`,
      email: trimmedEmail
    };
  }

  // Đặt lại mật khẩu mới (trực tiếp không cần xác minh mã OTP qua mail)
  async resetPassword(email: string, newPassword: string, _otp?: string) {
    const trimmedEmail = email.trim().toLowerCase();
    if (!newPassword || newPassword.length < 6) {
      throw new Error('Mật khẩu mới phải có ít nhất 6 ký tự');
    }

    const user = await prisma.user.findUnique({
      where: { email: trimmedEmail }
    });

    if (!user) {
      throw new Error('Email không tồn tại trong hệ thống');
    }

    if (user.status !== 'ACTIVE') {
      throw new Error('Tài khoản đã bị tạm dừng hoạt động. Vui lòng liên hệ Quản trị viên');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash }
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'RESET_PASSWORD_SUCCESS',
        entityType: 'User',
        entityId: user.id,
        newValue: { email: trimmedEmail, resetAt: new Date().toISOString() }
      }
    });

    return {
      message: 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.'
    };
  }

  // Đăng nhập Single Sign-On (SSO) Google Workspace
  async googleLogin(email: string, fullName?: string) {
    const trimmedEmail = email.trim().toLowerCase();
    
    // Tìm user theo email
    let user = await prisma.user.findUnique({
      where: { email: trimmedEmail },
      include: {
        department: true,
        userRoles: {
          include: {
            role: {
              include: {
                permissions: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      // Nếu là email thuộc Google Workspace Nam Khánh (@namkhanh.vn), tự động tạo tài khoản mặc định nếu có cấu hình
      if (trimmedEmail.endsWith('@namkhanh.vn')) {
        const defaultRole = await prisma.role.findFirst({
          where: { code: 'SALES' }
        });

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('NamKhanh@2026', salt);

        const count = await prisma.user.count();
        const userCode = `NV${String(count + 1).padStart(3, '0')}`;

        user = await prisma.user.create({
          data: {
            code: userCode,
            email: trimmedEmail,
            fullName: fullName || trimmedEmail.split('@')[0],
            phone: `09${Math.floor(10000000 + Math.random() * 90000000)}`,
            passwordHash,
            status: 'ACTIVE',
            userRoles: defaultRole ? {
              create: [{ roleId: defaultRole.id }]
            } : undefined
          },
          include: {
            department: true,
            userRoles: {
              include: {
                role: {
                  include: {
                    permissions: true
                  }
                }
              }
            }
          }
        });
      } else {
        throw new Error(`Email Google Workspace (${trimmedEmail}) chưa được cấp quyền truy cập vào CRM Nam Khánh. Vui lòng liên hệ Admin.`);
      }
    }

    if (user.status !== 'ACTIVE') {
      throw new Error('Tài khoản đã bị tạm dừng hoạt động. Vui lòng liên hệ Quản trị viên');
    }

    const roles = user.userRoles.map((ur: any) => ur.role.code);
    const permissionMap = new Map<string, any>();

    for (const ur of user.userRoles as any[]) {
      for (const p of ur.role.permissions) {
        const existing = permissionMap.get(p.moduleCode);
        if (!existing) {
          permissionMap.set(p.moduleCode, { ...p });
        } else {
          existing.canRead = existing.canRead || p.canRead;
          existing.canCreate = existing.canCreate || p.canCreate;
          existing.canUpdate = existing.canUpdate || p.canUpdate;
          existing.canDelete = existing.canDelete || p.canDelete;
        }
      }
    }

    const secret = process.env.JWT_SECRET || 'crm_namkhanh_super_secret_jwt_key_2026';
    const token = jwt.sign(
      { userId: user.id, email: user.email, roles },
      secret,
      { expiresIn: '7d' }
    );

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'GOOGLE_SSO_LOGIN',
        entityType: 'User',
        entityId: user.id,
        newValue: { email: user.email, provider: 'Google Workspace', time: new Date().toISOString() }
      }
    });

    const isSalaryAuthorized = roles.includes('ADMIN') || roles.includes('CEO');

    return {
      token,
      user: {
        id: user.id,
        code: user.code,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        department: user.department ? { id: user.department.id, code: user.department.code, name: user.department.name } : null,
        roles,
        basicSalary: isSalaryAuthorized ? user.basicSalary : undefined,
        allowance: isSalaryAuthorized ? user.allowance : undefined,
        permissions: Array.from(permissionMap.values())
      }
    };
  }
}

export const authService = new AuthService();
