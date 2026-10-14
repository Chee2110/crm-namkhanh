import React, { useState, useEffect, useRef } from 'react';
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
  Columns,
  Upload,
  Image as ImageIcon,
  Loader2,
  Download,
  Filter,
  Check,
  ArrowLeft
} from 'lucide-react';
import { api } from '../../services/api';
import { Product, Warehouse, Category, ProductType, Supplier } from '../../types';
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

export const ProductsPage: React.FC<ProductsPageProps> = ({ headerSlot }) => {
  const { hasPermission } = useAuth();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
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
  const [productTypeFilter, setProductTypeFilter] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [showCostPrice, setShowCostPrice] = useState(false);

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
    rowHeight: 38,
    topOffset: 295,
    minRows: 4,
    maxRows: 50,
  });

  // Header filter states
  const [openFilterCol, setOpenFilterCol] = useState<'categoryName' | 'productTypeName' | null>(null);
  const [catSearchTerm, setCatSearchTerm] = useState('');
  const [typeSearchTerm, setTypeSearchTerm] = useState('');
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

  // Modal Import Excel & Drag-and-drop Cột
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isColumnDropdownOpen, setIsColumnDropdownOpen] = useState(false);

  const defaultVisibleCols: Record<string, boolean> = {
    stt: true,
    code: true,
    image: true,
    name: true,
    brand: true,
    unit: true,
    color: true,
    specification: true,
    costPrice: true,
    sellingPrice: true,
    vatRate: true,
    warehouseName: true,
    minStockLevel: true,
    maxStockLevel: true,
    categoryName: true,
    productTypeName: true,
    subTypeCode: true,
    subTypeName: true,
    status: true,
    actions: true
  };

  const defaultColOrder = [
    'stt',
    'code',
    'image',
    'name',
    'brand',
    'unit',
    'color',
    'specification',
    'costPrice',
    'sellingPrice',
    'vatRate',
    'warehouseName',
    'minStockLevel',
    'maxStockLevel',
    'categoryName',
    'productTypeName',
    'subTypeCode',
    'subTypeName',
    'status',
    'actions'
  ];

  const columnLabels: Record<string, string> = {
    stt: 'Stt',
    code: 'Mã hàng hóa',
    image: 'Hình ảnh',
    name: 'Tên hàng hóa',
    brand: 'Thương hiệu',
    unit: 'ĐVT',
    color: 'Màu sắc',
    specification: 'Quy cách',
    costPrice: 'Giá nhập',
    sellingPrice: 'Giá bán',
    vatRate: 'Thuế VAT',
    warehouseName: 'Kho',
    minStockLevel: 'Tồn kho tối thiểu',
    maxStockLevel: 'Tồn kho tối đa',
    categoryName: 'Danh mục',
    productTypeName: 'Loại hàng hóa',
    subTypeCode: 'Mã nhóm loại',
    subTypeName: 'Tên nhóm loại',
    status: 'Trạng thái',
    actions: 'Thao tác'
  };

  // Cấu hình hiển thị và thứ tự cột mặc định:
  // Mã hàng hóa -> Hình ảnh -> Tên hàng hóa -> Thương hiệu -> ĐVT -> Màu sắc -> Giá -> Các kho -> Danh mục -> Loại -> Trạng thái -> Thao tác

  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('namkhanh_products_visible_cols_v6');
      if (saved) {
        const parsed = JSON.parse(saved);
        delete parsed.warehouseCode;
        delete parsed.categoryCode;
        delete parsed.productTypeCode;
        if (parsed.warehouseName !== undefined && parsed.code !== undefined) return parsed;
      }
      return defaultVisibleCols;
    } catch {
      return defaultVisibleCols;
    }
  });

  const [columnOrder, setColumnOrder] = useState<string[]>(() => {
    try {
      // Dọn dẹp cache cũ các phiên bản v1 - v5 để đảm bảo thứ tự mặc định mới có hiệu lực ngay
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
        'namkhanh_products_visible_cols_v5'
      ];
      oldKeys.forEach((k) => {
        try {
          localStorage.removeItem(k);
        } catch {
          // ignore
        }
      });

      const saved = localStorage.getItem('namkhanh_products_col_order_v6');
      if (saved) {
        const parsed = JSON.parse(saved);
        const filtered = parsed.filter(
          (c: string) => !['warehouseCode', 'categoryCode', 'productTypeCode'].includes(c)
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
    code: 115,
    image: 85,
    name: 240,
    brand: 115,
    unit: 90,
    color: 90,
    specification: 120,
    costPrice: 110,
    sellingPrice: 110,
    vatRate: 85,
    warehouseName: 120,
    minStockLevel: 110,
    maxStockLevel: 110,
    categoryName: 135,
    productTypeName: 135,
    subTypeCode: 105,
    subTypeName: 120,
    status: 135,
    actions: 95
  };

  const { columnWidths, startResize, resetWidths, getTableWidth } = useTableResize({
    tableKey: 'products_v6',
    defaultWidths: defaultProductWidths,
    minWidth: 50,
    minWidths: {
      stt: 45,
      code: 90,
      image: 65,
      name: 150,
      brand: 80,
      unit: 70,
      color: 70,
      specification: 90,
      costPrice: 85,
      sellingPrice: 85,
      vatRate: 70,
      warehouseName: 90,
      minStockLevel: 85,
      maxStockLevel: 85,
      categoryName: 100,
      productTypeName: 100,
      subTypeCode: 85,
      subTypeName: 90,
      status: 100,
      actions: 80
    }
  });

  const handleReorderColumns = (newOrder: string[]) => {
    const normalized = withActionsLast(newOrder, defaultColOrder);
    setColumnOrder(normalized);
    try {
      localStorage.setItem('namkhanh_products_col_order_v6', JSON.stringify(normalized));
    } catch {
      // ignore
    }
  };

  const toggleColumnVisibility = (key: string) => {
    const updated = { ...visibleColumns, [key]: !visibleColumns[key] };
    setVisibleColumns(updated);
    try {
      localStorage.setItem('namkhanh_products_visible_cols_v6', JSON.stringify(updated));
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
      'namkhanh_products_col_order_v6'
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
      if (val === undefined || val === null || val === '') return fallback;
      const cleaned = String(val).replace(/[^0-9.-]+/g, '');
      const parsed = Number(cleaned);
      return isNaN(parsed) ? fallback : parsed;
    };

    for (const r of rows) {
      try {
        const code = String(r['Mã sản phẩm'] || r['Mã SKU'] || r['Mã SP'] || '').trim().toUpperCase();
        const name = String(r['Tên sản phẩm'] || r['Tên SP'] || '').trim();
        if (!code || !name) continue;

        const warehouseCode = String(r['Mã kho'] || r['Mã Kho'] || '').trim();
        const warehouseName = String(r['Tên Kho'] || r['Tên kho'] || '').trim();
        const categoryCode = String(r['Mã danh mục'] || r['Mã Danh Mục'] || '').trim();
        const categoryName = String(r['Tên danh mục'] || r['Tên Danh Mục'] || '').trim();
        const productTypeCode = String(r['Mã loại'] || r['Mã Loại'] || '').trim();
        const productTypeName = String(r['Tên loại'] || r['Tên Loại'] || '').trim();
        const subTypeCode = String(r['Mã nhóm loại'] || r['Mã Nhóm Loại'] || '').trim();
        const subTypeName = String(r['Tên nhóm loại'] || r['Tên Nhóm Loại'] || '').trim();
        let imageUrl = String(r['Hình ảnh sản phẩm'] || r['Hình ảnh'] || r['image'] || '').trim();
        const brand = String(r['Thương hiệu'] || r['Nhãn hiệu'] || '').trim();
        const color = String(r['Màu sắc'] || '').trim();
        const specification = String(r['Quy cách'] || '').trim();
        const unit = String(r['Đơn vị tính'] || r['ĐVT'] || 'Cái').trim();
        const costPrice = parseNum(r['Giá nhập'] || r['Giá vốn'], 0);
        const sellingPrice = parseNum(r['Giá bán'], 0);
        const vatRate = parseNum(r['Thuế VAT'] || r['VAT'], 8);
        const minStockLevel = parseNum(r['Tồn kho tối thiểu'] || r['Tồn tối thiểu'] || r['Mức an toàn'], 20);
        const maxStockLevel = parseNum(r['Tồn kho tối đa'] || r['Tồn tối đa'], 0);

        // NẾU CÓ HÌNH ẢNH TRÍCH XUẤT TỪ FILE EXCEL (dạng blob hoặc data:image/)
        // Upload lên backend /api/v1/products/upload-image để lưu file vật lý vào /uploads/
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
          categoryCode,
          categoryName,
          category: categoryName || 'Văn phòng phẩm',
          productTypeCode,
          productTypeName,
          subTypeCode,
          subTypeName,
          imageUrl: imageUrl || null,
          brand,
          color,
          specification,
          unit,
          costPrice,
          sellingPrice,
          vatRate,
          minStockLevel,
          maxStockLevel,
          stockQuantity: minStockLevel || 100,
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
    await loadData();
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
      // 1. Nếu là data URL
      if (url.startsWith('data:image/')) {
        const match = url.match(/^data:image\/(png|jpeg|jpg);base64,(.+)$/i);
        if (match) {
          return {
            extension: match[1].toLowerCase() === 'jpg' ? 'jpeg' : (match[1].toLowerCase() as 'png' | 'jpeg'),
            base64: match[2]
          };
        }
      }

      // 2. Fetch ảnh trực tiếp (qua Vite proxy cho /uploads/... hoặc external URL)
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

      const worksheet = workbook.addWorksheet('CẤU TRÚC SẢN PHẨM', {
        views: [{ state: 'frozen', xSplit: 0, ySplit: 1, showGridLines: true }]
      });

      const exportColsDef: Record<
        string,
        { label: string; bg: string; width: number; align: 'center' | 'left' | 'right'; format?: string }
      > = {
        stt: { label: 'Stt', bg: 'FFD9E1F2', width: 7, align: 'center' },
        warehouseCode: { label: 'Mã kho', bg: 'FFD9E1F2', width: 14, align: 'center' },
        warehouseName: { label: 'Tên Kho', bg: 'FFD9E1F2', width: 26, align: 'left' },
        categoryCode: { label: 'Mã danh mục', bg: 'FFBDD7EE', width: 15, align: 'center' },
        categoryName: { label: 'Tên danh mục', bg: 'FFBDD7EE', width: 24, align: 'left' },
        productTypeCode: { label: 'Mã loại', bg: 'FFE2EFDA', width: 15, align: 'center' },
        productTypeName: { label: 'Tên loại', bg: 'FFE2EFDA', width: 24, align: 'left' },
        subTypeCode: { label: 'Mã nhóm loại', bg: 'FFFCE4D6', width: 16, align: 'center' },
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
        minStockLevel: { label: 'Tồn kho tối thiểu', bg: 'FFD9E1F2', width: 16, align: 'right', format: '#,##0' },
        maxStockLevel: { label: 'Tồn kho tối đa', bg: 'FFD9E1F2', width: 16, align: 'right', format: '#,##0' }
      };

      // Xác định thứ tự cột theo columnOrder hiển thị (loại bỏ cột actions)
      const exportCols = columnOrder.filter((k) => k !== 'actions' && exportColsDef[k]);
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

      // Tô màu nền, font chữ và viền cho từng ô tiêu đề chuẩn theo ảnh
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
            case 'categoryCode':
              rowData[k] = p.categoryRel?.code || (p as any).categoryCode || 'GIAY';
              break;
            case 'categoryName':
              rowData[k] = p.categoryRel?.name || (p as any).categoryName || p.category || 'Giấy';
              break;
            case 'productTypeCode':
              rowData[k] = p.productType?.code || (p as any).productTypeCode || 'A4';
              break;
            case 'productTypeName':
              rowData[k] = p.productType?.name || (p as any).productTypeName || 'Giấy A4';
              break;
            case 'subTypeCode':
              rowData[k] = p.subTypeCode || '—';
              break;
            case 'subTypeName':
              rowData[k] = p.subTypeName || '—';
              break;
            case 'image':
              rowData[k] = ''; // Để trống ô để nhúng thumbnail hình ảnh, không ghi text URL
              break;
            case 'code':
              rowData[k] = p.code;
              break;
            case 'name':
              rowData[k] = p.name;
              break;
            case 'brand':
              rowData[k] = p.brand || '—';
              break;
            case 'color':
              rowData[k] = p.color || '—';
              break;
            case 'specification':
              rowData[k] = p.specification || '—';
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
              rowData[k] = `${p.vatRate ?? 8}%`;
              break;
            case 'minStockLevel':
              rowData[k] = Number(p.minStockLevel) || 0;
              break;
            case 'maxStockLevel':
              rowData[k] = Number(p.maxStockLevel) || 0;
              break;
            default:
              rowData[k] = '';
          }
        });

        const dataRow = worksheet.addRow(rowData);
        dataRow.height = 38; // Chiều cao hàng vừa vặn với thumbnail ảnh

        // Định dạng font, border, căn lề từng ô dữ liệu
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
              // Row 1 là tiêu đề (0-based: 0), sản phẩm đầu tiên là row 2 (0-based: 1).
              // Canh giữa ảnh 34x34 px trong ô (cột rộng 18, hàng cao 38pt)
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
      link.download = `CAU_TRUC_SAN_PHAM_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setToastMessage(`Đã xuất thành công ${products.length} dòng dữ liệu Cấu Trúc Sản Phẩm vào file Excel (.xlsx)!`);
    } catch (err) {
      console.error('Lỗi khi xuất file Excel:', err);
      alert('Có lỗi xảy ra khi tạo file Excel');
    } finally {
      setIsExporting(false);
    }
  };

  const [showSpecs, setShowSpecs] = useState(false);

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
    categoryCode: 'GIAY',
    categoryName: 'Giấy',
    category: 'Giấy',
    productTypeId: '',
    productTypeCode: 'A4',
    productTypeName: 'Giấy A4',
    subTypeCode: 'GIN',
    subTypeName: 'Giấy in',
    imageUrl: '',
    code: '',
    barcode: '',
    name: '',
    brand: 'Double',
    color: 'Trắng',
    specification: '500 tờ/ream',
    unit: 'Ream',
    supplierId: '',
    supplierName: '',
    supplierPhone: '',
    supplierAddress: '',
    costPrice: 45000,
    sellingPrice: 65000,
    vatRate: 8,
    stockQuantity: 100,
    minStockLevel: 5000,
    maxStockLevel: 10000,
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
      // Fallback preview dạng DataURL
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
      const [resWh, resCat, resTypes, resSup] = await Promise.all([
        api.get<Warehouse[]>('/warehouses'),
        api.get<Category[]>('/categories'),
        api.get<ProductType[]>('/product-types'),
        api.get<Supplier[]>('/suppliers')
      ]);

      setWarehouses(resWh.data || []);
      setCategories(resCat.data || []);
      setProductTypes(resTypes.data || []);
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
    if (warehouses.length === 0 || categories.length === 0 || productTypes.length === 0) {
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
  }, [search, warehouseFilter, categoryFilter, productTypeFilter, lowStockFilter]);

  const paginatedProducts = paginateProducts(products);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadProducts(true);
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setFormTab('structure');
    const firstWh = warehouses[0];
    const firstCat = categories[0];
    const firstType = productTypes[0];
    setFormData({
      ...initialFormData,
      warehouseId: firstWh?.id || '',
      warehouseCode: firstWh?.code || 'NK01',
      warehouseName: firstWh?.name || 'Kho số 1',
      categoryId: firstCat?.id || '',
      categoryCode: firstCat?.code || 'GIAY',
      categoryName: firstCat?.name || 'Giấy',
      category: firstCat?.name || 'Giấy',
      productTypeId: firstType?.id || '',
      productTypeCode: firstType?.code || 'A4',
      productTypeName: firstType?.name || 'Giấy A4',
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
      // Đồng bộ ngầm không tải lại toàn trang
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

    setFormData({
      warehouseId: p.warehouseId || '',
      warehouseCode: p.warehouse?.code || matchedWh?.code || '',
      warehouseName: p.warehouse?.name || matchedWh?.name || '',
      categoryId: p.categoryId || '',
      categoryCode: (p as any).categoryRel?.code || matchedCat?.code || '',
      categoryName: p.category || (p as any).categoryRel?.name || matchedCat?.name || '',
      category: p.category || (p as any).categoryRel?.name || '',
      productTypeId: p.productTypeId || '',
      productTypeCode: (p as any).productType?.code || matchedType?.code || '',
      productTypeName: (p as any).productType?.name || matchedType?.name || '',
      subTypeCode: p.subTypeCode || '',
      subTypeName: p.subTypeName || '',
      imageUrl: p.imageUrl || '',
      code: p.code,
      barcode: p.barcode || '',
      name: p.name,
      brand: p.brand || '',
      color: p.color || '',
      specification: p.specification || '',
      unit: p.unit,
      supplierId: p.supplierId || '',
      supplierName: p.supplier?.name || '',
      supplierPhone: p.supplier?.phone || '',
      supplierAddress: p.supplier?.address || '',
      costPrice: Number(p.costPrice) || 0,
      sellingPrice: Number(p.sellingPrice) || 0,
      vatRate: p.vatRate ?? 8,
      stockQuantity: p.stockQuantity ?? 0,
      minStockLevel: p.minStockLevel ?? 20,
      maxStockLevel: p.maxStockLevel ?? 0,
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
        const cat = categories.find((c) => c.id === formData.categoryId);
        const payload = {
          ...formData,
          code: formData.code.trim().toUpperCase(),
          name: formData.name.trim(),
          unit: formData.unit.trim(),
          brand: formData.brand?.trim() || null,
          color: formData.color?.trim() || null,
          specification: formData.specification?.trim() || null,
          subTypeCode: formData.subTypeCode?.trim() || null,
          subTypeName: formData.subTypeName?.trim() || null,
          imageUrl: formData.imageUrl?.trim() || null,
          category: cat ? cat.name : (formData.categoryName || formData.category || 'Văn phòng phẩm'),
          costPrice: Number(formData.costPrice) || 0,
          sellingPrice: Number(formData.sellingPrice) || 0,
          vatRate: Number(formData.vatRate) || 8,
          minStockLevel: Number(formData.minStockLevel) || 0,
          maxStockLevel: Number(formData.maxStockLevel) || 0,
          stockQuantity: Number(formData.stockQuantity) || 0
        };

        if (editingProduct) {
          const res = await api.put(`/products/${editingProduct.id}`, payload);
          const updatedData = res.data?.data || res.data;
          // Cập nhật tức thì sản phẩm trong bảng để hiển thị ngay ảnh và thông tin mới
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
        await loadData(true);
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
                      ? 'Cập nhật thông tin chi tiết sản phẩm, giá bán, cấu trúc phân loại và thông số kỹ thuật'
                      : 'Tự động tạo Nhà cung cấp nếu tên NCC mới chưa có trên hệ thống. Áp thuế VAT 8% ngành VPP'}
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
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${formTab === 'structure'
                ? 'border-[#E53935] text-[#E53935] bg-white rounded-t-lg shadow-xs'
                : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-100/60 rounded-t-lg'
                }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>1. Kho & Phân loại</span>
            </button>
            <button
              type="button"
              onClick={() => setFormTab('general')}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${formTab === 'general'
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
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${formTab === 'price'
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
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${formTab === 'supplier'
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

            {/* TAB 1: KHO & CẤU TRÚC PHÂN LOẠI */}
            {formTab === 'structure' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Kho hàng */}
                <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                      <WarehouseIcon className="w-3.5 h-3.5 text-blue-600" />
                      Kho lưu trữ
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
                          className="px-2 py-1 text-xs border border-gray-200 rounded-md bg-white"
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
                  <div className="grid grid-cols-2 gap-3">
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

                {/* Danh mục Cấp 1 */}
                <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-emerald-600" />
                      Danh mục Cấp 1
                    </span>
                    {categories.length > 0 && (
                      <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                        <span>Chọn nhanh:</span>
                        <select
                          value={formData.categoryId}
                          onChange={(e) => {
                            const cat = categories.find((c) => c.id === e.target.value);
                            setFormData({
                              ...formData,
                              categoryId: cat ? cat.id : '',
                              categoryCode: cat ? cat.code : formData.categoryCode,
                              categoryName: cat ? cat.name : formData.categoryName,
                              category: cat ? cat.name : formData.categoryName
                            });
                          }}
                          className="px-2 py-1 text-xs border border-gray-200 rounded-md bg-white"
                        >
                          <option value="">-- Danh mục có sẵn --</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.code})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Mã danh mục</label>
                      <input
                        type="text"
                        placeholder="VD: GIAY, BUT, BIABAN..."
                        value={formData.categoryCode}
                        onChange={(e) => setFormData({ ...formData, categoryCode: e.target.value.toUpperCase() })}
                        className="w-full px-3 py-2 text-xs font-mono font-bold border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-[#E53935]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Tên danh mục</label>
                      <input
                        type="text"
                        placeholder="VD: Giấy, Bút, Bìa sổ..."
                        value={formData.categoryName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            categoryName: e.target.value,
                            category: e.target.value
                          })
                        }
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-[#E53935]"
                      />
                    </div>
                  </div>
                </div>

                {/* Loại hàng Cấp 2 */}
                <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-100 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-purple-600" />
                      Loại hàng Cấp 2
                    </span>
                    {productTypes.length > 0 && (
                      <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                        <span>Chọn nhanh:</span>
                        <select
                          value={formData.productTypeId}
                          onChange={(e) => {
                            const pt = productTypes.find((t) => t.id === e.target.value);
                            setFormData({
                              ...formData,
                              productTypeId: pt ? pt.id : '',
                              productTypeCode: pt ? pt.code : formData.productTypeCode,
                              productTypeName: pt ? pt.name : formData.productTypeName
                            });
                          }}
                          className="px-2 py-1 text-xs border border-gray-200 rounded-md bg-white"
                        >
                          <option value="">-- Loại hàng có sẵn --</option>
                          {productTypes.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name} ({t.code})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Mã loại</label>
                      <input
                        type="text"
                        placeholder="VD: A4, Bubi, A3..."
                        value={formData.productTypeCode}
                        onChange={(e) => setFormData({ ...formData, productTypeCode: e.target.value.toUpperCase() })}
                        className="w-full px-3 py-2 text-xs font-mono font-bold border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-[#E53935]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Tên loại</label>
                      <input
                        type="text"
                        placeholder="VD: Giấy A4, Bút bi, Giấy photo..."
                        value={formData.productTypeName}
                        onChange={(e) => setFormData({ ...formData, productTypeName: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-[#E53935]"
                      />
                    </div>
                  </div>
                </div>

                {/* Nhóm loại Cấp 3 */}
                <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100 space-y-2.5">
                  <span className="text-xs font-bold text-amber-900 block">
                    Nhóm loại Cấp 3 (Mã nhóm loại & Tên nhóm loại)
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Mã nhóm loại</label>
                      <input
                        type="text"
                        placeholder="VD: GIN, BN, BTL..."
                        value={formData.subTypeCode}
                        onChange={(e) => setFormData({ ...formData, subTypeCode: e.target.value.toUpperCase() })}
                        className="w-full px-3 py-2 text-xs font-mono font-bold border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-[#E53935]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Tên nhóm loại</label>
                      <input
                        type="text"
                        placeholder="VD: Giấy in, Bút bi nước, Bút lông..."
                        value={formData.subTypeName}
                        onChange={(e) => setFormData({ ...formData, subTypeName: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-[#E53935]"
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
                    {/* Box xem trước ảnh hình vuông 1:1 */}
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

                    {/* Nút upload & ô nhập URL */}
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
                      placeholder="VD: DBA480, TL027..."
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
                      placeholder="VD: Giấy Double A4 80gsm, Bút bi xanh..."
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
                      placeholder="VD: Double, Thiên long, Bến Nghé, Plus..."
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#E53935]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Màu sắc</label>
                    <input
                      type="text"
                      placeholder="VD: Trắng, Xanh, Đen, Đỏ, Vàng..."
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
                      placeholder="VD: 500 tờ/ream, 20 cây/ hộp, 5 ream/thùng..."
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
                      placeholder="VD: Ream, Cây, hộp, Cuộn, Cái..."
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
                      Giá bán (VNĐ) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
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

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Thuế VAT (%)</label>
                    <select
                      value={formData.vatRate}
                      onChange={(e) => setFormData({ ...formData, vatRate: parseInt(e.target.value) || 8 })}
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
                      Tồn kho tối thiểu
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="VD: 5000, 50..."
                      value={formData.minStockLevel}
                      onChange={(e) =>
                        setFormData({ ...formData, minStockLevel: Math.max(0, parseInt(e.target.value) || 0) })
                      }
                      className="w-full px-3 py-2 text-xs font-semibold border border-gray-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Tồn kho tối đa
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="VD: 10000, 100..."
                      value={formData.maxStockLevel}
                      onChange={(e) =>
                        setFormData({ ...formData, maxStockLevel: Math.max(0, parseInt(e.target.value) || 0) })
                      }
                      className="w-full px-3 py-2 text-xs font-semibold border border-gray-200 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Số lượng tồn kho ban đầu ({formData.unit || 'Đơn vị'})
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', paddingBottom: '0.75rem' }}>
      {/* KHỐI TẬP TRUNG: TIÊU ĐỀ, TABS & THANH CÔNG CỤ (GỘP THÀNH 1 KHỐI) */}
      <div className="card p-3 sm:px-4 sm:py-2.5 rounded-2xl border border-slate-100/90 shadow-sm bg-white/95 backdrop-blur-md space-y-2">
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
              title="Xuất bảng Cấu trúc sản phẩm ra file Excel chuẩn định dạng (.xlsx)"
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
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div
          style={{
            padding: '0.75rem 1.25rem',
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
              • Kéo thả tiêu đề cột để sắp xếp thứ tự hiển thị
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '12.65px', color: '#6B7280' }}>
            <span>Hiển thị <strong>{products.length}</strong> sản phẩm</span>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
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
            <thead>
              <tr className="bg-slate-50/90 border-b border-gray-200 text-gray-600 uppercase text-[11px] font-semibold tracking-wider whitespace-nowrap">
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

                        {/* Nút lọc cho Danh mục */}
                        {colKey === 'categoryName' && (
                          <div className="relative inline-flex items-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenFilterCol(openFilterCol === 'categoryName' ? null : 'categoryName');
                              }}
                              onMouseDown={(e) => e.stopPropagation()}
                              title={categoryFilter ? 'Đang lọc danh mục (Nhấp để đổi hoặc bỏ lọc)' : 'Lọc theo danh mục'}
                              className={`p-1 rounded-md transition-colors cursor-pointer ${
                                categoryFilter
                                  ? 'text-[#E53935] bg-red-50 border border-red-200'
                                  : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              <Filter size={11} className={categoryFilter ? 'fill-[#E53935]' : ''} />
                            </button>

                            {openFilterCol === 'categoryName' && (
                              <div
                                ref={filterMenuRef}
                                onClick={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                                className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 bg-white rounded-xl shadow-2xl border border-gray-200 p-2 z-50 text-left normal-case tracking-normal font-normal text-xs animate-in fade-in zoom-in-95"
                                style={{ width: '220px' }}
                              >
                                <div className="flex items-center justify-between px-1.5 py-1 mb-1.5 border-b border-gray-100">
                                  <span className="font-bold text-gray-800 text-[11px] uppercase tracking-wider">
                                    Lọc Danh mục
                                  </span>
                                  {categoryFilter && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCategoryFilter('');
                                        setOpenFilterCol(null);
                                      }}
                                      className="text-[11px] text-[#E53935] hover:underline font-semibold cursor-pointer"
                                    >
                                      Bỏ lọc
                                    </button>
                                  )}
                                </div>

                                {categories.length > 5 && (
                                  <div className="mb-1.5 px-0.5">
                                    <input
                                      type="text"
                                      placeholder="Tìm danh mục..."
                                      value={catSearchTerm}
                                      onChange={(e) => setCatSearchTerm(e.target.value)}
                                      className="w-full px-2 py-1 text-xs border border-gray-200 rounded-md focus:outline-none focus:border-[#E53935]"
                                    />
                                  </div>
                                )}

                                <div className="max-h-52 overflow-y-auto space-y-0.5 custom-scrollbar">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCategoryFilter('');
                                      setOpenFilterCol(null);
                                    }}
                                    className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors ${
                                      categoryFilter === ''
                                        ? 'bg-red-50 text-[#E53935] font-semibold'
                                        : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                                  >
                                    <span>-- Tất cả danh mục --</span>
                                    {categoryFilter === '' && <Check size={13} className="text-[#E53935]" />}
                                  </button>
                                  {categories
                                    .filter((c) => !catSearchTerm || c.name.toLowerCase().includes(catSearchTerm.toLowerCase()))
                                    .map((c) => (
                                      <button
                                        key={c.id}
                                        type="button"
                                        onClick={() => {
                                          setCategoryFilter(c.id);
                                          setOpenFilterCol(null);
                                        }}
                                        className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors ${
                                          categoryFilter === c.id
                                            ? 'bg-red-50 text-[#E53935] font-semibold'
                                            : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                      >
                                        <span className="truncate mr-2">{c.name}</span>
                                        {categoryFilter === c.id && <Check size={13} className="text-[#E53935] shrink-0" />}
                                      </button>
                                    ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Nút lọc cho Loại hàng hóa */}
                        {colKey === 'productTypeName' && (
                          <div className="relative inline-flex items-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenFilterCol(openFilterCol === 'productTypeName' ? null : 'productTypeName');
                              }}
                              onMouseDown={(e) => e.stopPropagation()}
                              title={productTypeFilter ? 'Đang lọc loại hàng (Nhấp để đổi hoặc bỏ lọc)' : 'Lọc theo loại hàng hóa'}
                              className={`p-1 rounded-md transition-colors cursor-pointer ${
                                productTypeFilter
                                  ? 'text-[#E53935] bg-red-50 border border-red-200'
                                  : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              <Filter size={11} className={productTypeFilter ? 'fill-[#E53935]' : ''} />
                            </button>

                            {openFilterCol === 'productTypeName' && (
                              <div
                                ref={filterMenuRef}
                                onClick={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                                className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 bg-white rounded-xl shadow-2xl border border-gray-200 p-2 z-50 text-left normal-case tracking-normal font-normal text-xs animate-in fade-in zoom-in-95"
                                style={{ width: '220px' }}
                              >
                                <div className="flex items-center justify-between px-1.5 py-1 mb-1.5 border-b border-gray-100">
                                  <span className="font-bold text-gray-800 text-[11px] uppercase tracking-wider">
                                    Lọc Loại hàng
                                  </span>
                                  {productTypeFilter && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setProductTypeFilter('');
                                        setOpenFilterCol(null);
                                      }}
                                      className="text-[11px] text-[#E53935] hover:underline font-semibold cursor-pointer"
                                    >
                                      Bỏ lọc
                                    </button>
                                  )}
                                </div>

                                {productTypes.length > 5 && (
                                  <div className="mb-1.5 px-0.5">
                                    <input
                                      type="text"
                                      placeholder="Tìm loại hàng..."
                                      value={typeSearchTerm}
                                      onChange={(e) => setTypeSearchTerm(e.target.value)}
                                      className="w-full px-2 py-1 text-xs border border-gray-200 rounded-md focus:outline-none focus:border-[#E53935]"
                                    />
                                  </div>
                                )}

                                <div className="max-h-52 overflow-y-auto space-y-0.5 custom-scrollbar">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setProductTypeFilter('');
                                      setOpenFilterCol(null);
                                    }}
                                    className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors ${
                                      productTypeFilter === ''
                                        ? 'bg-red-50 text-[#E53935] font-semibold'
                                        : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                                  >
                                    <span>-- Tất cả loại hàng --</span>
                                    {productTypeFilter === '' && <Check size={13} className="text-[#E53935]" />}
                                  </button>
                                  {productTypes
                                    .filter((pt) => {
                                      if (categoryFilter && pt.categoryId !== categoryFilter) return false;
                                      if (typeSearchTerm && !pt.name.toLowerCase().includes(typeSearchTerm.toLowerCase())) return false;
                                      return true;
                                    })
                                    .map((pt) => (
                                      <button
                                        key={pt.id}
                                        type="button"
                                        onClick={() => {
                                          setProductTypeFilter(pt.id);
                                          setOpenFilterCol(null);
                                        }}
                                        className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors ${
                                          productTypeFilter === pt.id
                                            ? 'bg-red-50 text-[#E53935] font-semibold'
                                            : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                      >
                                        <span className="truncate mr-2">{pt.name}</span>
                                        {productTypeFilter === pt.id && <Check size={13} className="text-[#E53935] shrink-0" />}
                                      </button>
                                    ))}
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
                            case 'categoryCode':
                              return (
                                <td key={colKey} className="py-1 px-2 text-center whitespace-nowrap font-mono text-gray-600">
                                  {p.categoryRel?.code || (p as any).categoryCode || 'GIAY'}
                                </td>
                              );
                            case 'categoryName':
                              return (
                                <td key={colKey} className="py-1 px-2 text-center text-gray-700 truncate" title={p.categoryRel?.name || (p as any).categoryName || p.category || 'Giấy'}>
                                  {p.categoryRel?.name || (p as any).categoryName || p.category || 'Giấy'}
                                </td>
                              );
                            case 'productTypeCode':
                              return (
                                <td key={colKey} className="py-1 px-2 text-center whitespace-nowrap font-mono text-gray-600">
                                  {p.productType?.code || (p as any).productTypeCode || 'A4'}
                                </td>
                              );
                            case 'productTypeName':
                              return (
                                <td key={colKey} className="py-1 px-2 text-center text-gray-700 truncate" title={p.productType?.name || (p as any).productTypeName || 'Giấy A4'}>
                                  {p.productType?.name || (p as any).productTypeName || 'Giấy A4'}
                                </td>
                              );
                            case 'subTypeCode':
                              return (
                                <td key={colKey} className="py-1 px-2 text-center whitespace-nowrap font-mono text-gray-500">
                                  {p.subTypeCode || '—'}
                                </td>
                              );
                            case 'subTypeName':
                              return (
                                <td key={colKey} className="py-1 px-2 text-center text-gray-700 truncate" title={p.subTypeName || '—'}>
                                  {p.subTypeName || '—'}
                                </td>
                              );
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
                            case 'minStockLevel':
                              return (
                                <td key={colKey} className="py-1 px-2 text-right text-gray-700 tabular-nums whitespace-nowrap">
                                  {Number(p.minStockLevel || 0).toLocaleString('vi-VN')}
                                </td>
                              );
                            case 'maxStockLevel':
                              return (
                                <td key={colKey} className="py-1 px-2 text-right text-gray-700 tabular-nums whitespace-nowrap">
                                  {Number(p.maxStockLevel || 1000).toLocaleString('vi-VN')}
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

        <TablePagination
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={products.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemLabel="sản phẩm"
        />
      </div>


      {/* MODAL IMPORT EXCEL HÀNG LOẠT (CẤU TRÚC 21 CỘT) */}
      <ImportExcelModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Nhập danh sách Sản phẩm từ Excel (Cấu trúc 21 cột)"
        sampleFileName="Cau_Truc_San_Pham_NamKhanh.xlsx"
        sampleHeaders={[
          'Stt',
          'Mã kho',
          'Tên Kho',
          'Mã danh mục',
          'Tên danh mục',
          'Mã loại',
          'Tên loại',
          'Mã nhóm loại',
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
          'Tồn kho tối thiểu',
          'Tồn kho tối đa'
        ]}
        sampleRows={[
          [
            '1',
            'NK01',
            'Kho số 1',
            'GIAY',
            'Giấy',
            'A4',
            'Giấy A4',
            'GIN',
            'Giấy in',
            '', // Ô ảnh để trống văn bản vì hình ảnh mẫu đã được nhúng trực tiếp
            'DBA480',
            'Giấy Double A4 80gsm',
            'Double',
            'Trắng',
            '500 tờ/ream',
            'Ream',
            45000,
            65000,
            8,
            5000,
            10000
          ],
          [
            '2',
            'NK02',
            'Kho số 1',
            'BUT',
            'Bút',
            'Bubi',
            'Bút bi',
            'BN',
            'Bút bi nước',
            '', // Ô ảnh để trống văn bản vì hình ảnh mẫu đã được nhúng trực tiếp
            'TL027',
            'Bút bi xanh',
            'Thiên long',
            'Xanh',
            '20 cây/ hộp',
            'Cây, hộp',
            35000,
            65000,
            8,
            50,
            100
          ]
        ]}
        sampleImages={[
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHgAAAB4CAYAAAA5ZDbSAAACu0lEQVR4nO3YMU4DMRBGYQRXpaHnCHScgtNwDypKSkBIQRGKCAkb27sez8zvN9JrooTd+HOciKv3z68d6XblfQMEMAFMAE8awOJ1A355faPOuQJ7v/kZGwK8dHGm//SAbgIG1HfWIFcDAxtnWpCrgMGNN7XIRWBw404NMsCJZzMwuPGnhAxw8gFYfAAWn9XA4OYYgMUHYPEBWHzcga8fnqlQOmDvBctceODTG765e6JCW5CHAgPbDzo0sPdCZQ5g8cICgwswAUwAi5cW+DBWC9P6963vB2CAtYCtswYetYEAFt9AZsCHGQ3cuhCqTQfcCz7bBkoL3LrQ1sBRN1Da72Br4F7Pt35cFti6tQsKcBJglQAWD2DxABYPYPEAFg9g8QAWD2DxABYPYPEAFg9g8QAWD2DxABYvPDDIAFN2YJC34aYApm0BLB7A4gEsXjrgt48dnSQB7L2IGUoL7L1wmQJYvHTA3guWLYDFA1g8gMUDuHKB/j7+u1zegAA3wY0F3v6eyvcB8DAMi3sAOBBGv3uo/bsp/5PlBRxlQ7SsxTLw/9zHjxaBD0+eFdhyQ2xB7g58irwEvHSEzAJstSFMj+j/kH9eeH45gG03gtl3cC3w0gAcHJjvYIBNgG/vH1csyP5V7c+puda6+5kIeL9AJeBeixgZLA3wz+fg8hxQL32Ce2FkAfMC3q/PsCN6ZrBewKUPWNcj+tLFWo7omVva0BZH9P5aXY7o3cS/otedUuc/AM+B61be9Yim+tL8igYYYFIABhlgygQMcj/cVMC0LoDFCwkM8lhcF2CQx+G6ATPjBmDxAVh8ABYfgMVnNTDIOQZg8QFYfAAWn03AIMeeEi7AyacLMMgxpwa3GhjkWFOL2wR8jAy0zxyvf61ZE/ApMvnU4tUMDHQO2M3AlCOAxQNYPIDFA1g8gMX7Brb7JwaNoLXWAAAAAElFTkSuQmCC',
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHgAAAB4CAYAAAA5ZDbSAAACB0lEQVR4nO3dzU0CURSGYaLFWYFF0Icl2ICxCTuwD1cuWRpjgiE6ySDg3PljzrnzvMm3YTEMPOSGBQmbj8+vvdW7zdI3YIANsAFe6QBXvsmA3953NvEWBV76xa9xVwG+9OSavimgewEDXbYhyMXAYOPUB7kIGG68SpE7geHGrQQZcOJGA8ONXxcy4OQB/u3m4fVkNbR64HOwNUEPBl4LbnZkwIDrBO6De9jt9mnpWx4U4ELcZtkC3AMXcKIAAwYMOH6AAQMGnDDAgAEDjh9gwIABJwwwYMCA4wcYMGDACQMMGDDg+AEGDBhwwgADBgw4foABAwacMMCAzyJnC3DhsgYYMGDACQMMGDDg+AEGDBhwwgADBgw4foABAwacMMCAAQOOH2DAgAEnDDBgwIDjBxgwYMAJAwwYMOD4AQYMGHDCAAMGDDh+qwXe+/dRwICTA+/9A3j9wE2Pzy8nqyHAF3ABA04RYMCAMwcYMODMAQYMOHOAAQPOHGDA9QO3u7vfLn0Lkwa41QEXMOBUAW4FGHC6ALcCXDlwjQ0GhpyjdMBz/RDu/HX7PBozwP9eF7AjOnijgCFP0XynRBcu4Ks0J3BzlRHAkGP2YzIRMORYlRzNvYGbz8oxdKbvm/lr3vtS3FHAx0fE7s/jNudKzXoBXzqyLSbsaGDLMcCVD3DlA1z5AFc+wJXvG6pqUpLu8p4XAAAAAElFTkSuQmCC'
        ]}
        requiredFields={['Mã sản phẩm', 'Tên sản phẩm', 'Đơn vị tính', 'Giá bán']}
        fieldMappingHelp="File mẫu chuẩn theo form 'CẤU TRÚC SẢN PHẨM' gồm đúng 21 cột kèm ảnh mẫu được nhúng trực tiếp. Khi điền file của bạn, bạn có thể chèn ảnh (Insert Picture) vào ô cột Hình ảnh sản phẩm hoặc dán link URL ảnh."
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
