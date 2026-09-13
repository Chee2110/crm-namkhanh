import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, Shield, AlertCircle, CheckCircle2, KeyRound, X } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Modal Quên mật khẩu
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [forgotLoading, setForgotLoading] = useState(false);

  // Modal Google SSO
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Vui lòng nhập đầy đủ Email và Mật khẩu');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await api.post('/auth/login', { email, password });
      login(res.data.token, res.data.user);
    } catch (err: any) {
      setError(err.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('123456');
    setError(null);
  };

  // Đặt lại mật khẩu mới trực tiếp (bỏ qua bước gửi OTP về mail)
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setForgotError('Vui lòng nhập địa chỉ email tài khoản');
      return;
    }
    if (newPassword.length < 6) {
      setForgotError('Mật khẩu mới phải có từ 6 ký tự trở lên');
      return;
    }
    if (newPassword !== confirmPassword) {
      setForgotError('Xác nhận mật khẩu mới không khớp');
      return;
    }

    try {
      setForgotLoading(true);
      setForgotError(null);
      const res = await api.post('/auth/reset-password', {
        email: forgotEmail.trim(),
        newPassword
      });
      setForgotSuccess(res.data?.message || 'Đặt lại mật khẩu thành công');
      setTimeout(() => {
        setIsForgotModalOpen(false);
        setPassword(newPassword);
        setEmail(forgotEmail.trim());
        setNewPassword('');
        setConfirmPassword('');
        setForgotSuccess(null);
      }, 1500);
    } catch (err: any) {
      setForgotError(err.response?.data?.message || err.message || 'Lỗi đặt lại mật khẩu');
    } finally {
      setForgotLoading(false);
    }
  };

  // Xử lý Google Workspace SSO
  const handleGoogleLoginSubmit = async (emailToLogin: string) => {
    try {
      setGoogleLoading(true);
      setGoogleError(null);
      const res = await api.post('/auth/google-sso', {
        email: emailToLogin,
        fullName: emailToLogin.split('@')[0]
      });
      setIsGoogleModalOpen(false);
      login(res.data.token, res.data.user);
    } catch (err: any) {
      setGoogleError(err.response?.data?.message || err.message || 'Đăng nhập Google SSO thất bại');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F9FAFB',
        position: 'relative',
        overflow: 'hidden',
        padding: '1.5rem'
      }}
    >
      {/* 4 Đốm sáng hiệu ứng Ambient Blur Blobs theo Section XI.5 */}
      <div className="blob blob-red" />
      <div className="blob blob-blue" />
      <div className="blob blob-green" />
      <div className="blob blob-yellow" />

      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          position: 'relative',
          zIndex: 10
        }}
      >
        {/* Card Đăng nhập */}
        <div
          className="card"
          style={{
            padding: '2.25rem',
            borderRadius: '1rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
            border: '1px solid rgba(229, 231, 235, 0.8)',
            backdropFilter: 'blur(8px)',
            backgroundColor: 'rgba(255, 255, 255, 0.95)'
          }}
        >
          {/* Logo Nam Khánh */}
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <div
              style={{
                width: '76px',
                height: '76px',
                borderRadius: '18px',
                backgroundColor: '#FFFFFF',
                boxShadow: '0 8px 20px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(229, 57, 53, 0.15)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px',
                marginBottom: '0.85rem',
                border: '1px solid #F3F4F6'
              }}
            >
              <img
                src="/logo.png"
                alt="Logo Công ty TNHH NK Nam Khánh"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#111827', margin: 0, letterSpacing: '-0.01em' }}>
              CÔNG TY TNHH NK NAM KHÁNH
            </h2>
            <div style={{ fontSize: '13px', color: '#E53935', fontWeight: '600', marginTop: '0.3rem' }}>
              Chuyên Cung Cấp Văn Phòng Phẩm & Thiết Bị Văn Phòng
            </div>
            <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '0.25rem' }}>
              Hệ thống Quản trị Doanh nghiệp & Chuỗi cung ứng
            </p>
          </div>

          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#FEE2E2',
                color: '#B91C1C',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                fontSize: '13px',
                marginBottom: '1.25rem'
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '0.375rem' }}>
                Email đăng nhập
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '0.75rem', color: '#9CA3AF' }}>
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  className="input"
                  style={{ paddingLeft: '2.35rem' }}
                  placeholder="admin@namkhanh.vn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
                <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                  Mật khẩu
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email || '');
                    setNewPassword('');
                    setConfirmPassword('');
                    setForgotError(null);
                    setForgotSuccess(null);
                    setIsForgotModalOpen(true);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#E53935',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  Quên mật khẩu?
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '0.75rem', color: '#9CA3AF' }}>
                  <Lock size={16} />
                </div>
                <input
                  type="password"
                  className="input"
                  style={{ paddingLeft: '2.35rem' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.65rem',
                fontSize: '14px',
                marginTop: '0.35rem'
              }}
            >
              {loading ? (
                'Đang xác thực...'
              ) : (
                <>
                  <span>Vào hệ thống</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            {/* Nút Đăng nhập Google Workspace SSO */}
            <div style={{ position: 'relative', textAlign: 'center', margin: '0.75rem 0 0.25rem 0' }}>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '100%', borderTop: '1px solid #E5E7EB' }} />
              </div>
              <div style={{ position: 'relative', display: 'inline-block', backgroundColor: '#FFFFFF', padding: '0 0.5rem', fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase' }}>
                Hoặc
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setGoogleEmail('ceo@namkhanh.vn');
                setIsGoogleModalOpen(true);
              }}
              className="btn btn-secondary"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '0.6rem',
                fontSize: '13.5px',
                gap: '0.6rem',
                border: '1px solid #D1D5DB'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              <span>Đăng nhập với Google Workspace</span>
            </button>
          </form>

          {/* Hộp chọn nhanh tài khoản Demo để Pair Programming & Test */}
          <div style={{ marginTop: '1.5rem', borderTop: '1px solid #F3F4F6', paddingTop: '1.15rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                fontSize: '11px',
                fontWeight: '600',
                color: '#6B7280',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.625rem'
              }}
            >
              <Shield size={12} color="#E53935" />
              <span>Tài khoản mẫu thử nghiệm (Click để điền nhanh):</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.375rem' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleQuickFill('admin@namkhanh.vn')}
                style={{ fontSize: '11.5px', justifyContent: 'flex-start' }}
              >
                🔴 Admin
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleQuickFill('ceo@namkhanh.vn')}
                style={{ fontSize: '11.5px', justifyContent: 'flex-start' }}
              >
                👔 CEO (Giám đốc)
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleQuickFill('sales.dir@namkhanh.vn')}
                style={{ fontSize: '11.5px', justifyContent: 'flex-start' }}
              >
                📊 Trưởng phòng KD
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleQuickFill('sales1@namkhanh.vn')}
                style={{ fontSize: '11.5px', justifyContent: 'flex-start' }}
              >
                💼 Nhân viên Sales
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleQuickFill('accountant@namkhanh.vn')}
                style={{ fontSize: '11.5px', justifyContent: 'flex-start' }}
              >
                💵 Kế toán
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleQuickFill('warehouse@namkhanh.vn')}
                style={{ fontSize: '11.5px', justifyContent: 'flex-start' }}
              >
                📦 Thủ kho
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ================= MODAL QUÊN MẬT KHẨU ================= */}
      {isForgotModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '420px',
              padding: '1.75rem',
              borderRadius: '1rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <KeyRound size={20} color="#E53935" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#111827' }}>
                  Khôi phục Mật khẩu
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}
              >
                <X size={20} />
              </button>
            </div>

            {forgotError && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: '#FEE2E2',
                  color: '#B91C1C',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '0.5rem',
                  fontSize: '12.5px',
                  marginBottom: '1rem'
                }}
              >
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotSuccess && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: '#DCFCE7',
                  color: '#166534',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '0.5rem',
                  fontSize: '12.5px',
                  marginBottom: '1rem'
                }}
              >
                <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
                <span>{forgotSuccess}</span>
              </div>
            )}

            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <p style={{ fontSize: '13px', color: '#6B7280', margin: 0, lineHeight: 1.5 }}>
                Nhập địa chỉ email tài khoản và thiết lập mật khẩu mới cho tài khoản CRM Nam Khánh.
              </p>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '500', color: '#374151', marginBottom: '0.35rem' }}>
                  Email của bạn
                </label>
                <input
                  type="email"
                  required
                  className="input"
                  placeholder="ví dụ: admin@namkhanh.vn"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '500', color: '#374151', marginBottom: '0.35rem' }}>
                  Mật khẩu mới
                </label>
                <input
                  type="password"
                  required
                  className="input"
                  placeholder="Tối thiểu 6 ký tự"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '500', color: '#374151', marginBottom: '0.35rem' }}>
                  Xác nhận mật khẩu mới
                </label>
                <input
                  type="password"
                  required
                  className="input"
                  placeholder="Nhập lại mật khẩu mới"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="btn btn-primary"
                >
                  {forgotLoading ? 'Đang cập nhật...' : 'Đặt lại mật khẩu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL GOOGLE WORKSPACE SSO ================= */}
      {isGoogleModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '440px',
              padding: '1.75rem',
              borderRadius: '1rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="22" height="22" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#111827' }}>
                  Google Workspace Single Sign-On
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsGoogleModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}
              >
                <X size={20} />
              </button>
            </div>

            {googleError && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: '#FEE2E2',
                  color: '#B91C1C',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '0.5rem',
                  fontSize: '12.5px',
                  marginBottom: '1rem'
                }}
              >
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>{googleError}</span>
              </div>
            )}

            <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 1rem 0', lineHeight: 1.5 }}>
              Hệ thống hỗ trợ đăng nhập 1-click cho các tài khoản email nhân sự thuộc Google Workspace của Công ty TNHH NK Nam Khánh (<code>@namkhanh.vn</code>).
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '1.25rem' }}>
              <button
                type="button"
                onClick={() => handleGoogleLoginSubmit('ceo@namkhanh.vn')}
                disabled={googleLoading}
                className="btn btn-secondary"
                style={{ justifyContent: 'flex-start', padding: '0.65rem 1rem', fontSize: '13px' }}
              >
                <span style={{ fontWeight: '600' }}>👔 ceo@namkhanh.vn</span>
                <span style={{ marginLeft: 'auto', fontSize: '11.5px', color: '#9CA3AF' }}>Tổng Giám đốc</span>
              </button>

              <button
                type="button"
                onClick={() => handleGoogleLoginSubmit('sales.dir@namkhanh.vn')}
                disabled={googleLoading}
                className="btn btn-secondary"
                style={{ justifyContent: 'flex-start', padding: '0.65rem 1rem', fontSize: '13px' }}
              >
                <span style={{ fontWeight: '600' }}>📊 sales.dir@namkhanh.vn</span>
                <span style={{ marginLeft: 'auto', fontSize: '11.5px', color: '#9CA3AF' }}>Trưởng phòng KD</span>
              </button>

              <button
                type="button"
                onClick={() => handleGoogleLoginSubmit('sales1@namkhanh.vn')}
                disabled={googleLoading}
                className="btn btn-secondary"
                style={{ justifyContent: 'flex-start', padding: '0.65rem 1rem', fontSize: '13px' }}
              >
                <span style={{ fontWeight: '600' }}>💼 sales1@namkhanh.vn</span>
                <span style={{ marginLeft: 'auto', fontSize: '11.5px', color: '#9CA3AF' }}>Chuyên viên Sales</span>
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (googleEmail.trim()) handleGoogleLoginSubmit(googleEmail.trim());
              }}
            >
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '0.35rem' }}>
                  Hoặc nhập email Google Workspace khác:
                </label>
                <input
                  type="email"
                  className="input"
                  placeholder="nhanvien@namkhanh.vn"
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsGoogleModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={googleLoading || !googleEmail.trim()}
                  className="btn btn-primary"
                >
                  {googleLoading ? 'Đang kết nối SSO...' : 'Đăng nhập với Google'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
