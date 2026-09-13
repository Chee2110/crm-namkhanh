import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Edit2,
  Lock,
  Unlock,
  Building,
  UserCheck,
  Calendar,
  AlertCircle,
  Eye,
  EyeOff,
  Columns,
  RotateCcw
} from 'lucide-react';
import { api } from '../../services/api';
import { User, Department, Role } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const UsersPage: React.FC = () => {
  const { hasPermission, canViewSalary } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  // Cấu hình ẩn / hiện cột
  const defaultVisibleCols: Record<string, boolean> = {
    stt: true,
    code: true,
    fullName: true,
    contact: true,
    department: true,
    manager: true,
    role: true,
    basicSalary: true,
    allowance: true,
    status: true,
    startDate: true,
    actions: true
  };

  const columnLabels: Record<string, string> = {
    stt: 'STT',
    code: 'Mã NV',
    fullName: 'Họ và tên',
    contact: 'Liên hệ (SĐT / Gmail)',
    department: 'Đơn vị phòng ban',
    manager: 'Quản lý trực tiếp',
    role: 'Vai trò',
    basicSalary: 'Lương cơ bản',
    allowance: 'Phụ cấp',
    status: 'Trạng thái',
    startDate: 'Ngày vào cty',
    actions: 'Thao tác'
  };

  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('namkhanh_users_visible_cols');
      return saved ? JSON.parse(saved) : defaultVisibleCols;
    } catch {
      return defaultVisibleCols;
    }
  });

  const [isColumnDropdownOpen, setIsColumnDropdownOpen] = useState(false);

  const toggleColumnVisibility = (colKey: string) => {
    const updated = { ...visibleColumns, [colKey]: !visibleColumns[colKey] };
    setVisibleColumns(updated);
    try {
      localStorage.setItem('namkhanh_users_visible_cols', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const resetColumns = () => {
    setVisibleColumns(defaultVisibleCols);
    try {
      localStorage.setItem('namkhanh_users_visible_cols', JSON.stringify(defaultVisibleCols));
    } catch (e) {
      console.error(e);
    }
  };

  // Filters
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'contract' | 'salary'>('personal');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Data
  const [formData, setFormData] = useState({
    code: '',
    fullName: '',
    email: '',
    phone: '',
    password: '',
    dob: '',
    departmentId: '',
    managerId: '',
    roleIds: [] as string[],
    basicSalary: '',
    allowance: '',
    startDate: '',
    status: 'ACTIVE'
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        page: page.toString(),
        pageSize: '20',
        ...(search ? { search } : {}),
        ...(departmentFilter ? { departmentId: departmentFilter } : {}),
        ...(roleFilter ? { roleId: roleFilter } : {}),
        ...(statusFilter ? { status: statusFilter } : {})
      });

      const [resUsers, resDepts, resRoles] = await Promise.all([
        api.get<User[]>(`/users?${query.toString()}`),
        api.get<Department[]>('/departments?format=flat'),
        api.get<Role[]>('/roles')
      ]);

      setUsers(resUsers.data || []);
      setTotal(resUsers.meta?.total || 0);
      setDepartments(resDepts.data || []);
      setRoles(resRoles.data || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, search, departmentFilter, roleFilter, statusFilter]);

  const openAddModal = () => {
    setEditingUser(null);
    setFormData({
      code: `NV${String(total + 1).padStart(3, '0')}`,
      fullName: '',
      email: '',
      phone: '',
      password: '123456',
      dob: '',
      departmentId: '',
      managerId: '',
      roleIds: roles.length > 0 ? [roles.find((r) => r.code === 'SALES')?.id || roles[0].id] : [],
      basicSalary: '',
      allowance: '',
      startDate: new Date().toISOString().split('T')[0],
      status: 'ACTIVE'
    });
    setActiveTab('personal');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (u: User) => {
    setEditingUser(u);
    setFormData({
      code: u.code,
      fullName: u.fullName,
      email: u.email,
      phone: u.phone || '',
      password: '',
      dob: u.dob ? u.dob.split('T')[0] : '',
      departmentId: u.departmentId || '',
      managerId: u.managerId || '',
      roleIds: u.roles.map((r) => r.id),
      basicSalary: u.basicSalary ? u.basicSalary.toString() : '',
      allowance: u.allowance ? u.allowance.toString() : '',
      startDate: u.startDate ? u.startDate.split('T')[0] : '',
      status: u.status
    });
    setActiveTab('personal');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.fullName || !formData.email) {
      setFormError('Mã nhân viên, Họ tên và Email là bắt buộc');
      return;
    }

    try {
      const payload: any = {
        ...formData,
        departmentId: formData.departmentId || null,
        managerId: formData.managerId || null,
        basicSalary: formData.basicSalary ? Number(formData.basicSalary) : null,
        allowance: formData.allowance ? Number(formData.allowance) : null
      };

      if (editingUser) {
        if (!formData.password) delete payload.password;
        await api.put(`/users/${editingUser.id}`, payload);
      } else {
        await api.post('/users', payload);
      }

      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Lỗi khi lưu thông tin người dùng');
    }
  };

  const handleToggleStatus = async (user: User) => {
    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const actionText = newStatus === 'ACTIVE' ? 'mở khóa hoạt động' : 'tạm ngừng hoạt động';

    if (!window.confirm(`Bạn có chắc chắn muốn ${actionText} cho tài khoản ${user.fullName} (${user.code})?`)) {
      return;
    }

    try {
      await api.patch(`/users/${user.id}/status`, { status: newStatus });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi cập nhật trạng thái');
    }
  };

  const formatCurrency = (amount?: number | null) => {
    if (amount === undefined || amount === null) return '—';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Thanh công cụ tìm kiếm và lọc */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', flex: 1 }}>
          <div style={{ position: 'relative', width: '260px' }}>
            <Search size={16} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '0.75rem', color: '#9CA3AF' }} />
            <input
              type="text"
              placeholder="Tìm họ tên, email, SĐT, mã..."
              className="input"
              style={{ paddingLeft: '2.25rem' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="input"
            style={{ width: '180px' }}
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
          >
            <option value="">-- Tất cả phòng ban --</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.code})
              </option>
            ))}
          </select>

          <select
            className="input"
            style={{ width: '160px' }}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">-- Tất cả vai trò --</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          <select
            className="input"
            style={{ width: '160px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">-- Trạng thái --</option>
            <option value="ACTIVE">Đang làm việc</option>
            <option value="INACTIVE">Ngừng làm việc</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Menu ẩn/hiện cột */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setIsColumnDropdownOpen(!isColumnDropdownOpen)}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '13px', cursor: 'pointer' }}
              title="Tùy biến hiển thị các cột trên bảng"
            >
              <Columns size={15} />
              <span>Tùy chỉnh cột</span>
            </button>

            {isColumnDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  marginTop: '0.5rem',
                  width: '240px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '0.75rem',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                  border: '1px solid #E5E7EB',
                  padding: '0.75rem',
                  zIndex: 40
                }}
              >
                <div
                  style={{
                    fontWeight: '700',
                    color: '#1F2937',
                    paddingBottom: '0.5rem',
                    borderBottom: '1px solid #F3F4F6',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '12px'
                  }}
                >
                  <span>Cột hiển thị</span>
                  <button
                    onClick={resetColumns}
                    style={{
                      color: '#E53935',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontWeight: '500',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '11px'
                    }}
                  >
                    <RotateCcw size={12} />
                    <span>Mặc định</span>
                  </button>
                </div>
                <div style={{ maxHeight: '240px', overflowY: 'auto', marginTop: '0.5rem' }}>
                  {Object.keys(columnLabels)
                    .filter((key) => canViewSalary || (key !== 'basicSalary' && key !== 'allowance'))
                    .map((key) => (
                      <label
                        key={key}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={visibleColumns[key] ?? true}
                          onChange={() => toggleColumnVisibility(key)}
                          disabled={key === 'fullName'}
                        />
                        <span>{columnLabels[key]}</span>
                      </label>
                    ))}
                </div>
              </div>
            )}
          </div>

          {hasPermission('A_USERS', 'create') && (
            <button onClick={openAddModal} className="btn btn-primary" style={{ cursor: 'pointer' }}>
              <Plus size={16} />
              <span>Thêm mới nhân sự</span>
            </button>
          )}
        </div>
      </div>

      {/* Thông báo quyền xem lương nếu có */}
      {canViewSalary && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: '#EFF6FF',
            border: '1px solid #BFDBFE',
            color: '#1D4ED8',
            padding: '0.625rem 1rem',
            borderRadius: '0.5rem',
            fontSize: '13px'
          }}
        >
          <Eye size={16} />
          <span>
            Bạn đang đăng nhập với quyền <strong>Ban Giám Đốc / Admin</strong>: Các cột và trường Lương cơ bản & Phụ cấp được hiển thị đầy đủ.
          </span>
        </div>
      )}

      {/* DataGrid Bảng Nhân sự */}
      <div className="table-container">
        <table className="table-custom">
          <thead>
            <tr>
              {visibleColumns.stt && <th className="table-th" style={{ width: '50px' }}>STT</th>}
              {visibleColumns.code && <th className="table-th">Mã NV</th>}
              {visibleColumns.fullName && <th className="table-th">Họ và tên</th>}
              {visibleColumns.contact && <th className="table-th">Liên hệ (SĐT / Gmail)</th>}
              {visibleColumns.department && <th className="table-th">Đơn vị phòng ban</th>}
              {visibleColumns.manager && <th className="table-th">Quản lý trực tiếp</th>}
              {visibleColumns.role && <th className="table-th">Vai trò</th>}
              {canViewSalary && visibleColumns.basicSalary && <th className="table-th">Lương cơ bản</th>}
              {canViewSalary && visibleColumns.allowance && <th className="table-th">Phụ cấp</th>}
              {visibleColumns.status && <th className="table-th">Trạng thái</th>}
              {visibleColumns.startDate && <th className="table-th">Ngày vào cty</th>}
              {visibleColumns.actions && <th className="table-th" style={{ textAlign: 'right' }}>Thao tác</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={
                    Object.entries(visibleColumns).filter(([k, v]) => {
                      if (!v) return false;
                      if ((k === 'basicSalary' || k === 'allowance') && !canViewSalary) return false;
                      return true;
                    }).length || 10
                  }
                  style={{ textAlign: 'center', padding: '3rem', color: '#6B7280' }}
                >
                  Đang tải danh sách nhân sự...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td
                  colSpan={
                    Object.entries(visibleColumns).filter(([k, v]) => {
                      if (!v) return false;
                      if ((k === 'basicSalary' || k === 'allowance') && !canViewSalary) return false;
                      return true;
                    }).length || 10
                  }
                  style={{ textAlign: 'center', padding: '2rem', color: '#9CA3AF' }}
                >
                  Không tìm thấy nhân sự nào phù hợp
                </td>
              </tr>
            ) : (
              users.map((u, index) => (
                <tr key={u.id} className="table-tr">
                  {visibleColumns.stt && <td className="table-td" style={{ fontWeight: '500' }}>{index + 1}</td>}
                  {visibleColumns.code && (
                    <td className="table-td">
                      <span style={{ fontWeight: '600', color: '#E53935' }}>{u.code}</span>
                    </td>
                  )}
                  {visibleColumns.fullName && (
                    <td className="table-td">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '9999px',
                            backgroundColor: '#E53935',
                            color: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}
                        >
                          {u.fullName.charAt(0)}
                        </div>
                        <span style={{ fontWeight: '600', color: '#111827' }}>{u.fullName}</span>
                      </div>
                    </td>
                  )}
                  {visibleColumns.contact && (
                    <td className="table-td">
                      <div style={{ fontSize: '13px', fontWeight: '500' }}>{u.phone || '—'}</div>
                      <div style={{ fontSize: '11px', color: '#6B7280' }}>{u.email}</div>
                    </td>
                  )}
                  {visibleColumns.department && (
                    <td className="table-td">
                      {u.department ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Building size={13} color="#6B7280" />
                          {u.department.name}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                  )}
                  {visibleColumns.manager && (
                    <td className="table-td">
                      {u.manager ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <UserCheck size={13} color="#16A34A" />
                          {u.manager.fullName}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                  )}
                  {visibleColumns.role && (
                    <td className="table-td">
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                        {u.roles.map((r) => (
                          <span key={r.id} className="badge badge-purple" style={{ fontSize: '11px' }}>
                            {r.name}
                          </span>
                        ))}
                      </div>
                    </td>
                  )}

                  {/* Bảo mật lương: Chỉ hiện với Admin/CEO */}
                  {canViewSalary && visibleColumns.basicSalary && (
                    <td className="table-td" style={{ fontWeight: '600', color: '#16A34A' }}>
                      {formatCurrency(u.basicSalary)}
                    </td>
                  )}
                  {canViewSalary && visibleColumns.allowance && (
                    <td className="table-td" style={{ color: '#4B5563' }}>
                      {formatCurrency(u.allowance)}
                    </td>
                  )}

                  {visibleColumns.status && (
                    <td className="table-td">
                      <span className={`badge ${u.status === 'ACTIVE' ? 'badge-green' : 'badge-red'}`}>
                        {u.status === 'ACTIVE' ? 'Đang làm việc' : 'Ngừng làm việc'}
                      </span>
                    </td>
                  )}
                  {visibleColumns.startDate && (
                    <td className="table-td" style={{ fontSize: '12.5px', color: '#6B7280' }}>
                      {u.startDate ? new Date(u.startDate).toLocaleDateString('vi-VN') : '—'}
                    </td>
                  )}
                  {visibleColumns.actions && (
                    <td className="table-td" style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.25rem' }}>
                        {hasPermission('A_USERS', 'update') && (
                          <button
                            onClick={() => openEditModal(u)}
                            className="btn btn-secondary btn-sm"
                            title="Chỉnh sửa thông tin"
                          >
                            <Edit2 size={13} />
                          </button>
                        )}
                        {hasPermission('A_USERS', 'update') && (
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className="btn btn-secondary btn-sm"
                            style={{ color: u.status === 'ACTIVE' ? '#DC2626' : '#16A34A' }}
                            title={u.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Kích hoạt lại'}
                          >
                            {u.status === 'ACTIVE' ? <Lock size={13} /> : <Unlock size={13} />}
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL THÊM / SỬA NHÂN SỰ VỚI 3 TABS QUY CHUẨN */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '720px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#111827' }}>
                {editingUser ? `Chỉnh sửa nhân sự: ${editingUser.fullName}` : 'Thêm mới nhân viên'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}
              >
                ✕
              </button>
            </div>

            {/* Tab Header Navigation */}
            <div
              style={{
                display: 'flex',
                borderBottom: '1px solid #E5E7EB',
                padding: '0 1.5rem',
                backgroundColor: '#FAFAFA'
              }}
            >
              <button
                type="button"
                onClick={() => setActiveTab('personal')}
                style={{
                  padding: '0.75rem 1rem',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontWeight: activeTab === 'personal' ? '600' : '400',
                  color: activeTab === 'personal' ? '#E53935' : '#6B7280',
                  borderBottom: activeTab === 'personal' ? '2px solid #E53935' : '2px solid transparent',
                  fontSize: '13.5px'
                }}
              >
                1. Thông tin cá nhân
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('contract')}
                style={{
                  padding: '0.75rem 1rem',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontWeight: activeTab === 'contract' ? '600' : '400',
                  color: activeTab === 'contract' ? '#E53935' : '#6B7280',
                  borderBottom: activeTab === 'contract' ? '2px solid #E53935' : '2px solid transparent',
                  fontSize: '13.5px'
                }}
              >
                2. Hợp đồng & Tổ chức
              </button>
              {canViewSalary && (
                <button
                  type="button"
                  onClick={() => setActiveTab('salary')}
                  style={{
                    padding: '0.75rem 1rem',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontWeight: activeTab === 'salary' ? '600' : '400',
                    color: activeTab === 'salary' ? '#E53935' : '#6B7280',
                    borderBottom: activeTab === 'salary' ? '2px solid #E53935' : '2px solid transparent',
                    fontSize: '13.5px'
                  }}
                >
                  3. Mức lương & Phụ cấp 🔒
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ minHeight: '260px' }}>
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
                      fontSize: '13px',
                      marginBottom: '1rem'
                    }}
                  >
                    <AlertCircle size={15} style={{ flexShrink: 0 }} />
                    <span>{formError}</span>
                  </div>
                )}

                {/* TAB 1: THÔNG TIN CÁ NHÂN */}
                {activeTab === 'personal' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '0.25rem' }}>
                          Mã nhân viên *
                        </label>
                        <input
                          type="text"
                          className="input"
                          placeholder="VD: NV007"
                          value={formData.code}
                          onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '0.25rem' }}>
                          Họ và tên *
                        </label>
                        <input
                          type="text"
                          className="input"
                          placeholder="VD: Nguyễn Văn A"
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '0.25rem' }}>
                          Gmail hệ thống *
                        </label>
                        <input
                          type="email"
                          className="input"
                          placeholder="ten.nv@namkhanh.vn"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '0.25rem' }}>
                          Số điện thoại
                        </label>
                        <input
                          type="text"
                          className="input"
                          placeholder="0912345678"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '0.25rem' }}>
                          Ngày sinh
                        </label>
                        <input
                          type="date"
                          className="input"
                          value={formData.dob}
                          onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '0.25rem' }}>
                          {editingUser ? 'Mật khẩu mới (Để trống nếu không đổi)' : 'Mật khẩu khởi tạo'}
                        </label>
                        <input
                          type="password"
                          className="input"
                          placeholder={editingUser ? '••••••••' : 'Mặc định: 123456'}
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: HỢP ĐỒNG & TỔ CHỨC */}
                {activeTab === 'contract' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '0.25rem' }}>
                          Đơn vị phòng ban
                        </label>
                        <select
                          className="input"
                          value={formData.departmentId}
                          onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                        >
                          <option value="">-- Chưa gán phòng ban --</option>
                          {departments.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name} ({d.code})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '0.25rem' }}>
                          Quản lý trực tiếp
                        </label>
                        <select
                          className="input"
                          value={formData.managerId}
                          onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                        >
                          <option value="">-- Không có --</option>
                          {users
                            .filter((u) => !editingUser || u.id !== editingUser.id)
                            .map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.fullName} ({u.code})
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '0.25rem' }}>
                        Vai trò chức danh (Có thể chọn vai trò chính)
                      </label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
                        {roles.map((r) => {
                          const isChecked = formData.roleIds.includes(r.id);
                          return (
                            <label
                              key={r.id}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.375rem',
                                padding: '0.375rem 0.75rem',
                                borderRadius: '0.375rem',
                                border: `1px solid ${isChecked ? '#E53935' : '#E5E7EB'}`,
                                backgroundColor: isChecked ? '#FFEBEE' : '#FFFFFF',
                                color: isChecked ? '#C62828' : '#374151',
                                cursor: 'pointer',
                                fontSize: '13px'
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFormData({ ...formData, roleIds: [...formData.roleIds, r.id] });
                                  } else {
                                    setFormData({
                                      ...formData,
                                      roleIds: formData.roleIds.filter((id) => id !== r.id)
                                    });
                                  }
                                }}
                              />
                              <span>{r.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '0.25rem' }}>
                          Ngày vào công ty
                        </label>
                        <input
                          type="date"
                          className="input"
                          value={formData.startDate}
                          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '0.25rem' }}>
                          Trạng thái làm việc
                        </label>
                        <select
                          className="input"
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        >
                          <option value="ACTIVE">Đang làm việc</option>
                          <option value="INACTIVE">Ngừng làm việc (Khóa quyền truy cập)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: MỨC LƯƠNG & PHỤ CẤP (BẢO MẬT) */}
                {activeTab === 'salary' && canViewSalary && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div
                      style={{
                        padding: '0.75rem 1rem',
                        backgroundColor: '#FEF9C3',
                        border: '1px solid #FDE047',
                        borderRadius: '0.5rem',
                        fontSize: '12.5px',
                        color: '#854D0E'
                      }}
                    >
                      ⚠️ <strong>Bảo mật thông tin nhân sự:</strong> Mức lương cơ bản và phụ cấp chỉ được hiển thị và chỉnh sửa bởi Quản trị viên (Admin) và Tổng Giám Đốc (CEO).
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '0.25rem' }}>
                          Lương cơ bản (VNĐ)
                        </label>
                        <input
                          type="number"
                          className="input"
                          placeholder="VD: 15000000"
                          value={formData.basicSalary}
                          onChange={(e) => setFormData({ ...formData, basicSalary: e.target.value })}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '0.25rem' }}>
                          Phụ cấp trách nhiệm / ăn trưa (VNĐ)
                        </label>
                        <input
                          type="number"
                          className="input"
                          placeholder="VD: 2500000"
                          value={formData.allowance}
                          onChange={(e) => setFormData({ ...formData, allowance: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}
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
                  {editingUser ? 'Lưu thay đổi' : 'Tạo nhân sự'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
