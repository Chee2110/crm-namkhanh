import React, { useState } from 'react';
import {
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

// Cánh hoa sen & hạt sáng 3D bay lơ lửng trong không gian
const FLOATING_PETALS = [
  { id: 1, type: 'petal', left: '8%', size: 19, duration: '14s', delay: '0s', opacity: 0.75, color: '#FDA4AF' },
  { id: 2, type: 'leaf', left: '19%', size: 20, duration: '16.5s', delay: '2.5s', opacity: 0.65, color: '#34D399' },
  { id: 3, type: 'petal', left: '32%', size: 15, duration: '12.5s', delay: '4.2s', opacity: 0.7, color: '#F9A8D4' },
  { id: 4, type: 'petal', left: '48%', size: 18, duration: '15s', delay: '1.4s', opacity: 0.65, color: '#FB7185' },
  { id: 5, type: 'leaf', left: '64%', size: 21, duration: '17s', delay: '3.6s', opacity: 0.6, color: '#10B981' },
  { id: 6, type: 'petal', left: '78%', size: 16, duration: '13.5s', delay: '0.9s', opacity: 0.72, color: '#FDA4AF' },
  { id: 7, type: 'petal', left: '90%', size: 14, duration: '15.5s', delay: '5.1s', opacity: 0.65, color: '#FBCFE8' }
];

export const LoginPage: React.FC = () => {
  const { login } = useAuth();

  // State Đăng nhập
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Hiệu ứng nghiêng 3D đa tầng (Multi-depth 3D Parallax) theo con trỏ chuột
  const [tilt, setTilt] = useState({
    rotateX: 0,
    rotateY: 0,
    glareX: 50,
    glareY: 25,
    shiftX: 0,
    shiftY: 0
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setTilt({
      rotateY: (x - 0.5) * 8,
      rotateX: (0.5 - y) * 8,
      glareX: x * 100,
      glareY: y * 100,
      shiftX: (x - 0.5) * 22,
      shiftY: (y - 0.5) * 22
    });
  };

  const handleMouseLeave = () => {
    setTilt({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 25, shiftX: 0, shiftY: 0 });
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
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
      className="fixed inset-0 overflow-y-auto overflow-x-hidden flex items-center justify-center p-4 sm:p-6 lg:p-10 select-none"
      style={{
        background: `
          radial-gradient(circle 650px at 18% 20%, rgba(254, 205, 211, 0.55) 0%, transparent 70%),
          radial-gradient(circle 680px at 82% 80%, rgba(167, 243, 208, 0.50) 0%, transparent 70%),
          radial-gradient(circle 620px at 78% 18%, rgba(186, 230, 253, 0.55) 0%, transparent 68%),
          radial-gradient(circle 550px at 22% 85%, rgba(254, 240, 138, 0.32) 0%, transparent 65%),
          linear-gradient(135deg, #FFF1F2 0%, #F0F9FF 48%, #ECFDF5 100%)
        `
      }}
    >
      {/* ===================================================================
          KEYFRAMES CHUYỂN ĐỘNG 3D MỀM MẠI & SANG TRỌNG
         =================================================================== */}
      <style>{`
        @keyframes nkLotusSwaySlow {
          0%, 100% { transform: rotate(0deg) translateY(0px) scale(1); }
          50% { transform: rotate(3.2deg) translateY(-7px) scale(1.018); }
        }
        @keyframes nkLotusSwayReverse {
          0%, 100% { transform: rotate(0deg) translateY(0px) scale(1); }
          50% { transform: rotate(-3.5deg) translateY(-9px) scale(1.02); }
        }
        @keyframes nkFloatBadge {
          0%, 100% { transform: translate3d(0, 0px, 50px); }
          50% { transform: translate3d(0, -8px, 50px); }
        }
        @keyframes nkFloatBadgeDelayed {
          0%, 100% { transform: translate3d(0, 0px, 45px); }
          50% { transform: translate3d(0, 8px, 45px); }
        }
        @keyframes nkPetalDrift {
          0% {
            transform: translate3d(0, -10vh, 0) rotateX(0deg) rotateY(0deg) rotateZ(0deg);
            opacity: 0;
          }
          12% {
            opacity: 0.85;
          }
          50% {
            transform: translate3d(42px, 48vh, 30px) rotateX(180deg) rotateY(120deg) rotateZ(160deg);
          }
          88% {
            opacity: 0.72;
          }
          100% {
            transform: translate3d(-22px, 108vh, 0) rotateX(360deg) rotateY(260deg) rotateZ(340deg);
            opacity: 0;
          }
        }
        @keyframes nkShimmerBtn {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>

      {/* ===================================================================
          LỚP 1: HOA SEN XA GẦN NGOÀI BIÊN MÀN HÌNH (3D DEPTH OF FIELD)
         =================================================================== */}
      {/* Đóa sen đôi góc dưới trái màn hình */}
      <div
        className="pointer-events-none fixed -bottom-14 -left-10 sm:-left-6 w-60 sm:w-76 lg:w-[340px] z-0 opacity-85"
        style={{
          transformOrigin: 'bottom center',
          animation: 'nkLotusSwaySlow 8s ease-in-out infinite',
          filter: 'drop-shadow(0 22px 35px rgba(15, 23, 42, 0.12))'
        }}
      >
        <img src="/lotus-duo.png" alt="" className="w-full h-auto object-contain" />
      </div>

      {/* Đóa sen cận cảnh góc dưới phải màn hình */}
      <div
        className="pointer-events-none fixed -bottom-16 -right-8 sm:-right-4 w-56 sm:w-72 lg:w-[310px] z-0 opacity-85"
        style={{
          transformOrigin: 'bottom right',
          animation: 'nkLotusSwayReverse 9s ease-in-out infinite',
          filter: 'drop-shadow(-14px 20px 32px rgba(225, 29, 72, 0.13))'
        }}
      >
        <img src="/lotus-bloom.png" alt="" className="w-full h-auto object-contain" />
      </div>

      {/* Bông sen mờ Bokeh phía xa góc trên trái */}
      <div
        className="hidden md:block pointer-events-none fixed -top-16 left-[7%] w-48 z-0 opacity-30"
        style={{
          transform: 'rotate(145deg)',
          filter: 'blur(3.5px) drop-shadow(0 12px 24px rgba(244, 63, 94, 0.12))'
        }}
      >
        <img src="/lotus-bloom.png" alt="" className="w-full h-auto object-contain" />
      </div>

      {/* ===================================================================
          LỚP 2: CÁNH HOA SEN BAY LƠ LỬNG TRONG GIÓ
         =================================================================== */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-20">
        {FLOATING_PETALS.map((item) => (
          <div
            key={item.id}
            style={{
              position: 'absolute',
              top: '-30px',
              left: item.left,
              width: `${item.size}px`,
              height: `${item.size}px`,
              opacity: item.opacity,
              animation: `nkPetalDrift ${item.duration} linear ${item.delay} infinite`
            }}
          >
            {item.type === 'petal' ? (
              <svg viewBox="0 0 24 24" fill="none" className="w-full h-full drop-shadow-xs">
                <path
                  d="M12 2C7.5 2 4 6.5 4 11.5C4 17.5 12 22 12 22C12 22 20 17.5 20 11.5C20 6.5 16.5 2 12 2Z"
                  fill={item.color}
                  fillOpacity="0.85"
                />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" className="w-full h-full drop-shadow-xs">
                <path
                  d="M21 3C14 3 6 6.5 4 14C3.5 16 4 18 5 19.5C9.5 15 14.5 11.5 19 9.5C14 12.5 9.5 16.5 6.5 21C8 21.5 10 21.5 12 21C19.5 19 21 10 21 3Z"
                  fill={item.color}
                  fillOpacity="0.8"
                />
              </svg>
            )}
          </div>
        ))}
      </div>

      {/* ===================================================================
          LỚP 3: CUNG ĐIỆN PHA LÊ 3D NỔI GIỮA KHÔNG GIAN (SCULPTURAL 3D PAVILION)
         =================================================================== */}
      <div
        className="w-full max-w-[500px] relative z-10 my-8"
        style={{ perspective: '1300px' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div
          className="relative"
          style={{
            transform: `rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
            transformStyle: 'preserve-3d',
            transition: 'transform 0.28s cubic-bezier(0.22, 1, 0.36, 1)'
          }}
        >
          {/* 1. VÒNG HÀO QUANG PHÍA SAU KHUNG (BACKLIGHT AURA) */}
          <div
            className="pointer-events-none absolute -inset-6 rounded-[56px]"
            style={{
              background:
                'radial-gradient(circle at 30% 25%, rgba(251, 113, 133, 0.28) 0%, rgba(56, 189, 248, 0.24) 48%, rgba(16, 185, 129, 0.22) 100%)',
              filter: 'blur(28px)',
              transform: 'translateZ(-40px)'
            }}
          />

          {/* 2. THẺ VIÊN NANG KÍNH 3D LƠ LỬNG BÊN HÔNG (FLOATING 3D ORBIT PILLS) */}
          <div
            className="hidden lg:flex items-center gap-2.5 px-3.5 py-2 rounded-2xl absolute -left-24 top-20 z-30 pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.92) 0%, rgba(255, 241, 242, 0.82) 100%)',
              backdropFilter: 'blur(16px)',
              border: '1.5px solid #FFFFFF',
              boxShadow:
                '0 18px 35px -8px rgba(225, 29, 72, 0.18), 0 6px 14px -4px rgba(15, 23, 42, 0.08), inset 0 2px 2px #FFFFFF',
              animation: 'nkFloatBadge 5.5s ease-in-out infinite'
            }}
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-400 to-pink-600 text-white flex items-center justify-center shadow-sm">
              <Sparkles size={15} />
            </div>
            <div>
              <div className="text-[11px] font-extrabold text-slate-800 leading-tight">ERP & CRM 2026</div>
              <div className="text-[10px] font-semibold text-rose-500">Chuỗi cung ứng Thông minh</div>
            </div>
          </div>

          <div
            className="hidden lg:flex items-center gap-2.5 px-3.5 py-2 rounded-2xl absolute -right-24 bottom-24 z-30 pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.92) 0%, rgba(236, 253, 245, 0.85) 100%)',
              backdropFilter: 'blur(16px)',
              border: '1.5px solid #FFFFFF',
              boxShadow:
                '0 18px 35px -8px rgba(16, 185, 129, 0.20), 0 6px 14px -4px rgba(15, 23, 42, 0.08), inset 0 2px 2px #FFFFFF',
              animation: 'nkFloatBadgeDelayed 6s ease-in-out infinite'
            }}
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white flex items-center justify-center shadow-sm">
              <ShieldCheck size={16} />
            </div>
            <div>
              <div className="text-[11px] font-extrabold text-slate-800 leading-tight">Bảo mật Đa tầng</div>
              <div className="text-[10px] font-semibold text-emerald-600">Đồng bộ Dữ liệu 24/7</div>
            </div>
          </div>

          {/* ===============================================================
              5. ĐÀI SEN PHA LÊ 3D NỔI PHÍA TRÊN ĐỈNH KHUNG (CROWN 3D MEDALLION)
             =============================================================== */}
          <div
            className="relative z-30 flex flex-col items-center -mb-11"
            style={{ transform: 'translateZ(48px)' }}
          >
            <div className="relative group">
              <div
                className="absolute -inset-2.5 rounded-[30px] pointer-events-none"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(251, 113, 133, 0.45) 0%, rgba(251, 191, 36, 0.35) 50%, rgba(56, 189, 248, 0.45) 100%)',
                  filter: 'blur(10px)'
                }}
              />
              <div
                className="rounded-[28px] p-3.5 flex items-center justify-center relative"
                style={{
                  width: '88px',
                  height: '88px',
                  background: 'linear-gradient(145deg, #FFFFFF 0%, #FFF1F2 55%, #F0F9FF 100%)',
                  border: '2px solid #FFFFFF',
                  boxShadow: `
                    0 20px 38px -8px rgba(225, 29, 72, 0.22),
                    0 8px 18px -4px rgba(2, 132, 199, 0.16),
                    inset 0 3px 5px #FFFFFF,
                    inset 0 -4px 8px rgba(253, 164, 175, 0.38)
                  `
                }}
              >
                <img
                  src="/logo.png"
                  alt="Logo Công ty TNHH NK Nam Khánh"
                  className="w-full h-full object-contain drop-shadow-xs"
                />
              </div>
            </div>
          </div>

          {/* ===============================================================
              6. THÂN KHUNG PHA LÊ KÍNH MỜ 3D ĐA LỚP (SCULPTED 3D PEARL GLASS)
             =============================================================== */}
          <div
            style={{
              padding: '10px',
              borderRadius: '44px',
              background:
                'linear-gradient(145deg, rgba(255, 255, 255, 0.85) 0%, rgba(255, 228, 230, 0.52) 50%, rgba(224, 242, 254, 0.65) 100%)',
              backdropFilter: 'blur(28px) saturate(200%)',
              WebkitBackdropFilter: 'blur(28px) saturate(200%)',
              border: '1.5px solid rgba(255, 255, 255, 0.96)',
              boxShadow: `
                0 40px 80px -20px rgba(15, 23, 42, 0.16),
                0 20px 45px -15px rgba(225, 29, 72, 0.12),
                0 12px 30px -10px rgba(2, 132, 199, 0.10),
                inset 0 2px 5px rgba(255, 255, 255, 1),
                inset 0 -3px 8px rgba(253, 164, 175, 0.28)
              `
            }}
          >
            {/* Lõi Ngọc Trai 3D bên trong */}
            <div
              className="relative overflow-hidden pt-14 pb-8 px-7 sm:px-10"
              style={{
                borderRadius: '36px',
                background:
                  'linear-gradient(165deg, rgba(255, 255, 255, 0.94) 0%, rgba(255, 250, 251, 0.88) 52%, rgba(240, 249, 255, 0.92) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.98)',
                boxShadow: `
                  inset 0 3px 6px #FFFFFF,
                  inset 0 -6px 14px rgba(224, 242, 254, 0.45)
                `
              }}
            >
              {/* Luồng sáng Specular 3D di chuyển theo chuột */}
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background: `radial-gradient(circle 320px at ${tilt.glareX}% ${tilt.glareY}%, rgba(255, 255, 255, 0.85), rgba(253, 164, 175, 0.08) 45%, transparent 72%)`
                }}
              />

              {/* Vòm cầu vồng pastel dịu nhẹ ở đỉnh trong thẻ */}
              <div
                className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-44 rounded-full"
                style={{
                  background:
                    'radial-gradient(circle, rgba(251, 113, 133, 0.16) 0%, rgba(56, 189, 248, 0.12) 55%, transparent 75%)',
                  filter: 'blur(18px)'
                }}
              />

              {/* Tiêu đề Thương hiệu Sang trọng */}
              <div className="relative z-10 text-center mb-6">
                <div
                  className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[10.5px] font-extrabold uppercase tracking-widest mb-2"
                  style={{
                    background: 'linear-gradient(90deg, #FFF1F2 0%, #F0F9FF 50%, #ECFDF5 100%)',
                    color: '#0284C7',
                    border: '1px solid rgba(186, 230, 253, 0.8)',
                    boxShadow: '0 4px 10px -2px rgba(2, 132, 199, 0.10), inset 0 1px 1px #FFFFFF'
                  }}
                >
                  <Sparkles size={11} className="text-rose-500" />
                  <span>Văn phòng phẩm & Thiết bị Văn phòng</span>
                </div>

                <h1
                  className="text-xl sm:text-2xl font-black tracking-tight"
                  style={{
                    background: 'linear-gradient(135deg, #0F172A 0%, #0369A1 55%, #0D9488 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  CÔNG TY TNHH NK NAM KHÁNH
                </h1>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Hệ thống Quản trị Doanh nghiệp & Điều hành Chuỗi cung ứng
                </p>
              </div>

              {/* Thông báo lỗi (nếu có) */}
              {error && (
                <div
                  className="relative z-10 flex items-center gap-2.5 px-4 py-3 rounded-2xl text-xs mb-5 font-semibold text-red-700"
                  style={{
                    background: 'linear-gradient(145deg, #FEF2F2 0%, #FEE2E2 100%)',
                    border: '1px solid #FECACA',
                    boxShadow: '0 8px 18px -4px rgba(239, 68, 68, 0.16), inset 0 1px 1px #FFFFFF'
                  }}
                >
                  <AlertCircle size={16} className="shrink-0 text-red-500" />
                  <span>{error}</span>
                </div>
              )}

              {/* FORM ĐĂNG NHẬP VỚI VIÊN NANG 3D NỔI (3D PEARL CAPSULES) */}
              <form onSubmit={handleLoginSubmit} className="space-y-4 relative z-10">
                {/* Ô Email 3D Pearl Capsule */}
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5 ml-1.5">
                    Email đăng nhập
                  </label>
                  <div
                    className="relative rounded-2xl transition-all duration-250"
                    style={{
                      transform: focusedField === 'email' ? 'translateY(-2px)' : 'none',
                      background:
                        focusedField === 'email'
                          ? 'linear-gradient(180deg, #FFFFFF 0%, #F0F9FF 100%)'
                          : 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
                      border:
                        focusedField === 'email'
                          ? '1.5px solid #38BDF8'
                          : '1.5px solid rgba(226, 232, 240, 0.95)',
                      boxShadow:
                        focusedField === 'email'
                          ? '0 14px 28px -6px rgba(2, 132, 199, 0.18), 0 0 0 4px rgba(56, 189, 248, 0.15), inset 0 2px 2px #FFFFFF'
                          : '0 8px 20px -6px rgba(15, 23, 42, 0.07), 0 2px 6px -1px rgba(15, 23, 42, 0.04), inset 0 2px 2px #FFFFFF'
                    }}
                  >
                    <div
                      className="absolute top-1/2 -translate-y-1/2 left-3 w-9 h-9 rounded-xl flex items-center justify-center pointer-events-none"
                      style={{
                        background: 'linear-gradient(135deg, #38BDF8 0%, #0284C7 100%)',
                        color: '#FFFFFF',
                        boxShadow:
                          '0 6px 12px -2px rgba(2, 132, 199, 0.35), inset 0 1.5px 1px rgba(255, 255, 255, 0.5)'
                      }}
                    >
                      <Mail size={16} strokeWidth={2.3} />
                    </div>
                    <input
                      type="email"
                      autoComplete="email"
                      placeholder="name@namkhanh.vn"
                      value={email}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pr-4 py-3.5 text-sm font-semibold text-slate-800 placeholder:text-slate-400 bg-transparent rounded-2xl focus:outline-none"
                      style={{ paddingLeft: '3.6rem' }}
                    />
                  </div>
                </div>

                {/* Ô Mật khẩu 3D Pearl Capsule */}
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5 ml-1.5">
                    Mật khẩu
                  </label>
                  <div
                    className="relative rounded-2xl transition-all duration-250"
                    style={{
                      transform: focusedField === 'password' ? 'translateY(-2px)' : 'none',
                      background:
                        focusedField === 'password'
                          ? 'linear-gradient(180deg, #FFFFFF 0%, #FFF1F2 100%)'
                          : 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
                      border:
                        focusedField === 'password'
                          ? '1.5px solid #FB7185'
                          : '1.5px solid rgba(226, 232, 240, 0.95)',
                      boxShadow:
                        focusedField === 'password'
                          ? '0 14px 28px -6px rgba(225, 29, 72, 0.16), 0 0 0 4px rgba(251, 113, 133, 0.15), inset 0 2px 2px #FFFFFF'
                          : '0 8px 20px -6px rgba(15, 23, 42, 0.07), 0 2px 6px -1px rgba(15, 23, 42, 0.04), inset 0 2px 2px #FFFFFF'
                    }}
                  >
                    <div
                      className="absolute top-1/2 -translate-y-1/2 left-3 w-9 h-9 rounded-xl flex items-center justify-center pointer-events-none"
                      style={{
                        background: 'linear-gradient(135deg, #FB7185 0%, #E11D48 100%)',
                        color: '#FFFFFF',
                        boxShadow:
                          '0 6px 12px -2px rgba(225, 29, 72, 0.35), inset 0 1.5px 1px rgba(255, 255, 255, 0.5)'
                      }}
                    >
                      <Lock size={16} strokeWidth={2.3} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={password}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pr-11 py-3.5 text-sm font-semibold text-slate-800 placeholder:text-slate-400 bg-transparent rounded-2xl focus:outline-none"
                      style={{ paddingLeft: '3.6rem' }}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute top-1/2 -translate-y-1/2 right-3.5 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
                      title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 px-1">
                  <label className="flex items-center gap-2.5 cursor-pointer text-slate-600 text-xs select-none font-semibold">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded text-[#0284C7] focus:ring-sky-400 accent-[#0284C7] cursor-pointer"
                    />
                    <span>Ghi nhớ phiên đăng nhập</span>
                  </label>

                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                    <ShieldCheck size={13.5} />
                    <span>Kết nối bảo mật SSL</span>
                  </span>
                </div>

                {/* Nút bấm 3D Pha Lê Tactile Sang Trọng */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 mt-2 rounded-2xl text-sm font-extrabold text-white flex items-center justify-center gap-2.5 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0.5 disabled:opacity-60"
                  style={{
                    backgroundSize: '200% 200%',
                    backgroundImage:
                      'linear-gradient(135deg, #0284C7 0%, #0EA5E9 38%, #10B981 75%, #059669 100%)',
                    animation: 'nkShimmerBtn 6s ease infinite',
                    boxShadow: `
                      0 18px 32px -8px rgba(2, 132, 199, 0.42),
                      0 8px 18px -4px rgba(16, 185, 129, 0.30),
                      inset 0 2px 3px rgba(255, 255, 255, 0.65),
                      inset 0 -4px 0 rgba(3, 105, 161, 0.45)
                    `,
                    border: '1px solid rgba(56, 189, 248, 0.7)'
                  }}
                >
                  {loading ? (
                    <span>Đang xác thực hệ thống...</span>
                  ) : (
                    <>
                      <span>Vào hệ thống điều hành</span>
                      <ArrowRight size={17} strokeWidth={2.5} />
                    </>
                  )}
                </button>
              </form>

              {/* Chân trang Kính 3D */}
              <div className="mt-6 pt-4 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400 font-semibold relative z-10">
                <span>© 2026 Công ty TNHH NK Nam Khánh</span>
                <span className="inline-flex items-center gap-1.5 text-emerald-600 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Hệ thống trực tuyến
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
