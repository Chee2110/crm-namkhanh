import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
                  placeholder="Email đăng nhập"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '0.375rem' }}>
                Mật khẩu
              </label>
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
          </form>
        </div>
      </div>
    </div>
  );
};
