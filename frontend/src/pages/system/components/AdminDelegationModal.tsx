import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  Lock,
  X,
  Crown,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Users,
  Building,
  KeyRound
} from 'lucide-react';
import { api } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { Role } from '../../../types';

export interface AdminUserItem {
  id: string;
  code: string;
  fullName: string;
  email: string;
  phone?: string;
  status: 'ACTIVE' | 'INACTIVE';
  department?: { id: string; code: string; name: string } | null;
  roles: Role[];
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

interface AdminDelegationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdminChanged?: () => void;
}

export const SUPER_ADMIN_EMAIL = 'dinhhchi2110@gmail.com';

export const AdminDelegationModal: React.FC<AdminDelegationModalProps> = ({
  isOpen,
  onClose,
  onAdminChanged
}) => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'ADMIN_ONLY' | 'REGULAR_ONLY'>('ALL');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Modal xác nhận thao tác
  const [confirmTarget, setConfirmTarget] = useState<{
    user: AdminUserItem;
    action: 'GRANT' | 'REVOKE';
  } | null>(null);

  const isSuperAdmin = currentUser?.email?.trim().toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();

  const loadData = async () => {
    try {
      setLoading(true);
      setActionError(null);
      const res = await api.get<{
        superAdminEmail: string;
        totalUsers: number;
        adminCount: number;
        users: AdminUserItem[];
      }>('/roles/admin-users');

      setUsers(res.data?.users || []);
    } catch (err: any) {
      setActionError(err.message || 'Lỗi khi tải danh sách phân quyền quản trị');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      setActionSuccess(null);
      setActionError(null);
      setSearch('');
      setFilterType('ALL');
      setConfirmTarget(null);
    }
  }, [isOpen]);

  const handleExecuteDelegation = async () => {
    if (!confirmTarget) return;
    const { user, action } = confirmTarget;

    try {
      setIsProcessing(true);
      setActionError(null);
      setActionSuccess(null);

      const res = await api.post('/roles/admin-delegation', {
        targetUserId: user.id,
        action
      });

      const msg =
        res.message ||
        (action === 'GRANT'
          ? `Đã cấp quyền quản trị thành công cho nhân sự ${user.fullName}!`
          : `Đã thu hồi quyền quản trị của nhân sự ${user.fullName}!`);

      setActionSuccess(msg);
      setConfirmTarget(null);
      await loadData();
      if (onAdminChanged) onAdminChanged();
    } catch (err: any) {
      setActionError(err.message || 'Thao tác phân quyền thất bại');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // 1. Lọc theo trạng thái Admin
      if (filterType === 'ADMIN_ONLY' && !u.isAdmin) return false;
      if (filterType === 'REGULAR_ONLY' && u.isAdmin) return false;

      // 2. Tìm kiếm từ khóa
      if (!search.trim()) return true;
      const kw = search.toLowerCase();
      return (
        u.fullName.toLowerCase().includes(kw) ||
        u.code.toLowerCase().includes(kw) ||
        u.email.toLowerCase().includes(kw) ||
        (u.phone && u.phone.includes(kw)) ||
        (u.department?.name && u.department.name.toLowerCase().includes(kw))
      );
    });
  }, [users, search, filterType]);

  const totalAdminCount = users.filter((u) => u.isAdmin).length;

  if (!isOpen) return null;

  return (
    <div className="modal-overlay fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div
        className="modal-content bg-white rounded-xl shadow-2xl w-full relative z-[1001] max-h-[92vh] flex flex-col overflow-hidden"
        style={{ maxWidth: '960px' }}
      >
        {/* HEADER MODAL */}
        <div
          className="modal-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.5rem',
            borderBottom: '1px solid #E5E7EB',
            backgroundColor: '#F9FAFB'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: '#FEE2E2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#DC2626',
                border: '1px solid #FECACA'
              }}
            >
              <ShieldCheck size={22} />
            </div>
            <div>
              <div style={{ fontSize: '17px', fontWeight: '700', color: '#111827', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>Phân quyền Quản trị Hệ thống (Admin)</span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    backgroundColor: '#FEF2F2',
                    color: '#DC2626',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    border: '1px solid #FECACA'
                  }}
                >
                  Đầy đủ quyền Quản trị
                </span>
              </div>
              <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '2px' }}>
                Chỉ duy nhất tài khoản <strong>{SUPER_ADMIN_EMAIL}</strong> mới có thẩm quyền cấp hoặc xóa quyền quản trị cho nhân sự khác
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#6B7280',
              padding: '6px',
              borderRadius: '6px'
            }}
            title="Đóng"
          >
            <X size={20} />
          </button>
        </div>

        {/* BODY MODAL */}
        <div
          className="modal-body"
          style={{
            padding: '1.25rem 1.5rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            flex: 1
          }}
        >
          {/* BANNER THẨM QUYỀN */}
          {isSuperAdmin ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                backgroundColor: '#ECFDF5',
                border: '1px solid #A7F3D0',
                color: '#065F46',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                fontSize: '13.5px'
              }}
            >
              <Crown size={19} className="text-emerald-600 shrink-0" />
              <div>
                <strong>Bạn đang đăng nhập với tư cách Quản trị viên tối cao ({SUPER_ADMIN_EMAIL}).</strong>
                <div>Bạn có toàn quyền cấp hoặc xóa quyền quản trị (Admin) cho các nhân sự khác trong toàn bộ hệ thống. Nhân sự được cấp sẽ có đầy đủ mọi quyền hạn như quản trị viên.</div>
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                backgroundColor: '#FFFBEB',
                border: '1px solid #FDE68A',
                color: '#92400E',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                fontSize: '13.5px'
              }}
            >
              <Lock size={19} className="text-amber-600 shrink-0" />
              <div>
                <strong>Giới hạn quyền hạn (Chế độ chỉ xem):</strong>
                <div>
                  Bạn đang đăng nhập bằng tài khoản <strong>{currentUser?.email}</strong>. Chỉ tài khoản <strong>{SUPER_ADMIN_EMAIL}</strong> mới có quyền cấp hoặc xóa quyền quản trị cho người khác.
                </div>
              </div>
            </div>
          )}

          {/* THÔNG BÁO KẾT QUẢ THAO TÁC */}
          {actionSuccess && (
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
                fontSize: '14px'
              }}
            >
              <CheckCircle2 size={16} className="shrink-0" />
              <span>{actionSuccess}</span>
            </div>
          )}

          {actionError && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#FEE2E2',
                border: '1px solid #FECACA',
                color: '#B91C1C',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                fontSize: '14px'
              }}
            >
              <AlertCircle size={16} className="shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {/* THANH CÔNG CỤ TÌM KIẾM VÀ BỘ LỌC */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
              backgroundColor: '#F9FAFB',
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              border: '1px solid #E5E7EB'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '280px' }}>
              <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
                <Search
                  size={15}
                  style={{
                    position: 'absolute',
                    left: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#9CA3AF'
                  }}
                />
                <input
                  type="text"
                  placeholder="Tìm họ tên, mã NV, email, phòng ban..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input"
                  style={{
                    paddingLeft: '32px',
                    paddingRight: '12px',
                    fontSize: '13px',
                    height: '34px',
                    width: '100%'
                  }}
                />
              </div>

              <select
                className="input"
                style={{ width: '200px', height: '34px', fontSize: '13px' }}
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
              >
                <option value="ALL">Tất cả nhân sự ({users.length})</option>
                <option value="ADMIN_ONLY">Chỉ Quản trị viên ({totalAdminCount})</option>
                <option value="REGULAR_ONLY">Chỉ Nhân viên thường ({users.length - totalAdminCount})</option>
              </select>
            </div>

            {/* Thống kê nhanh */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  backgroundColor: '#FEF2F2',
                  color: '#DC2626',
                  border: '1px solid #FECACA',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <ShieldCheck size={13} />
                Quản trị viên: {totalAdminCount} người
              </span>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: '500',
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  backgroundColor: '#F3F4F6',
                  color: '#4B5563',
                  border: '1px solid #E5E7EB'
                }}
              >
                Tổng nhân sự: {users.length}
              </span>
            </div>
          </div>

          {/* BẢNG DANH SÁCH NHÂN SỰ VÀ TRẠNG THÁI QUẢN TRỊ */}
          <div
            className="table-container shadow-sm border border-gray-200 rounded-lg overflow-x-auto"
            style={{ maxHeight: '420px', overflowY: 'auto' }}
          >
            <table className="table-custom" style={{ width: '100%', minWidth: '780px' }}>
              <thead className="bg-slate-50 sticky top-0 z-10 border-b border-gray-200">
                <tr>
                  <th className="table-th text-center" style={{ width: '50px' }}>STT</th>
                  <th className="table-th" style={{ width: '32%' }}>Nhân sự & Tài khoản</th>
                  <th className="table-th" style={{ width: '22%' }}>Đơn vị phòng ban</th>
                  <th className="table-th" style={{ width: '20%' }}>Vai trò hiện có</th>
                  <th className="table-th text-center" style={{ width: '13%' }}>Quyền Quản trị</th>
                  <th className="table-th text-right" style={{ width: '13%' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#6B7280' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <Loader2 size={18} className="animate-spin text-[#E53935]" />
                        <span>Đang tải danh sách nhân sự phân quyền...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: '#9CA3AF' }}>
                      Không tìm thấy nhân sự nào phù hợp với bộ lọc hiện tại.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u, idx) => {
                    const isTargetSuper = u.isSuperAdmin;

                    return (
                      <tr
                        key={u.id}
                        className="table-tr"
                        style={{
                          backgroundColor: isTargetSuper ? '#FFFBEB' : u.isAdmin ? '#FEF2F2' : undefined
                        }}
                      >
                        <td className="table-td text-center text-xs text-gray-500 font-mono">
                          {idx + 1}
                        </td>
                        <td className="table-td">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                            <div
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '9999px',
                                backgroundColor: isTargetSuper ? '#D97706' : u.isAdmin ? '#DC2626' : '#6B7280',
                                color: '#FFFFFF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: '700',
                                fontSize: '13px',
                                flexShrink: 0
                              }}
                            >
                              {u.fullName.charAt(0)}
                            </div>
                            <div style={{ overflow: 'hidden' }}>
                              <div style={{ fontWeight: '600', color: '#111827', fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <span>{u.fullName}</span>
                                {isTargetSuper && (
                                  <span title="Chủ sở hữu hệ thống (Gốc)" className="inline-flex items-center">
                                    <Crown size={14} className="text-amber-500 shrink-0" />
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '11.5px', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontFamily: 'monospace', color: '#DC2626', fontWeight: '600' }}>
                                  {u.code}
                                </span>
                                <span>•</span>
                                <span>{u.email}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="table-td text-xs text-gray-700">
                          {u.department ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <Building size={13} className="text-gray-400 shrink-0" />
                              <span className="truncate" title={u.department.name}>
                                {u.department.name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="table-td">
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                            {u.roles.map((r) => (
                              <span
                                key={r.id}
                                className={`text-[11px] px-2 py-0.5 rounded font-medium ${
                                  r.code === 'ADMIN'
                                    ? 'bg-red-100 text-red-700 border border-red-200'
                                    : r.code === 'CEO'
                                    ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                    : 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {r.name}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="table-td text-center">
                          {isTargetSuper ? (
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: '700',
                                backgroundColor: '#FEF3C7',
                                color: '#92400E',
                                padding: '3px 8px',
                                borderRadius: '9999px',
                                border: '1px solid #FDE68A',
                                whiteSpace: 'nowrap',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                            >
                              <Crown size={12} className="text-amber-600" />
                              Admin Gốc
                            </span>
                          ) : u.isAdmin ? (
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: '600',
                                backgroundColor: '#FEE2E2',
                                color: '#DC2626',
                                padding: '3px 8px',
                                borderRadius: '9999px',
                                border: '1px solid #FECACA',
                                whiteSpace: 'nowrap',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                            >
                              <ShieldCheck size={12} />
                              Có quyền Quản trị
                            </span>
                          ) : (
                            <span
                              style={{
                                fontSize: '11px',
                                color: '#6B7280',
                                backgroundColor: '#F3F4F6',
                                padding: '3px 8px',
                                borderRadius: '9999px',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              Nhân viên
                            </span>
                          )}
                        </td>
                        <td className="table-td text-right">
                          {isTargetSuper ? (
                            <span style={{ fontSize: '11px', color: '#9CA3AF', fontStyle: 'italic' }}>
                              Mặc định vĩnh viễn
                            </span>
                          ) : u.isAdmin ? (
                            <button
                              type="button"
                              onClick={() => setConfirmTarget({ user: u, action: 'REVOKE' })}
                              disabled={!isSuperAdmin || isProcessing}
                              style={{
                                fontSize: '12px',
                                padding: '3px 10px',
                                borderRadius: '6px',
                                border: '1px solid #FECACA',
                                backgroundColor: '#FEF2F2',
                                color: '#DC2626',
                                fontWeight: '600',
                                cursor: isSuperAdmin ? 'pointer' : 'not-allowed',
                                opacity: isSuperAdmin ? 1 : 0.5,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              title={
                                isSuperAdmin
                                  ? `Thu hồi quyền quản trị của ${u.fullName}`
                                  : `Chỉ tài khoản ${SUPER_ADMIN_EMAIL} mới có quyền xóa quyền quản trị`
                              }
                            >
                              {!isSuperAdmin && <Lock size={11} />}
                              <span>Xóa quyền quản trị</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmTarget({ user: u, action: 'GRANT' })}
                              disabled={!isSuperAdmin || isProcessing}
                              style={{
                                fontSize: '12px',
                                padding: '3px 10px',
                                borderRadius: '6px',
                                border: '1px solid #DC2626',
                                backgroundColor: '#DC2626',
                                color: '#FFFFFF',
                                fontWeight: '600',
                                cursor: isSuperAdmin ? 'pointer' : 'not-allowed',
                                opacity: isSuperAdmin ? 1 : 0.5,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              title={
                                isSuperAdmin
                                  ? `Cấp toàn quyền quản trị cho ${u.fullName}`
                                  : `Chỉ tài khoản ${SUPER_ADMIN_EMAIL} mới có quyền cấp quyền quản trị`
                              }
                            >
                              {!isSuperAdmin && <Lock size={11} />}
                              <span>Cấp quyền quản trị</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* FOOTER MODAL */}
        <div
          className="modal-footer"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.85rem 1.5rem',
            borderTop: '1px solid #E5E7EB',
            backgroundColor: '#F9FAFB'
          }}
        >
          <div style={{ fontSize: '12.5px', color: '#6B7280' }}>
            Tổng số: <strong>{filteredUsers.length}</strong> nhân sự hiển thị ({totalAdminCount} quản trị viên)
          </div>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Đóng cửa sổ
          </button>
        </div>
      </div>

      {/* POPUP XÁC NHẬN CẤP / THU HỒI QUYỀN QUẢN TRỊ */}
      {confirmTarget && (
        <div
          className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setConfirmTarget(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md relative z-[1101]"
            onClick={(e) => e.stopPropagation()}
            style={{ border: '1px solid #E5E7EB' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor: confirmTarget.action === 'GRANT' ? '#DCFCE7' : '#FEE2E2',
                  color: confirmTarget.action === 'GRANT' ? '#166534' : '#DC2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `1px solid ${confirmTarget.action === 'GRANT' ? '#86EFAC' : '#FECACA'}`
                }}
              >
                {confirmTarget.action === 'GRANT' ? <ShieldCheck size={22} /> : <ShieldAlert size={22} />}
              </div>
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#111827', margin: 0 }}>
                  {confirmTarget.action === 'GRANT'
                    ? 'Xác nhận cấp Quyền Quản trị'
                    : 'Xác nhận thu hồi Quyền Quản trị'}
                </h4>
                <div style={{ fontSize: '12.5px', color: '#6B7280' }}>
                  Hành động này được ghi nhận nhật ký hệ thống
                </div>
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#F9FAFB',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                border: '1px solid #E5E7EB',
                marginBottom: '1rem',
                fontSize: '13.5px'
              }}
            >
              <div style={{ marginBottom: '4px' }}>
                Nhân sự: <strong>{confirmTarget.user.fullName}</strong> ({confirmTarget.user.code})
              </div>
              <div style={{ color: '#6B7280', fontSize: '12.5px' }}>
                Email: {confirmTarget.user.email}
              </div>
              {confirmTarget.user.department && (
                <div style={{ color: '#6B7280', fontSize: '12.5px' }}>
                  Phòng ban: {confirmTarget.user.department.name}
                </div>
              )}
            </div>

            <p style={{ fontSize: '13.5px', color: '#374151', lineHeight: '1.5', marginBottom: '1.25rem' }}>
              {confirmTarget.action === 'GRANT' ? (
                <>
                  Bạn đang cấp quyền Quản trị viên (ADMIN) cho nhân sự này. Sau khi cấp, tài khoản này sẽ{' '}
                  <strong style={{ color: '#DC2626' }}>
                    có đầy đủ toàn bộ mọi quyền hạn như Quản trị viên
                  </strong>{' '}
                  (toàn quyền xem, thêm, sửa, xóa tất cả các phân hệ và xem thông tin bảo mật).
                </>
              ) : (
                <>
                  Bạn đang thu hồi quyền Quản trị viên (ADMIN) của nhân sự này. Sau khi xóa, tài khoản này sẽ{' '}
                  <strong style={{ color: '#DC2626' }}>
                    không còn quyền truy cập vào các chức năng quản trị hệ thống
                  </strong>
                  .
                </>
              )}
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.625rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={isProcessing}
                onClick={() => setConfirmTarget(null)}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleExecuteDelegation}
                style={{
                  backgroundColor: confirmTarget.action === 'GRANT' ? '#DC2626' : '#B91C1C',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '0.375rem',
                  padding: '0.5rem 1rem',
                  fontWeight: '600',
                  fontSize: '13.5px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  cursor: isProcessing ? 'not-allowed' : 'pointer'
                }}
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Đang xử lý...</span>
                  </>
                ) : confirmTarget.action === 'GRANT' ? (
                  <>
                    <ShieldCheck size={16} />
                    <span>Đồng ý Cấp quyền</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert size={16} />
                    <span>Đồng ý Xóa quyền</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
