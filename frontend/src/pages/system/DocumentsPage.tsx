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
import { useTableResize } from '../../hooks/useTableResize';

export const DocumentsPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [activeTab, setActiveTab] = useState<'CONTRACT' | 'CERTIFICATE'>('CONTRACT');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const defaultDocWidths: Record<string, number> = {
    stt: 60,
    code: 140,
    title: 260,
    fileName: 220,
    fileSize: 110,
    uploadedBy: 160,
    createdAt: 120,
    actions: 140
  };

  const { columnWidths, startResize, getTableWidth } = useTableResize({
    tableKey: 'documents',
    defaultWidths: defaultDocWidths,
    minWidth: 50,
    minWidths: { stt: 45, actions: 120 }
  });

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
      <div className="table-container shadow-sm border border-gray-100 rounded-xl overflow-x-auto">
        <table
          className="table-custom"
          style={{
            width: `${getTableWidth(Object.keys(defaultDocWidths))}px`,
            minWidth: '100%',
            tableLayout: 'fixed',
            borderCollapse: 'separate',
            borderSpacing: 0
          }}
        >
          <thead className="bg-slate-50/90 border-b border-gray-200">
            <tr style={{ whiteSpace: 'nowrap' }}>
              <th className="table-th text-center select-none" style={{ width: `${columnWidths.stt || defaultDocWidths.stt}px`, position: 'relative' }}>
                <span>STT</span>
                <div className="col-resizer" onMouseDown={(e) => startResize('stt', e)} onClick={(e) => e.stopPropagation()} title="Kéo để chỉnh độ rộng" />
              </th>
              <th className="table-th select-none" style={{ width: `${columnWidths.code || defaultDocWidths.code}px`, position: 'relative' }}>
                <span>Mã hồ sơ</span>
                <div className="col-resizer" onMouseDown={(e) => startResize('code', e)} onClick={(e) => e.stopPropagation()} title="Kéo để chỉnh độ rộng" />
              </th>
              <th className="table-th select-none" style={{ width: `${columnWidths.title || defaultDocWidths.title}px`, position: 'relative' }}>
                <span>Tên hồ sơ giấy tờ</span>
                <div className="col-resizer" onMouseDown={(e) => startResize('title', e)} onClick={(e) => e.stopPropagation()} title="Kéo để chỉnh độ rộng" />
              </th>
              <th className="table-th select-none" style={{ width: `${columnWidths.fileName || defaultDocWidths.fileName}px`, position: 'relative' }}>
                <span>Tên tệp đính kèm</span>
                <div className="col-resizer" onMouseDown={(e) => startResize('fileName', e)} onClick={(e) => e.stopPropagation()} title="Kéo để chỉnh độ rộng" />
              </th>
              <th className="table-th select-none" style={{ width: `${columnWidths.fileSize || defaultDocWidths.fileSize}px`, position: 'relative' }}>
                <span>Dung lượng</span>
                <div className="col-resizer" onMouseDown={(e) => startResize('fileSize', e)} onClick={(e) => e.stopPropagation()} title="Kéo để chỉnh độ rộng" />
              </th>
              <th className="table-th select-none" style={{ width: `${columnWidths.uploadedBy || defaultDocWidths.uploadedBy}px`, position: 'relative' }}>
                <span>Người tải lên</span>
                <div className="col-resizer" onMouseDown={(e) => startResize('uploadedBy', e)} onClick={(e) => e.stopPropagation()} title="Kéo để chỉnh độ rộng" />
              </th>
              <th className="table-th select-none" style={{ width: `${columnWidths.createdAt || defaultDocWidths.createdAt}px`, position: 'relative' }}>
                <span>Ngày tạo</span>
                <div className="col-resizer" onMouseDown={(e) => startResize('createdAt', e)} onClick={(e) => e.stopPropagation()} title="Kéo để chỉnh độ rộng" />
              </th>
              <th className="table-th sticky-action-th" style={{ width: `${columnWidths.actions || defaultDocWidths.actions}px`, textAlign: 'right' }}>
                <span>Thao tác</span>
              </th>
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
                  <td className="table-td text-center text-xs text-gray-500 font-mono overflow-hidden">{index + 1}</td>
                  <td className="table-td whitespace-nowrap overflow-hidden">
                    <span className="font-semibold text-xs text-[#E53935] font-mono">
                      {doc.code}
                    </span>
                  </td>
                  <td className="table-td overflow-hidden">
                    <div className="flex flex-col min-w-0" title={doc.title}>
                      <span className="font-semibold text-xs text-gray-900 truncate">{doc.title}</span>
                      <div className="mt-0.5">
                        <span className="badge badge-blue" style={{ fontSize: '10px' }}>
                          {doc.type === 'CONTRACT' ? 'Hợp đồng mẫu' : 'CO-CQ / Năng lực'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="table-td overflow-hidden">
                    <div className="flex items-center gap-1.5 text-xs text-gray-700 min-w-0" title={doc.fileName}>
                      <FileCode size={14} className="text-gray-400 shrink-0" />
                      <span className="truncate">{doc.fileName}</span>
                    </div>
                  </td>
                  <td className="table-td text-xs text-gray-500 font-mono whitespace-nowrap overflow-hidden">
                    {formatFileSize(doc.fileSize)}
                  </td>
                  <td className="table-td text-xs text-gray-700 whitespace-nowrap overflow-hidden">
                    <span className="truncate block">{doc.uploadedBy?.fullName || 'Hệ thống'}</span>
                  </td>
                  <td className="table-td text-xs text-gray-500 font-mono whitespace-nowrap overflow-hidden">
                    {new Date(doc.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="table-td sticky-action-td whitespace-nowrap overflow-hidden" style={{ textAlign: 'right' }}>
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
