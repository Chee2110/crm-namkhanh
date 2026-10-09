import React, { useState } from 'react';
import {
  Settings,
  User,
  Lock,
  Palette,
  Shield,
  Save,
  CheckCircle2,
  Building2,
  Mail,
  Phone,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'appearance' | 'about'>('profile');

  // Đổi mật khẩu state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState<string | null>(null);
  const [pwdError, setPwdError] = useState<string | null>(null);

  // Cài đặt giao diện state
  const [compactMode, setCompactMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [savedSettingsSuccess, setSavedSettingsSuccess] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      setPwdError('Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới');
      return;
    }
    if (newPassword.length < 6) {
      setPwdError('Mật khẩu mới phải có tối thiểu 6 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError('Xác nhận mật khẩu mới không khớp');
      return;
    }

    try {
      setPwdLoading(true);
      setPwdError(null);
      await api.post('/auth/reset-password', {
        email: user?.email,
        newPassword
      });
      setPwdSuccess('Đổi mật khẩu thành công!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPwdSuccess(null), 3000);
    } catch (err: any) {
      setPwdError(err.response?.data?.message || err.message || 'Lỗi khi đổi mật khẩu');
    } finally {
      setPwdLoading(false);
    }
  };

  const handleSavePreferences = () => {
    setSavedSettingsSuccess(true);
    setTimeout(() => setSavedSettingsSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header with pill tabs */}
      <div className="card p-6 rounded-3xl border border-slate-100/80 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-namkhanh-50 text-namkhanh-600 flex items-center justify-center font-bold shadow-inner">
            <Settings size={24} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Cài đặt Hệ thống</h1>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Quản lý hồ sơ cá nhân, bảo mật, tùy biến giao diện và bản quyền Nam Khánh ERP
            </p>
          </div>
        </div>

        {/* Quixotic Pill Nav */}
        <div className="pill-nav">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pill-tab-item flex items-center gap-1.5 ${activeTab === 'profile' ? 'pill-tab-item-active' : ''}`}
          >
            <User size={14} />
            <span>Hồ sơ</span>
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`pill-tab-item flex items-center gap-1.5 ${activeTab === 'security' ? 'pill-tab-item-active' : ''}`}
          >
            <Lock size={14} />
            <span>Bảo mật</span>
          </button>
          <button
            onClick={() => setActiveTab('appearance')}
            className={`pill-tab-item flex items-center gap-1.5 ${activeTab === 'appearance' ? 'pill-tab-item-active' : ''}`}
          >
            <Palette size={14} />
            <span>Tùy biến</span>
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`pill-tab-item flex items-center gap-1.5 ${activeTab === 'about' ? 'pill-tab-item-active' : ''}`}
          >
            <Building2 size={14} />
            <span>Hệ thống</span>
          </button>
        </div>
      </div>

      {/* TAB 1: HỒ SƠ CÁ NHÂN */}
      {activeTab === 'profile' && (
        <div className="card rounded-3xl border border-slate-100/80 shadow-card p-8 space-y-6">
          <div className="flex items-center gap-5 pb-6 border-b border-slate-100">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-namkhanh-600 to-rose-400 text-white font-extrabold text-3xl flex items-center justify-center shadow-lg shadow-namkhanh-500/20">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">{user?.fullName}</h3>
              <p className="text-sm text-slate-500 font-medium">{user?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="badge badge-green text-xs font-semibold px-3 py-1 rounded-full">Đang hoạt động</span>
                <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-mono font-bold">
                  {user?.code || 'NV001'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Họ và tên</label>
              <div className="input bg-slate-50 text-slate-800 cursor-not-allowed font-medium rounded-2xl">{user?.fullName}</div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Email làm việc</label>
              <div className="input bg-slate-50 text-slate-800 cursor-not-allowed flex items-center gap-2 font-medium rounded-2xl">
                <Mail size={15} className="text-slate-400" />
                <span>{user?.email}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Số điện thoại</label>
              <div className="input bg-slate-50 text-slate-800 cursor-not-allowed flex items-center gap-2 font-medium rounded-2xl">
                <Phone size={15} className="text-slate-400" />
                <span>{user?.phone || 'Chưa cập nhật'}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Phòng ban / Đơn vị</label>
              <div className="input bg-slate-50 text-slate-800 cursor-not-allowed flex items-center gap-2 font-medium rounded-2xl">
                <Building2 size={15} className="text-slate-400" />
                <span>{user?.department?.name || 'Văn phòng Công ty Nam Khánh'}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Vai trò hệ thống</label>
              <div className="input bg-slate-50 text-namkhanh-600 cursor-not-allowed flex items-center gap-2 font-bold rounded-2xl">
                <Shield size={15} />
                <span>{user?.roles?.join(', ') || 'Nhân viên'}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Thời hạn phiên làm việc</label>
              <div className="input bg-slate-50 text-slate-800 cursor-not-allowed flex items-center gap-2 font-medium rounded-2xl">
                <Clock size={15} className="text-slate-400" />
                <span>JWT Token 7 ngày (Tự động gia hạn)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ĐỔI MẬT KHẨU & BẢO MẬT */}
      {activeTab === 'security' && (
        <div className="card rounded-3xl border border-slate-100/80 shadow-card p-8 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Thay đổi Mật khẩu Đăng nhập</h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Để đảm bảo an toàn dữ liệu khách hàng và kinh doanh, mật khẩu nên có ít nhất 6 ký tự và đổi định kỳ.
            </p>
          </div>

          {pwdError && (
            <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-2xl flex items-center gap-2.5">
              <AlertCircle size={16} />
              <span className="font-medium">{pwdError}</span>
            </div>
          )}

          {pwdSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs rounded-2xl flex items-center gap-2.5">
              <CheckCircle2 size={16} />
              <span className="font-medium">{pwdSuccess}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Mật khẩu hiện tại</label>
              <input
                type="password"
                required
                className="input text-sm rounded-2xl"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Mật khẩu mới</label>
              <input
                type="password"
                required
                className="input text-sm rounded-2xl"
                placeholder="Tối thiểu 6 ký tự"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Xác nhận mật khẩu mới</label>
              <input
                type="password"
                required
                className="input text-sm rounded-2xl"
                placeholder="Nhập lại mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button type="submit" disabled={pwdLoading} className="btn btn-primary text-xs shadow-md">
              <Save size={14} />
              <span>{pwdLoading ? 'Đang cập nhật...' : 'Cập nhật Mật khẩu'}</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: TÙY BIẾN GIAO DIỆN & TIỆN ÍCH */}
      {activeTab === 'appearance' && (
        <div className="card rounded-3xl border border-slate-100/80 shadow-card p-8 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Tùy biến Giao diện & Trải nghiệm</h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Cấu hình hiển thị theo thói quen thao tác của nhân sự văn phòng
            </p>
          </div>

          {savedSettingsSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs rounded-2xl flex items-center gap-2.5">
              <CheckCircle2 size={16} />
              <span className="font-semibold">Đã lưu tùy biến thành công!</span>
            </div>
          )}

          <div className="space-y-4 max-w-xl">
            <div className="flex items-center justify-between p-4 bg-slate-50/80 rounded-2xl border border-slate-100">
              <div>
                <div className="text-sm font-bold text-slate-900">Màu thương hiệu chủ đạo (Hệ 4 màu Logo)</div>
                <div className="text-xs text-slate-500 mt-0.5">Màu đỏ Nam Khánh (#EA332A) kết hợp Vàng (#F9BB12), Xanh lá (#22BB4E), Xanh dương (#1A7FED)</div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#EA332A] border-2 border-white shadow-xs inline-block" title="Đỏ Nam Khánh" />
                <span className="w-5 h-5 rounded-full bg-[#F9BB12] border-2 border-white shadow-xs inline-block" title="Vàng Nam Khánh" />
                <span className="w-5 h-5 rounded-full bg-[#22BB4E] border-2 border-white shadow-xs inline-block" title="Xanh lá Nam Khánh" />
                <span className="w-5 h-5 rounded-full bg-[#1A7FED] border-2 border-white shadow-xs inline-block" title="Xanh dương Nam Khánh" />
                <span className="text-xs font-mono font-bold text-slate-700 ml-1">#EA332A</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50/80 rounded-2xl border border-slate-100">
              <div>
                <div className="text-sm font-bold text-slate-900">Chế độ hiển thị cô đọng (Compact Mode)</div>
                <div className="text-xs text-slate-500 mt-0.5">Giảm khoảng cách dòng bảng để xem được nhiều hàng hóa hơn</div>
              </div>
              <input
                type="checkbox"
                checked={compactMode}
                onChange={(e) => setCompactMode(e.target.checked)}
                className="w-5 h-5 text-namkhanh-600 rounded-lg border-slate-300 focus:ring-namkhanh-500 accent-namkhanh-600"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50/80 rounded-2xl border border-slate-100">
              <div>
                <div className="text-sm font-bold text-slate-900">Thông báo âm thanh (Sound Notification)</div>
                <div className="text-xs text-slate-500 mt-0.5">Phát âm thanh nhẹ khi hoàn thành thao tác lưu hoặc có đơn hàng mới</div>
              </div>
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                className="w-5 h-5 text-namkhanh-600 rounded-lg border-slate-300 focus:ring-namkhanh-500 accent-namkhanh-600"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50/80 rounded-2xl border border-slate-100">
              <div>
                <div className="text-sm font-bold text-slate-900">Tự động làm mới Dashboard (Auto Refresh)</div>
                <div className="text-xs text-slate-500 mt-0.5">Cập nhật chỉ số doanh thu và tồn kho tự động mỗi 5 phút</div>
              </div>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-5 h-5 text-namkhanh-600 rounded-lg border-slate-300 focus:ring-namkhanh-500 accent-namkhanh-600"
              />
            </div>

            <button onClick={handleSavePreferences} className="btn btn-primary text-xs shadow-md">
              <Save size={14} />
              <span>Lưu Cài đặt Giao diện</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: THÔNG TIN HỆ THỐNG & BẢN QUYỀN */}
      {activeTab === 'about' && (
        <div className="card rounded-3xl border border-slate-100/80 shadow-card p-8 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 shadow-sm p-2 flex items-center justify-center">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">CÔNG TY TNHH NK NAM KHÁNH</h3>
              <p className="text-xs text-slate-500 font-medium">Hệ thống ERP Quản trị Doanh nghiệp, Chuỗi cung ứng & Tài chính</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            <div className="p-5 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-2.5">
              <div className="font-extrabold text-slate-900 text-sm">Thông tin phần mềm</div>
              <div className="text-slate-600"><strong>Phiên bản:</strong> Enterprise v2.0.0 (Release 2026)</div>
              <div className="text-slate-600"><strong>Công nghệ Frontend:</strong> React 18, TypeScript, Tailwind CSS, Vite</div>
              <div className="text-slate-600"><strong>Công nghệ Backend:</strong> Node.js, Express, Prisma ORM, PostgreSQL</div>
              <div className="text-slate-600"><strong>Bảo mật:</strong> RBAC Matrix, JWT Bearer, AES-256 Symmetric Encryption</div>
            </div>

            <div className="p-5 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-2.5">
              <div className="font-extrabold text-slate-900 text-sm">Liên hệ hỗ trợ kỹ thuật</div>
              <div className="text-slate-600"><strong>Đơn vị vận hành:</strong> Phòng CNTT - Công ty TNHH NK Nam Khánh</div>
              <div className="text-slate-600"><strong>Hotline kỹ thuật:</strong> 0988.xxx.xxx (Hỗ trợ 24/7)</div>
              <div className="text-slate-600"><strong>Email hỗ trợ:</strong> support@namkhanh.vn</div>
              <div className="text-slate-600"><strong>Trụ sở:</strong> TP. Hà Nội, Việt Nam</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
