import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Search,
  List,
  GitFork,
  Edit2,
  Trash2,
  ChevronRight,
  ChevronDown,
  UserCheck,
  MapPin,
  AlertCircle
} from 'lucide-react';
import { api } from '../../services/api';
import { Department, User } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const DepartmentsPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const [departmentsTree, setDepartmentsTree] = useState<Department[]>([]);
  const [departmentsFlat, setDepartmentsFlat] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'tree' | 'table'>('tree');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    parentId: '',
    managerId: '',
    address: '',
    mission: '',
    status: 'ACTIVE'
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [resTree, resFlat, resUsers] = await Promise.all([
        api.get<Department[]>(`/departments?format=tree&status=${statusFilter}&search=${search}`),
        api.get<Department[]>(`/departments?format=flat`),
        api.get<User[]>(`/users?pageSize=100`)
      ]);
      setDepartmentsTree(resTree.data || []);
      setDepartmentsFlat(resFlat.data || []);
      setUsers(resUsers.data || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, search]);

  const openAddModal = (parentId?: string) => {
    setEditingDept(null);
    setFormData({
      code: '',
      name: '',
      parentId: parentId || '',
      managerId: '',
      address: '',
      mission: '',
      status: 'ACTIVE'
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (dept: Department) => {
    setEditingDept(dept);
    setFormData({
      code: dept.code,
      name: dept.name,
      parentId: dept.parentId || '',
      managerId: dept.managerId || '',
      address: dept.address || '',
      mission: dept.mission || '',
      status: dept.status
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.name) {
      setFormError('Mã đơn vị và Tên đơn vị là bắt buộc');
      return;
    }

    try {
      if (editingDept) {
        await api.put(`/departments/${editingDept.id}`, {
          ...formData,
          parentId: formData.parentId || null,
          managerId: formData.managerId || null
        });
      } else {
        await api.post('/departments', {
          ...formData,
          parentId: formData.parentId || null,
          managerId: formData.managerId || null
        });
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Lỗi khi lưu thông tin đơn vị');
    }
  };

  const handleDelete = async (dept: Department) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa đơn vị '${dept.name}' (${dept.code})?`)) {
      return;
    }

    try {
      await api.delete(`/departments/${dept.id}`);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xóa đơn vị');
    }
  };

  // Node Component hiển thị Cây phân cấp
  const TreeNode: React.FC<{ dept: Department; level?: number }> = ({ dept, level = 0 }) => {
    const [expanded, setExpanded] = useState(true);
    const hasChildren = dept.children && dept.children.length > 0;

    return (
      <div style={{ marginLeft: `${level * 24}px`, marginTop: '0.5rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem 1rem',
            backgroundColor: '#FFFFFF',
            borderRadius: '0.5rem',
            border: '1px solid #E5E7EB',
            borderLeft: `4px solid ${level === 0 ? '#E53935' : level === 1 ? '#1E88E5' : '#43A047'}`,
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            {hasChildren ? (
              <button
                onClick={() => setExpanded(!expanded)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  color: '#6B7280'
                }}
              >
                {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              </button>
            ) : (
              <div style={{ width: '18px' }} />
            )}

            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: level === 0 ? '#FFEBEE' : '#F3F4F6',
                color: level === 0 ? '#E53935' : '#4B5563',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Building2 size={18} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontWeight: '600', fontSize: '14px', color: '#111827' }}>
                  {dept.name}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#6B7280',
                    backgroundColor: '#F3F4F6',
                    padding: '0.1rem 0.35rem',
                    borderRadius: '4px'
                  }}
                >
                  {dept.code}
                </span>
                <span
                  className={`badge ${
                    dept.status === 'ACTIVE'
                      ? 'badge-green'
                      : dept.status === 'SUSPENDED'
                      ? 'badge-yellow'
                      : 'badge-red'
                  }`}
                >
                  {dept.status === 'ACTIVE'
                    ? 'Đang hoạt động'
                    : dept.status === 'SUSPENDED'
                    ? 'Tạm ngừng'
                    : 'Ngừng hoạt động'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.25rem', fontSize: '12px', color: '#6B7280' }}>
                {dept.manager && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <UserCheck size={13} color="#16A34A" />
                    Trưởng bộ phận: <strong>{dept.manager.fullName}</strong>
                  </span>
                )}
                {dept.address && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <MapPin size={13} color="#9CA3AF" />
                    {dept.address}
                  </span>
                )}
                {dept._count && (
                  <span>
                    Nhân sự: <strong>{dept._count.staff}</strong> người
                  </span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            {hasPermission('A_DEPARTMENTS', 'create') && (
              <button
                onClick={() => openAddModal(dept.id)}
                className="btn btn-secondary btn-sm"
                title="Thêm phòng ban con trực thuộc"
              >
                <Plus size={14} />
                <span>Thêm con</span>
              </button>
            )}
            {hasPermission('A_DEPARTMENTS', 'update') && (
              <button
                onClick={() => openEditModal(dept)}
                className="btn btn-secondary btn-sm"
                title="Chỉnh sửa đơn vị"
              >
                <Edit2 size={14} />
              </button>
            )}
            {hasPermission('A_DEPARTMENTS', 'delete') && (
              <button
                onClick={() => handleDelete(dept)}
                className="btn btn-secondary btn-sm"
                style={{ color: '#DC2626' }}
                title="Xóa đơn vị"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>

        {hasChildren && expanded && (
          <div>
            {dept.children!.map((child) => (
              <TreeNode key={child.id} dept={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '280px' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '320px' }}>
            <Search size={16} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '0.75rem', color: '#9CA3AF' }} />
            <input
              type="text"
              placeholder="Tìm kiếm mã, tên phòng ban..."
              className="input"
              style={{ paddingLeft: '2.25rem' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="input"
            style={{ width: '180px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">-- Tất cả trạng thái --</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="SUSPENDED">Tạm ngừng hoạt động</option>
            <option value="INACTIVE">Ngừng hoạt động</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Chuyển đổi Cây thư mục / Bảng */}
          <div
            style={{
              display: 'flex',
              backgroundColor: '#F3F4F6',
              borderRadius: '0.5rem',
              padding: '2px'
            }}
          >
            <button
              onClick={() => setViewMode('tree')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.375rem 0.75rem',
                borderRadius: '0.375rem',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12.5px',
                fontWeight: viewMode === 'tree' ? '600' : '400',
                backgroundColor: viewMode === 'tree' ? '#FFFFFF' : 'transparent',
                color: viewMode === 'tree' ? '#E53935' : '#6B7280',
                boxShadow: viewMode === 'tree' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              <GitFork size={14} />
              <span>Dạng cây</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.375rem 0.75rem',
                borderRadius: '0.375rem',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12.5px',
                fontWeight: viewMode === 'table' ? '600' : '400',
                backgroundColor: viewMode === 'table' ? '#FFFFFF' : 'transparent',
                color: viewMode === 'table' ? '#E53935' : '#6B7280',
                boxShadow: viewMode === 'table' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              <List size={14} />
              <span>Dạng bảng</span>
            </button>
          </div>

          {hasPermission('A_DEPARTMENTS', 'create') && (
            <button onClick={() => openAddModal()} className="btn btn-primary">
              <Plus size={16} />
              <span>Thêm mới đơn vị</span>
            </button>
          )}
        </div>
      </div>

      {/* Nội dung hiển thị */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6B7280' }}>
          Đang tải dữ liệu cơ cấu tổ chức...
        </div>
      ) : viewMode === 'tree' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {departmentsTree.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem', color: '#6B7280' }}>
              Chưa có đơn vị phòng ban nào phù hợp.
            </div>
          ) : (
            departmentsTree.map((dept) => <TreeNode key={dept.id} dept={dept} level={0} />)
          )}
        </div>
      ) : (
        /* DataGrid Bảng danh sách */
        <div className="table-container">
          <table className="table-custom">
            <thead>
              <tr>
                <th className="table-th" style={{ width: '60px' }}>STT</th>
                <th className="table-th">Mã đơn vị</th>
                <th className="table-th">Tên đơn vị</th>
                <th className="table-th">Trực thuộc</th>
                <th className="table-th">Trưởng bộ phận</th>
                <th className="table-th">Địa chỉ</th>
                <th className="table-th">Nhiệm vụ</th>
                <th className="table-th">Trạng thái</th>
                <th className="table-th" style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {departmentsFlat.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: '#9CA3AF' }}>
                    Không tìm thấy bản ghi nào
                  </td>
                </tr>
              ) : (
                departmentsFlat.map((d, index) => (
                  <tr key={d.id} className="table-tr">
                    <td className="table-td" style={{ fontWeight: '500' }}>{index + 1}</td>
                    <td className="table-td">
                      <span style={{ fontWeight: '600', color: '#E53935' }}>{d.code}</span>
                    </td>
                    <td className="table-td" style={{ fontWeight: '600' }}>{d.name}</td>
                    <td className="table-td">{d.parent?.name || '— (Đơn vị gốc)'}</td>
                    <td className="table-td">{d.manager?.fullName || '—'}</td>
                    <td className="table-td">{d.address || '—'}</td>
                    <td className="table-td" style={{ maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {d.mission || '—'}
                    </td>
                    <td className="table-td">
                      <span
                        className={`badge ${
                          d.status === 'ACTIVE'
                            ? 'badge-green'
                            : d.status === 'SUSPENDED'
                            ? 'badge-yellow'
                            : 'badge-red'
                        }`}
                      >
                        {d.status === 'ACTIVE' ? 'Đang hoạt động' : d.status === 'SUSPENDED' ? 'Tạm ngừng' : 'Ngừng hoạt động'}
                      </span>
                    </td>
                    <td className="table-td" style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.25rem' }}>
                        {hasPermission('A_DEPARTMENTS', 'update') && (
                          <button
                            onClick={() => openEditModal(d)}
                            className="btn btn-secondary btn-sm"
                            title="Sửa"
                          >
                            <Edit2 size={13} />
                          </button>
                        )}
                        {hasPermission('A_DEPARTMENTS', 'delete') && (
                          <button
                            onClick={() => handleDelete(d)}
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
      )}

      {/* MODAL THÊM / SỬA ĐƠN VỊ */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#111827' }}>
                {editingDept ? `Chỉnh sửa đơn vị: ${editingDept.name}` : 'Thêm mới đơn vị phòng ban'}
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '0.25rem' }}>
                      Mã đơn vị *
                    </label>
                    <input
                      type="text"
                      className="input"
                      placeholder="VD: PKD1"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '0.25rem' }}>
                      Tên đơn vị *
                    </label>
                    <input
                      type="text"
                      className="input"
                      placeholder="VD: Phòng Kinh Doanh 1"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '0.25rem' }}>
                    Đơn vị cấp trên (Trực thuộc)
                  </label>
                  <select
                    className="input"
                    value={formData.parentId}
                    onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                  >
                    <option value="">-- Không có (Đơn vị cấp cao nhất) --</option>
                    {departmentsFlat
                      .filter((d) => !editingDept || d.id !== editingDept.id)
                      .map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.code})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '0.25rem' }}>
                    Trưởng bộ phận
                  </label>
                  <select
                    className="input"
                    value={formData.managerId}
                    onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                  >
                    <option value="">-- Chưa chỉ định --</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} ({u.code}) - {u.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '0.25rem' }}>
                    Địa chỉ / Vị trí làm việc
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="VD: Tầng 3 - Tòa nhà Nam Khánh, Cụm kho Gia Lâm..."
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '0.25rem' }}>
                    Chức năng nhiệm vụ
                  </label>
                  <textarea
                    className="input"
                    rows={3}
                    placeholder="VD: Cung ứng văn phòng phẩm trọn gói cho doanh nghiệp, điều phối kho giấy in..."
                    value={formData.mission}
                    onChange={(e) => setFormData({ ...formData, mission: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '0.25rem' }}>
                    Trạng thái hoạt động
                  </label>
                  <select
                    className="input"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="ACTIVE">Đang hoạt động</option>
                    <option value="SUSPENDED">Tạm ngừng hoạt động</option>
                    <option value="INACTIVE">Ngừng hoạt động</option>
                  </select>
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
                  {editingDept ? 'Lưu thay đổi' : 'Tạo đơn vị'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
