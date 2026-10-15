import { prisma } from '../../config/db';
import { MODULE_DEFINITIONS } from '../../common/constants/modules';

export const SUPER_ADMIN_EMAIL = 'dinhhchi2110@gmail.com';

export class RolesService {
  async getRoles() {
    return await prisma.role.findMany({
      include: {
        _count: {
          select: { userRoles: true, permissions: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
  }

  async getRoleById(id: string) {
    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        permissions: true,
        userRoles: {
          include: {
            user: {
              select: { id: true, code: true, fullName: true, email: true }
            }
          }
        }
      }
    });
    if (!role) throw new Error('Vai trò không tồn tại');
    return role;
  }

  async createRole(data: { code: string; name: string; description?: string }) {
    const code = data.code.trim().toUpperCase();
    const existing = await prisma.role.findUnique({ where: { code } });
    if (existing) {
      throw new Error(`Mã vai trò '${code}' đã tồn tại`);
    }

    const role = await prisma.role.create({
      data: {
        code,
        name: data.name.trim(),
        description: data.description?.trim(),
        isSystem: false
      }
    });

    // Tự động khởi tạo quyền mặc định (tất cả false) cho role mới
    const defaultPermissions = MODULE_DEFINITIONS.map((m) => ({
      roleId: role.id,
      moduleCode: m.code,
      canRead: false,
      canCreate: false,
      canUpdate: false,
      canDelete: false,
      dataScope: 'PERSONAL'
    }));

    await prisma.rolePermission.createMany({
      data: defaultPermissions
    });

    return role;
  }

  async updateRole(id: string, data: { name?: string; description?: string }) {
    const role = await prisma.role.findUnique({ where: { id } });
    if (!role) throw new Error('Vai trò không tồn tại');

    return await prisma.role.update({
      where: { id },
      data: {
        name: data.name ? data.name.trim() : undefined,
        description: data.description !== undefined ? data.description?.trim() : undefined
      }
    });
  }

  async deleteRole(id: string) {
    const role = await prisma.role.findUnique({
      where: { id },
      include: { _count: { select: { userRoles: true } } }
    });
    if (!role) throw new Error('Vai trò không tồn tại');

    if (role.isSystem) {
      throw new Error('Đây là vai trò mặc định của hệ thống, không được phép xóa');
    }

    if (role._count.userRoles > 0) {
      throw new Error(`Không thể xóa vai trò này vì đang được gán cho ${role._count.userRoles} nhân sự`);
    }

    return await prisma.role.delete({ where: { id } });
  }

  async getRolePermissions(roleId: string) {
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: { permissions: true }
    });
    if (!role) throw new Error('Vai trò không tồn tại');

    // Ghép với danh mục 29 modules đầy đủ để đảm bảo không thiếu module/trang nào
    const permissionMap = new Map<string, any>(role.permissions.map((p: any) => [p.moduleCode, p]));
    const isSuperRole = role.code === 'ADMIN' || role.code === 'CEO';

    const fullMatrix = MODULE_DEFINITIONS.map((m) => {
      const p = permissionMap.get(m.code);
      return {
        moduleCode: m.code,
        moduleName: m.name,
        group: m.group,
        canRead: p ? p.canRead : isSuperRole,
        canCreate: p ? p.canCreate : isSuperRole,
        canUpdate: p ? p.canUpdate : isSuperRole,
        canDelete: p ? p.canDelete : isSuperRole,
        dataScope: p ? p.dataScope : (isSuperRole ? 'ALL' : 'PERSONAL')
      };
    });

    return {
      role: { id: role.id, code: role.code, name: role.name, isSystem: role.isSystem },
      permissions: fullMatrix
    };
  }

  async updateRolePermissions(
    roleId: string,
    permissions: Array<{
      moduleCode: string;
      canRead: boolean;
      canCreate: boolean;
      canUpdate: boolean;
      canDelete: boolean;
      dataScope?: string;
    }>
  ) {
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw new Error('Vai trò không tồn tại');

    // Thực hiện upsert quyền hàng loạt trong 1 transaction
    await prisma.$transaction(
      permissions.map((p) =>
        prisma.rolePermission.upsert({
          where: {
            roleId_moduleCode: {
              roleId,
              moduleCode: p.moduleCode
            }
          },
          update: {
            canRead: p.canRead,
            canCreate: p.canCreate,
            canUpdate: p.canUpdate,
            canDelete: p.canDelete,
            dataScope: p.dataScope || 'PERSONAL'
          },
          create: {
            roleId,
            moduleCode: p.moduleCode,
            canRead: p.canRead,
            canCreate: p.canCreate,
            canUpdate: p.canUpdate,
            canDelete: p.canDelete,
            dataScope: p.dataScope || 'PERSONAL'
          }
        })
      )
    );

    return await this.getRolePermissions(roleId);
  }

