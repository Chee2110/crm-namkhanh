import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Warehouse as WarehouseIcon,
  Layers,
  Truck,
  DollarSign,
  Edit2,
  Trash2,
  AlertCircle,
  X,
  Eye,
  SlidersHorizontal,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  GripVertical,
  RotateCcw,
  Columns
} from 'lucide-react';
import { api } from '../../services/api';
import { Product, Warehouse, Category, ProductType, Supplier } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { ImportExcelModal } from '../../components/common/ImportExcelModal';
import { useTableResize } from '../../hooks/useTableResize';

export const ProductsPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [showCostPrice, setShowCostPrice] = useState(false);

  // Modal Import Excel & Drag-and-drop Cột
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isColumnDropdownOpen, setIsColumnDropdownOpen] = useState(false);

  const defaultVisibleCols: Record<string, boolean> = {
    stt: true,
    code: true,
    name: true,
    category: true,
    supplier: true,
    unit: true,
    costPrice: true,
    sellingPrice: true,
    stock: true,
    actions: true
  };

  const defaultColOrder = [
    'stt',
    'code',
    'name',
    'category',
    'supplier',
    'unit',
    'costPrice',
    'sellingPrice',
    'stock',
    'actions'
  ];

  const columnLabels: Record<string, string> = {
    stt: 'STT',
    code: 'Mã SKU',
    name: 'Tên sản phẩm VPP',
    category: 'Phân loại & Kho',
    supplier: 'Nhà cung cấp',
    unit: 'ĐVT',
    costPrice: 'Giá vốn',
    sellingPrice: 'Giá bán',
    stock: 'Tồn kho',
    actions: 'Thao tác'
  };

  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('namkhanh_products_visible_cols');
      return saved ? JSON.parse(saved) : defaultVisibleCols;
    } catch {
      return defaultVisibleCols;
    }
  });

  const [columnOrder, setColumnOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('namkhanh_products_col_order');
      return saved ? JSON.parse(saved) : defaultColOrder;
    } catch {
      return defaultColOrder;
    }
  });

  const defaultProductWidths: Record<string, number> = {
    stt: 60,
    code: 150,
    name: 280,
    category: 200,
    unit: 80,
    costPrice: 130,
    sellingPrice: 130,
    stock: 130,
    actions: 140
  };

  const { columnWidths, startResize, resetWidths, getTableWidth } = useTableResize({
    tableKey: 'products',
    defaultWidths: defaultProductWidths,
    minWidth: 50,
    minWidths: { stt: 45, actions: 120 }
  });

  const [draggedCol, setDraggedCol] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, colKey: string) => {
    setDraggedCol(colKey);
    e.dataTransfer.setData('text/plain', colKey);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, colKey: string) => {
    e.preventDefault();
    if (draggedCol && draggedCol !== colKey) {
      setDragOverCol(colKey);
    }
  };

  const handleDragLeave = () => {
    setDragOverCol(null);
  };

  const handleDrop = (e: React.DragEvent, targetCol: string) => {
    e.preventDefault();
    if (!draggedCol || draggedCol === targetCol || targetCol === 'actions' || targetCol === 'stt' || draggedCol === 'actions' || draggedCol === 'stt') {
      setDraggedCol(null);
      setDragOverCol(null);
      return;
    }

    const newOrder = [...columnOrder];
    const dragIdx = newOrder.indexOf(draggedCol);
    const dropIdx = newOrder.indexOf(targetCol);

    if (dragIdx > -1 && dropIdx > -1) {
      newOrder.splice(dragIdx, 1);
      newOrder.splice(dropIdx, 0, draggedCol);
      const withoutActions = newOrder.filter((k) => k !== 'actions');
      withoutActions.push('actions');
      setColumnOrder(withoutActions);
      localStorage.setItem('namkhanh_products_col_order', JSON.stringify(withoutActions));
    }

    setDraggedCol(null);
    setDragOverCol(null);
  };

  const toggleColumnVisibility = (key: string) => {
    const updated = { ...visibleColumns, [key]: !visibleColumns[key] };
    setVisibleColumns(updated);
    localStorage.setItem('namkhanh_products_visible_cols', JSON.stringify(updated));
  };

  const resetColumns = () => {
    setVisibleColumns(defaultVisibleCols);
    setColumnOrder(defaultColOrder);
    resetWidths();
    localStorage.removeItem('namkhanh_products_visible_cols');
    localStorage.removeItem('namkhanh_products_col_order');
  };

  const handleImportProducts = async (rows: Record<string, any>[]) => {
    let successCount = 0;
    const errList: string[] = [];
    for (const r of rows) {
      try {
        const code = String(r['Mã SKU'] || '').trim().toUpperCase();
        const name = String(r['Tên sản phẩm'] || '').trim();
        const unit = String(r['Đơn vị tính'] || 'Ream').trim();
        const costPrice = Number(r['Giá nhập']) || 0;
        const sellingPrice = Number(r['Giá bán']) || 0;
        const stockQuantity = Number(r['Tồn kho ban đầu']) || 0;
        const minStockLevel = Number(r['Mức an toàn']) || 20;
        const barcode = r['Mã vạch'] ? String(r['Mã vạch']).trim() : undefined;

        if (!code || !name) continue;

        await api.post('/products', {
          code,
          name,
          unit,
          costPrice,
          sellingPrice,
          stockQuantity,
          minStockLevel,
          barcode,
          vatRate: 8,
          status: 'ACTIVE'
        });
        successCount++;
      } catch (err: any) {
        errList.push(err.message || 'Lỗi lưu sản phẩm');
      }
    }
    await loadData();
    return {
      success: successCount > 0,
      count: successCount,
      message: errList.length > 0 ? `Nhập được ${successCount} SP. Lỗi: ${errList.slice(0, 2).join(', ')}` : undefined
    };
  };
  const [showSpecs, setShowSpecs] = useState(false);

  // Modal Create / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formTab, setFormTab] = useState<'general' | 'supplier' | 'price' | 'specs'>('general');

  const [formData, setFormData] = useState({
    code: '',
    barcode: '',
    name: '',
    unit: 'Ream',
    warehouseId: '',
    categoryId: '',
    productTypeId: '',
    supplierId: '',
    supplierName: '',
    supplierPhone: '',
    supplierAddress: '',
    costPrice: 0,
    sellingPrice: 0,
    vatRate: 8,
    stockQuantity: 100,
    minStockLevel: 20,
    color: '',
    length: 0,
    width: 0,
    height: 0,
    weight: 0,
    description: '',
    status: 'ACTIVE'
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      if (warehouseFilter) query.append('warehouseId', warehouseFilter);
      if (categoryFilter) query.append('categoryId', categoryFilter);
      if (lowStockFilter) query.append('lowStock', 'true');

      const [resProd, resWh, resCat, resTypes, resSup] = await Promise.all([
        api.get<Product[]>(`/products?${query.toString()}`),
        api.get<Warehouse[]>('/warehouses'),
        api.get<Category[]>('/categories'),
        api.get<ProductType[]>('/product-types'),
        api.get<Supplier[]>('/suppliers')
      ]);

      setProducts(resProd.data || []);
      setWarehouses(resWh.data || []);
      setCategories(resCat.data || []);
      setProductTypes(resTypes.data || []);
      setSuppliers(resSup.data || []);
    } catch (err) {
      console.error('Lỗi khi tải sản phẩm VPP:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [warehouseFilter, categoryFilter, lowStockFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setFormTab('general');
    setFormData({
      code: '',
      barcode: '',
      name: '',
      unit: 'Ream',
      warehouseId: warehouses[0]?.id || '',
      categoryId: categories[0]?.id || '',
      productTypeId: productTypes[0]?.id || '',
      supplierId: suppliers[0]?.id || '',
      supplierName: '',
      supplierPhone: '',
      supplierAddress: '',
      costPrice: 50000,
      sellingPrice: 65000,
      vatRate: 8,
      stockQuantity: 100,
      minStockLevel: 20,
      color: '',
      length: 0,
      width: 0,
      height: 0,
      weight: 0,
      description: '',
      status: 'ACTIVE'
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormTab('general');
    setFormData({
      code: p.code,
      barcode: p.barcode || '',
      name: p.name,
      unit: p.unit,
      warehouseId: p.warehouseId || '',
      categoryId: p.categoryId || '',
      productTypeId: p.productTypeId || '',
      supplierId: p.supplierId || '',
      supplierName: p.supplier?.name || '',
      supplierPhone: p.supplier?.phone || '',
      supplierAddress: p.supplier?.address || '',
      costPrice: Number(p.costPrice),
      sellingPrice: Number(p.sellingPrice),
      vatRate: p.vatRate,
      stockQuantity: p.stockQuantity,
      minStockLevel: p.minStockLevel || 20,
      color: p.color || '',
      length: Number(p.length) || 0,
      width: Number(p.width) || 0,
      height: Number(p.height) || 0,
      weight: Number(p.weight) || 0,
      description: p.description || '',
      status: p.status
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name || !formData.code) {
      setFormError('Vui lòng nhập Mã SKU và Tên hàng hóa');
      return;
    }

    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, formData);
      } else {
        await api.post('/products', formData);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu hàng hóa');
    }
  };

  const handleDelete = async (p: Product) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa mặt hàng "${p.name}" (${p.code})?`)) return;
    try {
      await api.delete(`/products/${p.id}`);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể xóa mặt hàng!');
    }
  };

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);
  };

  return (
    <div className="space-y-6">
      {/* HEADER & FILTER */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-[#E53935]" />
            Quản Lý Hàng Hóa Chi Tiết (SKU Master - C.5)
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Danh mục sản phẩm VPP, giá vốn, giá bán, thuế VAT và tự động tạo mới Nhà Cung Cấp
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto relative">
          {/* Nút Tùy chỉnh cột */}
          <div className="relative">
            <button
              onClick={() => setIsColumnDropdownOpen(!isColumnDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title="Tùy biến hiển thị các cột trên bảng"
            >
              <Columns className="w-3.5 h-3.5 text-gray-500" />
              <span>Tùy chỉnh cột</span>
            </button>

            {isColumnDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 p-3 z-30 space-y-1.5 text-xs">
                <div className="font-bold text-gray-800 pb-1.5 border-b border-gray-100 flex justify-between items-center">
                  <span>Cột hiển thị</span>
                  <button
                    onClick={resetColumns}
                    className="text-red-600 hover:text-red-700 flex items-center gap-1 font-medium cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Mặc định</span>
                  </button>
                </div>
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {columnOrder.map((key) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={visibleColumns[key] ?? true}
                        onChange={() => toggleColumnVisibility(key)}
                        disabled={key === 'code' || key === 'name'}
                        className="rounded text-[#E53935]"
                      />
                      <span>{columnLabels[key]}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Nút Nhập Excel hàng loạt */}
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            title="Nhập danh sách sản phẩm hàng loạt từ Excel/CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Nhập Excel</span>
          </button>

          <button
            onClick={() => setLowStockFilter(!lowStockFilter)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
              lowStockFilter ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-gray-100 text-gray-600 border-gray-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            {lowStockFilter ? 'Đang lọc: Sắp hết' : 'Lọc sắp hết hàng'}
          </button>

          {hasPermission('C_PRODUCTS', 'create') && (
            <button
              onClick={openAddModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#E53935] hover:bg-[#D32F2F] text-white rounded-lg text-xs font-semibold shadow-sm transition-colors whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Thêm Sản Phẩm Mới
            </button>
          )}
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center">
        <form onSubmit={handleSearch} className="relative flex-1 w-full sm:w-auto">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo tên SP, mã SKU, barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#E53935]"
          />
        </form>

        <select
          value={warehouseFilter}
          onChange={(e) => setWarehouseFilter(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-[#E53935] w-full sm:w-auto"
        >
          <option value="">Tất cả kho</option>
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-[#E53935] w-full sm:w-auto"
        >
          <option value="">Tất cả danh mục</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={loadData}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg text-xs font-semibold"
        >
          Lọc
        </button>
      </div>

      {/* BẢNG DATAGRID SẢN PHẨM */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table
            className="w-full text-left text-sm border-collapse"
            style={{
              width: `${getTableWidth(columnOrder.filter((k) => visibleColumns[k]))}px`,
              minWidth: '100%',
              tableLayout: 'fixed'
            }}
          >
            <thead>
              <tr className="bg-slate-50/90 border-b border-gray-200 text-gray-600 uppercase text-[11px] font-semibold tracking-wider">
                {columnOrder
                  .filter((k) => visibleColumns[k])
                  .map((colKey) => (
                    <th
                      key={colKey}
                      draggable={colKey !== 'actions' && colKey !== 'stt'}
                      onDragStart={(e) => handleDragStart(e, colKey)}
                      onDragOver={(e) => handleDragOver(e, colKey)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, colKey)}
                      className={`py-3 px-3.5 select-none transition-colors whitespace-nowrap overflow-hidden ${
                        colKey === 'actions' ? 'sticky-action-th' : ''
                      } ${
                        dragOverCol === colKey ? 'bg-red-100 border-l-2 border-[#E53935]' : ''
                      } ${draggedCol === colKey ? 'opacity-50' : ''} ${
                        colKey === 'stt' || colKey === 'unit' || colKey === 'stock' || colKey === 'actions'
                          ? 'text-center'
                          : colKey === 'costPrice' || colKey === 'sellingPrice'
                          ? 'text-right'
                          : ''
                      }`}
                      style={{
                        width: `${columnWidths[colKey] || defaultProductWidths[colKey] || 120}px`,
                        position: colKey === 'actions' ? 'sticky' : 'relative',
                        cursor: colKey !== 'actions' && colKey !== 'stt' ? 'grab' : 'default'
                      }}
                      title={colKey !== 'actions' && colKey !== 'stt' ? 'Kéo thả để thay đổi vị trí cột' : undefined}
                    >
                      <div
                        className={`inline-flex items-center gap-1.5 overflow-hidden w-full ${
                          colKey === 'costPrice' || colKey === 'sellingPrice'
                            ? 'justify-end'
                            : colKey === 'stt' || colKey === 'unit' || colKey === 'stock' || colKey === 'actions'
                            ? 'justify-center'
                            : 'justify-start'
                        }`}
                      >
                        {colKey !== 'actions' && colKey !== 'stt' && (
                          <GripVertical className="w-3 h-3 text-gray-400 opacity-60 flex-shrink-0" />
                        )}
                        <span className="truncate">{columnLabels[colKey]}</span>
                      </div>
                      {colKey !== 'actions' && (
                        <div
                          className="col-resizer"
                          onMouseDown={(e) => startResize(colKey, e)}
                          onClick={(e) => e.stopPropagation()}
                          title="Kéo sang trái/phải để điều chỉnh độ rộng cột"
                        />
                      )}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={columnOrder.filter((k) => visibleColumns[k]).length} className="py-12 text-center text-gray-500">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#E53935] mb-2"></div>
                    <p>Đang tải danh sách hàng hóa...</p>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={columnOrder.filter((k) => visibleColumns[k]).length} className="py-12 text-center text-gray-500">
                    Không có sản phẩm nào phù hợp
                  </td>
                </tr>
              ) : (
                products.map((p, idx) => {
                  const isLow = p.stockQuantity <= (p.minStockLevel || 20);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      {columnOrder
                        .filter((k) => visibleColumns[k])
                        .map((colKey) => {
                          switch (colKey) {
                            case 'stt':
                              return (
                                <td key={colKey} className="py-3 px-3.5 text-center text-gray-500 text-xs font-semibold whitespace-nowrap overflow-hidden">
                                  {idx + 1}
                                </td>
                              );
                            case 'code':
                              return (
                                <td key={colKey} className="py-3 px-3.5 whitespace-nowrap overflow-hidden">
                                  <div className="flex items-center gap-1.5 min-w-0" title={`Mã: ${p.code}${p.barcode ? ` - Barcode: ${p.barcode}` : ''}`}>
                                    <span className="font-mono font-bold text-gray-900 text-xs">{p.code}</span>
                                    {p.barcode && (
                                      <span className="font-mono text-[10px] text-gray-500 bg-gray-100 px-1 py-0.5 rounded shrink-0">
                                        {p.barcode}
                                      </span>
                                    )}
                                  </div>
                                </td>
                              );
                            case 'name':
                              return (
                                <td key={colKey} className="py-2.5 px-3.5 overflow-hidden">
                                  <div className="min-w-0" title={`${p.name}${p.description ? `\n• ${p.description}` : ''}`}>
                                    <div className="font-semibold text-gray-900 text-sm truncate leading-snug">
                                      {p.name}
                                    </div>
                                    {p.description && (
                                      <div className="text-xs text-gray-400 truncate mt-0.5">
                                        {p.description}
                                      </div>
                                    )}
                                  </div>
                                </td>
                              );
                            case 'category':
                              return (
                                <td key={colKey} className="py-2.5 px-3.5 text-xs overflow-hidden">
                                  <div className="min-w-0" title={`Danh mục: ${p.categoryRel?.name || p.category} - Kho: ${p.warehouse?.name || 'Tổng kho'}`}>
                                    <span className="font-semibold text-gray-800 truncate block">
                                      {p.categoryRel?.name || p.category}
                                    </span>
                                    <span className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5 truncate">
                                      <WarehouseIcon className="w-3 h-3 text-gray-400 shrink-0" />
                                      <span className="truncate">{p.warehouse?.name || 'Tổng kho'}</span>
                                    </span>
                                  </div>
                                </td>
                              );
                            case 'supplier':
                              return (
                                <td key={colKey} className="py-3 px-3.5 text-xs text-gray-700 whitespace-nowrap overflow-hidden">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 max-w-[150px] truncate" title={p.supplier?.name || 'Chưa gán'}>
                                    {p.supplier?.name || 'Chưa gán'}
                                  </span>
                                </td>
                              );
                            case 'unit':
                              return (
                                <td key={colKey} className="py-3 px-3.5 text-center text-xs font-semibold text-gray-600 whitespace-nowrap overflow-hidden">
                                  {p.unit}
                                </td>
                              );
                            case 'costPrice':
                              return (
                                <td key={colKey} className="py-3 px-3.5 text-right text-xs font-medium text-gray-600 whitespace-nowrap overflow-hidden tabular-nums">
                                  {formatVND(Number(p.costPrice))}
                                </td>
                              );
                            case 'sellingPrice':
                              return (
                                <td key={colKey} className="py-3 px-3.5 text-right text-xs font-bold text-[#E53935] whitespace-nowrap overflow-hidden tabular-nums">
                                  {formatVND(Number(p.sellingPrice))}
                                </td>
                              );
                            case 'stock':
                              return (
                                <td key={colKey} className="py-3 px-3.5 text-center whitespace-nowrap overflow-hidden">
                                  <span
                                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                                      isLow ? 'bg-amber-100 text-amber-800' : 'bg-emerald-50 text-emerald-700'
                                    }`}
                                  >
                                    {p.stockQuantity} {p.unit}
                                  </span>
                                </td>
                              );
                            case 'actions':
                              return (
                                <td key={colKey} className="py-3 px-3.5 text-center sticky-action-td whitespace-nowrap">
                                  <div className="flex items-center justify-center gap-1">
                                    {hasPermission('C_PRODUCTS', 'update') && (
                                      <button
                                        onClick={() => openEditModal(p)}
                                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                        title="Chỉnh sửa sản phẩm"
                                      >
                                        <Edit2 className="w-4 h-4" />
                                      </button>
                                    )}
                                    {hasPermission('C_PRODUCTS', 'delete') && (
                                      <button
                                        onClick={() => handleDelete(p)}
                                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                        title="Xóa sản phẩm"
                                      >
                                        <Trash2 className="w-4 h-4" />
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
      </div>

      {/* MODAL THÊM / SỬA HÀNG HÓA VỚI 4 KHỐI TAB CHUẨN ĐẶC TẢ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-red-50/50">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-[#E53935]" />
                <div>
                  <h3 className="font-bold text-gray-900">
                    {editingProduct ? 'Chỉnh Sửa Mặt Hàng SKU' : 'Khai Báo Sản Phẩm VPP Mới (SKU Master)'}
                  </h3>
                  <p className="text-xs text-gray-500">Tự động tạo Nhà cung cấp nếu tên NCC mới chưa có trên hệ thống</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 4 Tabs Form */}
            <div className="flex border-b border-gray-200 bg-gray-50/80 px-6 pt-2">
              <button
                type="button"
                onClick={() => setFormTab('general')}
                className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
                  formTab === 'general'
                    ? 'border-[#E53935] text-[#E53935] bg-white'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                1. Thông tin chung
              </button>
              <button
                type="button"
                onClick={() => setFormTab('supplier')}
                className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
                  formTab === 'supplier'
                    ? 'border-[#E53935] text-[#E53935] bg-white'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                2. Nguồn gốc & NCC
              </button>
              <button
                type="button"
                onClick={() => setFormTab('price')}
                className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
                  formTab === 'price'
                    ? 'border-[#E53935] text-[#E53935] bg-white'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                3. Giá vốn & Tồn kho
              </button>
              <button
                type="button"
                onClick={() => setFormTab('specs')}
                className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
                  formTab === 'specs'
                    ? 'border-[#E53935] text-[#E53935] bg-white'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                4. Quy cách & Kích thước
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-[#E53935] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {formError}
                </div>
              )}

              {/* KHỐI 1: THÔNG TIN CHUNG */}
              {formTab === 'general' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Mã SKU <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        disabled={!!editingProduct}
                        placeholder="VD: SP-GIAY-05, SP-BUT-10..."
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        className="w-full px-3 py-2 text-xs font-mono font-bold border border-gray-200 rounded-lg disabled:bg-gray-100 focus:outline-none focus:border-[#E53935]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Mã vạch Barcode</label>
                      <input
                        type="text"
                        placeholder="VD: 8935001802711..."
                        value={formData.barcode}
                        onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                        className="w-full px-3 py-2 text-xs font-mono border border-gray-200 rounded-lg focus:outline-none focus:border-[#E53935]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Tên hàng hóa VPP <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Giấy in A4 Double A 80gsm..."
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#E53935]"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Kho lưu trữ</label>
                      <select
                        value={formData.warehouseId}
                        onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white"
                      >
                        <option value="">-- Chọn kho --</option>
                        {warehouses.map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Danh mục Cấp 1</label>
                      <select
                        value={formData.categoryId}
                        onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white"
                      >
                        <option value="">-- Chọn danh mục --</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Loại hàng Cấp 2</label>
                      <select
                        value={formData.productTypeId}
                        onChange={(e) => setFormData({ ...formData, productTypeId: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white"
                      >
                        <option value="">-- Chọn loại hàng --</option>
                        {productTypes.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Đơn vị tính chính <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Ream, Hộp, Cây, Cuộn, Thùng, Cái..."
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#E53935]"
                    />
                  </div>
                </div>
              )}

              {/* KHỐI 2: NGUỒN GỐC & NHÀ CUNG CẤP */}
              {formTab === 'supplier' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Chọn Nhà Cung Cấp có sẵn
                    </label>
                    <select
                      value={formData.supplierId}
                      onChange={(e) => {
                        const sid = e.target.value;
                        const s = suppliers.find((item) => item.id === sid);
                        setFormData({
                          ...formData,
                          supplierId: sid,
                          supplierName: s ? s.name : '',
                          supplierPhone: s ? s.phone || '' : '',
                          supplierAddress: s ? s.address || '' : ''
                        });
                      }}
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white"
                    >
                      <option value="">-- Hoặc nhập tên NCC mới bên dưới --</option>
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 space-y-3">
                    <p className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                      <Truck className="w-4 h-4" />
                      Tự động tạo Nhà Cung Cấp mới nếu chưa có trên hệ thống:
                    </p>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Tên Nhà Cung Cấp
                      </label>
                      <input
                        type="text"
                        placeholder="VD: Công ty TNHH Văn Phòng Phẩm Minh Đức..."
                        value={formData.supplierName}
                        onChange={(e) =>
                          setFormData({ ...formData, supplierName: e.target.value, supplierId: '' })
                        }
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-[#E53935]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">SĐT NCC</label>
                        <input
                          type="text"
                          placeholder="SĐT liên hệ"
                          value={formData.supplierPhone}
                          onChange={(e) => setFormData({ ...formData, supplierPhone: e.target.value })}
                          className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Địa chỉ NCC</label>
                        <input
                          type="text"
                          placeholder="Địa chỉ nhà máy / kho"
                          value={formData.supplierAddress}
                          onChange={(e) => setFormData({ ...formData, supplierAddress: e.target.value })}
                          className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* KHỐI 3: GIÁ VỐN & TỒN KHO */}
              {formTab === 'price' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Giá vốn / Giá nhập (VNĐ) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={formData.costPrice}
                        onChange={(e) =>
                          setFormData({ ...formData, costPrice: Math.max(0, parseInt(e.target.value) || 0) })
                        }
                        className="w-full px-3 py-2 text-xs font-bold border border-gray-200 rounded-lg focus:outline-none focus:border-[#E53935]"
                      />
                      <span className="text-[11px] text-gray-400 mt-1 block">
                        Định dạng: {formatVND(formData.costPrice)}
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Giá bán niêm yết (VNĐ) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={formData.sellingPrice}
                        onChange={(e) =>
                          setFormData({ ...formData, sellingPrice: Math.max(0, parseInt(e.target.value) || 0) })
                        }
                        className="w-full px-3 py-2 text-xs font-bold text-[#E53935] border border-gray-200 rounded-lg focus:outline-none focus:border-[#E53935]"
                      />
                      <span className="text-[11px] text-gray-400 mt-1 block">
                        Định dạng: {formatVND(formData.sellingPrice)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Thuế VAT (%)</label>
                      <select
                        value={formData.vatRate}
                        onChange={(e) => setFormData({ ...formData, vatRate: parseInt(e.target.value) || 8 })}
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white"
                      >
                        <option value={8}>8% (Tiêu chuẩn VPP)</option>
                        <option value={10}>10% (Thiết bị máy VP)</option>
                        <option value={0}>0% (Miễn thuế)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Số lượng tồn kho ban đầu
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.stockQuantity}
                        onChange={(e) =>
                          setFormData({ ...formData, stockQuantity: Math.max(0, parseInt(e.target.value) || 0) })
                        }
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Định mức tồn tối thiểu
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.minStockLevel}
                        onChange={(e) =>
                          setFormData({ ...formData, minStockLevel: Math.max(0, parseInt(e.target.value) || 0) })
                        }
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* KHỐI 4: QUY CÁCH & KÍCH THƯỚC */}
              {formTab === 'specs' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Màu sắc</label>
                      <input
                        type="text"
                        placeholder="VD: Trắng, Xanh, Đen, Trong suốt..."
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Trọng lượng (kg)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="VD: 2.5 kg..."
                        value={formData.weight}
                        onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Dài (mm)</label>
                      <input
                        type="number"
                        value={formData.length}
                        onChange={(e) => setFormData({ ...formData, length: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Rộng (mm)</label>
                      <input
                        type="number"
                        value={formData.width}
                        onChange={(e) => setFormData({ ...formData, width: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Cao (mm)</label>
                      <input
                        type="number"
                        value={formData.height}
                        onChange={(e) => setFormData({ ...formData, height: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Mô tả chi tiết & Quy cách đóng gói
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Mô tả tiêu chuẩn đóng gói (VD: 500 tờ/ream, 5 ream/thùng)..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full p-2.5 text-xs border border-gray-200 rounded-lg"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <div className="flex gap-2">
                  {formTab !== 'general' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (formTab === 'specs') setFormTab('price');
                        else if (formTab === 'price') setFormTab('supplier');
                        else if (formTab === 'supplier') setFormTab('general');
                      }}
                      className="px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-xs font-semibold"
                    >
                      Quay lại
                    </button>
                  )}
                  {formTab !== 'specs' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (formTab === 'general') setFormTab('supplier');
                        else if (formTab === 'supplier') setFormTab('price');
                        else if (formTab === 'price') setFormTab('specs');
                      }}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-semibold"
                    >
                      Tiếp theo
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-xs"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#E53935] hover:bg-[#D32F2F] text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    {editingProduct ? 'Lưu thay đổi' : 'Lưu sản phẩm'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL IMPORT EXCEL HÀNG LOẠT */}
      <ImportExcelModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Nhập danh sách Sản phẩm VPP từ Excel/CSV"
        sampleFileName="Mau_Nhap_San_Pham_NamKhanh.csv"
        sampleHeaders={[
          'Mã SKU',
          'Tên sản phẩm',
          'Đơn vị tính',
          'Giá nhập',
          'Giá bán',
          'Tồn kho ban đầu',
          'Mức an toàn',
          'Mã vạch'
        ]}
        sampleRows={[
          ['SP-GIAY-001', 'Giấy in Bãi Bằng A4 70gsm', 'Ream', 52000, 68000, 150, 25, '8936012345678'],
          ['SP-BUT-002', 'Bút bi Thiên Long TL-027 Xanh', 'Hộp', 42000, 55000, 80, 15, '8936012345679']
        ]}
        requiredFields={['Mã SKU', 'Tên sản phẩm', 'Đơn vị tính', 'Giá bán']}
        fieldMappingHelp="Điền Mã SKU, Tên sản phẩm, ĐVT, Giá nhập, Giá bán. Giá nhập và Giá bán nhập số nguyên (VNĐ)."
        onImport={handleImportProducts}
      />
    </div>
  );
};
