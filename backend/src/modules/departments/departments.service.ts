import { prisma } from '../../config/db';

export class DepartmentsService {
  async getDepartments(format: 'flat' | 'tree' = 'tree', status?: string, search?: string) {
    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } }
      ];
    }

    const departments = await prisma.department.findMany({
      where,
      include: {
        manager: {
          select: { id: true, code: true, fullName: true, email: true, phone: true }
        },
        parent: {
          select: { id: true, code: true, name: true }
        },
        _count: {
          select: { staff: true, children: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    if (format === 'flat') {
      return departments;
    }

    // Build hierarchical tree
    return this.buildTree(departments);
  }

  private buildTree(items: any[], parentId: string | null = null): any[] {
    const branch: any[] = [];
    for (const item of items) {
      if (item.parentId === parentId) {
        const children = this.buildTree(items, item.id);
        branch.push({
          ...item,
          children: children.length > 0 ? children : undefined
        });
      }
    }
    return branch;
  }

  async getDepartmentById(id: string) {
    const dept = await prisma.department.findUnique({
      where: { id },
      include: {
        manager: true,
        parent: true,
        children: true,
        staff: {
          select: { id: true, code: true, fullName: true, email: true, phone: true, status: true }
        }
      }
    });
    if (!dept) {
      throw new Error('Đơn vị phòng ban không tồn tại');
    }
    return dept;
  }

  async createDepartment(data: {
    code: string;
    name: string;
    parentId?: string | null;
    managerId?: string | null;
    address?: string;
    mission?: string;
    avatarUrl?: string;
    status?: string;
  }) {
    // 1. Check mã duy nhất
    const existing = await prisma.department.findUnique({
      where: { code: data.code.trim().toUpperCase() }
    });
    if (existing) {
      throw new Error(`Mã đơn vị '${data.code}' đã tồn tại trong hệ thống`);
    }

    // 2. Validate parentId nếu có
    if (data.parentId) {
      const parent = await prisma.department.findUnique({ where: { id: data.parentId } });
      if (!parent) {
        throw new Error('Đơn vị cấp trên không tồn tại');
      }
    }

    // 3. Validate managerId nếu có
    if (data.managerId) {
      const manager = await prisma.user.findUnique({ where: { id: data.managerId } });
      if (!manager) {
        throw new Error('Trưởng bộ phận được chọn không tồn tại');
      }
    }

    return await prisma.department.create({
      data: {
        code: data.code.trim().toUpperCase(),
        name: data.name.trim(),
        parentId: data.parentId || null,
        managerId: data.managerId || null,
        address: data.address,
        mission: data.mission,
        avatarUrl: data.avatarUrl,
        status: data.status || 'ACTIVE'
      },
      include: {
        manager: true,
        parent: true
      }
    });
  }

  async updateDepartment(
    id: string,
    data: {
      code?: string;
      name?: string;
      parentId?: string | null;
      managerId?: string | null;
      address?: string;
      mission?: string;
      avatarUrl?: string;
      status?: string;
    }
  ) {
    const dept = await prisma.department.findUnique({ where: { id } });
    if (!dept) {
      throw new Error('Đơn vị phòng ban không tồn tại');
    }

    // 1. Check mã duy nhất nếu thay đổi
    if (data.code && data.code.trim().toUpperCase() !== dept.code) {
      const existing = await prisma.department.findUnique({
        where: { code: data.code.trim().toUpperCase() }
      });
      if (existing) {
        throw new Error(`Mã đơn vị '${data.code}' đã tồn tại trong hệ thống`);
      }
    }

    // 2. Chống vòng lặp phân cấp (Đơn vị con không thể làm cha của đơn vị cha)
    if (data.parentId !== undefined) {
      if (data.parentId === id) {
        throw new Error('Đơn vị không thể làm cấp trên của chính mình');
      }

      if (data.parentId) {
        const isDescendant = await this.isDescendantOf(data.parentId, id);
        if (isDescendant) {
          throw new Error('Đơn vị cấp trên không thể là đơn vị con thuộc phân cấp hiện tại (Chống vòng lặp)');
        }
      }
    }

    return await prisma.department.update({
      where: { id },
      data: {
        code: data.code ? data.code.trim().toUpperCase() : undefined,
        name: data.name ? data.name.trim() : undefined,
        parentId: data.parentId !== undefined ? data.parentId : undefined,
        managerId: data.managerId !== undefined ? data.managerId : undefined,
        address: data.address,
        mission: data.mission,
        avatarUrl: data.avatarUrl,
        status: data.status
      },
      include: {
        manager: true,
        parent: true
      }
    });
  }

  private async isDescendantOf(targetParentId: string, currentId: string): Promise<boolean> {
    let currentCheckId: string | null = targetParentId;
    while (currentCheckId) {
      if (currentCheckId === currentId) {
        return true;
      }
      const parentDept: { parentId: string | null } | null = await prisma.department.findUnique({
        where: { id: currentCheckId },
        select: { parentId: true }
      });
      currentCheckId = parentDept?.parentId || null;
    }
    return false;
  }

  async deleteDepartment(id: string) {
    const dept = await prisma.department.findUnique({
      where: { id },
      include: {
        _count: {
          select: { staff: true, children: true }
        }
      }
    });

    if (!dept) {
      throw new Error('Đơn vị phòng ban không tồn tại');
    }

    if (dept._count.children > 0) {
      throw new Error('Không thể xóa đơn vị này vì đang có các phòng ban/đơn vị trực thuộc');
    }

    if (dept._count.staff > 0) {
      throw new Error(`Không thể xóa đơn vị này vì đang có ${dept._count.staff} nhân sự trực thuộc`);
    }

    return await prisma.department.delete({
      where: { id }
    });
  }
}

export const departmentsService = new DepartmentsService();