  async getAdminUsers() {
    const users = await prisma.user.findMany({
      include: {
        department: {
          select: { id: true, code: true, name: true }
        },
        userRoles: {
          include: {
            role: {
              select: { id: true, code: true, name: true, isSystem: true }
            }
          }
        }
      },
      orderBy: [{ createdAt: 'asc' }]
    });

    const mapped = users.map((u: any) => {
      const roles = u.userRoles.map((ur: any) => ur.role);
      const isAdmin = roles.some((r: any) => r.code === 'ADMIN');
      const isSuperAdmin = u.email?.trim().toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();

      return {
        id: u.id,
        code: u.code,
        fullName: u.fullName,
        email: u.email,
        phone: u.phone,
        status: u.status,
        department: u.department,
        roles,
        isAdmin,
        isSuperAdmin
      };
    });

    mapped.sort((a: any, b: any) => {
      if (a.isSuperAdmin) return -1;
      if (b.isSuperAdmin) return 1;
      if (a.isAdmin && !b.isAdmin) return -1;
      if (!a.isAdmin && b.isAdmin) return 1;
      return a.fullName.localeCompare(b.fullName, 'vi');
    });

    return {
      superAdminEmail: SUPER_ADMIN_EMAIL,
      totalUsers: mapped.length,
      adminCount: mapped.filter((u: any) => u.isAdmin).length,
      users: mapped
    };
  }

  async delegateAdminRole(params: {
    targetUserId: string;
    action: 'GRANT' | 'REVOKE';
    operatorEmail: string;
  }) {
    if (params.operatorEmail?.trim().toLowerCase() !== SUPER_ADMIN_EMAIL.toLowerCase()) {
      throw new Error(`Chỉ tài khoản ${SUPER_ADMIN_EMAIL} mới có quyền cấp hoặc xóa quyền quản trị cho người khác`);
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: params.targetUserId },
      include: {
        userRoles: {
          include: { role: true }
        }
      }
    });

    if (!targetUser) {
      throw new Error('Người dùng không tồn tại');
    }

    const adminRole = await prisma.role.findUnique({ where: { code: 'ADMIN' } });
    if (!adminRole) {
      throw new Error('Vai trò Quản trị viên (ADMIN) không tồn tại trong hệ thống');
    }

    if (params.action === 'REVOKE') {
      if (targetUser.email?.trim().toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
        throw new Error(`Không thể thu hồi quyền quản trị của tài khoản Quản trị viên tối cao (${SUPER_ADMIN_EMAIL})`);
      }

      await prisma.userRole.deleteMany({
        where: {
          userId: targetUser.id,
          roleId: adminRole.id
        }
      });

      // Nếu nhân sự không còn vai trò nào khác, gán vai trò mặc định SALES
      const count = await prisma.userRole.count({ where: { userId: targetUser.id } });
      if (count === 0) {
        const salesRole = await prisma.role.findUnique({ where: { code: 'SALES' } });
        if (salesRole) {
          await prisma.userRole.create({
            data: { userId: targetUser.id, roleId: salesRole.id }
          });
        }
      }

      return {
        success: true,
        message: `Đã thu hồi thành công quyền quản trị của nhân sự ${targetUser.fullName} (${targetUser.email})`,
        targetUser: {
          id: targetUser.id,
          fullName: targetUser.fullName,
          email: targetUser.email,
          isAdmin: false
        }
      };
    } else {
      // GRANT ADMIN
      await prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId: targetUser.id,
            roleId: adminRole.id
          }
        },
        update: {},
        create: {
          userId: targetUser.id,
          roleId: adminRole.id
        }
      });

      return {
        success: true,
        message: `Đã cấp quyền quản trị thành công cho nhân sự ${targetUser.fullName} (${targetUser.email}). Người này hiện có đầy đủ toàn bộ quyền như quản trị viên.`,
        targetUser: {
          id: targetUser.id,
          fullName: targetUser.fullName,
          email: targetUser.email,
          isAdmin: true
        }
      };
    }
  }

  getModules() {
    return MODULE_DEFINITIONS;
  }
}

export const rolesService = new RolesService();

