import React, { useState, useEffect, useRef } from 'react';
import {
  Package,
  Plus,
  Warehouse as WarehouseIcon,
  Layers,
  Truck,
  DollarSign,
  Edit2,
  Trash2,
  AlertCircle,
  AlertTriangle,
  FileSpreadsheet,
  Upload,
  Image as ImageIcon,
  Loader2,
  Download,
  Filter,
  Check,
  ArrowLeft,
  Boxes
} from 'lucide-react';
import { api } from '../../services/api';
import { Product, Warehouse, Category, ProductType, ProductGroup, Supplier } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { ImportExcelModal } from '../../components/common/ImportExcelModal';
import ExcelJS from 'exceljs';
import { useTableResize } from '../../hooks/useTableResize';
import { Toast } from '../../components/common/Toast';
import { StatusBadgeDropdown, StatusOption } from '../../components/common/StatusBadgeDropdown';
import { ColumnCustomizerDropdown } from '../../components/common/ColumnCustomizerDropdown';
import { withActionsLast } from '../../utils/columnOrder';
import { TablePagination } from '../../components/common/TablePagination';
import { useAutoTablePagination } from '../../hooks/useAutoTablePagination';
import { SearchInput } from '../../components/common/SearchInput';

const PRODUCT_STATUS_OPTIONS: StatusOption[] = [
  { value: 'ACTIVE', label: 'Đang kinh doanh', colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-300' },
  { value: 'INACTIVE', label: 'Ngừng kinh doanh', colorClass: 'bg-red-50 text-red-700 border-red-300' }
];

interface ProductsPageProps {
  headerSlot?: React.ReactNode;
}

const normalizeTextLabel = (val?: string | null): string => {
  if (!val) return '';
  const trimmed = String(val).trim().replace(/\s+/g, ' ');
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};

export const ProductsPage: React.FC<ProductsPageProps> = ({ headerSlot }) => {
  const { hasPermission } = useAuth();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [productGroups, setProductGroups] = useState<ProductGroup[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [categoryFilter] = useState('');
  const [productTypeFilter] = useState('');
  const [productGroupFilter, setProductGroupFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);

  // Pagination (vừa vặn màn hình laptop, tự động tăng/giảm dòng khi zoom)
  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    startIndex,
    paginate: paginateProducts
  } = useAutoTablePagination({
    totalItems: products.length,
    rowHeight: 35,
    topOffset: 270,
    minRows: 6,
    maxRows: 50,
  });

  // Header filter states
  const [openFilterCol, setOpenFilterCol] = useState<string | null>(null);
  const [whSearchTerm, setWhSearchTerm] = useState('');
  const [groupSearchTerm, setGroupSearchTerm] = useState('');
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

  // Modal Import Excel & Tùy chỉnh Cột (Chuẩn 15 cột dữ liệu theo file DU_LIEU_HANG_HOA.xlsx + Trạng thái + Thao tác)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const defaultVisibleCols: Record<string, boolean> = {
    stt: true,
    warehouseCode: true,
    warehouseName: true,
    subTypeName: true,
    image: true,
    code: true,
    name: true,
    brand: true,
    color: true,
    specification: true,
    unit: true,
    costPrice: true,
    sellingPrice: true,
    vatRate: true,
    stockQuantity: true,
    status: true,
    actions: true
  };

  const defaultColOrder = [
    'stt',
    'warehouseCode',
    'warehouseName',
    'subTypeName',
    'image',
    'code',
    'name',
    'brand',
    'color',
    'specification',
    'unit',
    'costPrice',
    'sellingPrice',
    'vatRate',
    'stockQuantity',
    'status',
    'actions'
  ];

  const columnLabels: Record<string, string> = {
    stt: 'Stt',
    warehouseCode: 'Mã kho',
    warehouseName: 'Tên Kho',
    subTypeName: 'Tên nhóm loại',
    image: 'Hình ảnh',
    code: 'Mã sản phẩm',
    name: 'Tên sản phẩm',
    brand: 'Thương hiệu',
    color: 'Màu sắc',
    specification: 'Quy cách',
    unit: 'Đơn vị tính',
    costPrice: 'Giá nhập',
    sellingPrice: 'Giá bán',
    vatRate: 'Thuế VAT',
    stockQuantity: 'Tồn kho',
    status: 'Trạng thái',
    actions: 'Thao tác'
  };

  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('namkhanh_products_visible_cols_v8');
      if (saved) {
        const parsed = JSON.parse(saved);
        delete parsed.categoryCode;
        delete parsed.categoryName;
        delete parsed.productTypeCode;
        delete parsed.productTypeName;
        delete parsed.subTypeCode;
        delete parsed.minStockLevel;
        delete parsed.maxStockLevel;
        if (parsed.warehouseName !== undefined && parsed.code !== undefined) return parsed;
      }
      return defaultVisibleCols;
    } catch {
      return defaultVisibleCols;
    }
  });

  const [columnOrder, setColumnOrder] = useState<string[]>(() => {
    try {
      const oldKeys = [
        'namkhanh_products_col_order',
        'namkhanh_products_visible_cols',
        'namkhanh_products_col_order_v2',
        'namkhanh_products_visible_cols_v2',
        'namkhanh_products_col_order_v3',
        'namkhanh_products_visible_cols_v3',
        'namkhanh_products_col_order_v4',
        'namkhanh_products_visible_cols_v4',
        'namkhanh_products_col_order_v5',
        'namkhanh_products_visible_cols_v5',
        'namkhanh_products_col_order_v6',
        'namkhanh_products_visible_cols_v6',
        'namkhanh_products_col_order_v7',
        'namkhanh_products_visible_cols_v7'
      ];
      oldKeys.forEach((k) => {
        try {
          localStorage.removeItem(k);
        } catch {
          // ignore
        }
      });

      const saved = localStorage.getItem('namkhanh_products_col_order_v8');
      if (saved) {
        const parsed = JSON.parse(saved);
        const filtered = parsed.filter(
          (c: string) =>
            ![
              'categoryCode',
              'categoryName',
              'productTypeCode',
              'productTypeName',
              'subTypeCode',
              'minStockLevel',
              'maxStockLevel'
            ].includes(c)
        );
        if (filtered.includes('code')) return withActionsLast(filtered, defaultColOrder);
      }
      return defaultColOrder;
    } catch {
      return defaultColOrder;
    }
  });

  const defaultProductWidths: Record<string, number> = {
    stt: 50,
    warehouseCode: 85,
    warehouseName: 115,
    subTypeName: 140,
    image: 75,
    code: 115,
    name: 250,
    brand: 115,
    color: 95,
    specification: 120,
    unit: 95,
    costPrice: 110,
    sellingPrice: 110,
    vatRate: 85,
    stockQuantity: 100,
    status: 135,
    actions: 95
  };

  const { columnWidths, startResize, resetWidths, getTableWidth } = useTableResize({
    tableKey: 'products_v8',
    defaultWidths: defaultProductWidths,
    minWidth: 50,
    minWidths: {
      stt: 45,
      warehouseCode: 70,
      warehouseName: 90,
      subTypeName: 100,
      image: 65,
      code: 90,
      name: 150,
      brand: 80,
      unit: 70,
      color: 70,
      specification: 90,
      costPrice: 85,
      sellingPrice: 85,
      vatRate: 70,
      stockQuantity: 75,
      status: 100,
      actions: 80
    }
  });

  const handleReorderColumns = (newOrder: string[]) => {
    const normalized = withActionsLast(newOrder, defaultColOrder);
    setColumnOrder(normalized);
    try {
      localStorage.setItem('namkhanh_products_col_order_v8', JSON.stringify(normalized));
    } catch {
      // ignore
    }
  };

  const toggleColumnVisibility = (key: string) => {
    const updated = { ...visibleColumns, [key]: !visibleColumns[key] };
    setVisibleColumns(updated);
    try {
      localStorage.setItem('namkhanh_products_visible_cols_v8', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const resetColumns = () => {
    setVisibleColumns(defaultVisibleCols);
    setColumnOrder(defaultColOrder);
    resetWidths();
    const oldKeys = [
      'namkhanh_products_visible_cols',
      'namkhanh_products_col_order',
      'namkhanh_products_visible_cols_v2',
      'namkhanh_products_col_order_v2',
      'namkhanh_products_visible_cols_v3',
      'namkhanh_products_col_order_v3',
      'namkhanh_products_visible_cols_v4',
      'namkhanh_products_col_order_v4',
      'namkhanh_products_visible_cols_v5',
      'namkhanh_products_col_order_v5',
      'namkhanh_products_visible_cols_v6',
      'namkhanh_products_col_order_v6',
      'namkhanh_products_visible_cols_v7',
      'namkhanh_products_col_order_v7',
      'namkhanh_products_visible_cols_v8',
      'namkhanh_products_col_order_v8'
    ];
    oldKeys.forEach((k) => {
      try {
        localStorage.removeItem(k);
      } catch {
        // ignore
      }
    });
  };

  const handleImportProducts = async (rows: Record<string, any>[]) => {
    let successCount = 0;
    const errList: string[] = [];

    const parseNum = (val: any, fallback = 0) => {
      if (val === undefined || val === null || String(val).trim() === '') return fallback;
      const cleaned = String(val).replace(/[^0-9.-]+/g, '');
      if (!cleaned) return fallback;
      const parsed = Number(cleaned);
      return isNaN(parsed) ? fallback : parsed;
    };

    for (const r of rows) {
      try {
        const code = String(r['Mã sản phẩm'] || r['Mã SKU'] || r['Mã SP'] || '').trim().toUpperCase();
        const name = String(r['Tên sản phẩm'] || r['Tên SP'] || '').trim();
        if (!code || !name) continue;

        const warehouseCode = String(r['Mã kho'] || r['Mã Kho'] || '').trim().toUpperCase() || 'NK01';
        const warehouseName = String(r['Tên Kho'] || r['Tên kho'] || '').trim() || 'Kho số 1';
        const categoryCode = String(r['Mã danh mục'] || r['Mã Danh Mục'] || '').trim();
        const categoryName = String(r['Tên danh mục'] || r['Tên Danh Mục'] || '').trim();
        const productTypeCode = String(r['Mã loại'] || r['Mã Loại'] || '').trim();
        const productTypeName = String(r['Tên loại'] || r['Tên Loại'] || '').trim();
        const subTypeCode = String(r['Mã nhóm loại'] || r['Mã Nhóm Loại'] || '').trim();
        const subTypeName = normalizeTextLabel(r['Tên nhóm loại'] || r['Tên Nhóm Loại'] || '');
        let imageUrl = String(r['Hình ảnh sản phẩm'] || r['Hình ảnh'] || r['image'] || '').trim();
        const brand = String(r['Thương hiệu'] || r['Nhãn hiệu'] || '').trim();
        const color = String(r['Màu sắc'] || '').trim();
        const specification = String(r['Quy cách'] || '').trim();
        const unit = normalizeTextLabel(r['Đơn vị tính'] || r['ĐVT'] || 'Chiếc') || 'Chiếc';
        const costPrice = parseNum(r['Giá nhập'] ?? r['Giá vốn'], 0);
        const sellingPrice = parseNum(r['Giá bán'], 0);
        const vatRate = parseNum(r['Thuế VAT'] ?? r['VAT'], 8);
        const rawStock = r['Tồn kho'] ?? r['Số lượng tồn'] ?? r['Số lượng'] ?? r['Tồn'];
        const stockQuantity = parseNum(rawStock, 0);

        // NẾU CÓ HÌNH ẢNH TRÍCH XUẤT TỪ FILE EXCEL (dạng blob hoặc data:image/)
        if (r._imageBlob || (imageUrl && imageUrl.startsWith('data:image/'))) {
          try {
            const fd = new FormData();
            if (r._imageBlob) {
              fd.append('file', r._imageBlob, `${code.toLowerCase()}-${Date.now()}.png`);
            } else {
              const match = imageUrl.match(/^data:image\/(png|jpeg|jpg);base64,(.+)$/i);
              const ext = match ? (match[1].toLowerCase() === 'jpg' ? 'jpeg' : match[1].toLowerCase()) : 'png';
              const b64 = match ? match[2] : imageUrl.split(',')[1];
              const byteChars = atob(b64);
              const byteNums = new Array(byteChars.length);
              for (let i = 0; i < byteChars.length; i++) {
                byteNums[i] = byteChars.charCodeAt(i);
              }
              const byteArray = new Uint8Array(byteNums);
              const blob = new Blob([byteArray], { type: `image/${ext}` });
              fd.append('file', blob, `${code.toLowerCase()}-${Date.now()}.${ext}`);
            }
            const upRes = await api.post('/products/upload-image', fd);
            if (upRes.data?.data?.imageUrl || upRes.data?.imageUrl) {
              imageUrl = upRes.data?.data?.imageUrl || upRes.data?.imageUrl;
            }
          } catch (upErr) {
            console.warn(`Không thể upload ảnh SP ${code}:`, upErr);
          }
        }

        const payload: any = {
          code,
          name,
          warehouseCode,
          warehouseName,
          categoryCode: categoryCode || undefined,
          categoryName: categoryName || undefined,
          category: subTypeName || categoryName || 'Văn phòng phẩm',
          productTypeCode: productTypeCode || undefined,
          productTypeName: productTypeName || undefined,
          subTypeCode: subTypeCode || undefined,
          subTypeName: subTypeName || undefined,
          imageUrl: imageUrl || null,
          brand,
          color,
          specification,
          unit,
          costPrice,
          sellingPrice,
          vatRate,
          minStockLevel: 0,
          maxStockLevel: 0,
          stockQuantity,
          status: 'ACTIVE'
        };

        // RÀNG BUỘC UPSERT: Nếu sản phẩm đã có trong hệ thống thì cập nhật, ngược lại tạo mới
        const existing = products.find((p) => p.code.toUpperCase() === code);
        if (existing) {
          await api.put(`/products/${existing.id}`, payload);
        } else {
          await api.post('/products', payload);
        }
        successCount++;
      } catch (err: any) {
        errList.push(err.response?.data?.message || err.message || 'Lỗi lưu sản phẩm');
      }
    }
    await Promise.all([loadMetadata(), loadProducts(false)]);
    return {
      success: successCount > 0,
      count: successCount,
      message: errList.length > 0 ? `Đã xử lý ${successCount} SP. Lỗi: ${errList.slice(0, 2).join(', ')}` : undefined
    };
  };

  const [isExporting, setIsExporting] = useState(false);

  // Helper chuẩn hóa đường dẫn hình ảnh cho web & bảng dữ liệu
  const formatImageUrl = (url?: string | null): string => {
    if (!url) return '';
    const trimmed = String(url).trim();
    if (
      trimmed.startsWith('data:') ||
      trimmed.startsWith('blob:') ||
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://')
    ) {
      return trimmed;
    }
    if (trimmed.startsWith('/uploads/')) {
      return trimmed;
    }
    if (trimmed.startsWith('uploads/')) {
      return `/${trimmed}`;
    }
    return trimmed;
  };

  // Helper chuyển đổi URL hình ảnh sang Base64 để nhúng vào Excel
  const fetchImageAsBase64 = async (
    url: string
  ): Promise<{ base64: string; extension: 'png' | 'jpeg' } | null> => {
    if (!url) return null;
    try {
      if (url.startsWith('data:image/')) {
        const match = url.match(/^data:image\/(png|jpeg|jpg);base64,(.+)$/i);
        if (match) {
          return {
            extension: match[1].toLowerCase() === 'jpg' ? 'jpeg' : (match[1].toLowerCase() as 'png' | 'jpeg'),
            base64: match[2]
          };
        }
      }

      let res: globalThis.Response | null = null;
      try {
        res = await fetch(url);
        if (!res.ok && url.startsWith('http')) {
          res = await fetch(`/api/v1/products/proxy-image?url=${encodeURIComponent(url)}`);
        }
      } catch {
        if (url.startsWith('http')) {
          try {
            res = await fetch(`/api/v1/products/proxy-image?url=${encodeURIComponent(url)}`);
          } catch {
            return null;
          }
        } else {
          return null;
        }
      }

      if (!res || !res.ok) return null;
      const blob = await res.blob();
      const mime = blob.type.toLowerCase();
      const extension: 'png' | 'jpeg' = mime.includes('jpeg') || mime.includes('jpg') ? 'jpeg' : 'png';

      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          const b64 = result?.split(',')[1];
          if (b64) {
            resolve({ base64: b64, extension });
          } else {
            resolve(null);
          }
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  };

  const handleExportExcel = async () => {
    if (products.length === 0) {
      alert('Không có dữ liệu sản phẩm để xuất!');
      return;
    }

    try {
      setIsExporting(true);

      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Công ty TNHH TM&DV Nam Khánh';
      workbook.created = new Date();

      const worksheet = workbook.addWorksheet('DANH SÁCH MẪU', {
        views: [{ state: 'frozen', xSplit: 0, ySplit: 1, showGridLines: true }]
      });

      const exportColsDef: Record<
        string,
        { label: string; bg: string; width: number; align: 'center' | 'left' | 'right'; format?: string }
      > = {
        stt: { label: 'Stt', bg: 'FFD9E1F2', width: 7, align: 'center' },
        warehouseCode: { label: 'Mã kho', bg: 'FFD9E1F2', width: 14, align: 'center' },
        warehouseName: { label: 'Tên Kho', bg: 'FFD9E1F2', width: 22, align: 'left' },
        subTypeName: { label: 'Tên nhóm loại', bg: 'FFFCE4D6', width: 22, align: 'left' },
        image: { label: 'Hình ảnh sản phẩm', bg: 'FFA9D08E', width: 18, align: 'center' },
        code: { label: 'Mã sản phẩm', bg: 'FFBDD7EE', width: 16, align: 'center' },
        name: { label: 'Tên sản phẩm', bg: 'FFBDD7EE', width: 38, align: 'left' },
        brand: { label: 'Thương hiệu', bg: 'FFF8CBAD', width: 16, align: 'center' },
        color: { label: 'Màu sắc', bg: 'FFD9D9D9', width: 14, align: 'center' },
        specification: { label: 'Quy cách', bg: 'FFD9E1F2', width: 22, align: 'left' },
        unit: { label: 'Đơn vị tính', bg: 'FFD9E1F2', width: 13, align: 'center' },
        costPrice: { label: 'Giá nhập', bg: 'FFD9E1F2', width: 16, align: 'right', format: '#,##0' },
        sellingPrice: { label: 'Giá bán', bg: 'FFD9E1F2', width: 16, align: 'right', format: '#,##0' },
        vatRate: { label: 'Thuế VAT', bg: 'FFD9E1F2', width: 12, align: 'center' },
        stockQuantity: { label: 'Tồn kho', bg: 'FFD9E1F2', width: 14, align: 'right', format: '#,##0.##' }
      };

      // Xuất đúng 15 cột chuẩn như file DU_LIEU_HANG_HOA.xlsx
      const exportCols = [
        'stt',
        'warehouseCode',
        'warehouseName',
        'subTypeName',
        'image',
        'code',
        'name',
        'brand',
        'color',
        'specification',
        'unit',
        'costPrice',
        'sellingPrice',
        'vatRate',
        'stockQuantity'
      ];
      const imageColIdx = exportCols.indexOf('image');

      // 1. Cấu hình tiêu đề cột và độ rộng
      worksheet.columns = exportCols.map((k) => ({
        key: k,
        width: exportColsDef[k].width
      }));

      // 2. Thêm dòng Header
      const headerRowValues: Record<string, string> = {};
      exportCols.forEach((k) => {
        headerRowValues[k] = exportColsDef[k].label;
      });
      const headerRow = worksheet.addRow(headerRowValues);
      headerRow.height = 30;

      headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const colKey = exportCols[colNumber - 1];
        const colDef = exportColsDef[colKey];
        if (colDef) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: colDef.bg }
          };
          cell.font = {
            name: 'Arial',
            size: 10,
            bold: true,
            color: { argb: 'FF000000' }
          };
          cell.alignment = {
            vertical: 'middle',
            horizontal: 'center',
            wrapText: false
          };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFB0B5BD' } },
            left: { style: 'thin', color: { argb: 'FFB0B5BD' } },
            bottom: { style: 'medium', color: { argb: 'FF6B7280' } },
            right: { style: 'thin', color: { argb: 'FFB0B5BD' } }
          };
        }
      });

      // 3. Đổ dữ liệu từng dòng sản phẩm
      products.forEach((p, idx) => {
        const rowData: Record<string, any> = {};
        exportCols.forEach((k) => {
          switch (k) {
            case 'stt':
              rowData[k] = idx + 1;
              break;
            case 'warehouseCode':
              rowData[k] = p.warehouse?.code || (p as any).warehouseCode || 'NK01';
              break;
            case 'warehouseName':
              rowData[k] = p.warehouse?.name || (p as any).warehouseName || 'Kho số 1';
              break;
            case 'subTypeName':
              rowData[k] = p.productGroup?.name || p.subTypeName || '';
              break;
            case 'image':
              rowData[k] = '';
              break;
            case 'code':
              rowData[k] = p.code;
              break;
            case 'name':
              rowData[k] = p.name;
              break;
            case 'brand':
              rowData[k] = p.brand || '';
              break;
            case 'color':
              rowData[k] = p.color || '';
              break;
            case 'specification':
              rowData[k] = p.specification || '';
              break;
            case 'unit':
              rowData[k] = p.unit;
              break;
            case 'costPrice':
              rowData[k] = Number(p.costPrice) || 0;
              break;
            case 'sellingPrice':
              rowData[k] = Number(p.sellingPrice) || 0;
              break;
            case 'vatRate':
              rowData[k] = p.vatRate ?? 8;
              break;
            case 'stockQuantity':
              rowData[k] = Number(p.stockQuantity) || 0;
              break;
            default:
              rowData[k] = '';
          }
        });

        const dataRow = worksheet.addRow(rowData);
        dataRow.height = 38;

        dataRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          const colKey = exportCols[colNumber - 1];
          const colDef = exportColsDef[colKey];
          if (colDef) {
            cell.font = {
              name: 'Arial',
              size: 9.5,
              bold: colKey === 'code',
              color: { argb: colKey === 'code' ? 'FF0F172A' : 'FF1F2937' }
            };
            cell.alignment = {
              vertical: 'middle',
              horizontal: colDef.align,
              wrapText: false
            };
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
              left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
              bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
              right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
            };
            if (colDef.format && typeof cell.value === 'number') {
              cell.numFmt = colDef.format;
            }
          }
        });
      });

      // 4. Nhúng hình ảnh thực tế của từng sản phẩm vào ô cột "Hình ảnh sản phẩm"
      if (imageColIdx !== -1) {
        const imagePromises = products.map((p) =>
          p.imageUrl ? fetchImageAsBase64(p.imageUrl) : Promise.resolve(null)
        );
        const loadedImages = await Promise.all(imagePromises);

        loadedImages.forEach((imgData, idx) => {
          if (imgData) {
            try {
              const imageId = workbook.addImage({
                base64: imgData.base64,
                extension: imgData.extension
              });
              worksheet.addImage(imageId, {
                tl: { col: imageColIdx + 0.35, row: idx + 1 + 0.12 },
                ext: { width: 34, height: 34 },
                editAs: 'oneCell'
              });
            } catch (imgErr) {
              console.warn(`Lỗi nhúng ảnh SP hàng ${idx + 1}:`, imgErr);
            }
          }
        });
      }

      // 5. Bật Auto-Filter cho toàn bộ bảng
      worksheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: exportCols.length }
      };

      // 6. Xuất file binary .xlsx
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `DU_LIEU_HANG_HOA_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setToastMessage(`Đã xuất thành công ${products.length} dòng dữ liệu Hàng hóa chuẩn 15 cột ra file Excel (.xlsx)!`);
    } catch (err) {
      console.error('Lỗi khi xuất file Excel:', err);
      alert('Có lỗi xảy ra khi tạo file Excel');
    } finally {
      setIsExporting(false);
    }
  };

  // Modal Create / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formTab, setFormTab] = useState<'structure' | 'general' | 'price' | 'supplier'>('structure');
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialFormData = {
    warehouseId: '',
    warehouseCode: 'NK01',
    warehouseName: 'Kho số 1',
    categoryId: '',
    categoryCode: '',
    categoryName: '',
    category: '',
    productTypeId: '',
    productTypeCode: '',
    productTypeName: '',
    productGroupId: '',
    subTypeCode: '',
    subTypeName: '',
    imageUrl: '',
    code: '',
    barcode: '',
    name: '',
    brand: '',
    color: '',
    specification: '',
    unit: 'Chiếc',
    supplierId: '',
    supplierName: '',
    supplierPhone: '',
    supplierAddress: '',
    costPrice: 0,
    sellingPrice: 0,
    vatRate: 8,
    stockQuantity: 0,
    minStockLevel: 0,
    maxStockLevel: 0,
    length: 0,
    width: 0,
    height: 0,
    weight: 0,
    description: '',
    status: 'ACTIVE'
  };

  const [formData, setFormData] = useState(initialFormData);

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file hình ảnh hợp lệ (JPG, PNG, WEBP, GIF, SVG)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Dung lượng hình ảnh không được vượt quá 10MB');
      return;
    }

    try {
      setUploadingImage(true);
      const fd = new FormData();
      fd.append('file', file);
      if (editingProduct?.id) {
        fd.append('id', editingProduct.id);
      }
      const res = await api.post('/products/upload-image', fd);
      const uploadedUrl =
        res.data?.imageUrl ||
        res.data?.url ||
        res.data?.data?.imageUrl ||
        res.data?.data?.url ||
        (res as any)?.imageUrl ||
        (res as any)?.url;

      if (uploadedUrl) {
        setFormData((prev) => ({ ...prev, imageUrl: uploadedUrl }));
        if (editingProduct?.id) {
          setProducts((prev) =>
            prev.map((item) =>
              item.id === editingProduct.id ? { ...item, imageUrl: uploadedUrl } : item
            )
          );
        }
        setToastMessage('Tải ảnh sản phẩm lên thành công!');
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          const resultStr = reader.result as string;
          setFormData((prev) => ({ ...prev, imageUrl: resultStr }));
          if (editingProduct?.id) {
            setProducts((prev) =>
              prev.map((item) =>
                item.id === editingProduct.id ? { ...item, imageUrl: resultStr } : item
              )
            );
          }
        };
        reader.readAsDataURL(file);
      }
    } catch (err: any) {
      console.warn('Lỗi tải ảnh lên backend, dùng bản xem trước data URL:', err);
      const reader = new FileReader();
      reader.onloadend = () => {
        const resultStr = reader.result as string;
        setFormData((prev) => ({ ...prev, imageUrl: resultStr }));
        if (editingProduct?.id) {
          setProducts((prev) =>
            prev.map((item) =>
              item.id === editingProduct.id ? { ...item, imageUrl: resultStr } : item
            )
          );
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const loadMetadata = async () => {
    try {
      const [resWh, resCat, resTypes, resGroups, resSup] = await Promise.all([
        api.get<Warehouse[]>('/warehouses'),
        api.get<Category[]>('/categories'),
        api.get<ProductType[]>('/product-types'),
        api.get<ProductGroup[]>('/product-groups'),
        api.get<Supplier[]>('/suppliers')
      ]);

      setWarehouses(resWh.data || []);
      setCategories(resCat.data || []);
      setProductTypes(resTypes.data || []);
      setProductGroups(resGroups.data || []);
      setSuppliers(resSup.data || []);
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu cấu hình kho & phân loại:', err);
    }
  };

  const loadProducts = async (silent: boolean = false) => {
    try {
      if (!silent) setLoading(true);
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      if (warehouseFilter) query.append('warehouseId', warehouseFilter);
      if (categoryFilter) query.append('categoryId', categoryFilter);
      if (productTypeFilter) query.append('productTypeId', productTypeFilter);
      if (productGroupFilter) query.append('productGroupId', productGroupFilter);
      if (statusFilter) query.append('status', statusFilter);
      if (lowStockFilter) query.append('lowStock', 'true');

      const resProd = await api.get<Product[]>(`/products?${query.toString()}`);
      setProducts(resProd.data || []);
    } catch (err) {
      console.error('Lỗi khi tải danh sách sản phẩm:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const loadData = async (silent: boolean | unknown = false) => {
    const isSilent = silent === true;
    if (warehouses.length === 0 || productGroups.length === 0) {
      loadMetadata();
    }
    await loadProducts(isSilent);
  };

  const isFirstMount = useRef(true);
  useEffect(() => {
    setCurrentPage(1);
    if (isFirstMount.current) {
      isFirstMount.current = false;
      loadMetadata();
      loadProducts(false);
      return;
    }
    loadProducts(true);
  }, [search, warehouseFilter, categoryFilter, productTypeFilter, productGroupFilter, statusFilter, lowStockFilter]);

  const paginatedProducts = paginateProducts(products);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadProducts(true);
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setFormTab('structure');
    const firstWh = warehouses.find((w) => w.code === 'NK01') || warehouses[0];
    const firstGroup = productGroups[0];
    setFormData({
      ...initialFormData,
      warehouseId: firstWh?.id || '',
      warehouseCode: firstWh?.code || 'NK01',
      warehouseName: firstWh?.name || 'Kho số 1',
      productGroupId: firstGroup?.id || '',
      subTypeCode: firstGroup?.code || '',
      subTypeName: firstGroup?.name || '',
      supplierId: suppliers[0]?.id || ''
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleQuickStatusChange = async (productId: string, newStatus: string, e?: React.SyntheticEvent) => {
    if (e) e.stopPropagation();
    const oldProd = products.find((p) => p.id === productId);
    if (!oldProd || oldProd.status === newStatus) return;
    const oldStatus = oldProd.status;

    try {
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, status: newStatus as any } : p))
      );
      await api.put(`/products/${productId}`, { status: newStatus });
      setToastMessage(newStatus === 'ACTIVE' ? 'Đã kích hoạt kinh doanh sản phẩm!' : 'Đã chuyển sang tạm dừng kinh doanh!');
      loadData(true);
    } catch (err: any) {
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, status: oldStatus } : p))
      );
      alert(err.response?.data?.message || err.message || 'Lỗi khi cập nhật trạng thái sản phẩm');
      loadData(true);
    }
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormTab('structure');
    const matchedWh = warehouses.find((w) => w.id === p.warehouseId);
    const matchedCat = categories.find((c) => c.id === p.categoryId);
    const matchedType = productTypes.find((t) => t.id === p.productTypeId);
    const matchedGroup = productGroups.find(
      (g) =>
        g.id === (p as any).productGroupId ||
        (p.subTypeCode && g.code === p.subTypeCode) ||
        (p.subTypeName && g.name.toLowerCase() === p.subTypeName.toLowerCase())
    );

    setFormData({
      warehouseId: p.warehouseId || '',
      warehouseCode: p.warehouse?.code || matchedWh?.code || 'NK01',
      warehouseName: p.warehouse?.name || matchedWh?.name || 'Kho số 1',
      categoryId: p.categoryId || '',
      categoryCode: (p as any).categoryRel?.code || matchedCat?.code || '',
      categoryName: p.category || (p as any).categoryRel?.name || matchedCat?.name || '',
      category: p.category || (p as any).categoryRel?.name || '',
      productTypeId: p.productTypeId || '',
      productTypeCode: (p as any).productType?.code || matchedType?.code || '',
      productTypeName: (p as any).productType?.name || matchedType?.name || '',
      productGroupId: (p as any).productGroupId || matchedGroup?.id || '',
      subTypeCode: p.subTypeCode || matchedGroup?.code || '',
      subTypeName: p.productGroup?.name || p.subTypeName || matchedGroup?.name || '',
      imageUrl: p.imageUrl || '',
      code: p.code,
      barcode: p.barcode || '',
      name: p.name,
      brand: p.brand || '',
      color: p.color || '',
      specification: p.specification || '',
      unit: p.unit || 'Chiếc',
      supplierId: p.supplierId || '',
      supplierName: p.supplier?.name || '',
      supplierPhone: p.supplier?.phone || '',
      supplierAddress: p.supplier?.address || '',
      costPrice: Number(p.costPrice) || 0,
      sellingPrice: Number(p.sellingPrice) || 0,
      vatRate: p.vatRate ?? 8,
      stockQuantity: Number(p.stockQuantity) || 0,
      minStockLevel: 0,
      maxStockLevel: 0,
      length: Number(p.length) || 0,
      width: Number(p.width) || 0,
      height: Number(p.height) || 0,
      weight: Number(p.weight) || 0,
      description: p.description || '',
      status: p.status || 'ACTIVE'
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name?.trim() || !formData.code?.trim()) {
      setFormError('Vui lòng nhập Mã sản phẩm (SKU) và Tên sản phẩm');
      setFormTab('general');
      return;
    }

    try {
      setSaving(true);
      const normalizedGroupName = normalizeTextLabel(formData.subTypeName);
      const normalizedUnit = normalizeTextLabel(formData.unit) || 'Chiếc';
      const payload = {
        ...formData,
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        unit: normalizedUnit,
        brand: formData.brand?.trim() || null,
        color: formData.color?.trim() || null,
        specification: formData.specification?.trim() || null,
        warehouseCode: formData.warehouseCode?.trim().toUpperCase() || 'NK01',
        warehouseName: formData.warehouseName?.trim() || 'Kho số 1',
        productGroupId: formData.productGroupId?.trim() || null,
        subTypeCode: formData.subTypeCode?.trim() || null,
        subTypeName: normalizedGroupName || null,
        imageUrl: formData.imageUrl?.trim() || null,
        category: normalizedGroupName || formData.categoryName || formData.category || 'Văn phòng phẩm',
        costPrice: Number(formData.costPrice) || 0,
        sellingPrice: Number(formData.sellingPrice) || 0,
        vatRate: Number(formData.vatRate) || 8,
        minStockLevel: 0,
        maxStockLevel: 0,
        stockQuantity: Number(formData.stockQuantity) || 0
      };

      if (editingProduct) {
        const res = await api.put(`/products/${editingProduct.id}`, payload);
        const updatedData = res.data?.data || res.data;
        setProducts((prev) =>
          prev.map((item) =>
            item.id === editingProduct.id
              ? {
                  ...item,
                  ...payload,
                  imageUrl: payload.imageUrl,
                  ...(typeof updatedData === 'object' && updatedData !== null ? updatedData : {})
                }
              : item
          )
        );
        setToastMessage('Đã cập nhật sản phẩm thành công');
      } else {
        const res = await api.post('/products', payload);
        const createdData = res.data?.data || res.data;
        if (createdData && typeof createdData === 'object' && createdData.id) {
          setProducts((prev) => [createdData, ...prev]);
        }
        setToastMessage('Đã thêm sản phẩm mới thành công');
      }
      setIsModalOpen(false);
      setEditingProduct(null);
      setFormError(null);
      await Promise.all([loadMetadata(), loadData(true)]);
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu hàng hóa');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelCreate = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setFormError(null);
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

  // GIAO DIỆN TRANG TẠO / SỬA HÀNG HÓA RIÊNG BIỆT (KHÔNG DÙNG POPUP MODAL)
  if (isModalOpen) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', paddingBottom: '0.75rem' }}>
        {/* Navigation & Header trang tạo/sửa */}
        <div className="card p-3 sm:px-4 sm:py-2.5 rounded-2xl border border-slate-100/90 shadow-sm bg-white/95 backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleCancelCreate}
                className="px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
                title="Quay lại danh sách hàng hóa"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay lại</span>
              </button>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-red-50 text-[#E53935] flex items-center justify-center border border-red-100 flex-shrink-0">
                  <Package className="w-5 h-5 text-[#E53935]" />
                </div>
                <div>
                  <div className="text-[11px] font-medium text-slate-400 mb-0.5">Quản lý hàng hóa / Hàng hóa</div>
                  <h2 className="text-base font-bold text-gray-900 m-0 leading-tight">
                    {editingProduct ? `Chỉnh Sửa Mặt Hàng SKU [${editingProduct.code}]` : 'Khai Báo Sản Phẩm Mới (SKU Master)'}
                  </h2>
                  <p className="text-xs text-gray-500 m-0 mt-0.5 font-normal">
                    {editingProduct
                      ? 'Cập nhật thông tin chi tiết sản phẩm, giá bán, kho lưu trữ và nhóm loại hàng hóa'
                      : 'Tự động tạo Nhóm loại hoặc Nhà cung cấp nếu chưa có trên hệ thống. Áp thuế VAT 8% ngành VPP'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {editingProduct && hasPermission('C_PRODUCTS', 'delete') && (
                <button
                  type="button"
                  onClick={async () => {
                    await handleDelete(editingProduct);
                    handleCancelCreate();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 rounded-lg text-xs font-semibold transition-colors cursor-pointer mr-1"
                  title="Xóa sản phẩm này"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-600" />
                  <span>Xóa</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleCancelCreate}
                className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                form="product-form"
                onClick={(e) => handleSubmit(e)}
                disabled={saving}
                className="px-5 py-2 bg-[#E53935] hover:bg-[#D32F2F] disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <span>{editingProduct ? 'Lưu thay đổi' : 'Lưu sản phẩm'}</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Khung nội dung Form chuẩn 4 Tabs */}
        <div className="card rounded-2xl border border-slate-100/90 shadow-sm bg-white overflow-hidden p-0">
          {/* 4 Tabs Form Navigation */}
          <div className="flex border-b border-gray-200 bg-gray-50/80 px-6 pt-2.5 overflow-x-auto gap-1">
            <button
              type="button"
              onClick={() => setFormTab('structure')}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                formTab === 'structure'
                  ? 'border-[#E53935] text-[#E53935] bg-white rounded-t-lg shadow-xs'
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-100/60 rounded-t-lg'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>1. Kho & Nhóm loại</span>
            </button>
            <button
              type="button"
              onClick={() => setFormTab('general')}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                formTab === 'general'
                  ? 'border-[#E53935] text-[#E53935] bg-white rounded-t-lg shadow-xs'
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-100/60 rounded-t-lg'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>2. Sản phẩm & Hình ảnh</span>
            </button>
            <button
              type="button"
              onClick={() => setFormTab('price')}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                formTab === 'price'
                  ? 'border-[#E53935] text-[#E53935] bg-white rounded-t-lg shadow-xs'
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-100/60 rounded-t-lg'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>3. Giá & Tồn kho</span>
            </button>
            <button
              type="button"
              onClick={() => setFormTab('supplier')}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                formTab === 'supplier'
                  ? 'border-[#E53935] text-[#E53935] bg-white rounded-t-lg shadow-xs'
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-100/60 rounded-t-lg'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>4. Nhà cung cấp & Khác</span>
            </button>
          </div>

          <form id="product-form" onSubmit={handleSubmit} className="p-6 space-y-6">
            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-[#E53935] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {formError}
              </div>
            )}

            {/* TAB 1: KHO & NHÓM LOẠI (1 CẤP ĐƠN GIẢN THEO CHUẨN FILE EXCEL) */}
            {formTab === 'structure' && (
              <div className="space-y-4">
                {/* Kho hàng */}
                <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 space-y-2.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                      <WarehouseIcon className="w-3.5 h-3.5 text-blue-600" />
                      Kho lưu trữ (Mặc định: NK01 - Kho số 1)
                    </span>
                    {warehouses.length > 0 && (
                      <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                        <span>Chọn nhanh:</span>
                        <select
                          value={formData.warehouseId}
                          onChange={(e) => {
                            const wh = warehouses.find((w) => w.id === e.target.value);
                            setFormData({
                              ...formData,
                              warehouseId: wh ? wh.id : '',
                              warehouseCode: wh ? wh.code : formData.warehouseCode,
                              warehouseName: wh ? wh.name : formData.warehouseName
                            });
                          }}
                          className="px-2 py-1 text-xs border border-gray-200 rounded-md bg-white focus:outline-none focus:border-blue-400"
                        >
                          <option value="">-- Kho có sẵn --</option>
                          {warehouses.map((w) => (
                            <option key={w.id} value={w.id}>
                              {w.name} ({w.code})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Mã kho</label>
                      <input
                        type="text"
                        placeholder="VD: NK01, NK02..."
                        value={formData.warehouseCode}
                        onChange={(e) => setFormData({ ...formData, warehouseCode: e.target.value.toUpperCase() })}
                        className="w-full px-3 py-2 text-xs font-mono font-bold border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-[#E53935]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Tên Kho</label>
                      <input
                        type="text"
                        placeholder="VD: Kho số 1, Kho chính..."
                        value={formData.warehouseName}
                        onChange={(e) => setFormData({ ...formData, warehouseName: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-[#E53935]"
                      />
                    </div>
                  </div>
                </div>

                {/* Nhóm loại hàng hóa (1 cấp duy nhất theo chuẩn DU_LIEU_HANG_HOA.xlsx) */}
                <div className="p-4 bg-amber-50/40 rounded-xl border border-amber-100/90 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-100 pb-2.5">
                    <div>
                      <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                        <Boxes className="w-4 h-4 text-amber-600" />
                        Nhóm loại hàng hóa (Tên nhóm loại)
                      </span>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Chọn nhóm loại có sẵn hoặc nhập tên nhóm loại mới (hệ thống tự động chuẩn hóa và tạo mới nếu chưa có)
                      </p>
                    </div>

                    {productGroups.length > 0 && (
                      <div className="flex items-center gap-1.5 text-[11px] text-gray-600">
                        <span className="font-semibold text-amber-800 whitespace-nowrap">Chọn nhanh:</span>
                        <select
                          value={formData.productGroupId}
                          onChange={(e) => {
                            const gId = e.target.value;
                            const g = productGroups.find((item) => item.id === gId);
                            if (g) {
                              setFormData((prev) => ({
                                ...prev,
                                productGroupId: g.id,
                                subTypeCode: g.code,
                                subTypeName: g.name
                              }));
                            } else {
                              setFormData((prev) => ({
                                ...prev,
                                productGroupId: '',
                                subTypeCode: '',
                                subTypeName: ''
                              }));
                            }
                          }}
                          className="px-2.5 py-1 text-xs border border-amber-200 rounded-md bg-white focus:outline-none focus:border-amber-500 min-w-[180px]"
                        >
                          <option value="">-- Nhóm loại có sẵn --</option>
                          {productGroups.map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.name} ({g.code})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Tên nhóm loại <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="VD: Bút bi, Bút chì, Băng dính, File nan nhựa..."
                        value={formData.subTypeName}
                        onChange={(e) => {
                          const val = e.target.value;
                          const matched = productGroups.find(
                            (g) => g.name.toLowerCase() === val.trim().toLowerCase()
                          );
                          setFormData({
                            ...formData,
                            subTypeName: val,
                            productGroupId: matched ? matched.id : '',
                            subTypeCode: matched ? matched.code : formData.subTypeCode
                          });
                        }}
                        className="w-full px-3 py-2 text-xs font-medium border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-[#E53935]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Mã nhóm loại <span className="text-gray-400 font-normal">(Tự sinh nếu để trống)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="VD: BUT-BI, BANG-DINH..."
                        value={formData.subTypeCode}
                        onChange={(e) => setFormData({ ...formData, subTypeCode: e.target.value.toUpperCase() })}
                        className="w-full px-3 py-2 text-xs font-mono font-bold border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-[#E53935]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: SẢN PHẨM & HÌNH ẢNH */}
            {formTab === 'general' && (
              <div className="space-y-4">
                {/* HÌNH ẢNH SẢN PHẨM */}
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2.5">
                  <label className="block text-xs font-semibold text-gray-800">
                    Hình ảnh sản phẩm (Tỉ lệ 1:1)
                  </label>
                  <div className="flex flex-col sm:flex-row items-center gap-3.5">
                    <div
                      className="relative group rounded-xl border border-gray-300 bg-white overflow-hidden shrink-0 flex items-center justify-center shadow-xs"
                      style={{
                        width: '88px',
                        height: '88px',
                        minWidth: '88px',
                        minHeight: '88px',
                        maxWidth: '88px',
                        maxHeight: '88px',
                        aspectRatio: '1 / 1'
                      }}
                    >
                      {formData.imageUrl ? (
                        <>
                          <img
                            src={formatImageUrl(formData.imageUrl)}
                            alt="Xem trước SP"
                            className="w-full h-full object-cover"
                            style={{ width: '100%', height: '100%', objectFit: 'cover', aspectRatio: '1 / 1' }}
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, imageUrl: '' })}
                            className="absolute inset-0 bg-black/60 text-white text-[11px] font-semibold opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                            title="Xóa ảnh"
                          >
                            Xóa ảnh
                          </button>
                        </>
                      ) : (
                        <div className="text-center p-2 text-gray-400">
                          <ImageIcon className="w-6 h-6 mx-auto mb-1 opacity-50" />
                          <span className="text-[10px] block leading-tight font-medium">Chưa có ảnh</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-2 w-full">
                      <div className="flex items-center gap-2 flex-wrap">
                        <label className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-lg cursor-pointer shadow-xs transition-colors shrink-0">
                          <Upload className="w-3.5 h-3.5 text-gray-500" />
                          <span>{uploadingImage ? 'Đang tải ảnh lên...' : 'Tải ảnh từ máy'}</span>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            disabled={uploadingImage}
                            onChange={handleImageFileChange}
                            className="hidden"
                          />
                        </label>
                        {formData.imageUrl && (
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, imageUrl: '' })}
                            className="text-xs text-red-600 hover:text-red-700 font-medium cursor-pointer"
                          >
                            Gỡ bỏ ảnh
                          </button>
                        )}
                        <span className="text-[11px] text-gray-400">Vuông 1:1, tối đa 10MB</span>
                      </div>
                      <input
                        type="text"
                        placeholder="Hoặc dán URL hình ảnh sản phẩm (VD: https://...)"
                        value={formData.imageUrl}
                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-[#E53935]"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Mã sản phẩm (Mã SKU) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      disabled={!!editingProduct}
                      placeholder="VD: TL027, BDG5cm, FNN1L..."
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 text-xs font-mono font-bold border border-gray-200 rounded-lg disabled:bg-gray-100 focus:outline-none focus:border-[#E53935]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Tên sản phẩm <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Bút bi TL027, Băng dính trong 5cm..."
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-medium border border-gray-200 rounded-lg focus:outline-none focus:border-[#E53935]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Thương hiệu</label>
                    <input
                      type="text"
                      placeholder="VD: Thiên Long, Deli, Kingjim, Kokuyo..."
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#E53935]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Màu sắc</label>
                    <input
                      type="text"
                      placeholder="VD: Xanh, Đen, Đỏ, Trắng, Vàng..."
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#E53935]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Quy cách</label>
                    <input
                      type="text"
                      placeholder="VD: 0.5mm, 6 cuộn/cây, A4, 7cm..."
                      value={formData.specification}
                      onChange={(e) => setFormData({ ...formData, specification: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#E53935]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Đơn vị tính <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Chiếc, Hộp, Cuộn, Tập, Quyển..."
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#E53935]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Mã vạch Barcode (Tùy chọn)</label>
                  <input
                    type="text"
                    placeholder="VD: 8935001802711..."
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono border border-gray-200 rounded-lg focus:outline-none focus:border-[#E53935]"
                  />
                </div>
              </div>
            )}

            {/* TAB 3: GIÁ CẢ & TỒN KHO */}
            {formTab === 'price' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Giá nhập (VNĐ) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={formData.costPrice}
                      onChange={(e) =>
                        setFormData({ ...formData, costPrice: Math.max(0, parseFloat(e.target.value) || 0) })
                      }
                      className="w-full px-3 py-2 text-xs font-bold border border-gray-200 rounded-lg focus:outline-none focus:border-[#E53935]"
                    />
                    <span className="text-[11px] text-gray-400 mt-1 block">
                      Định dạng: {formatVND(formData.costPrice)}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Giá bán (VNĐ) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={formData.sellingPrice}
                      onChange={(e) =>
                        setFormData({ ...formData, sellingPrice: Math.max(0, parseFloat(e.target.value) || 0) })
                      }
                      className="w-full px-3 py-2 text-xs font-bold text-[#E53935] border border-gray-200 rounded-lg focus:outline-none focus:border-[#E53935]"
                    />
                    <span className="text-[11px] text-gray-400 mt-1 block">
                      Định dạng: {formatVND(formData.sellingPrice)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Thuế VAT (%)</label>
                    <select
                      value={formData.vatRate}
                      onChange={(e) => setFormData({ ...formData, vatRate: parseInt(e.target.value) ?? 8 })}
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white"
                    >
                      <option value={8}>8% (Tiêu chuẩn)</option>
                      <option value={10}>10% (Thiết bị VP)</option>
                      <option value={5}>5%</option>
                      <option value={0}>0% (Miễn thuế)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Số lượng tồn kho ({formData.unit || 'Đơn vị'})
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={formData.stockQuantity}
                      onChange={(e) =>
                        setFormData({ ...formData, stockQuantity: Math.max(0, parseFloat(e.target.value) || 0) })
                      }
                      className="w-full px-3 py-2 text-xs font-bold text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:border-[#E53935]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: NHÀ CUNG CẤP & KHÁC */}
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
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
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">KL (kg)</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Mô tả chi tiết & Ghi chú sản phẩm
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Mô tả công dụng, đóng gói hoặc lưu ý bảo quản..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-2.5 text-xs border border-gray-200 rounded-lg"
                  />
                </div>
              </div>
            )}

            {/* Navigation & Action Footer */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <div className="flex gap-2">
                {formTab !== 'structure' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (formTab === 'supplier') setFormTab('price');
                      else if (formTab === 'price') setFormTab('general');
                      else if (formTab === 'general') setFormTab('structure');
                    }}
                    className="px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-xs font-semibold cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    Quay lại
                  </button>
                )}
                {formTab !== 'supplier' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (formTab === 'structure') setFormTab('general');
                      else if (formTab === 'general') setFormTab('price');
                      else if (formTab === 'price') setFormTab('supplier');
                    }}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Tiếp theo
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCancelCreate}
                  className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg text-xs font-medium cursor-pointer transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-[#E53935] hover:bg-[#D32F2F] disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <span>{editingProduct ? 'Lưu thay đổi' : 'Lưu sản phẩm'}</span>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        <Toast
          show={!!toastMessage}
          message={toastMessage || ''}
          onClose={() => setToastMessage(null)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-between min-h-[calc(100vh-82px)] min-h-[calc(100dvh-82px)] pb-1">
      {/* KHỐI TẬP TRUNG: TIÊU ĐỀ, TABS & THANH CÔNG CỤ (GỘP THÀNH 1 KHỐI) */}
      <div className="card p-3 sm:px-4 sm:py-2.5 rounded-2xl border border-slate-100/90 shadow-sm bg-white/95 backdrop-blur-md space-y-2 shrink-0 mb-2.5">
        {headerSlot}
        {headerSlot && <div className="border-t border-slate-100" />}

        {/* THANH CÔNG CỤ TẬP TRUNG: BỘ LỌC, TÌM KIẾM & NÚT THAO TÁC */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.45rem'
          }}
        >
          <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flex: 1, minWidth: '260px', flexWrap: 'wrap' }}>
            <SearchInput
              value={search}
              onChange={(val) => setSearch(val)}
              onSearchImmediate={() => loadProducts(true)}
              placeholder="Tìm theo tên SP, mã SKU, barcode..."
              wrapperStyle={{ flex: 1, minWidth: '180px', maxWidth: '300px' }}
            />

            <select
              className="input"
              style={{ width: '150px', fontSize: '12.5px', height: '32px', borderRadius: '12px' }}
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
            >
              <option value="">-- Tất cả kho --</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>

            {productGroups.length > 0 && (
              <select
                className="input"
                style={{ width: '165px', fontSize: '12.5px', height: '32px', borderRadius: '12px' }}
                value={productGroupFilter}
                onChange={(e) => setProductGroupFilter(e.target.value)}
              >
                <option value="">-- Tất cả nhóm loại --</option>
                {productGroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={() => setLowStockFilter(!lowStockFilter)}
              className={`btn btn-sm ${lowStockFilter ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                borderRadius: '12px',
                padding: '0.35rem 0.65rem',
                fontSize: '12.5px',
                height: '32px',
                backgroundColor: lowStockFilter ? '#FEF2F2' : '#FFFFFF',
                borderColor: lowStockFilter ? '#EF4444' : '#E5E7EB',
                color: lowStockFilter ? '#DC2626' : '#4B5563',
                fontWeight: lowStockFilter ? 700 : 500,
                boxShadow: lowStockFilter ? '0 0 0 2px rgba(239, 68, 68, 0.2)' : 'none',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap'
              }}
              title="Lọc các mặt hàng có tồn kho nhỏ hơn hoặc bằng định mức tồn tối thiểu"
            >
              <AlertTriangle size={13} color={lowStockFilter ? '#DC2626' : '#F59E0B'} />
              <span>{lowStockFilter ? 'Sắp hết ✓' : 'Lọc sắp hết hàng'}</span>
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
            {/* Nút Cột */}
            <ColumnCustomizerDropdown
              columnOrder={columnOrder}
              columnLabels={columnLabels}
              visibleColumns={visibleColumns}
              onToggleColumn={toggleColumnVisibility}
              onReorderColumns={handleReorderColumns}
              onReset={resetColumns}
              disabledKeys={['code', 'name']}
              buttonStyle={{ height: '32px', borderRadius: '12px' }}
            />

            {/* Nút Nhập Excel hàng loạt */}
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '12.5px', height: '32px', borderRadius: '12px', gap: '0.35rem', backgroundColor: '#ECFDF5', color: '#047857', borderColor: '#A7F3D0' }}
              title="Nhập danh sách sản phẩm hàng loạt từ Excel/CSV"
            >
              <FileSpreadsheet size={13} color="#059669" />
              <span>Nhập Excel</span>
            </button>

            {/* Nút Xuất Excel cấu trúc sản phẩm */}
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={isExporting}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '12.5px', height: '32px', borderRadius: '12px', gap: '0.35rem', backgroundColor: '#EFF6FF', color: '#1D4ED8', borderColor: '#BFDBFE' }}
              title="Xuất bảng dữ liệu Hàng hóa chuẩn 15 cột ra file Excel (.xlsx)"
            >
              {isExporting ? (
                <>
                  <Loader2 size={13} className="animate-spin text-blue-600" />
                  <span>Đang xuất...</span>
                </>
              ) : (
                <>
                  <Download size={13} color="#2563EB" />
                  <span>Xuất Excel</span>
                </>
              )}
            </button>

            {hasPermission('C_PRODUCTS', 'create') && (
              <button
                type="button"
                onClick={openAddModal}
                className="btn btn-primary btn-sm flex items-center shadow-glow"
                style={{ padding: '0.35rem 0.75rem', fontSize: '12.5px', height: '32px', borderRadius: '12px', gap: '0.35rem' }}
              >
                <Plus size={14} />
                <span>Thêm Sản Phẩm Mới</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* BẢNG DATAGRID SẢN PHẨM SKU */}
      <div className="card rounded-2xl border border-slate-100/80 shadow-card overflow-hidden p-0 flex flex-col flex-1 min-h-0">
        <div
          className="shrink-0"
          style={{
            padding: '0.65rem 1.25rem',
            borderBottom: '1px solid #F3F4F6',
            backgroundColor: '#FAFAFA',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Package size={15} color="#E53935" />
            <span style={{ fontWeight: '700', fontSize: '14.3px', color: '#111827' }}>
              Danh mục sản phẩm SKU ({products.length})
            </span>
            <span style={{ fontSize: '12.1px', color: '#6B7280', marginLeft: '0.35rem' }}>
              • Chuẩn 15 cột dữ liệu hàng hóa
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '12.65px', color: '#6B7280' }}>
            <span>Hiển thị <strong>{products.length}</strong> sản phẩm</span>
          </div>
        </div>

        <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0 custom-scrollbar">
          <table
            className="w-full text-left text-sm"
            style={{
              width: `${getTableWidth(columnOrder.filter((k) => visibleColumns[k]))}px`,
              minWidth: '100%',
              tableLayout: 'fixed',
              borderCollapse: 'separate',
              borderSpacing: 0
            }}
          >
            <thead className="sticky top-0 z-20 bg-slate-50 border-b border-gray-200 shadow-2xs">
              <tr className="bg-slate-50 text-gray-600 uppercase text-[11px] font-semibold tracking-wider whitespace-nowrap">
                {columnOrder
                  .filter((k) => visibleColumns[k])
                  .map((colKey) => (
                    <th
                      key={colKey}
                      className={`py-1.5 px-2 select-none transition-colors whitespace-nowrap text-center ${
                        openFilterCol === colKey ? 'overflow-visible z-40' : 'overflow-hidden'
                      } ${
                        colKey === 'name' ? 'th-left text-left' : 'text-center'
                      } ${colKey === 'actions' ? 'sticky-action-th' : ''}`}
                      style={{
                        width: `${columnWidths[colKey] || defaultProductWidths[colKey] || 110}px`,
                        position: colKey === 'actions' ? 'sticky' : 'relative',
                        zIndex: openFilterCol === colKey ? 40 : undefined,
                        textAlign: colKey === 'name' ? 'left' : 'center'
                      }}
                    >
                      <div
                        className={`inline-flex items-center gap-1.5 w-full ${
                          colKey === 'name' ? 'justify-start' : 'justify-center'
                        }`}
                        style={{
                          justifyContent: colKey === 'name' ? 'flex-start' : 'center'
                        }}
                      >
                        <span className="whitespace-nowrap select-none font-semibold text-gray-700">
                          {columnLabels[colKey]}
                        </span>

                        {/* Nút lọc cho Nhóm loại */}
                        {colKey === 'subTypeName' && (
                          <div className="relative inline-flex items-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenFilterCol(openFilterCol === 'subTypeName' ? null : 'subTypeName');
                              }}
                              onMouseDown={(e) => e.stopPropagation()}
                              title={productGroupFilter ? 'Đang lọc nhóm loại (Nhấp để đổi hoặc bỏ lọc)' : 'Lọc theo nhóm loại'}
                              className={`p-1 rounded-md transition-colors cursor-pointer ${
                                productGroupFilter
                                  ? 'text-[#E53935] bg-red-50 border border-red-200'
                                  : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              <Filter size={11} className={productGroupFilter ? 'fill-[#E53935]' : ''} />
                            </button>

                            {openFilterCol === 'subTypeName' && (
                              <div
                                ref={filterMenuRef}
                                onClick={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                                className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 bg-white rounded-xl shadow-2xl border border-gray-200 p-2 z-50 text-left normal-case tracking-normal font-normal text-xs animate-in fade-in zoom-in-95"
                                style={{ width: '220px' }}
                              >
                                <div className="flex items-center justify-between px-1.5 py-1 mb-1.5 border-b border-gray-100">
                                  <span className="font-bold text-gray-800 text-[11px] uppercase tracking-wider">
                                    Lọc Nhóm loại
                                  </span>
                                  {productGroupFilter && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setProductGroupFilter('');
                                        setOpenFilterCol(null);
                                      }}
                                      className="text-[11px] text-[#E53935] hover:underline font-semibold cursor-pointer"
                                    >
                                      Bỏ lọc
                                    </button>
                                  )}
                                </div>

                                {productGroups.length > 5 && (
                                  <div className="mb-1.5 px-0.5">
                                    <input
                                      type="text"
                                      placeholder="Tìm nhóm loại..."
                                      value={groupSearchTerm}
                                      onChange={(e) => setGroupSearchTerm(e.target.value)}
                                      className="w-full px-2 py-1 text-xs border border-gray-200 rounded-md focus:outline-none focus:border-[#E53935]"
                                    />
                                  </div>
                                )}

                                <div className="max-h-52 overflow-y-auto space-y-0.5 custom-scrollbar">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setProductGroupFilter('');
                                      setOpenFilterCol(null);
                                    }}
                                    className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors ${
                                      productGroupFilter === ''
                                        ? 'bg-red-50 text-[#E53935] font-semibold'
                                        : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                                  >
                                    <span>-- Tất cả nhóm loại --</span>
                                    {productGroupFilter === '' && <Check size={13} className="text-[#E53935]" />}
                                  </button>
                                  {productGroups
                                    .filter((pg) => {
                                      if (groupSearchTerm && !pg.name.toLowerCase().includes(groupSearchTerm.toLowerCase())) return false;
                                      return true;
                                    })
                                    .map((pg) => (
                                      <button
                                        key={pg.id}
                                        type="button"
                                        onClick={() => {
                                          setProductGroupFilter(pg.id);
                                          setOpenFilterCol(null);
                                        }}
                                        className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors ${
                                          productGroupFilter === pg.id
                                            ? 'bg-red-50 text-[#E53935] font-semibold'
                                            : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                      >
                                        <span className="truncate mr-2">{pg.name}</span>
                                        {productGroupFilter === pg.id && <Check size={13} className="text-[#E53935] shrink-0" />}
                                      </button>
                                    ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Nút lọc cho Kho lưu trữ */}
                        {colKey === 'warehouseName' && (
                          <div className="relative inline-flex items-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenFilterCol(openFilterCol === 'warehouseName' ? null : 'warehouseName');
                              }}
                              onMouseDown={(e) => e.stopPropagation()}
                              title={warehouseFilter ? 'Đang lọc kho lưu trữ (Nhấp để đổi hoặc bỏ lọc)' : 'Lọc theo kho'}
                              className={`p-1 rounded-md transition-colors cursor-pointer ${
                                warehouseFilter
                                  ? 'text-[#E53935] bg-red-50 border border-red-200'
                                  : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              <Filter size={11} className={warehouseFilter ? 'fill-[#E53935]' : ''} />
                            </button>

                            {openFilterCol === 'warehouseName' && (
                              <div
                                ref={filterMenuRef}
                                onClick={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                                className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 bg-white rounded-xl shadow-2xl border border-gray-200 p-2 z-50 text-left normal-case tracking-normal font-normal text-xs animate-in fade-in zoom-in-95"
                                style={{ width: '220px' }}
                              >
                                <div className="flex items-center justify-between px-1.5 py-1 mb-1.5 border-b border-gray-100">
                                  <span className="font-bold text-gray-800 text-[11px] uppercase tracking-wider">
                                    Lọc Kho lưu trữ
                                  </span>
                                  {warehouseFilter && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setWarehouseFilter('');
                                        setOpenFilterCol(null);
                                      }}
                                      className="text-[11px] text-[#E53935] hover:underline font-semibold cursor-pointer"
                                    >
                                      Bỏ lọc
                                    </button>
                                  )}
                                </div>

                                {warehouses.length > 5 && (
                                  <div className="mb-1.5 px-0.5">
                                    <input
                                      type="text"
                                      placeholder="Tìm kho..."
                                      value={whSearchTerm}
                                      onChange={(e) => setWhSearchTerm(e.target.value)}
                                      className="w-full px-2 py-1 text-xs border border-gray-200 rounded-md focus:outline-none focus:border-[#E53935]"
                                    />
                                  </div>
                                )}

                                <div className="max-h-52 overflow-y-auto space-y-0.5 custom-scrollbar">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setWarehouseFilter('');
                                      setOpenFilterCol(null);
                                    }}
                                    className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors ${
                                      warehouseFilter === ''
                                        ? 'bg-red-50 text-[#E53935] font-semibold'
                                        : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                                  >
                                    <span>-- Tất cả kho lưu trữ --</span>
                                    {warehouseFilter === '' && <Check size={13} className="text-[#E53935]" />}
                                  </button>
                                  {warehouses
                                    .filter((w) => !whSearchTerm || w.name.toLowerCase().includes(whSearchTerm.toLowerCase()))
                                    .map((w) => (
                                      <button
                                        key={w.id}
                                        type="button"
                                        onClick={() => {
                                          setWarehouseFilter(w.id);
                                          setOpenFilterCol(null);
                                        }}
                                        className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors ${
                                          warehouseFilter === w.id
                                            ? 'bg-red-50 text-[#E53935] font-semibold'
                                            : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                      >
                                        <span className="truncate mr-2">{w.name}</span>
                                        {warehouseFilter === w.id && <Check size={13} className="text-[#E53935] shrink-0" />}
                                      </button>
                                    ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Nút lọc cho Trạng thái */}
                        {colKey === 'status' && (
                          <div className="relative inline-flex items-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenFilterCol(openFilterCol === 'status' ? null : 'status');
                              }}
                              onMouseDown={(e) => e.stopPropagation()}
                              title={statusFilter ? 'Đang lọc trạng thái (Nhấp để đổi hoặc bỏ lọc)' : 'Lọc theo trạng thái'}
                              className={`p-1 rounded-md transition-colors cursor-pointer ${
                                statusFilter
                                  ? 'text-[#E53935] bg-red-50 border border-red-200'
                                  : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              <Filter size={11} className={statusFilter ? 'fill-[#E53935]' : ''} />
                            </button>

                            {openFilterCol === 'status' && (
                              <div
                                ref={filterMenuRef}
                                onClick={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                                className="absolute right-0 top-full mt-1.5 bg-white rounded-xl shadow-2xl border border-gray-200 p-2 z-50 text-left normal-case tracking-normal font-normal text-xs animate-in fade-in zoom-in-95"
                                style={{ width: '180px' }}
                              >
                                <div className="flex items-center justify-between px-1.5 py-1 mb-1.5 border-b border-gray-100">
                                  <span className="font-bold text-gray-800 text-[11px] uppercase tracking-wider">
                                    Lọc Trạng thái
                                  </span>
                                  {statusFilter && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setStatusFilter('');
                                        setOpenFilterCol(null);
                                      }}
                                      className="text-[11px] text-[#E53935] hover:underline font-semibold cursor-pointer"
                                    >
                                      Bỏ lọc
                                    </button>
                                  )}
                                </div>

                                <div className="space-y-0.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setStatusFilter('');
                                      setOpenFilterCol(null);
                                    }}
                                    className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors ${
                                      statusFilter === ''
                                        ? 'bg-red-50 text-[#E53935] font-semibold'
                                        : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                                  >
                                    <span>-- Tất cả trạng thái --</span>
                                    {statusFilter === '' && <Check size={13} className="text-[#E53935]" />}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setStatusFilter('ACTIVE');
                                      setOpenFilterCol(null);
                                    }}
                                    className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors ${
                                      statusFilter === 'ACTIVE'
                                        ? 'bg-emerald-50 text-emerald-700 font-semibold'
                                        : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                                  >
                                    <span>Đang kinh doanh</span>
                                    {statusFilter === 'ACTIVE' && <Check size={13} className="text-emerald-600" />}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setStatusFilter('INACTIVE');
                                      setOpenFilterCol(null);
                                    }}
                                    className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors ${
                                      statusFilter === 'INACTIVE'
                                        ? 'bg-amber-50 text-amber-700 font-semibold'
                                        : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                                  >
                                    <span>Ngừng kinh doanh</span>
                                    {statusFilter === 'INACTIVE' && <Check size={13} className="text-amber-600" />}
                                  </button>
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
                  <td
                    colSpan={columnOrder.filter((k) => visibleColumns[k]).length}
                    className="py-8 text-center text-gray-500"
                  >
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#E53935] mb-2"></div>
                    <p>Đang tải danh sách hàng hóa...</p>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td
                    colSpan={columnOrder.filter((k) => visibleColumns[k]).length}
                    className="py-8 text-center text-gray-500"
                  >
                    Không tìm thấy sản phẩm nào phù hợp
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p, idx) => {
                  return (
                    <tr
                      key={p.id}
                      onClick={() => openEditModal(p)}
                      className="hover:bg-red-50/30 transition-colors cursor-pointer border-b border-gray-100 text-xs"
                    >
                      {columnOrder
                        .filter((k) => visibleColumns[k])
                        .map((colKey) => {
                          switch (colKey) {
                            case 'stt':
                              return (
                                <td key={colKey} className="py-1 px-2 text-center text-gray-500 whitespace-nowrap">
                                  {startIndex + idx + 1}
                                </td>
                              );
                            case 'warehouseCode':
                              return (
                                <td key={colKey} className="py-1 px-2 text-center whitespace-nowrap font-mono text-gray-600">
                                  {p.warehouse?.code || (p as any).warehouseCode || 'NK01'}
                                </td>
                              );
                            case 'warehouseName':
                              return (
                                <td key={colKey} className="py-1 px-2 text-center text-gray-700 truncate" title={p.warehouse?.name || (p as any).warehouseName || 'Kho số 1'}>
                                  {p.warehouse?.name || (p as any).warehouseName || 'Kho số 1'}
                                </td>
                              );
                            case 'subTypeName': {
                              const groupLabel = p.productGroup?.name || p.subTypeName || '—';
                              return (
                                <td key={colKey} className="py-1 px-2 text-center text-gray-700 truncate" title={groupLabel}>
                                  {groupLabel}
                                </td>
                              );
                            }
                            case 'image': {
                              const imgUrl = formatImageUrl(p.imageUrl);
                              return (
                                <td key={colKey} className="py-1 px-2 text-center">
                                  <div
                                    className="w-7 h-7 rounded border border-gray-200 bg-white mx-auto overflow-hidden flex items-center justify-center shrink-0 relative shadow-2xs"
                                    style={{ width: '28px', height: '28px', minWidth: '28px', minHeight: '28px', aspectRatio: '1 / 1' }}
                                    title={p.name}
                                  >
                                    {imgUrl ? (
                                      <img
                                        src={imgUrl}
                                        alt={p.name}
                                        className="w-full h-full object-cover"
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', aspectRatio: '1 / 1' }}
                                        onError={(e) => {
                                          const target = e.target as HTMLElement;
                                          target.style.display = 'none';
                                          const parent = target.parentElement;
                                          if (parent) {
                                            const fb = parent.querySelector('.img-cell-fallback') as HTMLElement;
                                            if (fb) fb.style.display = 'flex';
                                          }
                                        }}
                                      />
                                    ) : null}
                                    <div
                                      className="img-cell-fallback w-full h-full items-center justify-center text-gray-300"
                                      style={{ display: imgUrl ? 'none' : 'flex' }}
                                    >
                                      <ImageIcon size={13} />
                                    </div>
                                  </div>
                                </td>
                              );
                            }
                            case 'code':
                              return (
                                <td key={colKey} className="py-1 px-2 text-center whitespace-nowrap" title={`Mã SKU: ${p.code}`}>
                                  <span className="font-mono font-bold text-[#E53935]">{p.code}</span>
                                </td>
                              );
                            case 'name':
                              return (
                                <td key={colKey} className="py-1 px-2.5 text-left overflow-hidden font-medium text-gray-900 truncate" title={p.name}>
                                  {p.name}
                                </td>
                              );
                            case 'brand':
                              return (
                                <td key={colKey} className="py-1 px-2 text-center text-gray-700 truncate" title={p.brand || '—'}>
                                  {p.brand || '—'}
                                </td>
                              );
                            case 'color':
                              return (
                                <td key={colKey} className="py-1 px-2 text-center text-gray-600 truncate" title={p.color || '—'}>
                                  {p.color || '—'}
                                </td>
                              );
                            case 'specification':
                              return (
                                <td key={colKey} className="py-1 px-2 text-center text-gray-600 truncate" title={p.specification || '—'}>
                                  {p.specification || '—'}
                                </td>
                              );
                            case 'unit':
                              return (
                                <td key={colKey} className="py-1 px-2 text-center text-gray-700 font-medium whitespace-nowrap">
                                  {p.unit}
                                </td>
                              );
                            case 'costPrice':
                              return (
                                <td key={colKey} className="py-1 px-2 text-right text-gray-600 tabular-nums whitespace-nowrap">
                                  {Number(p.costPrice).toLocaleString('vi-VN')} đ
                                </td>
                              );
                            case 'sellingPrice':
                              return (
                                <td key={colKey} className="py-1 px-2 text-right font-bold text-gray-900 tabular-nums whitespace-nowrap">
                                  {Number(p.sellingPrice).toLocaleString('vi-VN')} đ
                                </td>
                              );
                            case 'vatRate':
                              return (
                                <td key={colKey} className="py-1 px-2 text-center text-gray-700 tabular-nums whitespace-nowrap">
                                  {p.vatRate ?? 8}%
                                </td>
                              );
                            case 'stockQuantity':
                              return (
                                <td key={colKey} className="py-1 px-2 text-right font-bold text-gray-900 tabular-nums whitespace-nowrap">
                                  {Number(p.stockQuantity ?? 0).toLocaleString('vi-VN', { maximumFractionDigits: 2 })}
                                </td>
                              );
                            case 'status':
                              return (
                                <td
                                  key={colKey}
                                  className="py-1 px-2 text-center whitespace-nowrap overflow-hidden"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="flex items-center justify-center">
                                    <StatusBadgeDropdown
                                      value={p.status || 'ACTIVE'}
                                      options={PRODUCT_STATUS_OPTIONS}
                                      onChange={(newStatus) => handleQuickStatusChange(p.id, newStatus)}
                                    />
                                  </div>
                                </td>
                              );
                            case 'actions':
                              return (
                                <td
                                  key={colKey}
                                  onClick={(e) => e.stopPropagation()}
                                  className="py-1 px-2 text-center sticky-action-td whitespace-nowrap bg-white border-l border-gray-100"
                                >
                                  <div className="flex items-center justify-center gap-1 w-full">
                                    {hasPermission('C_PRODUCTS', 'update') && (
                                      <button
                                        type="button"
                                        onClick={() => openEditModal(p)}
                                        className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                                        title="Chỉnh sửa sản phẩm"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                    {hasPermission('C_PRODUCTS', 'delete') && (
                                      <button
                                        type="button"
                                        onClick={() => handleDelete(p)}
                                        className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                                        title="Xóa sản phẩm"
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

        <div className="shrink-0">
          <TablePagination
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={products.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            itemLabel="sản phẩm"
          />
        </div>
      </div>

      {/* MODAL IMPORT EXCEL HÀNG LOẠT (CHUẨN 15 CỘT DU_LIEU_HANG_HOA.XLSX) */}
      <ImportExcelModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Nhập danh sách Hàng hóa từ Excel (Chuẩn 15 cột)"
        sampleFileName="Du_Lieu_Hang_Hoa_NamKhanh.xlsx"
        sampleHeaders={[
          'Stt',
          'Mã kho',
          'Tên Kho',
          'Tên nhóm loại',
          'Hình ảnh sản phẩm',
          'Mã sản phẩm',
          'Tên sản phẩm',
          'Thương hiệu',
          'Màu sắc',
          'Quy cách',
          'Đơn vị tính',
          'Giá nhập',
          'Giá bán',
          'Thuế VAT',
          'Tồn kho'
        ]}
        sampleRows={[
          [
            '1',
            'NK01',
            'Kho số 1',
            'Bút bi',
            '',
            'TL027',
            'Bút bi TL027',
            'Thiên Long',
            'Xanh',
            '0.5mm',
            'Chiếc',
            3273,
            3900,
            8,
            3209
          ],
          [
            '2',
            'NK01',
            'Kho số 1',
            'Băng dính',
            '',
            'BDG5cm',
            'Băng dính giấy 5cm',
            '',
            'Trắng',
            '6 cuộn/cây',
            'Cuộn',
            12833,
            16500,
            8,
            148
          ]
        ]}
        sampleImages={[
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHgAAAB4CAYAAAA5ZDbSAAACu0lEQVR4nO3YMU4DMRBGYQRXpaHnCHScgtNwDypKSkBIQRGKCAkb27sez8zvN9JrooTd+HOciKv3z68d6XblfQMEMAFMAE8awOJ1A355faPOuQJ7v/kZGwK8dHGm//SAbgIG1HfWIFcDAxtnWpCrgMGNN7XIRWBw404NMsCJZzMwuPGnhAxw8gFYfAAWn9XA4OYYgMUHYPEBWHzcga8fnqlQOmDvBctceODTG765e6JCW5CHAgPbDzo0sPdCZQ5g8cICgwswAUwAi5cW+DBWC9P6963vB2CAtYCtswYetYEAFt9AZsCHGQ3cuhCqTQfcCz7bBkoL3LrQ1sBRN1Da72Br4F7Pt35cFti6tQsKcBJglQAWD2DxABYPYPEAFg9g8QAWD2DxABYPYPEAFg9g8QAWD2DxABYvPDDIAFN2YJC34aYApm0BLB7A4gEsXjrgt48dnSQB7L2IGUoL7L1wmQJYvHTA3guWLYDFA1g8gMUDuHKB/j7+u1zegAA3wY0F3v6eyvcB8DAMi3sAOBBGv3uo/bsp/5PlBRxlQ7SsxTLw/9zHjxaBD0+eFdhyQ2xB7g58irwEvHSEzAJstSFMj+j/kH9eeH45gG03gtl3cC3w0gAcHJjvYIBNgG/vH1csyP5V7c+puda6+5kIeL9AJeBeixgZLA3wz+fg8hxQL32Ce2FkAfMC3q/PsCN6ZrBewKUPWNcj+tLFWo7omVva0BZH9P5aXY7o3cS/otedUuc/AM+B61be9Yim+tL8igYYYFIABhlgygQMcj/cVMC0LoDFCwkM8lhcF2CQx+G6ATPjBmDxAVh8ABYfgMVnNTDIOQZg8QFYfAAWn03AIMeeEi7AyacLMMgxpwa3GhjkWFOL2wR8jAy0zxyvf61ZE/ApMvnU4tUMDHQO2M3AlCOAxQNYPIDFA1g8gMX7Brb7JwaNoLXWAAAAAElFTkSuQmCC',
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHgAAAB4CAYAAAA5ZDbSAAACB0lEQVR4nO3dzU0CURSGYaLFWYFF0Icl2ICxCTuwD1cuWRpjgiE6ySDg3PljzrnzvMm3YTEMPOSGBQmbj8+vvdW7zdI3YIANsAFe6QBXvsmA3953NvEWBV76xa9xVwG+9OSavimgewEDXbYhyMXAYOPUB7kIGG68SpE7geHGrQQZcOJGA8ONXxcy4OQB/u3m4fVkNbR64HOwNUEPBl4LbnZkwIDrBO6De9jt9mnpWx4U4ELcZtkC3AMXcKIAAwYMOH6AAQMGnDDAgAEDjh9gwIABJwwwYMCA4wcYMGDACQMMGDDg+AEGDBhwwgADBgw4foABAwacMMCAzyJnC3DhsgYYMGDACQMMGDDg+AEGDBhwwgADBgw4foABAwacMMCAAQOOH2DAgAEnDDBgwIDjBxgwYMAJAwwYMOD4AQYMGHDCAAMGDDh+qwXe+/dRwICTA+/9A3j9wE2Pzy8nqyHAF3ABA04RYMCAMwcYMODMAQYMOHOAAQPOHGDA9QO3u7vfLn0Lkwa41QEXMOBUAW4FGHC6ALcCXDlwjQ0GhpyjdMBz/RDu/HX7PBozwP9eF7AjOnijgCFP0XynRBcu4Ks0J3BzlRHAkGP2YzIRMORYlRzNvYGbz8oxdKbvm/lr3vtS3FHAx0fE7s/jNudKzXoBXzqyLSbsaGDLMcCVD3DlA1z5AFc+wJXvG6pqUpLu8p4XAAAAAElFTkSuQmCC'
        ]}
        requiredFields={['Mã sản phẩm', 'Tên sản phẩm']}
        fieldMappingHelp="File mẫu chuẩn theo form 'DU_LIEU_HANG_HOA.xlsx' gồm đúng 15 cột dữ liệu kèm ảnh mẫu được nhúng trực tiếp. Khi điền file của bạn, bạn có thể chèn ảnh (Insert Picture) vào ô cột Hình ảnh sản phẩm hoặc dán link URL ảnh."
        onImport={handleImportProducts}
      />
      <Toast
        show={!!toastMessage}
        message={toastMessage || ''}
        onClose={() => setToastMessage(null)}
      />
    </div>
  );
};
