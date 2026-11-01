import React, { useState, useEffect, useRef } from 'react';
import {
  Boxes,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  X,
  Filter
} from 'lucide-react';
import { api } from '../../services/api';
import { ProductGroup } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useTableResize } from '../../hooks/useTableResize';
import { ColumnCustomizerDropdown } from '../../components/common/ColumnCustomizerDropdown';
import { withActionsLast } from '../../utils/columnOrder';
import { TablePagination } from '../../components/common/TablePagination';
import { useAutoTablePagination } from '../../hooks/useAutoTablePagination';
import { SearchInput } from '../../components/common/SearchInput';

interface ProductGroupsPageProps {
  headerSlot?: React.ReactNode;
}

export const ProductGroupsPage: React.FC<ProductGroupsPageProps> = ({ headerSlot }) => {
  const { hasPermission } = useAuth();
  const [productGroups, setProductGroups] = useState<ProductGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Header filter states
  const [openFilterCol, setOpenFilterCol] = useState<string | null>(null);
  const [nameSearchInput, setNameSearchInput] = useState('');
  const filterMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(e.target as Node)) {
        setOpenFilterCol(null);
      }
    };
    if (openFilterCol) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openFilterCol]);

  // Pagination
  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    startIndex,
    paginate: paginateProductGroups
  } = useAutoTablePagination({
    totalItems: productGroups.length,
    rowHeight: 34,
    topOffset: 250,
    minRows: 6,
    maxRows: 50,
  });

  const defaultColOrder = ['stt', 'code', 'name', 'description', 'skuCount', 'actions'];

  const columnLabels: Record<string, string> = {
    stt: 'STT',
    code: 'Mã nhóm loại',
    name: 'Tên nhóm loại',
    description: 'Mô tả / Ghi chú',
    skuCount: 'Số hàng hóa',
    actions: 'Thao tác'
  };

  const defaultVisibleCols: Record<string, boolean> = {
    stt: true,
    code: true,
    name: true,
    description: true,
    skuCount: true,
    actions: true
  };

  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('namkhanh_product_groups_visible_cols_v2');
      return saved ? JSON.parse(saved) : defaultVisibleCols;
    } catch {
      return defaultVisibleCols;
    }
  });

  const [columnOrder, setColumnOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('namkhanh_product_groups_col_order_v2');
      return saved ? withActionsLast(JSON.parse(saved), defaultColOrder) : defaultColOrder;
    } catch {
      return defaultColOrder;
    }
  });

  const defaultGroupWidths: Record<string, number> = {
    stt: 60,
    code: 160,
    name: 280,
    description: 280,
    skuCount: 140,
    actions: 90
  };

  const { columnWidths, startResize, resetWidths, getTableWidth } = useTableResize({
    tableKey: 'product_groups_v2',
    defaultWidths: defaultGroupWidths,
    minWidth: 60,
    minWidths: {
      stt: 50,
      code: 110,
      name: 180,
      description: 160,
      skuCount: 110,
      actions: 75
    }
  });

  const handleReorderColumns = (newOrder: string[]) => {
    const normalized = withActionsLast(newOrder, defaultColOrder);
    setColumnOrder(normalized);
    try {
      localStorage.setItem('namkhanh_product_groups_col_order_v2', JSON.stringify(normalized));
    } catch (e) {
      console.error(e);
    }
  };

  const toggleColumnVisibility = (key: string) => {
    setVisibleColumns((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem('namkhanh_product_groups_visible_cols_v2', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const resetColumns = () => {
    setVisibleColumns(defaultVisibleCols);
    setColumnOrder(defaultColOrder);
    resetWidths();
    try {
      localStorage.removeItem('namkhanh_product_groups_visible_cols_v2');
      localStorage.removeItem('namkhanh_product_groups_col_order_v2');
    } catch (e) {
      console.error(e);
    }
  };

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ProductGroup | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    status: 'ACTIVE'
  });

  const loadProductGroups = async (silent: boolean = false) => {
    try {
      if (!silent) setLoading(true);
      const query = new URLSearchParams();
      if (search) query.append('search', search);

      const resGroups = await api.get<ProductGroup[]>(`/product-groups?${query.toString()}`);
      setProductGroups(resGroups.data || []);
    } catch (err) {
      console.error('Lỗi khi tải nhóm loại hàng hóa:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const isFirstMount = useRef(true);
  useEffect(() => {
    setCurrentPage(1);
    if (isFirstMount.current) {
      isFirstMount.current = false;
      loadProductGroups(false);
      return;
    }
    loadProductGroups(true);
  }, [search]);

  const paginatedProductGroups = paginateProductGroups(productGroups);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadProductGroups(true);
  };

  const openAddModal = () => {
    setEditingGroup(null);
    setFormData({
      code: '',
      name: '',
      description: '',
      status: 'ACTIVE'
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (g: ProductGroup) => {
    setEditingGroup(g);
    setFormData({
      code: g.code,
      name: g.name,
      description: g.description || '',
      status: g.status || 'ACTIVE'
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name?.trim()) {
      setFormError('Vui lòng nhập Tên nhóm loại hàng hóa');
      return;
    }

    try {
      if (editingGroup) {
        await api.put(`/product-groups/${editingGroup.id}`, {
          code: formData.code.trim().toUpperCase(),
          name: formData.name.trim(),
          description: formData.description,
          status: formData.status
        });
      } else {
        await api.post('/product-groups', {
          code: formData.code.trim().toUpperCase(),
          name: formData.name.trim(),
          description: formData.description
        });
      }
      setIsModalOpen(false);
      loadProductGroups(true);
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu nhóm loại hàng');
    }
  };

  const handleDelete = async (g: ProductGroup) => {
    if (!confirm(`Bạn có chắc muốn xóa nhóm loại "${g.name}" (${g.code})?`)) return;
    try {
      await api.delete(`/product-groups/${g.id}`);
      loadProductGroups(true);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể xóa nhóm loại hàng!');
    }
  };

  const canCreate = hasPermission('C_PRODUCT_TYPES', 'create') || hasPermission('C_PRODUCTS', 'create') || hasPermission('C_CATEGORIES', 'create');
  const canUpdate = hasPermission('C_PRODUCT_TYPES', 'update') || hasPermission('C_PRODUCTS', 'update') || hasPermission('C_CATEGORIES', 'update');
  const canDelete = hasPermission('C_PRODUCT_TYPES', 'delete') || hasPermission('C_PRODUCTS', 'delete') || hasPermission('C_CATEGORIES', 'delete');

  return (
    <div className="flex flex-col justify-between min-h-[calc(100vh-82px)] min-h-[calc(100dvh-82px)] pb-1">
      {/* KHỐI TẬP TRUNG: TIÊU ĐỀ, TABS & THANH CÔNG CỤ */}
      <div className="card p-3 sm:px-4 sm:py-2.5 rounded-2xl border border-slate-100/90 shadow-sm bg-white/95 backdrop-blur-md space-y-2 shrink-0 mb-2.5">
        {headerSlot ? (
          headerSlot
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-50 text-[#E53935] flex items-center justify-center border border-red-100 flex-shrink-0">
              <Boxes className="w-4 h-4 text-[#E53935]" />
            </div>
            <div>
              <div className="text-[11px] font-medium text-slate-400 mb-0.5">Quản lý hàng hóa / Nhóm loại</div>
              <h1 className="text-base font-bold text-gray-900 m-0 leading-tight">
                Nhóm Loại Hàng Hóa
              </h1>
              <p className="text-xs text-gray-500 m-0 mt-0.5 font-normal">
                Quản lý danh sách nhóm loại sản phẩm (Bút bi, Băng dính, Bìa FILE, Sổ, Giấy in...)
              </p>
            </div>
          </div>
        )}
        <div className="border-t border-slate-100" />

        {/* THANH CÔNG CỤ: TÌM KIẾM & NÚT THAO TÁC */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 flex-1 flex-wrap">
            <form onSubmit={handleSearch} className="flex-1 min-w-[220px] max-w-md">
              <SearchInput
                value={search}
                onChange={(val) => setSearch(val)}
                onSearchImmediate={() => loadProductGroups(true)}
                placeholder="Tìm theo mã hoặc tên nhóm loại..."
              />
            </form>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <ColumnCustomizerDropdown
              columnOrder={columnOrder}
              columnLabels={columnLabels}
              visibleColumns={visibleColumns}
              onToggleColumn={toggleColumnVisibility}
              onReorderColumns={handleReorderColumns}
              onReset={resetColumns}
              disabledKeys={['name']}
              buttonStyle={{ height: '32px' }}
            />

            {canCreate && (
              <button
                type="button"
                onClick={openAddModal}
                className="btn btn-primary btn-sm flex items-center gap-1.5 whitespace-nowrap shadow-glow"
                style={{ padding: '0.35rem 0.75rem', fontSize: '12.5px', height: '32px' }}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm Nhóm Loại</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* BẢNG DANH SÁCH NHÓM LOẠI HÀNG */}
      <div className="card rounded-2xl border border-slate-100/80 shadow-card overflow-hidden p-0 flex flex-col flex-1 min-h-[380px]">
        <div className="overflow-x-auto overflow-y-auto flex-1 min-h-[340px] custom-scrollbar">
          <table
            className="w-full text-left text-sm border-collapse"
            style={{
              width: `${getTableWidth(columnOrder.filter((k) => visibleColumns[k]))}px`,
              minWidth: '100%',
              tableLayout: 'fixed'
            }}
          >
            <thead className="sticky top-0 z-20 bg-slate-50 border-b border-gray-200 shadow-2xs">
              <tr className="bg-slate-50 text-gray-600 uppercase text-[11px] font-semibold tracking-wider whitespace-nowrap">
                {columnOrder
                  .filter((k) => visibleColumns[k])
                  .map((colKey) => (
                    <th
                      key={colKey}
                      className={`py-1.5 ${colKey === 'actions' ? 'px-1.5' : 'px-2.5'} select-none ${
                        openFilterCol === colKey ? 'overflow-visible z-40' : 'overflow-hidden'
                      } ${
                        colKey === 'actions'
                          ? 'sticky-action-th text-center'
                          : colKey === 'stt' || colKey === 'skuCount' || colKey === 'code'
                          ? 'text-center'
                          : ''
                      }`}
                      style={{
                        width: `${columnWidths[colKey] || defaultGroupWidths[colKey]}px`,
                        position: colKey === 'actions' ? 'sticky' : 'relative',
                        zIndex: openFilterCol === colKey ? 40 : undefined
                      }}
                    >
                      <div
                        className={`inline-flex items-center gap-1.5 w-full ${
                          colKey === 'stt' || colKey === 'actions' || colKey === 'skuCount' || colKey === 'code'
                            ? 'justify-center'
                            : 'justify-between'
                        }`}
                      >
                        <span className="truncate">{columnLabels[colKey]}</span>

                        {/* Nút lọc cho Tên nhóm loại */}
                        {colKey === 'name' && (
                          <div className="relative inline-flex items-center shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setNameSearchInput(search);
                                setOpenFilterCol(openFilterCol === 'name' ? null : 'name');
                              }}
                              onMouseDown={(e) => e.stopPropagation()}
                              title={search ? 'Đang lọc tìm kiếm (Nhấp để đổi hoặc bỏ lọc)' : 'Lọc theo tên nhóm loại'}
                              className={`p-1 rounded-md transition-colors cursor-pointer ${
                                search
                                  ? 'text-[#E53935] bg-red-50 border border-red-200'
                                  : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              <Filter size={11} className={search ? 'fill-[#E53935]' : ''} />
                            </button>

                            {openFilterCol === 'name' && (
                              <div
                                ref={filterMenuRef}
                                onClick={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                                className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 bg-white rounded-xl shadow-2xl border border-gray-200 p-2.5 z-50 text-left normal-case tracking-normal font-normal text-xs animate-in fade-in zoom-in-95"
                                style={{ width: '220px' }}
                              >
                                <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-gray-100">
                                  <span className="font-bold text-gray-800 text-[11px] uppercase tracking-wider">
                                    Lọc theo tên / mã
                                  </span>
                                  {search && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSearch('');
                                        setNameSearchInput('');
                                        setOpenFilterCol(null);
                                      }}
                                      className="text-[11px] text-[#E53935] hover:underline font-semibold cursor-pointer"
                                    >
                                      Bỏ lọc
                                    </button>
                                  )}
                                </div>
                                <div className="space-y-2">
                                  <input
                                    type="text"
                                    placeholder="Nhập từ khóa tìm..."
                                    value={nameSearchInput}
                                    onChange={(e) => setNameSearchInput(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        setSearch(nameSearchInput);
                                        setOpenFilterCol(null);
                                      }
                                    }}
                                    autoFocus
                                    className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:border-[#E53935]"
                                  />
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => setOpenFilterCol(null)}
                                      className="px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded-md"
                                    >
                                      Đóng
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSearch(nameSearchInput);
                                        setOpenFilterCol(null);
                                      }}
                                      className="px-2.5 py-1 text-xs bg-[#E53935] text-white font-medium rounded-md hover:bg-red-700"
                                    >
                                      Áp dụng
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {colKey !== 'actions' && (
                        <div
                          className="col-resizer"
                          onMouseDown={(e) => startResize(colKey, e)}
                          onClick={(e) => e.stopPropagation()}
                          title="Kéo để chỉnh độ rộng"
                        />
                      )}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={columnOrder.filter((k) => visibleColumns[k]).length || 6} className="py-8 text-center text-gray-500">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#E53935] mb-2"></div>
                    <p>Đang tải danh sách nhóm loại hàng...</p>
                  </td>
                </tr>
              ) : productGroups.length === 0 ? (
                <tr>
                  <td colSpan={columnOrder.filter((k) => visibleColumns[k]).length || 6} className="py-8 text-center text-gray-500">
                    Chưa có nhóm loại hàng hóa nào
                  </td>
                </tr>
              ) : (
                paginatedProductGroups.map((g, idx) => (
                  <tr key={g.id} className="hover:bg-slate-50/80 transition-colors">
                    {columnOrder
                      .filter((k) => visibleColumns[k])
                      .map((colKey) => {
                        switch (colKey) {
                          case 'stt':
                            return (
                              <td key={colKey} className="py-1 px-2.5 text-center text-gray-500 text-xs font-semibold whitespace-nowrap overflow-hidden">
                                {startIndex + idx + 1}
                              </td>
                            );
                          case 'code':
                            return (
                              <td key={colKey} className="py-1 px-2.5 font-mono font-bold text-[#E53935] text-xs whitespace-nowrap overflow-hidden text-center">
                                {g.code}
                              </td>
                            );
                          case 'name':
                            return (
                              <td key={colKey} className="py-1 px-2.5 overflow-hidden">
                                <div className="font-semibold text-gray-900 text-xs truncate leading-normal" title={g.name}>
                                  {g.name}
                                </div>
                              </td>
                            );
                          case 'description':
                            return (
                              <td key={colKey} className="py-1 px-2.5 text-xs text-gray-500 truncate overflow-hidden" title={g.description || ''}>
                                {g.description || '—'}
                              </td>
                            );
                          case 'skuCount':
                            return (
                              <td key={colKey} className="py-1 px-2.5 text-center whitespace-nowrap overflow-hidden">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700">
                                  {g._count?.products || 0} Hàng hóa
                                </span>
                              </td>
                            );
                          case 'actions':
                            return (
                              <td key={colKey} className="py-1 px-1.5 text-center sticky-action-td whitespace-nowrap">
                                <div className="flex items-center justify-center gap-1 w-full">
                                  {canUpdate && (
                                    <button
                                      type="button"
                                      onClick={() => openEditModal(g)}
                                      className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                                      title="Chỉnh sửa nhóm loại"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  {canDelete && (
                                    <button
                                      type="button"
                                      onClick={() => handleDelete(g)}
                                      className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                                      title="Xóa nhóm loại"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            );
                          default:
                            return null;
                        }
                      })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PHÂN TRANG */}
        <div className="shrink-0">
          <TablePagination
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={productGroups.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            itemLabel="nhóm loại"
          />
        </div>
      </div>

      {/* MODAL THÊM / SỬA NHÓM LOẠI */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-gray-100 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-50 text-[#E53935] flex items-center justify-center border border-red-100">
                  <Boxes className="w-4 h-4 text-[#E53935]" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm">
                  {editingGroup ? 'Chỉnh Sửa Nhóm Loại Hàng' : 'Thêm Nhóm Loại Hàng Mới'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 rounded-lg p-1 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-[#E53935] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Tên nhóm loại <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="VD: Bút bi, Băng dính, Bìa FILE, Sổ, Giấy in..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-[#E53935]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Mã nhóm loại <span className="text-gray-400 font-normal">(Để trống sẽ tự động tạo mã)</span>
                </label>
                <input
                  type="text"
                  placeholder="VD: BUT-BI, BANG-DINH, BIA-FILE..."
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 text-xs font-mono font-bold border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-[#E53935]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Mô tả / Ghi chú
                </label>
                <textarea
                  rows={3}
                  placeholder="Ghi chú thêm về nhóm loại hàng hóa..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-[#E53935]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#E53935] hover:bg-[#D32F2F] text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-sm"
                >
                  {editingGroup ? 'Lưu thay đổi' : 'Tạo nhóm loại'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
