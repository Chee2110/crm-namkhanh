import bcrypt from 'bcryptjs';
import { prisma } from '../../config/db';
import { AuthenticatedUser } from '../../common/guards/auth.guard';
import { encryptSensitiveData, decryptSensitiveData } from '../../common/utils/crypto';

export class UsersService {
  async getUsers(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    departmentId?: string;
    roleId?: string;
    status?: string;
    currentUser: AuthenticatedUser;
  }) {
    const page = Math.max(Number(params.page) || 1, 1);
    const pageSize = Math.min(Math.max(Number(params.pageSize) || 20, 1), 100);
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (params.status) {
      where.status = params.status;
    }
    if (params.departmentId) {
      where.departmentId = params.departmentId;
    }
    if (params.roleId) {
      where.userRoles = {
        some: { roleId: params.roleId }
      };
    }
    if (params.search) {
      where.OR = [
        { code: { contains: params.search, mode: 'insensitive' } },
        { fullName: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
        { phone: { contains: params.search, mode: 'insensitive' } }
      ];
    }

    // Row-level scope: Nếu scope là DEPARTMENT thì chỉ xem user phòng ban mình
    const perm = params.currentUser.permissions.find((p) => p.moduleCode === 'A_USERS');
    if (
      !params.currentUser.roles.includes('ADMIN') &&
      !params.currentUser.roles.includes('CEO') &&
      perm?.dataScope === 'DEPARTMENT' &&
      params.currentUser.departmentId
    ) {
      where.departmentId = params.currentUser.departmentId;
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          department: {
            select: { id: true, code: true, name: true }
          },
          manager: {
            select: { id: true, code: true, fullName: true, email: true }
          },
          userRoles: {
            include: {
              role: {
                select: { id: true, code: true, name: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    // Kiểm tra quyền xem trường Lương & Phụ cấp (Giám đốc, HR, Admin)
    const canViewSalary =
      params.currentUser.roles.includes('ADMIN') ||
      params.currentUser.roles.includes('CEO') ||
      params.currentUser.roles.includes('HR') ||
      params.currentUser.roles.includes('DIRECTOR') ||
      params.currentUser.roles.includes('SALES_DIR');

    const sanitizedUsers = users.map((u: any) => {
      const roles = u.userRoles.map((ur: any) => ur.role);
      return {
        id: u.id,
        code: u.code,
        fullName: u.fullName,
        email: u.email,
        phone: u.phone,
        dob: u.dob,
        avatarUrl: u.avatarUrl,
        department: u.department,
        manager: u.manager,
        roles,
        status: u.status,
        startDate: u.startDate,
        createdAt: u.createdAt,
        // Che giấu dữ liệu lương nếu không đủ thẩm quyền
        basicSalary: canViewSalary ? u.basicSalary : undefined,
        allowance: canViewSalary ? u.allowance : undefined
      };
    });

    return {
      items: sanitizedUsers,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  }

  async getUserById(id: string, currentUser: AuthenticatedUser) {
    const u = await prisma.user.findUnique({
      where: { id },
      include: {
        department: true,
        manager: true,
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });

    if (!u) {
      throw new Error('Người dùng không tồn tại');
    }

    const canViewSalary =
      currentUser.roles.includes('ADMIN') ||
      currentUser.roles.includes('CEO') ||
      currentUser.roles.includes('HR') ||
      currentUser.roles.includes('DIRECTOR') ||
      currentUser.roles.includes('SALES_DIR');

    return {
      id: u.id,
      code: u.code,
      fullName: u.fullName,
      email: u.email,
      phone: u.phone,
      dob: u.dob,
      avatarUrl: u.avatarUrl,
      departmentId: u.departmentId,
      department: u.department,
      managerId: u.managerId,
      manager: u.manager,
      roles: u.userRoles.map((ur: any) => ur.role),
      status: u.status,
      startDate: u.startDate,
      createdAt: u.createdAt,
      basicSalary: canViewSalary ? u.basicSalary : undefined,
      allowance: canViewSalary ? u.allowance : undefined
    };
  }

  async createUser(
    data: {
      code: string;
      fullName: string;
      email: string;
      password?: string;
      phone?: string;
      dob?: string;
      departmentId?: string;
      managerId?: string;
      roleIds?: string[];
      basicSalary?: number;
      allowance?: number;
      startDate?: string;
      avatarUrl?: string;
      status?: string;
    },
    currentUser: AuthenticatedUser
  ) {
    // 1. Check unique code, email, phone
    const existingCode = await prisma.user.findUnique({ where: { code: data.code.trim().toUpperCase() } });
    if (existingCode) {
      throw new Error(`Mã người dùng '${data.code}' đã tồn tại`);
    }

    const existingEmail = await prisma.user.findUnique({ where: { email: data.email.trim().toLowerCase() } });
    if (existingEmail) {
      throw new Error(`Email '${data.email}' đã được sử dụng`);
    }

    if (data.phone) {
      const existingPhone = await prisma.user.findUnique({ where: { phone: data.phone.trim() } });
      if (existingPhone) {
        throw new Error(`Số điện thoại '${data.phone}' đã được đăng ký`);
      }
    }

    // 2. Hash password (default: 123456 nếu không truyền)
    const rawPass = data.password && data.password.trim() ? data.password.trim() : '123456';
    const passwordHash = await bcrypt.hash(rawPass, 10);

    const canManageSalary =
      currentUser.roles.includes('ADMIN') ||
      currentUser.roles.includes('CEO') ||
      currentUser.roles.includes('HR') ||
      currentUser.roles.includes('DIRECTOR');

    const basicSalary = canManageSalary && data.basicSalary !== undefined ? data.basicSalary : null;
    const allowance = canManageSalary && data.allowance !== undefined ? data.allowance : null;

    // 3. Create user transaction
    const newUser = await prisma.$transaction(async (tx: any) => {
      const created = await tx.user.create({
        data: {
          code: data.code.trim().toUpperCase(),
          fullName: data.fullName.trim(),
          email: data.email.trim().toLowerCase(),
          passwordHash,
          phone: data.phone?.trim() || null,
          dob: data.dob ? new Date(data.dob) : null,
          departmentId: data.departmentId || null,
          managerId: data.managerId || null,
          basicSalary,
          allowance,
          startDate: data.startDate ? new Date(data.startDate) : new Date(),
          avatarUrl: data.avatarUrl || null,
          status: data.status || 'ACTIVE'
        }
      });

      if (data.roleIds && data.roleIds.length > 0) {
        await tx.userRole.createMany({
          data: data.roleIds.map((roleId) => ({
            userId: created.id,
            roleId
          }))
        });
      }

      return created;
    });

    return await this.getUserById(newUser.id, currentUser);
  }

  async updateUser(
    id: string,
    data: {
      code?: string;
      fullName?: string;
      email?: string;
      password?: string;
      phone?: string;
      dob?: string;
      departmentId?: string;
      managerId?: string;
      roleIds?: string[];
      basicSalary?: number;
      allowance?: number;
      startDate?: string;
      avatarUrl?: string;
      status?: string;
    },
    currentUser: AuthenticatedUser
  ) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new Error('Người dùng không tồn tại');
    }

    // Check unique code
    if (data.code && data.code.trim().toUpperCase() !== user.code) {
      const existing = await prisma.user.findUnique({ where: { code: data.code.trim().toUpperCase() } });
      if (existing) throw new Error(`Mã người dùng '${data.code}' đã tồn tại`);
    }

    // Check unique email
    if (data.email && data.email.trim().toLowerCase() !== user.email) {
      const existing = await prisma.user.findUnique({ where: { email: data.email.trim().toLowerCase() } });
      if (existing) throw new Error(`Email '${data.email}' đã được sử dụng`);
    }

    // Check unique phone
    if (data.phone && data.phone.trim() !== user.phone) {
      const existing = await prisma.user.findUnique({ where: { phone: data.phone.trim() } });
      if (existing) throw new Error(`Số điện thoại '${data.phone}' đã được sử dụng`);
    }

    const canManageSalary =
      currentUser.roles.includes('ADMIN') ||
      currentUser.roles.includes('CEO') ||
      currentUser.roles.includes('HR') ||
      currentUser.roles.includes('DIRECTOR');

    await prisma.$transaction(async (tx: any) => {
      let passwordHash: string | undefined = undefined;
      if (data.password && data.password.trim()) {
        passwordHash = await bcrypt.hash(data.password.trim(), 10);
      }

      await tx.user.update({
        where: { id },
        data: {
          code: data.code ? data.code.trim().toUpperCase() : undefined,
          fullName: data.fullName ? data.fullName.trim() : undefined,
          email: data.email ? data.email.trim().toLowerCase() : undefined,
          passwordHash,
          phone: data.phone !== undefined ? data.phone?.trim() || null : undefined,
          dob: data.dob !== undefined ? (data.dob ? new Date(data.dob) : null) : undefined,
          departmentId: data.departmentId !== undefined ? data.departmentId || null : undefined,
          managerId: data.managerId !== undefined ? data.managerId || null : undefined,
          startDate: data.startDate !== undefined ? (data.startDate ? new Date(data.startDate) : null) : undefined,
          avatarUrl: data.avatarUrl !== undefined ? data.avatarUrl : undefined,
          status: data.status,
          basicSalary: canManageSalary && data.basicSalary !== undefined ? data.basicSalary : undefined,
          allowance: canManageSalary && data.allowance !== undefined ? data.allowance : undefined
        }
      });

      if (data.roleIds) {
        await tx.userRole.deleteMany({ where: { userId: id } });
        if (data.roleIds.length > 0) {
          await tx.userRole.createMany({
            data: data.roleIds.map((roleId) => ({
              userId: id,
              roleId
            }))
          });
        }
      }
    });

    return await this.getUserById(id, currentUser);
  }

  async updateStatus(id: string, status: 'ACTIVE' | 'INACTIVE') {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new Error('Người dùng không tồn tại');

    // Khóa/mở khóa trạng thái, không xóa cứng để bảo vệ dữ liệu lịch sử chứng từ
    return await prisma.user.update({
      where: { id },
      data: { status }
    });
  }
}

export const usersService = new UsersService();
