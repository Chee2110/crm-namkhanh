import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
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
      login(res.data.token, res.data.user, rememberMe, res.data.maintenanceNotice);
    } catch (err: any) {
      setError(err.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden p-6"
      style={{
        backgroundColor: '#FFFFFF',
        backgroundImage: `
          radial-gradient(circle 520px at 0% 0%, rgba(251, 113, 133, 0.13) 0%, rgba(244, 114, 182, 0.07) 35%, rgba(253, 164, 175, 0.02) 65%, transparent 85%),
          radial-gradient(circle 520px at 100% 100%, rgba(251, 113, 133, 0.13) 0%, rgba(244, 114, 182, 0.07) 35%, rgba(253, 164, 175, 0.02) 65%, transparent 85%)
        `
      }}
    >
      {/* Dynamic Ambient Blobs - Loang màu hồng nhẹ nhàng kích thước ~65% */}
      <div className="absolute -top-20 -left-20 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-rose-400/12 via-pink-300/08 to-transparent blur-[75px] pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-[400px] h-[400px] rounded-full bg-gradient-to-tl from-rose-400/12 via-pink-300/08 to-transparent blur-[75px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Solid White Content Card */}
        <div className="bg-white p-9 rounded-3xl shadow-2xl border border-slate-100">
          {/* Logo Nam Khánh */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-2xl bg-white shadow-card inline-flex items-center justify-center p-2.5 mb-3.5 border border-slate-100">
              <img
                src="/logo.png"
                alt="Logo Công ty TNHH NK Nam Khánh"
                className="w-full h-full object-contain"
              />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              CÔNG TY TNHH NK NAM KHÁNH
            </h2>
            <div className="text-xs text-namkhanh-600 font-bold uppercase tracking-wider mt-1">
              Văn phòng phẩm & Thiết bị văn phòng
            </div>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              Hệ thống Quản trị Doanh nghiệp & Chuỗi cung ứng
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2.5 bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-2xl text-xs mb-5 font-medium">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Email đăng nhập
              </label>
              <div className="relative">
                <div className="absolute top-1/2 -translate-y-1/2 left-3.5 text-slate-400">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  className="input input-pill pl-10 text-sm font-medium"
                  placeholder="name@namkhanh.vn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Mật khẩu
              </label>
              <div className="relative">
                <div className="absolute top-1/2 -translate-y-1/2 left-3.5 text-slate-400">
                  <Lock size={16} />
                </div>
                <input
                  type="password"
                  className="input input-pill pl-10 text-sm font-medium"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600 text-xs select-none font-medium">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-namkhanh-600 focus:ring-namkhanh-500 accent-namkhanh-600 cursor-pointer"
                />
                <span>Ghi nhớ đăng nhập</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-3 mt-2 text-sm font-bold shadow-glow flex items-center justify-center gap-2"
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
