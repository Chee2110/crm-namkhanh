import React, { useState, useEffect, useMemo } from 'react';
import {
  KeyRound,
  CheckSquare,
  Square,
  Save,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  Search,
  RotateCcw
} from 'lucide-react';
import { api } from '../../services/api';
import { Role, RolePermission } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { SYSTEM_MODULES, ORDERED_GROUPS } from '../../constants/modules';
import { AdminDelegationModal } from './components/AdminDelegationModal';

interface PermissionsPageProps {
  initialRoleId?: string;
}

export const PermissionsPage: React.FC<PermissionsPageProps> = ({ initialRoleId }) => {
  const { user, hasPermission } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>(initialRoleId || '');
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  // Tải danh sách roles
  useEffect(() => {
    api.get<Role[]>('/roles').then((res) => {
      const roleList = res.data || [];
      setRoles(roleList);
      if (!selectedRoleId && roleList.length > 0) {
        setSelectedRoleId(initialRoleId || roleList[0].id);
      }
    });
  }, [initialRoleId]);

  // Tải ma trận quyền khi đổi selectedRoleId
  useEffect(() => {
    if (!selectedRoleId) return;
    setLoading(true);
    setSaveSuccess(false);
    setSaveError(null);

    api
      .get<{ role: Role; permissions: RolePermission[] }>(`/roles/${selectedRoleId}/permissions`)
      .then((res) => {
        const serverPerms = res.data.permissions || [];
        const serverPermMap = new Map<string, RolePermission>(serverPerms.map((p) => [p.moduleCode, p]));
        const isSuperRole = res.data.role?.code === 'ADMIN' || res.data.role?.code === 'CEO';

        // Hợp nhất toàn bộ 29 phân hệ chuẩn của hệ thống với quyền máy chủ trả về
        const fullMatrix: RolePermission[] = SYSTEM_MODULES.map((m) => {
          const p = serverPermMap.get(m.code);
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

        setPermissions(fullMatrix);
      })
      .catch((err) => {
        setSaveError(err.message || 'Lỗi tải ma trận quyền');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selectedRoleId]);

  const handleToggle = (
    moduleCode: string,
    field: 'canRead' | 'canCreate' | 'canUpdate' | 'canDelete'
  ) => {
    setPermissions((prev) =>
      prev.map((p) => {
        if (p.moduleCode === moduleCode) {
          const newVal = !p[field];
          const updated = { ...p, [field]: newVal };

          // Logic RBAC chuẩn: Bật thêm/sửa/xóa tự động bật Xem
          if (newVal && (field === 'canCreate' || field === 'canUpdate' || field === 'canDelete')) {
            updated.canRead = true;
          }
          // Tắt quyền Xem thì tự động tắt luôn Thêm/Sửa/Xóa
          if (!newVal && field === 'canRead') {
            updated.canCreate = false;
            updated.canUpdate = false;
            updated.canDelete = false;
          }
          return updated;
        }
        return p;
      })
    );
  };

  const handleScopeChange = (moduleCode: string, dataScope: 'ALL' | 'DEPARTMENT' | 'PERSONAL') => {
    setPermissions((prev) =>
      prev.map((p) => {
        if (p.moduleCode === moduleCode) {
          return { ...p, dataScope };
        }
        return p;
      })
    );
  };

  // Chọn toàn bộ quyền tất cả các trang
  const handleSelectAll = () => {
    setPermissions((prev) =>
      prev.map((p) => ({
        ...p,
        canRead: true,
        canCreate: true,
        canUpdate: true,
        canDelete: true
      }))
    );
  };

  // Bỏ chọn toàn bộ quyền
  const handleDeselectAll = () => {
    setPermissions((prev) =>
      prev.map((p) => ({
        ...p,
        canRead: false,
        canCreate: false,
        canUpdate: false,
        canDelete: false
      }))
    );
  };

  // Bật/tắt tất cả quyền cho một phân hệ nhóm cụ thể
  const handleToggleGroup = (groupName: string, select: boolean) => {
    setPermissions((prev) =>
      prev.map((p) => {
        if (p.group === groupName) {
          return {
            ...p,
            canRead: select,
            canCreate: select,
            canUpdate: select,
            canDelete: select
          };
        }
        return p;
      })
    );
  };

  // Bật/tắt nhanh toàn bộ một cột quyền (Xem / Thêm / Sửa / Xóa)
  const handleToggleColumn = (field: 'canRead' | 'canCreate' | 'canUpdate' | 'canDelete') => {
    const allChecked = permissions.every((p) => p[field]);
    const nextVal = !allChecked;
    setPermissions((prev) =>
      prev.map((p) => {
        const updated = { ...p, [field]: nextVal };
        if (nextVal && (field === 'canCreate' || field === 'canUpdate' || field === 'canDelete')) {
          updated.canRead = true;
        }
        if (!nextVal && field === 'canRead') {
          updated.canCreate = false;
          updated.canUpdate = false;
          updated.canDelete = false;
        }
        return updated;
      })
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveSuccess(false);
      setSaveError(null);

      await api.put(`/roles/${selectedRoleId}/permissions`, {
        permissions: permissions.map((p) => ({
          moduleCode: p.moduleCode,
          canRead: p.canRead,
          canCreate: p.canCreate,
          canUpdate: p.canUpdate,
          canDelete: p.canDelete,
          dataScope: p.dataScope
        }))
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      setSaveError(err.message || 'Lỗi khi lưu cấu hình phân quyền');
    } finally {
      setSaving(false);
    }
  };

  // Nhóm các permissions theo đúng thứ tự 5 phân hệ chuẩn của CRM Nam Khánh
  const groupedPermissions = useMemo(() => {
    const groups: Record<string, RolePermission[]> = {};
    ORDERED_GROUPS.forEach((g) => {
      groups[g] = [];
    });

    const filtered = permissions.filter((p) => {
      if (!searchKeyword.trim()) return true;
      const kw = searchKeyword.toLowerCase();
      return (
        (p.moduleName && p.moduleName.toLowerCase().includes(kw)) ||
        p.moduleCode.toLowerCase().includes(kw) ||
        (p.group && p.group.toLowerCase().includes(kw))
      );
    });

    filtered.forEach((p) => {
      const g = p.group || 'Khác';
      if (!groups[g]) {
        groups[g] = [];
      }
      groups[g].push(p);
    });

    return groups;
  }, [permissions, searchKeyword]);

  const selectedRole = roles.find((r) => r.id === selectedRoleId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
      {/* Thanh lựa chọn vai trò & hành động */}
      <div
        className="card"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          padding: '0.65rem 1.25rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '14.85px', fontWeight: '600', color: '#374151' }}>
              Vai trò cần cấu hình:
            </span>
            <select
              className="input"
              style={{ width: '250px', fontWeight: '600', color: '#E53935' }}
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.code})
                </option>
              ))}
            </select>
          </div>

          {selectedRole && (
            <span style={{ fontSize: '13.75px', color: '#6B7280' }}>
              Mô tả: {selectedRole.description || 'Không có mô tả'}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
          {/* Ô tìm kiếm nhanh chức năng */}
          <div style={{ position: 'relative', width: '200px' }}>
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: '9px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9CA3AF'
              }}
            />
            <input
              type="text"
              placeholder="Lọc trang / module..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="input"
              style={{
                paddingLeft: '28px',
                paddingRight: '10px',
                paddingTop: '4px',
                paddingBottom: '4px',
                fontSize: '13px',
                height: '32px'
              }}
            />
          </div>

          {/* NÚT PHÂN QUYỀN QUẢN TRỊ (CHỈ dinhhchi2110@gmail.com CÓ THẨM QUYỀN CẤP/XÓA) */}
          <button
            type="button"
            onClick={() => setIsAdminModalOpen(true)}
            className="btn btn-secondary btn-sm"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              borderColor: '#FCA5A5',
              backgroundColor: '#FEF2F2',
              color: '#DC2626',
              fontWeight: '600'
            }}
            title="Phân quyền quản trị hệ thống (Chỉ dinhhchi2110@gmail.com có thẩm quyền cấp/xóa cho người khác)"
          >
            <ShieldCheck size={15} style={{ color: '#DC2626' }} />
            <span>Phân quyền quản trị</span>
            {user?.email?.trim().toLowerCase() === 'dinhhchi2110@gmail.com' && (
              <span
                style={{
                  fontSize: '10px',
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  padding: '1px 6px',
                  borderRadius: '9999px',
                  fontWeight: '700'
                }}
              >
                Gốc
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={handleSelectAll}
            className="btn btn-secondary btn-sm"
            title="Tích chọn toàn bộ quyền của tất cả các trang"
          >
            <CheckSquare size={14} />
            <span>Chọn tất cả</span>
          </button>
          <button
            type="button"
            onClick={handleDeselectAll}
            className="btn btn-secondary btn-sm"
            title="Bỏ chọn tất cả quyền"
          >
            <Square size={14} />
            <span>Bỏ chọn tất cả</span>
          </button>
          {hasPermission('A_PERMISSIONS', 'update') && (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="btn btn-primary"
            >
              <Save size={16} />
              <span>{saving ? 'Đang lưu...' : 'Lưu cấu hình'}</span>
            </button>
          )}
        </div>
      </div>

      {saveSuccess && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: '#DCFCE7',
            border: '1px solid #86EFAC',
            color: '#166534',
            padding: '0.75rem 1rem',
            borderRadius: '0.5rem',
            fontSize: '14.3px'
          }}
        >
          <CheckCircle2 size={16} />
          <span>Đã lưu thành công ma trận phân quyền cho vai trò {selectedRole?.name}!</span>
        </div>
      )}

      {saveError && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: '#FEE2E2',
            color: '#B91C1C',
            padding: '0.75rem 1rem',
            borderRadius: '0.5rem',
            fontSize: '14.3px'
          }}
        >
          <AlertCircle size={16} />
          <span>{saveError}</span>
        </div>
      )}

      {/* BẢNG MA TRẬN PHÂN QUYỀN ĐẦY ĐỦ TẤT CẢ CÁC TRANG (29 CHỨC NĂNG / 5 PHÂN HỆ) */}
      <div className="table-container">
        <table className="table-custom">
          <thead>
            <tr>
              <th className="table-th" style={{ width: '50px', textAlign: 'center' }}>STT</th>
              <th className="table-th" style={{ width: '38%', textAlign: 'left' }}>Phân hệ / Chức năng con</th>
              <th
                className="table-th"
                style={{ width: '9%', textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}
                onClick={() => handleToggleColumn('canRead')}
                title="Bấm để bật / tắt toàn bộ cột [XEM]"
              >
                [XEM]
              </th>
              <th
                className="table-th"
                style={{ width: '9%', textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}
                onClick={() => handleToggleColumn('canCreate')}
                title="Bấm để bật / tắt toàn bộ cột [THÊM]"
              >
                [THÊM]
              </th>
              <th
                className="table-th"
                style={{ width: '9%', textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}
                onClick={() => handleToggleColumn('canUpdate')}
                title="Bấm để bật / tắt toàn bộ cột [SỬA]"
              >
                [SỬA]
              </th>
              <th
                className="table-th"
                style={{ width: '9%', textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}
                onClick={() => handleToggleColumn('canDelete')}
                title="Bấm để bật / tắt toàn bộ cột [XÓA]"
              >
                [XÓA]
              </th>
              <th className="table-th" style={{ width: '26%', textAlign: 'center' }}>Phạm vi dữ liệu (Data Scope)</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#6B7280' }}>
                  Đang nạp ma trận phân quyền...
                </td>
              </tr>
            ) : (() => {
              let globalIndex = 0;
              const entries = Object.entries(groupedPermissions).filter(([_, items]) => items.length > 0);

              if (entries.length === 0) {
                return (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
                      Không tìm thấy chức năng nào phù hợp với từ khóa "{searchKeyword}".
                    </td>
                  </tr>
                );
              }

              return entries.map(([groupName, items]) => (
                <React.Fragment key={groupName}>
                  {/* Dòng Header phân nhóm 5 phân hệ */}
                  <tr style={{ backgroundColor: '#F3F4F6' }}>
                    <td
                      colSpan={7}
                      style={{
                        padding: '0.55rem 1rem',
                        fontSize: '12.8px',
                        fontWeight: '700',
                        color: '#1F2937',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        borderTop: '2px solid #E5E7EB',
                        borderBottom: '1px solid #E5E7EB'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>
                          {groupName} ({items.length} chức năng)
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'none', fontWeight: '500' }}>
                          <button
                            type="button"
                            onClick={() => handleToggleGroup(groupName, true)}
                            className="btn btn-secondary btn-xs"
                            style={{ fontSize: '11px', padding: '2px 7px', height: '22px' }}
                            title={`Bật tất cả quyền của nhóm ${groupName}`}
                          >
                            Bật cả nhóm
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleGroup(groupName, false)}
                            className="btn btn-secondary btn-xs"
                            style={{ fontSize: '11px', padding: '2px 7px', height: '22px' }}
                            title={`Tắt tất cả quyền của nhóm ${groupName}`}
                          >
                            Tắt cả nhóm
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>

                  {/* Danh sách các chức năng trong nhóm */}
                  {items.map((item) => {
                    globalIndex++;
                    return (
                      <tr key={item.moduleCode} className="table-tr">
                        <td className="table-td" style={{ textAlign: 'center', fontWeight: '500', color: '#6B7280' }}>
                          {globalIndex}
                        </td>
                        <td className="table-td">
                          <div style={{ fontWeight: '600', color: '#111827', fontSize: '13.8px' }}>
                            {item.moduleName || item.moduleCode}
                          </div>
                          <div style={{ fontSize: '11.8px', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span style={{ fontFamily: 'monospace', color: '#4B5563', backgroundColor: '#F3F4F6', padding: '1px 5px', borderRadius: '3px' }}>
                              {item.moduleCode}
                            </span>
                          </div>
                        </td>

                        {/* Checkbox Xem */}
                        <td className="table-td" style={{ textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#E53935' }}
                            checked={item.canRead}
                            onChange={() => handleToggle(item.moduleCode, 'canRead')}
                            title={`Quyền Xem: ${item.moduleName}`}
                          />
                        </td>

                        {/* Checkbox Thêm */}
                        <td className="table-td" style={{ textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#E53935' }}
                            checked={item.canCreate}
                            onChange={() => handleToggle(item.moduleCode, 'canCreate')}
                            title={`Quyền Thêm: ${item.moduleName}`}
                          />
                        </td>

                        {/* Checkbox Sửa */}
                        <td className="table-td" style={{ textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#E53935' }}
                            checked={item.canUpdate}
                            onChange={() => handleToggle(item.moduleCode, 'canUpdate')}
                            title={`Quyền Sửa: ${item.moduleName}`}
                          />
                        </td>

                        {/* Checkbox Xóa */}
                        <td className="table-td" style={{ textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#E53935' }}
                            checked={item.canDelete}
                            onChange={() => handleToggle(item.moduleCode, 'canDelete')}
                            title={`Quyền Xóa: ${item.moduleName}`}
                          />
                        </td>

                        {/* Dropdown Data Scope */}
                        <td className="table-td">
                          <select
                            className="input"
                            style={{ fontSize: '13px', padding: '0.25rem 0.5rem', width: '100%', height: '32px' }}
                            value={item.dataScope}
                            onChange={(e) =>
                              handleScopeChange(
                                item.moduleCode,
                                e.target.value as 'ALL' | 'DEPARTMENT' | 'PERSONAL'
                              )
                            }
                          >
                            <option value="ALL">Toàn công ty (Tất cả)</option>
                            <option value="DEPARTMENT">Toàn phòng ban</option>
                            <option value="PERSONAL">Cá nhân phụ trách</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ));
            })()}
          </tbody>
        </table>
      </div>

      {/* MODAL PHÂN QUYỀN QUẢN TRỊ (CHỈ dinhhchi2110@gmail.com ĐƯỢC CẤP/XÓA) */}
      <AdminDelegationModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
      />
    </div>
  );
};

