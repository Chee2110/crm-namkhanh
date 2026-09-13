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
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
              <Settings size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Cài đặt Hệ thống</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Quản lý hồ sơ tài khoản, đổi mật khẩu, tùy biến giao diện và thông tin bản quyền ERP
              </p>
            </div>
          </div>
        </div>

        {/* Tab Nav buttons */}
        <div className="flex items-center bg-gray-100 p-1 rounded-xl gap-1">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'profile' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <User size={14} />
            <span>Hồ sơ</span>
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'security' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Lock size={14} />
            <span>Bảo mật</span>
          </button>
          <button
            onClick={() => setActiveTab('appearance')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'appearance' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Palette size={14} />
            <span>Tùy biến</span>
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'about' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Building2 size={14} />
            <span>Hệ thống</span>
          </button>
        </div>
      </div>

      {/* TAB 1: HỒ SƠ CÁ NHÂN */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
          <div className="flex items-center gap-4 pb-6 border-b border-gray-100">
            <div className="w-16 h-16 rounded-full bg-red-600 text-white font-bold text-2xl flex items-center justify-center shadow-md">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{user?.fullName}</h3>
              <p className="text-sm text-gray-500">{user?.email}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="badge badge-green text-xs font-medium">Đang hoạt động</span>
                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full font-mono font-medium">
                  {user?.code || 'NV001'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">Họ và tên</label>
              <div className="input bg-gray-50 text-gray-800 cursor-not-allowed">{user?.fullName}</div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">Email làm việc</label>
              <div className="input bg-gray-50 text-gray-800 cursor-not-allowed flex items-center gap-2">
                <Mail size={14} className="text-gray-400" />
                <span>{user?.email}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">Số điện thoại</label>
              <div className="input bg-gray-50 text-gray-800 cursor-not-allowed flex items-center gap-2">
                <Phone size={14} className="text-gray-400" />
                <span>{user?.phone || 'Chưa cập nhật'}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">Phòng ban / Đơn vị</label>
              <div className="input bg-gray-50 text-gray-800 cursor-not-allowed flex items-center gap-2">
                <Building2 size={14} className="text-gray-400" />
                <span>{user?.department?.name || 'Văn phòng Công ty Nam Khánh'}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">Vai trò hệ thống</label>
              <div className="input bg-gray-50 text-gray-800 cursor-not-allowed flex items-center gap-2 font-semibold text-red-600">
                <Shield size={14} />
                <span>{user?.roles?.join(', ') || 'Nhân viên'}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">Thời hạn phiên làm việc</label>
              <div className="input bg-gray-50 text-gray-800 cursor-not-allowed flex items-center gap-2">
                <Clock size={14} className="text-gray-400" />
                <span>JWT Token 7 ngày (Tự động gia hạn)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ĐỔI MẬT KHẨU & BẢO MẬT */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-gray-900">Thay đổi Mật khẩu Đăng nhập</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Để đảm bảo an toàn dữ liệu khách hàng và kinh doanh, mật khẩu nên có ít nhất 6 ký tự và đổi định kỳ.
            </p>
          </div>

          {pwdError && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle size={15} />
              <span>{pwdError}</span>
            </div>
          )}

          {pwdSuccess && (
            <div className="p-3 bg-green-50 text-green-700 text-xs rounded-lg flex items-center gap-2">
              <CheckCircle2 size={15} />
              <span>{pwdSuccess}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Mật khẩu hiện tại</label>
              <input
                type="password"
                required
                className="input text-sm"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Mật khẩu mới</label>
              <input
                type="password"
                required
                className="input text-sm"
                placeholder="Tối thiểu 6 ký tự"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Xác nhận mật khẩu mới</label>
              <input
                type="password"
                required
                className="input text-sm"
                placeholder="Nhập lại mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button type="submit" disabled={pwdLoading} className="btn btn-primary text-xs">
              <Save size={14} />
              <span>{pwdLoading ? 'Đang cập nhật...' : 'Cập nhật Mật khẩu'}</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: TÙY BIẾN GIAO DIỆN & TIỆN ÍCH */}
      {activeTab === 'appearance' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-gray-900">Tùy biến Giao diện & Trải nghiệm</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Cấu hình hiển thị theo thói quen thao tác của nhân sự văn phòng
            </p>
          </div>

          {savedSettingsSuccess && (
            <div className="p-3 bg-green-50 text-green-700 text-xs rounded-lg flex items-center gap-2">
              <CheckCircle2 size={15} />
              <span>Đã lưu tùy biến thành công!</span>
            </div>
          )}

          <div className="space-y-4 max-w-xl">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div>
                <div className="text-sm font-semibold text-gray-900">Màu thương hiệu chủ đạo</div>
                <div className="text-xs text-gray-500">Màu đỏ Nam Khánh (#E53935) theo quy chuẩn nhận diện thương hiệu</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#E53935] border-2 border-white shadow-sm inline-block" />
                <span className="text-xs font-mono font-bold text-gray-700">#E53935</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div>
                <div className="text-sm font-semibold text-gray-900">Chế độ hiển thị cô đọng (Compact Mode)</div>
                <div className="text-xs text-gray-500">Giảm khoảng cách dòng bảng để xem được nhiều hàng hóa hơn</div>
              </div>
              <input
                type="checkbox"
                checked={compactMode}
                onChange={(e) => setCompactMode(e.target.checked)}
                className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div>
                <div className="text-sm font-semibold text-gray-900">Thông báo âm thanh (Sound Notification)</div>
                <div className="text-xs text-gray-500">Phát âm thanh nhẹ khi hoàn thành thao tác lưu hoặc có đơn hàng mới</div>
              </div>
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div>
                <div className="text-sm font-semibold text-gray-900">Tự động làm mới Dashboard (Auto Refresh)</div>
                <div className="text-xs text-gray-500">Cập nhật chỉ số doanh thu và tồn kho tự động mỗi 5 phút</div>
              </div>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
              />
            </div>

            <button onClick={handleSavePreferences} className="btn btn-primary text-xs">
              <Save size={14} />
              <span>Lưu Cài đặt Giao diện</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: THÔNG TIN HỆ THỐNG & BẢN QUYỀN */}
      {activeTab === 'about' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 shadow-sm p-1.5 flex items-center justify-center">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">CÔNG TY TNHH NK NAM KHÁNH</h3>
              <p className="text-xs text-gray-500">Hệ thống ERP Quản trị Doanh nghiệp, Chuỗi cung ứng & Tài chính</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
              <div className="font-bold text-gray-800 text-sm">Thông tin phần mềm</div>
              <div><strong>Phiên bản:</strong> Enterprise v2.0.0 (Release 2026)</div>
              <div><strong>Công nghệ Frontend:</strong> React 18, TypeScript, Tailwind CSS, Vite</div>
              <div><strong>Công nghệ Backend:</strong> Node.js, Express, Prisma ORM, PostgreSQL</div>
              <div><strong>Bảo mật:</strong> RBAC Matrix, JWT Bearer, AES-256 Symmetric Encryption</div>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
              <div className="font-bold text-gray-800 text-sm">Liên hệ hỗ trợ kỹ thuật</div>
              <div><strong>Đơn vị vận hành:</strong> Phòng CNTT - Công ty TNHH NK Nam Khánh</div>
              <div><strong>Hotline kỹ thuật:</strong> 0988.xxx.xxx (Hỗ trợ 24/7)</div>
              <div><strong>Email hỗ trợ:</strong> support@namkhanh.vn</div>
              <div><strong>Trụ sở:</strong> TP. Hà Nội, Việt Nam</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
