import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, KeyRound, Edit2, Trash2, AlertCircle, ShieldAlert } from 'lucide-react';
import { api } from '../../services/api';
import { Role } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useTableResize } from '../../hooks/useTableResize';

interface RolesPageProps {
  onNavigateToPermissions: (roleId: string) => void;
}

export const RolesPage: React.FC<RolesPageProps> = ({ onNavigateToPermissions }) => {
  const { hasPermission } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  const defaultRoleWidths: Record<string, number> = {
    stt: 60,
    code: 140,
    name: 200,
    description: 260,
    type: 150,
    userCount: 120,
    createdAt: 120,
    actions: 170
  };

  const { columnWidths, startResize, getTableWidth } = useTableResize({
    tableKey: 'roles',
    defaultWidths: defaultRoleWidths,
    minWidth: 50,
    minWidths: { stt: 45, actions: 140 }
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: ''
  });

  const loadRoles = async () => {
    try {
      setLoading(true);
      const res = await api.get<Role[]>('/roles');
      setRoles(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const openAddModal = () => {
    setEditingRole(null);
    setFormData({ code: '', name: '', description: '' });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (r: Role) => {
    setEditingRole(r);
    setFormData({ code: r.code, name: r.name, description: r.description || '' });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      setFormError('Tên vai trò là bắt buộc');
      return;
    }
    if (!editingRole && !formData.code) {
      setFormError('Mã vai trò là bắt buộc');
      return;
    }

    try {
      if (editingRole) {
        await api.put(`/roles/${editingRole.id}`, {
          name: formData.name,
          description: formData.description
        });
      } else {
        await api.post('/roles', {
          code: formData.code.toUpperCase(),
          name: formData.name,
          description: formData.description
        });
      }
      setIsModalOpen(false);
      loadRoles();
    } catch (err: any) {
      setFormError(err.message || 'Lỗi khi lưu vai trò');
    }
  };

  const handleDelete = async (role: Role) => {
    if (role.isSystem) {
      alert('Không được phép xóa vai trò cốt lõi của hệ thống');
      return;
    }

    if (!window.confirm(`Bạn có chắc chắn muốn xóa vai trò '${role.name}'?`)) {
      return;
    }

    try {
      await api.delete(`/roles/${role.id}`);
      loadRoles();
    } catch (err: any) {
      alert(err.message || 'Lỗi xóa vai trò');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Header Card */}
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
        <div>
          <div style={{ fontWeight: '600', fontSize: '15px', color: '#111827' }}>
            Danh mục Chức danh & Vai trò Người dùng
          </div>
          <div style={{ fontSize: '12.5px', color: '#6B7280' }}>
            Quản lý các vai trò phân quyền chức năng và phạm vi xử lý dữ liệu trong hệ thống
          </div>
        </div>

        {hasPermission('A_ROLES', 'create') && (
          <button onClick={openAddModal} className="btn btn-primary">
            <Plus size={16} />
            <span>Thêm vai trò mới</span>
          </button>
        )}
      </div>

      {/* DataGrid Bảng Vai trò */}
      <div className="table-container shadow-sm border border-gray-100 rounded-xl overflow-x-auto">
        <table
          className="table-custom"
          style={{
            width: `${getTableWidth(Object.keys(defaultRoleWidths))}px`,
            minWidth: '100%',
            tableLayout: 'fixed',
            borderCollapse: 'separate',
            borderSpacing: 0
          }}
        >
          <thead className="bg-slate-50/90 border-b border-gray-200">
            <tr style={{ whiteSpace: 'nowrap' }}>
              <th className="table-th text-center select-none" style={{ width: `${columnWidths.stt || defaultRoleWidths.stt}px`, position: 'relative' }}>
                <span>STT</span>
                <div className="col-resizer" onMouseDown={(e) => startResize('stt', e)} onClick={(e) => e.stopPropagation()} title="Kéo để chỉnh độ rộng" />
              </th>
              <th className="table-th select-none" style={{ width: `${columnWidths.code || defaultRoleWidths.code}px`, position: 'relative' }}>
                <span>Mã vai trò</span>
                <div className="col-resizer" onMouseDown={(e) => startResize('code', e)} onClick={(e) => e.stopPropagation()} title="Kéo để chỉnh độ rộng" />
              </th>
              <th className="table-th select-none" style={{ width: `${columnWidths.name || defaultRoleWidths.name}px`, position: 'relative' }}>
                <span>Tên vai trò</span>
                <div className="col-resizer" onMouseDown={(e) => startResize('name', e)} onClick={(e) => e.stopPropagation()} title="Kéo để chỉnh độ rộng" />
              </th>
              <th className="table-th select-none" style={{ width: `${columnWidths.description || defaultRoleWidths.description}px`, position: 'relative' }}>
                <span>Mô tả nhiệm vụ</span>
                <div className="col-resizer" onMouseDown={(e) => startResize('description', e)} onClick={(e) => e.stopPropagation()} title="Kéo để chỉnh độ rộng" />
              </th>
              <th className="table-th select-none" style={{ width: `${columnWidths.type || defaultRoleWidths.type}px`, position: 'relative' }}>
                <span>Phân loại</span>
                <div className="col-resizer" onMouseDown={(e) => startResize('type', e)} onClick={(e) => e.stopPropagation()} title="Kéo để chỉnh độ rộng" />
              </th>
              <th className="table-th text-center select-none" style={{ width: `${columnWidths.userCount || defaultRoleWidths.userCount}px`, position: 'relative' }}>
                <span>Số nhân sự</span>
                <div className="col-resizer" onMouseDown={(e) => startResize('userCount', e)} onClick={(e) => e.stopPropagation()} title="Kéo để chỉnh độ rộng" />
              </th>
              <th className="table-th select-none" style={{ width: `${columnWidths.createdAt || defaultRoleWidths.createdAt}px`, position: 'relative' }}>
                <span>Ngày tạo</span>
                <div className="col-resizer" onMouseDown={(e) => startResize('createdAt', e)} onClick={(e) => e.stopPropagation()} title="Kéo để chỉnh độ rộng" />
              </th>
              <th className="table-th sticky-action-th" style={{ width: `${columnWidths.actions || defaultRoleWidths.actions}px`, textAlign: 'right' }}>
                <span>Thao tác</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: '#6B7280' }}>
                  Đang tải danh mục vai trò...
                </td>
              </tr>
            ) : (
              roles.map((r, index) => (
                <tr key={r.id} className="table-tr">
                  <td className="table-td text-center text-xs text-gray-500 font-mono overflow-hidden">{index + 1}</td>
                  <td className="table-td whitespace-nowrap overflow-hidden">
                    <span className="font-semibold text-xs text-[#E53935] font-mono">
                      {r.code}
                    </span>
                  </td>
                  <td className="table-td overflow-hidden">
                    <span className="font-semibold text-xs text-gray-900 truncate block" title={r.name}>
                      {r.name}
                    </span>
                  </td>
                  <td className="table-td text-xs text-gray-600 overflow-hidden">
                    <div className="truncate max-w-full" title={r.description || '—'}>
                      {r.description || '—'}
                    </div>
                  </td>
                  <td className="table-td whitespace-nowrap overflow-hidden">
                    {r.isSystem ? (
                      <span className="badge badge-purple" style={{ whiteSpace: 'nowrap' }}>
                        <ShieldCheck size={11} />
                        Hệ thống mặc định
                      </span>
                    ) : (
                      <span className="badge badge-blue" style={{ whiteSpace: 'nowrap' }}>Tùy biến</span>
                    )}
                  </td>
                  <td className="table-td text-center text-xs font-semibold text-gray-700 whitespace-nowrap overflow-hidden">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-700">
                      {r._count?.userRoles || 0} người
                    </span>
                  </td>
                  <td className="table-td text-xs text-gray-500 font-mono whitespace-nowrap overflow-hidden">
                    {new Date(r.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="table-td sticky-action-td whitespace-nowrap overflow-hidden" style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.375rem' }}>
                      <button
                        onClick={() => onNavigateToPermissions(r.id)}
                        className="btn btn-secondary btn-sm"
                        style={{ color: '#E53935' }}
                        title="Thiết lập ma trận phân quyền"
                      >
                        <KeyRound size={13} />
                        <span>Phân quyền</span>
                      </button>

                      {hasPermission('A_ROLES', 'update') && (
                        <button
                          onClick={() => openEditModal(r)}
                          className="btn btn-secondary btn-sm"
                          title="Sửa"
                        >
                          <Edit2 size={13} />
                        </button>
                      )}

                      {hasPermission('A_ROLES', 'delete') && !r.isSystem && (
                        <button
                          onClick={() => handleDelete(r)}
                          className="btn btn-secondary btn-sm"
                          style={{ color: '#DC2626' }}
                          title="Xóa"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL THÊM / SỬA VAI TRÒ */}
      {isModalOpen && (
        <div className="modal-overlay fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="modal-content bg-white rounded-xl shadow-2xl w-full relative z-[1001] max-h-[90vh] overflow-y-auto" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#111827' }}>
                {editingRole ? `Chỉnh sửa vai trò: ${editingRole.name}` : 'Thêm mới vai trò chức danh'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {formError && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      backgroundColor: '#FEE2E2',
                      color: '#B91C1C',
                      padding: '0.625rem 0.75rem',
                      borderRadius: '0.375rem',
                      fontSize: '13px'
                    }}
                  >
                    <AlertCircle size={15} style={{ flexShrink: 0 }} />
                    <span>{formError}</span>
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '0.25rem' }}>
                    Mã vai trò (IN HOA không dấu) *
                  </label>
                  <input
                    type="text"
                    disabled={Boolean(editingRole)}
                    className="input"
                    placeholder="VD: MARKETING_LEAD"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  />
                  {editingRole && (
                    <span style={{ fontSize: '11px', color: '#6B7280', marginTop: '0.25rem', display: 'block' }}>
                      Mã vai trò không thể thay đổi sau khi tạo
                    </span>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '0.25rem' }}>
                    Tên vai trò hiển thị *
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="VD: Trưởng nhóm Tiếp thị"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '0.25rem' }}>
                    Mô tả chức năng & quyền hạn
                  </label>
                  <textarea
                    className="input"
                    rows={3}
                    placeholder="Mô tả tóm tắt quyền hạn chính của vai trò..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Hủy bỏ
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingRole ? 'Lưu thay đổi' : 'Tạo vai trò'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
