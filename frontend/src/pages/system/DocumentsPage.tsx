import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Search,
  Download,
  Trash2,
  UploadCloud,
  FileCheck,
  AlertCircle,
  Eye,
  FileCode
} from 'lucide-react';
import { api } from '../../services/api';
import { LegalDocument } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const DocumentsPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [activeTab, setActiveTab] = useState<'CONTRACT' | 'CERTIFICATE'>('CONTRACT');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    title: '',
    type: 'CONTRACT' as 'CONTRACT' | 'CERTIFICATE'
  });

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        type: activeTab,
        ...(search ? { search } : {})
      });
      const res = await api.get<LegalDocument[]>(`/documents?${query.toString()}`);
      setDocuments(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [activeTab, search]);

  const openAddModal = () => {
    setFormData({
      code: activeTab === 'CONTRACT' ? `HD-MAU-${Date.now().toString().slice(-4)}` : `CQ-${Date.now().toString().slice(-4)}`,
      title: '',
      type: activeTab
    });
    setSelectedFile(null);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 25 * 1024 * 1024) {
        setFormError('Dung lượng tệp tin vượt quá giới hạn cho phép (Tối đa 25MB)');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setFormError(null);
      if (!formData.title) {
        // Tự động gợi ý tên tài liệu theo tên file không có extension
        const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        setFormData((prev) => ({ ...prev, title: nameWithoutExt }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.title) {
      setFormError('Vui lòng nhập đầy đủ Mã tài liệu và Tên tài liệu');
      return;
    }
    if (!selectedFile) {
      setFormError('Vui lòng chọn tệp tin đính kèm');
      return;
    }

    try {
      setUploading(true);
      const data = new FormData();
      data.append('code', formData.code);
      data.append('title', formData.title);
      data.append('type', formData.type);
      data.append('file', selectedFile);

      await api.post('/documents', data);
      setIsModalOpen(false);
      loadDocuments();
    } catch (err: any) {
      setFormError(err.message || 'Lỗi khi tải tài liệu lên');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (doc: LegalDocument) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tài liệu '${doc.title}'?`)) {
      return;
    }
    try {
      await api.delete(`/documents/${doc.id}`);
      loadDocuments();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xóa tài liệu');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Tab Navigation & Search */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* 2 Tabs chuyển đổi theo Section III.5 */}
          <div
            style={{
              display: 'flex',
              backgroundColor: '#F3F4F6',
              borderRadius: '0.5rem',
              padding: '2px'
            }}
          >
            <button
              onClick={() => setActiveTab('CONTRACT')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: activeTab === 'CONTRACT' ? '600' : '400',
                backgroundColor: activeTab === 'CONTRACT' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'CONTRACT' ? '#E53935' : '#6B7280',
                boxShadow: activeTab === 'CONTRACT' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              <FileText size={15} />
              <span>Tab 1: Hợp đồng mẫu</span>
            </button>
            <button
              onClick={() => setActiveTab('CERTIFICATE')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: activeTab === 'CERTIFICATE' ? '600' : '400',
                backgroundColor: activeTab === 'CERTIFICATE' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'CERTIFICATE' ? '#E53935' : '#6B7280',
                boxShadow: activeTab === 'CERTIFICATE' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              <FileCheck size={15} />
              <span>Tab 2: Chứng chỉ CO-CQ & Năng lực</span>
            </button>
          </div>

          <div style={{ position: 'relative', width: '260px' }}>
            <Search
              size={15}
              style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '0.75rem', color: '#9CA3AF' }}
            />
            <input
              type="text"
              placeholder="Tìm kiếm mã, tên hồ sơ..."
              className="input"
              style={{ paddingLeft: '2.25rem', paddingRight: '0.75rem' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {hasPermission('A_DOCUMENTS', 'create') && (
          <button onClick={openAddModal} className="btn btn-primary">
            <Plus size={16} />
            <span>Tải lên tài liệu</span>
          </button>
        )}
      </div>

      {/* DataGrid Bảng danh sách tài liệu */}
      <div className="table-container">
        <table className="table-custom">
          <thead>
            <tr>
              <th className="table-th" style={{ width: '50px' }}>STT</th>
              <th className="table-th">Mã hồ sơ</th>
              <th className="table-th">Tên hồ sơ giấy tờ</th>
              <th className="table-th">Tên tệp đính kèm</th>
              <th className="table-th">Dung lượng</th>
              <th className="table-th">Người tải lên</th>
              <th className="table-th">Ngày tạo</th>
              <th className="table-th" style={{ textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: '#6B7280' }}>
                  Đang tải danh sách tài liệu...
                </td>
              </tr>
            ) : documents.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#9CA3AF' }}>
                  Chưa có tài liệu nào trong phân loại này.
                </td>
              </tr>
            ) : (
              documents.map((doc, index) => (
                <tr key={doc.id} className="table-tr">
                  <td className="table-td" style={{ fontWeight: '500' }}>{index + 1}</td>
                  <td className="table-td">
                    <span style={{ fontWeight: '600', color: '#E53935', fontFamily: 'monospace' }}>
                      {doc.code}
                    </span>
                  </td>
                  <td className="table-td">
                    <div style={{ fontWeight: '600', color: '#111827' }}>{doc.title}</div>
                    <span className="badge badge-blue" style={{ fontSize: '10px', marginTop: '2px' }}>
                      {doc.type === 'CONTRACT' ? 'Hợp đồng mẫu' : 'CO-CQ / Năng lực'}
                    </span>
                  </td>
                  <td className="table-td">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#4B5563' }}>
                      <FileCode size={14} color="#6B7280" />
                      <span>{doc.fileName}</span>
                    </div>
                  </td>
                  <td className="table-td" style={{ fontSize: '12.5px', color: '#6B7280' }}>
                    {formatFileSize(doc.fileSize)}
                  </td>
                  <td className="table-td">{doc.uploadedBy?.fullName || 'Hệ thống'}</td>
                  <td className="table-td" style={{ fontSize: '12px', color: '#6B7280' }}>
                    {new Date(doc.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="table-td" style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.25rem' }}>
                      {/* Tải về an toàn */}
                      <a
                        href={`/api/v1/documents/${doc.id}/download`}
                        className="btn btn-secondary btn-sm"
                        style={{ color: '#1E88E5' }}
                        title="Tải về"
                      >
                        <Download size={13} />
                        <span>Tải về</span>
                      </a>

                      {/* Xem trước nếu là link web hoặc file trực tiếp */}
                      {doc.fileUrl && (
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary btn-sm"
                          title="Xem trước"
                        >
                          <Eye size={13} />
                        </a>
                      )}

                      {hasPermission('A_DOCUMENTS', 'delete') && (
                        <button
                          onClick={() => handleDelete(doc)}
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

      {/* MODAL UPLOAD TÀI LIỆU (TỐI ĐA 25MB) */}
      {isModalOpen && (
        <div className="modal-overlay fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="modal-content bg-white rounded-xl shadow-2xl w-full relative z-[1001] max-h-[90vh] overflow-y-auto" style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#111827' }}>
                Tải lên hồ sơ giấy tờ & Chứng chỉ mẫu
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
                    Phân loại hồ sơ *
                  </label>
                  <select
                    className="input"
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value as 'CONTRACT' | 'CERTIFICATE' })
                    }
                  >
                    <option value="CONTRACT">Hợp đồng mẫu</option>
                    <option value="CERTIFICATE">Chứng chỉ CO-CQ & Hồ sơ năng lực</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '0.25rem' }}>
                      Mã tài liệu *
                    </label>
                    <input
                      type="text"
                      className="input"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '0.25rem' }}>
                      Tên tài liệu / Tiêu đề *
                    </label>
                    <input
                      type="text"
                      className="input"
                      placeholder="VD: Hợp đồng cung ứng văn phòng phẩm trọn gói 2026..."
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>
                </div>

                {/* Khu vực Drag & Drop File */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '0.25rem' }}>
                    Tệp đính kèm (Tối đa 25MB: PDF, Word, Excel, Ảnh) *
                  </label>
                  <div
                    style={{
                      border: '2px dashed #D1D5DB',
                      borderRadius: '0.5rem',
                      padding: '1.5rem',
                      textAlign: 'center',
                      backgroundColor: '#F9FAFB',
                      cursor: 'pointer'
                    }}
                    onClick={() => document.getElementById('file-input')?.click()}
                  >
                    <input
                      id="file-input"
                      type="file"
                      style={{ display: 'none' }}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                    />
                    <UploadCloud size={32} color="#E53935" style={{ margin: '0 auto 0.5rem auto' }} />
                    {selectedFile ? (
                      <div>
                        <div style={{ fontWeight: '600', color: '#111827', fontSize: '13.5px' }}>
                          {selectedFile.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6B7280' }}>
                          Dung lượng: {formatFileSize(selectedFile.size)}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontWeight: '500', color: '#374151', fontSize: '13.5px' }}>
                          Nhấp để tải lên hoặc kéo thả tệp vào đây
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#9CA3AF', marginTop: '0.25rem' }}>
                          Hỗ trợ: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG (Dưới 25MB)
                        </div>
                      </div>
                    )}
                  </div>
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
                <button type="submit" disabled={uploading} className="btn btn-primary">
                  {uploading ? 'Đang tải lên...' : 'Tải lên tài liệu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
