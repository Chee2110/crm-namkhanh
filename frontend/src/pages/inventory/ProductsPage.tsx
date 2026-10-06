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
  RotateCcw,
  Columns,
  Upload,
  Image as ImageIcon,
  Loader2,
  Download
} from 'lucide-react';
import { api } from '../../services/api';
import { Product, Warehouse, Category, ProductType, Supplier } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { ImportExcelModal } from '../../components/common/ImportExcelModal';
import ExcelJS from 'exceljs';
import { useTableResize } from '../../hooks/useTableResize';
import { Toast } from '../../components/common/Toast';

export const ProductsPage: React.FC = () => {
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
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [showCostPrice, setShowCostPrice] = useState(false);

  // Modal Import Excel & Drag-and-drop Cột
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isColumnDropdownOpen, setIsColumnDropdownOpen] = useState(false);

  const defaultVisibleCols: Record<string, boolean> = {
    stt: true,
    warehouseCode: true,
    warehouseName: true,
    categoryCode: true,
    categoryName: true,
    productTypeCode: true,
    productTypeName: true,
    subTypeCode: true,
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
    minStockLevel: true,
    maxStockLevel: true,
    actions: true
  };

  const defaultColOrder = [
    'stt',
    'warehouseCode',
    'warehouseName',
    'categoryCode',
    'categoryName',
    'productTypeCode',
    'productTypeName',
    'subTypeCode',
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
    'minStockLevel',
    'maxStockLevel',
    'actions'
  ];

  const columnLabels: Record<string, string> = {
    stt: 'Stt',
    warehouseCode: 'Mã kho',
    warehouseName: 'Tên Kho',
    categoryCode: 'Mã danh mục',
    categoryName: 'Tên danh mục',
    productTypeCode: 'Mã loại',
    productTypeName: 'Tên loại',
    subTypeCode: 'Mã nhóm loại',
    subTypeName: 'Tên nhóm loại',
    image: 'Hình ảnh sản phẩm',
    code: 'Mã sản phẩm',
    name: 'Tên sản phẩm',
    brand: 'Thương hiệu',
    color: 'Màu sắc',
    specification: 'Quy cách',
    unit: 'Đơn vị tính',
    costPrice: 'Giá nhập',
    sellingPrice: 'Giá bán',
    vatRate: 'Thuế VAT',
    minStockLevel: 'Tồn kho tối thiểu',
    maxStockLevel: 'Tồn kho tối đa',
    actions: 'Thao tác'
  };

  // Màu sắc nền tiêu đề các cột chuẩn theo file mẫu Excel "CẤU TRÚC SẢN PHẨM"
  const columnHeaderBg: Record<string, string> = {
    stt: '#D9E1F2',
    warehouseCode: '#D9E1F2',
    warehouseName: '#D9E1F2',
    categoryCode: '#BDD7EE',
    categoryName: '#BDD7EE',
    productTypeCode: '#E2EFDA',
    productTypeName: '#E2EFDA',
    subTypeCode: '#FCE4D6',
    subTypeName: '#FCE4D6',
    image: '#A9D08E',
    code: '#BDD7EE',
    name: '#BDD7EE',
    brand: '#F8CBAD',
    color: '#D9D9D9',
    specification: '#D9E1F2',
    unit: '#D9E1F2',
    costPrice: '#D9E1F2',
    sellingPrice: '#D9E1F2',
    vatRate: '#D9E1F2',
    minStockLevel: '#D9E1F2',
    maxStockLevel: '#D9E1F2',
    actions: '#E5E7EB'
  };

  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('namkhanh_products_visible_cols_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.warehouseCode !== undefined) return parsed;
      }
      return defaultVisibleCols;
    } catch {
      return defaultVisibleCols;
    }
  });

  const [columnOrder, setColumnOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('namkhanh_products_col_order_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.includes('warehouseCode')) return parsed;
      }
      return defaultColOrder;
    } catch {
      return defaultColOrder;
    }
  });

  const defaultProductWidths: Record<string, number> = {
    stt: 50,
    warehouseCode: 95,
    warehouseName: 125,
    categoryCode: 110,
    categoryName: 120,
    productTypeCode: 95,
    productTypeName: 120,
    subTypeCode: 105,
    subTypeName: 120,
    image: 110,
    code: 115,
    name: 240,
    brand: 115,
    color: 95,
    specification: 130,
    unit: 95,
    costPrice: 110,
    sellingPrice: 110,
    vatRate: 90,
    minStockLevel: 115,
    maxStockLevel: 115,
    actions: 95
  };

  const { columnWidths, startResize, resetWidths, getTableWidth } = useTableResize({
    tableKey: 'products_v2',
    defaultWidths: defaultProductWidths,
    minWidth: 50,
    minWidths: {
      stt: 45,
      warehouseCode: 75,
      warehouseName: 90,
      categoryCode: 85,
      categoryName: 90,
      productTypeCode: 75,
      productTypeName: 90,
      subTypeCode: 85,
      subTypeName: 90,
      image: 75,
      code: 90,
      name: 150,
      brand: 80,
      color: 70,
      specification: 90,
      unit: 70,
      costPrice: 85,
      sellingPrice: 85,
      vatRate: 70,
      minStockLevel: 85,
      maxStockLevel: 85,
      actions: 80
    }
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
      localStorage.setItem('namkhanh_products_col_order_v2', JSON.stringify(withoutActions));
    }

    setDraggedCol(null);
    setDragOverCol(null);
  };

  const toggleColumnVisibility = (key: string) => {
    const updated = { ...visibleColumns, [key]: !visibleColumns[key] };
    setVisibleColumns(updated);
    localStorage.setItem('namkhanh_products_visible_cols_v2', JSON.stringify(updated));
  };

  const resetColumns = () => {
    setVisibleColumns(defaultVisibleCols);
    setColumnOrder(defaultColOrder);
    resetWidths();
    localStorage.removeItem('namkhanh_products_visible_cols');
    localStorage.removeItem('namkhanh_products_col_order');
    localStorage.removeItem('namkhanh_products_visible_cols_v2');
    localStorage.removeItem('namkhanh_products_col_order_v2');
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
    try {
      setUploadingImage(true);
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/products/upload-image', fd);
      if (res.data?.url) {
        setFormData((prev) => ({ ...prev, imageUrl: res.data.url }));
      }
    } catch (err: any) {
      // Fallback preview dạng DataURL
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

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
        await api.put(`/products/${editingProduct.id}`, payload);
        setToastMessage('Đã cập nhật thành công');
      } else {
        await api.post('/products', payload);
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu hàng hóa');
    } finally {
      setSaving(false);
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

          {/* Nút Xuất Excel cấu trúc sản phẩm */}
          <button
            onClick={handleExportExcel}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            title="Xuất bảng Cấu trúc sản phẩm ra file Excel chuẩn định dạng (.xlsx)"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                <span>Đang xuất Excel...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>Xuất Excel</span>
              </>
            )}
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
              {/* DÒNG 1: TIÊU ĐỀ MERGED - CẤU TRÚC SẢN PHẨM */}
              <tr className="border-b border-gray-400 bg-white">
                <th
                  colSpan={columnOrder.filter((k) => visibleColumns[k]).length}
                  className="py-3 px-4 text-center font-bold text-base md:text-lg text-gray-900 uppercase tracking-widest border-b-2 border-gray-400"
                  style={{ fontFamily: 'Arial, sans-serif', letterSpacing: '2px' }}
                >
                  CẤU TRÚC SẢN PHẨM
                </th>
              </tr>

              {/* DÒNG 2: CÁC CỘT DỮ LIỆU ĐƯỢC TÔ MÀU PHÂN NHÓM CHUẨN FORM EXCEL */}
              <tr className="border-b border-gray-400 text-gray-900 text-[11px] font-bold">
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
                      className={`py-2 px-2 select-none transition-colors whitespace-nowrap overflow-hidden text-center ${
                        colKey === 'name' ? 'th-left text-left' : 'text-center'
                      } ${
                        colKey === 'actions' ? 'sticky-action-th' : ''
                      } ${
                        dragOverCol === colKey ? 'brightness-95 ring-2 ring-[#E53935]' : ''
                      } ${draggedCol === colKey ? 'opacity-50' : ''}`}
                      style={{
                        width: `${columnWidths[colKey] || defaultProductWidths[colKey] || 110}px`,
                        backgroundColor: columnHeaderBg[colKey] || '#D9E1F2',
                        color: '#000000',
                        borderRight: '1px solid #B0B5BD',
                        borderBottom: '1.5px solid #6B7280',
                        position: colKey === 'actions' ? 'sticky' : 'relative',
                        cursor: colKey !== 'actions' && colKey !== 'stt' ? 'grab' : 'default',
                        textAlign: colKey === 'name' ? 'left' : 'center'
                      }}
                      title={colKey !== 'actions' && colKey !== 'stt' ? 'Kéo thả để thay đổi vị trí cột' : undefined}
                    >
                      <div
                        className={`inline-flex items-center gap-1 w-full ${
                          colKey === 'name' ? 'justify-start' : 'justify-center'
                        }`}
                        style={{
                          justifyContent: colKey === 'name' ? 'flex-start' : 'center'
                        }}
                      >
                        {colKey !== 'actions' && colKey !== 'stt' && (
                          <GripVertical className="w-3 h-3 text-gray-500 opacity-40 hover:opacity-100 flex-shrink-0" />
                        )}
                        <span className="whitespace-nowrap select-none font-bold text-[11px]">
                          {columnLabels[colKey]}
                        </span>
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
            <tbody className="divide-y divide-gray-200 bg-white">
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
                  return (
                    <tr
                      key={p.id}
                      onClick={() => openEditModal(p)}
                      className="hover:bg-amber-50/40 transition-colors cursor-pointer border-b border-gray-200 text-xs"
                    >
                      {columnOrder
                        .filter((k) => visibleColumns[k])
                        .map((colKey) => {
                          switch (colKey) {
                            case 'stt':
                              return (
                                <td key={colKey} className="py-2 px-2 text-center text-gray-800 font-medium whitespace-nowrap border-r border-gray-200">
                                  {idx + 1}
                                </td>
                              );
                            case 'warehouseCode':
                              return (
                                <td key={colKey} className="py-2 px-2 text-center whitespace-nowrap border-r border-gray-200 font-mono font-medium text-gray-900">
                                  {p.warehouse?.code || (p as any).warehouseCode || 'NK01'}
                                </td>
                              );
                            case 'warehouseName':
                              return (
                                <td key={colKey} className="py-2 px-2 text-center text-gray-800 border-r border-gray-200 truncate" title={p.warehouse?.name || (p as any).warehouseName || 'Kho số 1'}>
                                  {p.warehouse?.name || (p as any).warehouseName || 'Kho số 1'}
                                </td>
                              );
                            case 'categoryCode':
                              return (
                                <td key={colKey} className="py-2 px-2 text-center whitespace-nowrap border-r border-gray-200 font-mono font-medium text-gray-900">
                                  {p.categoryRel?.code || (p as any).categoryCode || 'GIAY'}
                                </td>
                              );
                            case 'categoryName':
                              return (
                                <td key={colKey} className="py-2 px-2 text-center text-gray-800 border-r border-gray-200 truncate" title={p.categoryRel?.name || (p as any).categoryName || p.category || 'Giấy'}>
                                  {p.categoryRel?.name || (p as any).categoryName || p.category || 'Giấy'}
                                </td>
                              );
                            case 'productTypeCode':
                              return (
                                <td key={colKey} className="py-2 px-2 text-center whitespace-nowrap border-r border-gray-200 font-mono font-medium text-gray-900">
                                  {p.productType?.code || (p as any).productTypeCode || 'A4'}
                                </td>
                              );
                            case 'productTypeName':
                              return (
                                <td key={colKey} className="py-2 px-2 text-center text-gray-800 border-r border-gray-200 truncate" title={p.productType?.name || (p as any).productTypeName || 'Giấy A4'}>
                                  {p.productType?.name || (p as any).productTypeName || 'Giấy A4'}
                                </td>
                              );
                            case 'subTypeCode':
                              return (
                                <td key={colKey} className="py-2 px-2 text-center whitespace-nowrap border-r border-gray-200 font-mono text-gray-700">
                                  {p.subTypeCode || '—'}
                                </td>
                              );
                            case 'subTypeName':
                              return (
                                <td key={colKey} className="py-2 px-2 text-center text-gray-800 border-r border-gray-200 truncate" title={p.subTypeName || '—'}>
                                  {p.subTypeName || '—'}
                                </td>
                              );
                            case 'image':
                              return (
                                <td key={colKey} className="py-1.5 px-2 text-center border-r border-gray-200">
                                  {p.imageUrl ? (
                                    <img
                                      src={p.imageUrl}
                                      alt={p.name}
                                      className="w-10 h-10 rounded object-contain border border-gray-200 bg-white mx-auto shadow-xs"
                                      onError={(e) => {
                                        (e.target as HTMLElement).style.display = 'none';
                                      }}
                                    />
                                  ) : (
                                    <div className="w-10 h-10 rounded border border-dashed border-gray-300 flex items-center justify-center text-gray-300 mx-auto">
                                      <ImageIcon className="w-4 h-4" />
                                    </div>
                                  )}
                                </td>
                              );
                            case 'code':
                              return (
                                <td key={colKey} className="py-2 px-2 text-center whitespace-nowrap border-r border-gray-200 font-mono font-bold text-gray-900" title={`Mã SP: ${p.code}`}>
                                  {p.code}
                                </td>
                              );
                            case 'name':
                              return (
                                <td key={colKey} className="py-2 px-2.5 text-left border-r border-gray-200 overflow-hidden font-medium text-gray-900 truncate" title={p.name}>
                                  {p.name}
                                </td>
                              );
                            case 'brand':
                              return (
                                <td key={colKey} className="py-2 px-2 text-center text-gray-800 border-r border-gray-200 truncate" title={p.brand || '—'}>
                                  {p.brand || '—'}
                                </td>
                              );
                            case 'color':
                              return (
                                <td key={colKey} className="py-2 px-2 text-center text-gray-700 border-r border-gray-200 truncate" title={p.color || '—'}>
                                  {p.color || '—'}
                                </td>
                              );
                            case 'specification':
                              return (
                                <td key={colKey} className="py-2 px-2 text-center text-gray-700 border-r border-gray-200 truncate" title={p.specification || '—'}>
                                  {p.specification || '—'}
                                </td>
                              );
                            case 'unit':
                              return (
                                <td key={colKey} className="py-2 px-2 text-center text-gray-800 font-medium whitespace-nowrap border-r border-gray-200">
                                  {p.unit}
                                </td>
                              );
                            case 'costPrice':
                              return (
                                <td key={colKey} className="py-2 px-2 text-right text-gray-800 border-r border-gray-200 tabular-nums whitespace-nowrap">
                                  {Number(p.costPrice).toLocaleString('vi-VN')}
                                </td>
                              );
                            case 'sellingPrice':
                              return (
                                <td key={colKey} className="py-2 px-2 text-right font-bold text-gray-900 border-r border-gray-200 tabular-nums whitespace-nowrap">
                                  {Number(p.sellingPrice).toLocaleString('vi-VN')}
                                </td>
                              );
                            case 'vatRate':
                              return (
                                <td key={colKey} className="py-2 px-2 text-center text-gray-800 border-r border-gray-200 tabular-nums whitespace-nowrap">
                                  {p.vatRate ?? 8}
                                </td>
                              );
                            case 'minStockLevel':
                              return (
                                <td key={colKey} className="py-2 px-2 text-right text-gray-800 border-r border-gray-200 tabular-nums whitespace-nowrap">
                                  {Number(p.minStockLevel || 0).toLocaleString('vi-VN')}
                                </td>
                              );
                            case 'maxStockLevel':
                              return (
                                <td key={colKey} className="py-2 px-2 text-right text-gray-800 border-r border-gray-200 tabular-nums whitespace-nowrap">
                                  {Number(p.maxStockLevel || 1000).toLocaleString('vi-VN')}
                                </td>
                              );
                            case 'actions':
                              return (
                                <td key={colKey} onClick={(e) => e.stopPropagation()} className="py-2 px-2 text-center sticky-action-td whitespace-nowrap bg-white border-l border-gray-200">
                                  <div className="flex items-center justify-center gap-1">
                                    {hasPermission('C_PRODUCTS', 'update') && (
                                      <button
                                        onClick={() => openEditModal(p)}
                                        className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                                        title="Chỉnh sửa sản phẩm"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                    {hasPermission('C_PRODUCTS', 'delete') && (
                                      <button
                                        onClick={() => handleDelete(p)}
                                        className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
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
            <div className="flex border-b border-gray-200 bg-gray-50/80 px-6 pt-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => setFormTab('structure')}
                className={`px-4 py-2 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  formTab === 'structure'
                    ? 'border-[#E53935] text-[#E53935] bg-white'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                1. Kho & Phân loại
              </button>
              <button
                type="button"
                onClick={() => setFormTab('general')}
                className={`px-4 py-2 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  formTab === 'general'
                    ? 'border-[#E53935] text-[#E53935] bg-white'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                2. Sản phẩm & Hình ảnh
              </button>
              <button
                type="button"
                onClick={() => setFormTab('price')}
                className={`px-4 py-2 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  formTab === 'price'
                    ? 'border-[#E53935] text-[#E53935] bg-white'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                3. Giá & Tồn kho
              </button>
              <button
                type="button"
                onClick={() => setFormTab('supplier')}
                className={`px-4 py-2 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  formTab === 'supplier'
                    ? 'border-[#E53935] text-[#E53935] bg-white'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                4. Nhà cung cấp & Khác
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-[#E53935] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {formError}
                </div>
              )}

              {/* TAB 1: KHO & CẤU TRÚC PHÂN LOẠI (Mã kho, Tên Kho, Mã danh mục, Tên danh mục, Mã loại, Tên loại, Mã nhóm loại, Tên nhóm loại) */}
              {formTab === 'structure' && (
                <div className="space-y-4">
                  {/* Kho hàng */}
                  <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-100 space-y-2.5">
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
                  <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-100 space-y-2.5">
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
                  <div className="p-3.5 bg-purple-50/50 rounded-xl border border-purple-100 space-y-2.5">
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
                  <div className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-100 space-y-2.5">
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

              {/* TAB 2: SẢN PHẨM & HÌNH ẢNH (Hình ảnh, Mã SP, Tên SP, Thương hiệu, Màu sắc, Quy cách, ĐVT, Barcode) */}
              {formTab === 'general' && (
                <div className="space-y-4">
                  {/* HÌNH ẢNH SẢN PHẨM */}
                  <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-2.5">
                    <label className="block text-xs font-semibold text-gray-800">
                      Hình ảnh sản phẩm
                    </label>
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <div className="w-20 h-20 rounded-xl border border-gray-200 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-xs relative group">
                        {formData.imageUrl ? (
                          <>
                            <img
                              src={formData.imageUrl}
                              alt="Xem trước SP"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, imageUrl: '' })}
                              className="absolute inset-0 bg-black/60 text-white text-[11px] font-semibold opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                            >
                              Xóa ảnh
                            </button>
                          </>
                        ) : (
                          <div className="text-center p-2 text-gray-400">
                            <ImageIcon className="w-6 h-6 mx-auto mb-1 opacity-50" />
                            <span className="text-[10px] block leading-tight">Chưa có ảnh</span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 w-full space-y-2">
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-lg cursor-pointer shadow-xs transition-colors">
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

                  <div className="grid grid-cols-2 gap-4">
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

                  <div className="grid grid-cols-2 gap-4">
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

                  <div className="grid grid-cols-2 gap-4">
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

              {/* TAB 3: GIÁ CẢ & TỒN KHO (Giá nhập, Giá bán, Thuế VAT, Tồn kho tối thiểu, Tồn kho tối đa, Tồn ban đầu) */}
              {formTab === 'price' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Giá nhập (VNĐ) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="500"
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
                        step="500"
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

                  <div className="grid grid-cols-4 gap-2.5">
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
                        step="0.1"
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
                      className="px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-xs font-semibold cursor-pointer"
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
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Tiếp theo
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-xs cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 bg-[#E53935] hover:bg-[#D32F2F] disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
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
        </div>
      )}
      {/* MODAL IMPORT EXCEL HÀNG LOẠT (CẤU TRÚC 21 CỘT) */}
      <ImportExcelModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Nhập danh sách Sản phẩm VPP từ Excel (Cấu trúc 21 cột)"
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
