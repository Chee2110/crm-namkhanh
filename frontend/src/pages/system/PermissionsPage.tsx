import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  CheckSquare,
  Square,
  Save,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { api } from '../../services/api';
import { Role, RolePermission } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface PermissionsPageProps {
  initialRoleId?: string;
}

export const PermissionsPage: React.FC<PermissionsPageProps> = ({ initialRoleId }) => {
  const { hasPermission } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>(initialRoleId || '');
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

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
        setPermissions(res.data.permissions || []);
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
          return { ...p, [field]: !p[field] };
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

  // Nhóm các permissions theo group
  const groupedPermissions: Record<string, RolePermission[]> = {};
  permissions.forEach((p) => {
    const groupName = p.group || 'Khác';
    if (!groupedPermissions[groupName]) {
      groupedPermissions[groupName] = [];
    }
    groupedPermissions[groupName].push(p);
  });

  const selectedRole = roles.find((r) => r.id === selectedRoleId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Thanh lựa chọn vai trò & hành động */}
      <div
        className="card"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          padding: '1rem 1.25rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '13.5px', fontWeight: '600', color: '#374151' }}>
              Vai trò cần cấu hình:
            </span>
            <select
              className="input"
              style={{ width: '220px', fontWeight: '600', color: '#E53935' }}
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
            <span style={{ fontSize: '12.5px', color: '#6B7280' }}>
              Mô tả: {selectedRole.description || 'Không có mô tả'}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <button type="button" onClick={handleSelectAll} className="btn btn-secondary btn-sm">
            <CheckSquare size={14} />
            <span>Chọn tất cả</span>
          </button>
          <button type="button" onClick={handleDeselectAll} className="btn btn-secondary btn-sm">
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
            fontSize: '13px'
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
            fontSize: '13px'
          }}
        >
          <AlertCircle size={16} />
          <span>{saveError}</span>
        </div>
      )}

      {/* BẢNG MA TRẬN PHÂN QUYỀN 25 MODULES */}
      <div className="table-container">
        <table className="table-custom">
          <thead>
            <tr>
              <th className="table-th" style={{ width: '40%' }}>Phân hệ / Chức năng con</th>
              <th className="table-th" style={{ width: '10%', textAlign: 'center' }}>[XEM]</th>
              <th className="table-th" style={{ width: '10%', textAlign: 'center' }}>[THÊM]</th>
              <th className="table-th" style={{ width: '10%', textAlign: 'center' }}>[SỬA]</th>
              <th className="table-th" style={{ width: '10%', textAlign: 'center' }}>[XÓA]</th>
              <th className="table-th" style={{ width: '20%' }}>Phạm vi dữ liệu (Data Scope)</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#6B7280' }}>
                  Đang nạp ma trận phân quyền...
                </td>
              </tr>
            ) : (
              Object.entries(groupedPermissions).map(([groupName, items]) => (
                <React.Fragment key={groupName}>
                  {/* Dòng Header phân nhóm */}
                  <tr style={{ backgroundColor: '#F3F4F6' }}>
                    <td
                      colSpan={6}
                      style={{
                        padding: '0.5rem 1rem',
                        fontSize: '11.5px',
                        fontWeight: '700',
                        color: '#374151',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}
                    >
                      {groupName} ({items.length} chức năng)
                    </td>
                  </tr>

                  {/* Danh sách các chức năng trong nhóm */}
                  {items.map((item) => (
                    <tr key={item.moduleCode} className="table-tr">
                      <td className="table-td">
                        <div style={{ fontWeight: '600', color: '#111827' }}>
                          {item.moduleName || item.moduleCode}
                        </div>
                        <div style={{ fontSize: '11px', color: '#6B7280', fontFamily: 'monospace' }}>
                          {item.moduleCode}
                        </div>
                      </td>

                      {/* Checkbox Xem */}
                      <td className="table-td" style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#E53935' }}
                          checked={item.canRead}
                          onChange={() => handleToggle(item.moduleCode, 'canRead')}
                        />
                      </td>

                      {/* Checkbox Thêm */}
                      <td className="table-td" style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#E53935' }}
                          checked={item.canCreate}
                          onChange={() => handleToggle(item.moduleCode, 'canCreate')}
                        />
                      </td>

                      {/* Checkbox Sửa */}
                      <td className="table-td" style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#E53935' }}
                          checked={item.canUpdate}
                          onChange={() => handleToggle(item.moduleCode, 'canUpdate')}
                        />
                      </td>

                      {/* Checkbox Xóa */}
                      <td className="table-td" style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#E53935' }}
                          checked={item.canDelete}
                          onChange={() => handleToggle(item.moduleCode, 'canDelete')}
                        />
                      </td>

                      {/* Dropdown Data Scope */}
                      <td className="table-td">
                        <select
                          className="input"
                          style={{ fontSize: '12px', padding: '0.25rem 0.5rem', width: '100%' }}
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
                  ))}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
