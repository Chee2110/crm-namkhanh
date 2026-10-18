import React, { useState, useEffect, useRef } from 'react';
import {
  Boxes,
  Plus,
  Layers,
  Package,
  Edit2,
  Trash2,
  AlertCircle,
  X
} from 'lucide-react';
import { api } from '../../services/api';
import { ProductGroup, ProductType, Category } from '../../types';
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
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [productTypeFilter, setProductTypeFilter] = useState('');

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

  const defaultColOrder = ['stt', 'code', 'name', 'productType', 'category', 'skuCount', 'actions'];

  const columnLabels: Record<string, string> = {
    stt: 'STT',
    code: 'Mã nhóm',
    name: 'Tên nhóm hàng hóa',
    productType: 'Thuộc loại hàng',
    category: 'Thuộc danh mục',
    skuCount: 'Số hàng hóa',
    actions: 'Thao tác'
  };

  const defaultVisibleCols: Record<string, boolean> = {
    stt: true,
    code: true,
    name: true,
    productType: true,
    category: true,
    skuCount: true,
    actions: true
  };

  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('namkhanh_product_groups_visible_cols');
      return saved ? JSON.parse(saved) : defaultVisibleCols;
    } catch {
      return defaultVisibleCols;
    }
  });

  const [columnOrder, setColumnOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('namkhanh_product_groups_col_order');
      return saved ? withActionsLast(JSON.parse(saved), defaultColOrder) : defaultColOrder;
    } catch {
      return defaultColOrder;
    }
  });

  const defaultGroupWidths: Record<string, number> = {
    stt: 60,
    code: 140,
    name: 240,
    productType: 220,
    category: 220,
    skuCount: 130,
    actions: 85
  };

  const { columnWidths, startResize, resetWidths, getTableWidth } = useTableResize({
    tableKey: 'product_groups_v1',
    defaultWidths: defaultGroupWidths,
    minWidth: 60,
    minWidths: {
      stt: 50,
      code: 100,
      name: 160,
      productType: 160,
      category: 160,
      skuCount: 110,
      actions: 75
    }
  });

  const handleReorderColumns = (newOrder: string[]) => {
    const normalized = withActionsLast(newOrder, defaultColOrder);
    setColumnOrder(normalized);
    try {
      localStorage.setItem('namkhanh_product_groups_col_order', JSON.stringify(normalized));
    } catch (e) {
      console.error(e);
    }
  };

  const toggleColumnVisibility = (key: string) => {
    setVisibleColumns((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem('namkhanh_product_groups_visible_cols', JSON.stringify(updated));
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
      localStorage.removeItem('namkhanh_product_groups_visible_cols');
      localStorage.removeItem('namkhanh_product_groups_col_order');
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
    categoryId: '',
    productTypeId: '',
    description: '',
    status: 'ACTIVE'
  });

  const loadCategoriesAndTypes = async () => {
    try {
      const [resCats, resTypes] = await Promise.all([
        api.get<Category[]>('/categories'),
        api.get<ProductType[]>('/product-types')
      ]);
      setCategories(resCats.data || []);
      setProductTypes(resTypes.data || []);
    } catch (err) {
      console.error('Lỗi khi tải danh mục / loại hàng:', err);
    }
  };

  const loadProductGroups = async (silent: boolean = false) => {
    try {
      if (!silent) setLoading(true);
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      if (categoryFilter) query.append('categoryId', categoryFilter);
      if (productTypeFilter) query.append('productTypeId', productTypeFilter);

      const resGroups = await api.get<ProductGroup[]>(`/product-groups?${query.toString()}`);
      setProductGroups(resGroups.data || []);
    } catch (err) {
      console.error('Lỗi khi tải nhóm hàng hóa:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const isFirstMount = useRef(true);
  useEffect(() => {
    setCurrentPage(1);
    if (isFirstMount.current) {
      isFirstMount.current = false;
      loadCategoriesAndTypes();
      loadProductGroups(false);
      return;
    }
    loadProductGroups(true);
  }, [search, categoryFilter, productTypeFilter]);

  const paginatedProductGroups = paginateProductGroups(productGroups);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadProductGroups(true);
  };

  const openAddModal = () => {
    setEditingGroup(null);
    const initialCatId = categoryFilter || categories[0]?.id || '';
    const filteredPts = initialCatId ? productTypes.filter((t) => t.categoryId === initialCatId) : productTypes;
    const initialPtId = productTypeFilter || filteredPts[0]?.id || '';

    setFormData({
      code: '',
      name: '',
      categoryId: initialCatId,
      productTypeId: initialPtId,
      description: '',
      status: 'ACTIVE'
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (g: ProductGroup) => {
    setEditingGroup(g);
    const catId = g.productType?.categoryId || (g.productType?.category as any)?.id || '';
    setFormData({
      code: g.code,
      name: g.name,
      categoryId: catId,
      productTypeId: g.productTypeId,
      description: g.description || '',
      status: g.status || 'ACTIVE'
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name?.trim() || !formData.productTypeId) {
      setFormError('Vui lòng điền tên nhóm hàng và chọn Loại hàng hóa cha');
      return;
    }
    if (!editingGroup && !formData.code?.trim()) {
      setFormError('Vui lòng nhập Mã nhóm hàng');
      return;
    }

    try {
      if (editingGroup) {
        await api.put(`/product-groups/${editingGroup.id}`, {
          name: formData.name.trim(),
          productTypeId: formData.productTypeId,
          description: formData.description,
          status: formData.status
        });
      } else {
        await api.post('/product-groups', {
          code: formData.code.trim().toUpperCase(),
          name: formData.name.trim(),
          productTypeId: formData.productTypeId,
          description: formData.description
        });
      }
      setIsModalOpen(false);
      loadProductGroups(true);
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu nhóm hàng');
    }
  };

  const handleDelete = async (g: ProductGroup) => {
    if (!confirm(`Bạn có chắc muốn xóa nhóm hàng "${g.name}" (${g.code})?`)) return;
    try {
      await api.delete(`/product-groups/${g.id}`);
      loadProductGroups(true);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể xóa nhóm hàng!');
    }
  };

  // Lọc loại hàng trong modal theo danh mục đang chọn
  const modalAvailableTypes = formData.categoryId
    ? productTypes.filter((t) => t.categoryId === formData.categoryId)
    : productTypes;

  // Lọc loại hàng trên thanh filter theo categoryFilter
  const filterAvailableTypes = categoryFilter
    ? productTypes.filter((t) => t.categoryId === categoryFilter)
    : productTypes;

  const canCreate = hasPermission('C_PRODUCT_TYPES', 'create') || hasPermission('C_PRODUCTS', 'create');
  const canUpdate = hasPermission('C_PRODUCT_TYPES', 'update') || hasPermission('C_PRODUCTS', 'update');
  const canDelete = hasPermission('C_PRODUCT_TYPES', 'delete') || hasPermission('C_PRODUCTS', 'delete');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', paddingBottom: '0.75rem' }}>
      {headerSlot ? (
        <div className="card p-3 sm:px-4 sm:py-2.5 rounded-2xl border border-slate-100/90 shadow-sm bg-white/95 backdrop-blur-md">
          {headerSlot}
        </div>
      ) : (
        <div className="card p-3 sm:px-4 sm:py-2.5 rounded-2xl border border-slate-100/90 shadow-sm bg-white/95 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-50 text-[#E53935] flex items-center justify-center border border-red-100 flex-shrink-0">
              <Boxes className="w-5 h-5 text-[#E53935]" />
            </div>
            <div>
              <div className="text-[11px] font-medium text-slate-400 mb-0.5">Quản lý hàng hóa / Nhóm hàng hóa</div>
              <h1 className="text-base font-bold text-gray-900 m-0 leading-tight">
                Nhóm Hàng Hóa (Cấp 3)
              </h1>
              <p className="text-xs text-gray-500 m-0 mt-0.5 font-normal">
                Quản lý các nhóm hàng hóa trực thuộc Loại hàng hóa Cấp 2 và Danh mục Cấp 1
              </p>
            </div>
          </div>
        </div>
      )}

      {/* THANH TÌM KIẾM & BỘ LỌC */}
      <div className="card p-3 sm:px-4 sm:py-2.5 rounded-2xl border border-slate-100/90 shadow-sm bg-white/95 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 flex-wrap">
            {/* Lọc theo Danh mục */}
            <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50/80 px-2 py-1 rounded-lg border border-gray-200/80">
              <Layers className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="font-semibold text-gray-700 whitespace-nowrap">Danh mục:</span>
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setProductTypeFilter(''); // Reset loại hàng khi đổi danh mục
                }}
                className="bg-transparent border-0 text-xs font-medium text-gray-900 focus:outline-none cursor-pointer pr-1"
              >
                <option value="">-- Tất cả danh mục --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Lọc theo Loại hàng */}
            <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50/80 px-2 py-1 rounded-lg border border-gray-200/80">
              <Package className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="font-semibold text-gray-700 whitespace-nowrap">Loại hàng:</span>
              <select
                value={productTypeFilter}
                onChange={(e) => setProductTypeFilter(e.target.value)}
                className="bg-transparent border-0 text-xs font-medium text-gray-900 focus:outline-none cursor-pointer pr-1"
              >
                <option value="">-- Tất cả loại hàng --</option>
                {filterAvailableTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Ô tìm kiếm */}
            <form onSubmit={handleSearch} className="flex-1 min-w-[200px] max-w-sm">
              <SearchInput
                value={search}
                onChange={(val) => setSearch(val)}
                onSearchImmediate={() => loadProductGroups(true)}
                placeholder="Tìm mã, tên nhóm hàng..."
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
              disabledKeys={['code', 'name']}
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
                <span>Thêm Nhóm Hàng</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* BẢNG DANH SÁCH NHÓM HÀNG */}
      <div className="card rounded-2xl border border-slate-100/80 shadow-card overflow-hidden p-0 flex flex-col flex-1 min-h-0">
        <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0 custom-scrollbar">
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
                      className={`py-1.5 ${colKey === 'actions' ? 'px-1.5' : 'px-2.5'} select-none overflow-hidden ${
                        colKey === 'actions'
                          ? 'sticky-action-th text-center'
                          : colKey === 'stt' || colKey === 'skuCount'
                          ? 'text-center'
                          : ''
                      }`}
                      style={{
                        width: `${columnWidths[colKey] || defaultGroupWidths[colKey]}px`,
                        position: colKey === 'actions' ? 'sticky' : 'relative'
                      }}
                    >
                      <span>{columnLabels[colKey]}</span>
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
                  <td colSpan={columnOrder.filter((k) => visibleColumns[k]).length || 7} className="py-8 text-center text-gray-500">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#E53935] mb-2"></div>
                    <p>Đang tải danh mục nhóm hàng...</p>
                  </td>
                </tr>
              ) : productGroups.length === 0 ? (
                <tr>
                  <td colSpan={columnOrder.filter((k) => visibleColumns[k]).length || 7} className="py-8 text-center text-gray-500">
                    Chưa có nhóm hàng hóa nào
                  </td>
                </tr>
              ) : (
                paginatedProductGroups.map((g, idx) => {
                  const catName = g.productType?.category?.name || '—';
                  const typeName = g.productType?.name || '—';

                  return (
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
                                  {g.description && (
                                    <div className="text-[11px] text-gray-400 truncate leading-tight mt-0.5" title={g.description}>
                                      {g.description}
                                    </div>
                                  )}
                                </td>
                              );
                            case 'productType':
                              return (
                                <td key={colKey} className="py-1 px-2.5 text-xs font-medium text-gray-700">
                                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 font-semibold text-blue-800" title={typeName}>
                                    <Package className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                    <span className="whitespace-normal break-words leading-tight">{typeName}</span>
                                  </span>
                                </td>
                              );
                            case 'category':
                              return (
                                <td key={colKey} className="py-1 px-2.5 text-xs font-medium text-gray-700">
                                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gray-100 font-semibold text-gray-800" title={catName}>
                                    <Layers className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                                    <span className="whitespace-normal break-words leading-tight">{catName}</span>
                                  </span>
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
                                        title="Chỉnh sửa nhóm hàng"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                    {canDelete && (
                                      <button
                                        type="button"
                                        onClick={() => handleDelete(g)}
                                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                                        title="Xóa nhóm hàng"
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PHÂN TRANG */}
        <div className="flex-shrink-0 bg-white">
          <TablePagination
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={productGroups.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      </div>

      {/* MODAL THÊM / SỬA NHÓM HÀNG */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg border border-gray-100 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-50 text-[#E53935] flex items-center justify-center border border-red-100">
                  <Boxes className="w-4 h-4 text-[#E53935]" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm">
                  {editingGroup ? 'Chỉnh Sửa Nhóm Hàng Hóa' : 'Thêm Nhóm Hàng Hóa Mới'}
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

              {/* CHỌN DANH MỤC & LOẠI HÀNG TỰ ĐỘNG ĐI VỚI NHAU */}
              <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-3">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-600" />
                  Phân Cấp: Danh Mục & Loại Hàng
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Danh mục cha (Cấp 1)
                    </label>
                    <select
                      value={formData.categoryId}
                      onChange={(e) => {
                        const newCatId = e.target.value;
                        const matchingPts = newCatId
                          ? productTypes.filter((t) => t.categoryId === newCatId)
                          : productTypes;
                        setFormData({
                          ...formData,
                          categoryId: newCatId,
                          productTypeId: matchingPts[0]?.id || ''
                        });
                      }}
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-[#E53935]"
                    >
                      <option value="">-- Chọn danh mục --</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Loại hàng hóa (Cấp 2) <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.productTypeId}
                      onChange={(e) => {
                        const ptId = e.target.value;
                        const pt = productTypes.find((t) => t.id === ptId);
                        setFormData({
                          ...formData,
                          productTypeId: ptId,
                          categoryId: pt?.categoryId || formData.categoryId
                        });
                      }}
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-[#E53935]"
                    >
                      <option value="">-- Chọn loại hàng --</option>
                      {modalAvailableTypes.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* MÃ & TÊN NHÓM */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Mã nhóm hàng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingGroup}
                    placeholder="VD: NH01, BIA-LA, BUT-GEL..."
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 text-xs font-mono font-bold border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-[#E53935] disabled:bg-gray-100 disabled:text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Tên nhóm hàng hóa <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Bìa lá, Bìa còng, Bút gel..."
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-[#E53935]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Mô tả / Ghi chú
                </label>
                <textarea
                  rows={3}
                  placeholder="Ghi chú về quy cách nhóm hàng..."
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
                  {editingGroup ? 'Lưu thay đổi' : 'Tạo nhóm hàng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
