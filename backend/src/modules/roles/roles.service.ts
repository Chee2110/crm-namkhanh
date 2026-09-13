import { prisma } from '../../config/db';
import { MODULE_DEFINITIONS } from '../../common/constants/modules';

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

    // Ghép với danh mục 25 modules đầy đủ để đảm bảo không thiếu module nào
    const permissionMap = new Map<string, any>(role.permissions.map((p: any) => [p.moduleCode, p]));

    const fullMatrix = MODULE_DEFINITIONS.map((m) => {
      const p = permissionMap.get(m.code);
      return {
        moduleCode: m.code,
        moduleName: m.name,
        group: m.group,
        canRead: p ? p.canRead : false,
        canCreate: p ? p.canCreate : false,
        canUpdate: p ? p.canUpdate : false,
        canDelete: p ? p.canDelete : false,
        dataScope: p ? p.dataScope : 'PERSONAL'
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

  getModules() {
    return MODULE_DEFINITIONS;
  }
}

export const rolesService = new RolesService();
