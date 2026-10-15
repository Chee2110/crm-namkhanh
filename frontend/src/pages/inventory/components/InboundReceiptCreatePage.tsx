import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Save,
  Send,
  Plus,
  Trash2,
  Upload,
  Calendar,
  Warehouse as WarehouseIcon,
  Truck,
  FileText,
  AlertCircle,
  Package,
  Layers,
  CheckCircle,
  Loader2,
  FileCheck,
  Tag,
  DollarSign,
  Boxes,
  HelpCircle,
  ExternalLink,
  Search,
  X,
  Check,
  FileSpreadsheet
} from 'lucide-react';
import { api } from '../../../services/api';
import {
  Warehouse,
  Supplier,
  Product,
  InboundReceipt,
  InboundReceiptType
} from '../../../types';
import { numberToWords } from '../../../utils/numberToWords';
import { SelectExistingProductsModal } from './SelectExistingProductsModal';
import { ImportItemsModal } from '../../../components/common/ImportItemsModal';
import { ProductAutocompleteInput } from '../../../components/common/ProductAutocompleteInput';

interface InboundReceiptCreatePageProps {
  editingReceipt?: InboundReceipt | null;
  warehouses: Warehouse[];
  suppliers: Supplier[];
  onBack: () => void;
  onSuccess: (receipt: InboundReceipt) => void;
}

interface FormItem {
  id?: string;
  productId?: string | null;
  productCode: string;
  productName: string;
  unit: string;
  expectedQuantity: number;
  actualQuantity: number;
  acceptedQuantity: number;
  rejectedQuantity: number;
  unitPrice: number;
  amount: number;
  vatRate: number;
  total: number;
  batchNumber: string;
  productionDate: string;
  expiryDate: string;
  locationArea: string;
  locationRack: string;
  locationShelf: string;
  locationBin: string;
  qualityStatus: 'PASSED' | 'CONDITIONAL' | 'FAILED';
  qualityNotes: string;
  currentStock?: number;
}

export const InboundReceiptCreatePage: React.FC<InboundReceiptCreatePageProps> = ({
  editingReceipt,
  warehouses,
  suppliers,
  onBack,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Danh mục sản phẩm để chọn
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [activeItemIndexForProductSelect, setActiveItemIndexForProductSelect] = useState<number | null>(null);

  // Form states
  const [code, setCode] = useState('');
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<InboundReceiptType>('PURCHASE');
  const [warehouseId, setWarehouseId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [sourceName, setSourceName] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [documentDate, setDocumentDate] = useState('');
  const [notes, setNotes] = useState('');
  const [vatRate, setVatRate] = useState<number>(0);
  const [fileUrl, setFileUrl] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');

  const [items, setItems] = useState<FormItem[]>([]);

  // Trạng thái Modals chọn hàng có sẵn & nhập file Excel
  const [isSelectExistingModalOpen, setIsSelectExistingModalOpen] = useState(false);
  const [isImportExcelModalOpen, setIsImportExcelModalOpen] = useState(false);

  // Tải danh mục sản phẩm từ backend
  useEffect(() => {
    api.get<Product[]>('/products')
      .then((res) => {
        if (Array.isArray(res.data)) {
          setAvailableProducts(res.data.filter((p) => p.status === 'ACTIVE'));
        }
      })
      .catch((err) => console.error('Lỗi tải danh mục sản phẩm:', err));
  }, []);

  // Khởi tạo dữ liệu form (khi tạo mới hoặc chỉnh sửa)
  useEffect(() => {
    if (editingReceipt) {
      setCode(editingReceipt.code);
      setReceiptDate(new Date(editingReceipt.receiptDate).toISOString().split('T')[0]);
      setType(editingReceipt.type);
      setWarehouseId(editingReceipt.warehouseId || '');
      setSupplierId(editingReceipt.supplierId || '');
      setSourceName(editingReceipt.sourceName || '');
      setDocumentNumber(editingReceipt.documentNumber || '');
      setDocumentDate(
        editingReceipt.documentDate
          ? new Date(editingReceipt.documentDate).toISOString().split('T')[0]
          : ''
      );
      setNotes(editingReceipt.notes || '');
      setVatRate(editingReceipt.vatRate || 0);
      setFileUrl(editingReceipt.fileUrl || '');
      setFileName(editingReceipt.fileName || '');

      setItems(
        editingReceipt.items.map((it) => {
          const matched = availableProducts.find(
            (p) => p.id === it.productId || (it.productCode && p.code === it.productCode)
          );
          return {
            id: it.id,
            productId: it.productId,
            productCode: it.productCode,
            productName: it.productName,
            unit: it.unit,
            expectedQuantity: it.expectedQuantity,
            actualQuantity: it.actualQuantity,
            acceptedQuantity: it.acceptedQuantity,
            rejectedQuantity: it.rejectedQuantity || 0,
            unitPrice: Number(it.unitPrice) || 0,
            amount: Number(it.amount) || 0,
            vatRate: it.vatRate || 0,
            total: Number(it.total) || 0,
            batchNumber: it.batchNumber || '',
            productionDate: it.productionDate
              ? new Date(it.productionDate).toISOString().split('T')[0]
              : '',
            expiryDate: it.expiryDate
              ? new Date(it.expiryDate).toISOString().split('T')[0]
              : '',
            locationArea: it.locationArea || '',
            locationRack: it.locationRack || '',
            locationShelf: it.locationShelf || '',
            locationBin: it.locationBin || '',
            qualityStatus: it.qualityStatus || 'PASSED',
            qualityNotes: it.qualityNotes || '',
            currentStock: matched?.stockQuantity !== undefined ? matched.stockQuantity : undefined
          };
        })
      );
    } else {
      // Tạo mới: Lấy mã phiếu tự động
      api.get<{ code: string }>('/inbound-receipts/next-code')
        .then((res) => {
          if (res.data?.code) setCode(res.data.code);
        })
        .catch(() => setCode(`PNK-${new Date().getFullYear()}-0001`));

      setReceiptDate(new Date().toISOString().split('T')[0]);
      setType('PURCHASE');
      setWarehouseId(warehouses.length > 0 ? warehouses[0].id : '');
      setSupplierId('');
      setSourceName('');
      setDocumentNumber('');
      setDocumentDate('');
      setNotes('');
      setVatRate(0);
      setFileUrl('');
      setFileName('');

      setItems([
        {
          productId: null,
          productCode: '',
          productName: '',
          unit: 'Cái',
          expectedQuantity: 1,
          actualQuantity: 1,
          acceptedQuantity: 1,
          rejectedQuantity: 0,
          unitPrice: 0,
          amount: 0,
          vatRate: 0,
          total: 0,
          batchNumber: '',
          productionDate: '',
          expiryDate: '',
          locationArea: 'Khu A',
          locationRack: 'Kệ 01',
          locationShelf: '',
          locationBin: '',
          qualityStatus: 'PASSED',
          qualityNotes: ''
        }
      ]);
    }

    setError(null);
  }, [editingReceipt, warehouses]);

  // Thêm dòng mặt hàng mới
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        productId: null,
        productCode: '',
        productName: '',
        unit: 'Cái',
        expectedQuantity: 1,
        actualQuantity: 1,
        acceptedQuantity: 1,
        rejectedQuantity: 0,
        unitPrice: 0,
        amount: 0,
        vatRate: vatRate,
        total: 0,
        batchNumber: '',
        productionDate: '',
        expiryDate: '',
        locationArea: 'Khu A',
        locationRack: 'Kệ 01',
        locationShelf: '',
        locationBin: '',
        qualityStatus: 'PASSED',
        qualityNotes: ''
      }
    ]);
  };

  // Xóa dòng mặt hàng
  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      setError('Phiếu nhập kho phải có ít nhất 1 mặt hàng');
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Chọn sản phẩm từ Master Data
  const handleSelectProduct = (index: number, product: Product) => {
    setItems((prev) => {
      const copy = [...prev];
      const it = copy[index];
      const unitPrice = Number(product.costPrice) || 0;
      const expectedQty = it.expectedQuantity || 1;
      const actualQty = it.actualQuantity !== undefined ? it.actualQuantity : expectedQty;
      const acceptedQty = actualQty;
      const amount = acceptedQty * unitPrice;
      const itemVat = it.vatRate || vatRate;
      const total = amount + (amount * itemVat) / 100;

      copy[index] = {
        ...it,
        productId: product.id,
        productCode: product.code,
        productName: product.name,
        unit: product.unit,
        unitPrice,
        amount,
        vatRate: itemVat,
        total,
        currentStock: product.stockQuantity || 0
      };
      return copy;
    });
    setActiveItemIndexForProductSelect(null);
    setProductSearch('');
  };

  // Bỏ liên kết sản phẩm cũ để nhập sản phẩm mới
  const handleClearSelectedProduct = (index: number) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        productId: null,
        currentStock: undefined
      };
      return copy;
    });
  };

  // Thêm nhanh danh sách hàng hóa có sẵn được chọn từ Modal
  const handleSelectExistingProducts = (selectedProducts: Product[]) => {
    if (selectedProducts.length === 0) return;

    setItems((prev) => {
      const isInitialEmpty =
        prev.length === 1 &&
        !prev[0].productId &&
        !prev[0].productName.trim() &&
        (!prev[0].productCode || prev[0].productCode === 'SKU-NEW');

      const baseList = isInitialEmpty ? [] : [...prev];

      const newItems: FormItem[] = selectedProducts.map((p) => {
        const unitPrice = Number(p.costPrice) || 0;
        const expectedQty = 1;
        const actualQty = 1;
        const acceptedQty = 1;
        const amount = acceptedQty * unitPrice;
        const itemVat = vatRate;
        const total = amount + (amount * itemVat) / 100;

        return {
          productId: p.id,
          productCode: p.code,
          productName: p.name,
          unit: p.unit || 'Cái',
          expectedQuantity: expectedQty,
          actualQuantity: actualQty,
          acceptedQuantity: acceptedQty,
          rejectedQuantity: 0,
          unitPrice,
          amount,
          vatRate: itemVat,
          total,
          batchNumber: '',
          productionDate: '',
          expiryDate: '',
          locationArea: 'Khu A',
          locationRack: 'Kệ 01',
          locationShelf: '',
          locationBin: '',
          qualityStatus: 'PASSED',
          qualityNotes: '',
          currentStock: p.stockQuantity || 0
        };
      });

      return [...baseList, ...newItems];
    });
  };

  // Nhập danh sách mặt hàng từ Excel/CSV
  const handleImportFromExcel = (importedRows: any[]) => {
    if (!importedRows || importedRows.length === 0) return;

    setItems((prev) => {
      const isInitialEmpty =
        prev.length === 1 &&
        !prev[0].productId &&
        !prev[0].productName.trim() &&
        (!prev[0].productCode || prev[0].productCode === 'SKU-NEW');

      const baseList = isInitialEmpty ? [] : [...prev];

      const newItems: FormItem[] = importedRows.map((row) => {
        const matchedProd = availableProducts.find(
          (p) =>
            (row.productCode && p.code.toLowerCase() === row.productCode.toLowerCase().trim()) ||
            (row.productId && p.id === row.productId)
        );

        const expQty = Math.max(1, Number(row.quantity) || 1);
        const actualQty = expQty;
        const acceptedQty = expQty;
        const unitPrice = Number(row.unitPrice) || Number(matchedProd?.costPrice) || 0;
        const amount = acceptedQty * unitPrice;
        const itemVat = row.vatRate !== undefined ? Number(row.vatRate) : vatRate;
        const total = amount + (amount * itemVat) / 100;

        return {
          productId: matchedProd?.id || row.productId || null,
          productCode: matchedProd?.code || row.productCode || 'SKU-NEW',
          productName: matchedProd?.name || row.productName || 'Hàng hóa',
          unit: matchedProd?.unit || row.unit || 'Cái',
          expectedQuantity: expQty,
          actualQuantity: actualQty,
          acceptedQuantity: acceptedQty,
          rejectedQuantity: 0,
          unitPrice,
          amount,
          vatRate: itemVat,
          total,
          batchNumber: row.batchNumber || '',
          productionDate: row.productionDate || '',
          expiryDate: row.expiryDate || '',
          locationArea: row.locationArea || 'Khu A',
          locationRack: row.locationRack || 'Kệ 01',
          locationShelf: '',
          locationBin: '',
          qualityStatus: 'PASSED',
          qualityNotes: '',
          currentStock: matchedProd?.stockQuantity || 0
        };
      });

      return [...baseList, ...newItems];
    });

    setIsImportExcelModalOpen(false);
  };

  // Cập nhật giá trị trường của một item
  const handleItemChange = (index: number, field: keyof FormItem, value: any) => {
    setItems((prev) => {
      const copy = [...prev];
      const it = { ...copy[index], [field]: value };

      if (
        field === 'actualQuantity' ||
        field === 'expectedQuantity' ||
        field === 'acceptedQuantity' ||
        field === 'unitPrice' ||
        field === 'vatRate'
      ) {
        const actQty = Number(it.actualQuantity) || 0;
        const accQty = field === 'acceptedQuantity' ? Number(value) : actQty;
        it.acceptedQuantity = accQty;
        it.rejectedQuantity = Math.max(0, actQty - accQty);

        const price = Number(it.unitPrice) || 0;
        const itemVat = Number(it.vatRate) || 0;

        it.amount = accQty * price;
        it.total = it.amount + (it.amount * itemVat) / 100;
      }

      copy[index] = it;
      return copy;
    });
  };

  // Upload file chứng từ / hóa đơn đính kèm
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setError(null);
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.post<{ fileUrl: string; fileName: string }>(
        '/inbound-receipts/upload',
        formData
      );

      if (res.data?.fileUrl) {
        setFileUrl(res.data.fileUrl);
        setFileName(res.data.fileName || file.name);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi khi tải file chứng từ');
    } finally {
      setUploading(false);
    }
  };

  // Tính tổng
  const subtotal = items.reduce((sum, it) => sum + (it.amount || 0), 0);
  const vatAmount = (subtotal * vatRate) / 100;
  const totalAmount = subtotal + vatAmount;
  const totalItemsCount = items.length;
  const totalActualQty = items.reduce((s, it) => s + (Number(it.actualQuantity) || 0), 0);

  // Submit form
  const handleSubmit = async (targetStatus: 'DRAFT' | 'CHECKING') => {
    setError(null);

    if (!warehouseId) {
      setError('Vui lòng chọn Kho lưu trữ nhận hàng');
      return;
    }

    if (items.length === 0) {
      setError('Vui lòng thêm ít nhất một mặt hàng nhập kho');
      return;
    }

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.productName || !it.productName.trim()) {
        setError(`Dòng số ${i + 1}: Vui lòng nhập hoặc chọn tên sản phẩm/NVL`);
        return;
      }
      if (it.actualQuantity <= 0) {
        setError(`Dòng số ${i + 1}: Số lượng thực nhập phải lớn hơn 0`);
        return;
      }
    }

    const payload = {
      code: code.trim(),
      receiptDate,
      type,
      warehouseId,
      supplierId: supplierId || null,
      sourceName: sourceName.trim() || null,
      documentNumber: documentNumber.trim() || null,
      documentDate: documentDate || null,
      status: targetStatus,
      vatRate,
      notes: notes.trim() || null,
      fileUrl: fileUrl || null,
      fileName: fileName || null,
      items: items.map((it) => ({
        productId: it.productId || null,
        productCode: it.productCode || 'SKU-NEW',
        productName: it.productName,
        unit: it.unit || 'Cái',
        expectedQuantity: Number(it.expectedQuantity) || 1,
        actualQuantity: Number(it.actualQuantity) || 1,
        acceptedQuantity: Number(it.acceptedQuantity) || 1,
        rejectedQuantity: Number(it.rejectedQuantity) || 0,
        unitPrice: Number(it.unitPrice) || 0,
        amount: it.amount,
        vatRate: it.vatRate,
        total: it.total,
        batchNumber: it.batchNumber || null,
        productionDate: it.productionDate || null,
        expiryDate: it.expiryDate || null,
        locationArea: it.locationArea || null,
        locationRack: it.locationRack || null,
        locationShelf: it.locationShelf || null,
        locationBin: it.locationBin || null,
        qualityStatus: it.qualityStatus,
        qualityNotes: it.qualityNotes || null
      }))
    };

    try {
      setLoading(true);
      let res;
      if (editingReceipt) {
        res = await api.put<InboundReceipt>(`/inbound-receipts/${editingReceipt.id}`, payload);
      } else {
        res = await api.post<InboundReceipt>('/inbound-receipts', payload);
      }

      onSuccess(res.data);
    } catch (err: any) {
      console.error('Lỗi lưu phiếu nhập kho:', err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu phiếu nhập kho');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = availableProducts.filter((p) => {
    if (!productSearch) return true;
    const term = productSearch.toLowerCase();
    return (
      p.code.toLowerCase().includes(term) ||
      p.name.toLowerCase().includes(term) ||
      p.category?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 pb-24">
      {/* 1. THANH ĐIỀU HƯỚNG TRANG & TIÊU ĐỀ */}
      <div className="card p-6 rounded-3xl border border-slate-100/80 shadow-card bg-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại danh sách phiếu nhập</span>
            </button>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-bold text-[#E53935] uppercase tracking-wide">
              {editingReceipt ? 'Chỉnh sửa phiếu' : 'Lập phiếu nhập kho'}
            </span>
          </div>

          <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-50 text-[#E53935] flex items-center justify-center font-bold border border-red-100 shadow-sm">
              <Package className="w-5 h-5" />
            </div>
            <span>
              {editingReceipt ? `Chỉnh sửa phiếu nhập kho: ${editingReceipt.code}` : 'Lập Phiếu Nhập Kho Mới'}
            </span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Ghi nhận nguồn hàng, quản lý lô hàng, hạn sử dụng, định vị kệ/ô lưu trữ và kiểm tra chất lượng thực nhận
          </p>
        </div>

        {/* Nút hành động phía trên */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            Hủy bỏ
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => handleSubmit('DRAFT')}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 text-slate-500" />}
            <span>Lưu bản nháp</span>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => handleSubmit('CHECKING')}
            className="px-5 py-2 text-xs font-bold text-white bg-[#E53935] hover:bg-[#D32F2F] rounded-xl flex items-center gap-1.5 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>{editingReceipt ? 'Cập nhật phiếu nhập kho' : 'Tạo phiếu & Chờ kiểm hàng'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700 text-xs shadow-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* 2. CARD 1: THÔNG TIN CHUNG PHIẾU NHẬP */}
      {/* 2. CARD 1: THÔNG TIN CHUNG PHIẾU NHẬP */}
      <div className="card p-5 rounded-2xl border border-slate-100/80 shadow-card bg-white space-y-3.5">
        <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#E53935]" />
            <span>1. Thông tin chung phiếu nhập kho</span>
          </div>
          <span className="text-[11px] text-slate-400 font-normal italic">
            * Các trường có dấu hoa thị là bắt buộc
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-6 lg:grid-cols-12 gap-x-3 gap-y-3">
          {/* HÀNG 1: ĐỊNH DANH PHIẾU & KHO TIẾP NHẬN (4 TRƯỜNG BẮT BUỘC) */}
          {/* Mã phiếu */}
          <div className="col-span-1 sm:col-span-3 lg:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1 truncate">
              Mã phiếu nhập <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="PNK-2026-XXXX"
              className="w-full h-9 px-2.5 py-1 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-red-500 font-mono font-bold text-slate-900 bg-slate-50/50"
            />
          </div>

          {/* Ngày nhập kho */}
          <div className="col-span-1 sm:col-span-3 lg:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1 truncate">
              Ngày nhập kho <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={receiptDate}
              onChange={(e) => setReceiptDate(e.target.value)}
              className="w-full h-9 px-2.5 py-1 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-red-500 text-slate-800"
            />
          </div>

          {/* Loại nhập kho */}
          <div className="col-span-1 sm:col-span-3 lg:col-span-4">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1 truncate">
              Loại nhập kho <span className="text-red-500">*</span>
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as InboundReceiptType)}
              className="w-full h-9 px-2.5 py-1 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-red-500 font-semibold text-slate-800 bg-white"
            >
              <option value="PURCHASE">Nhập mua hàng từ NCC</option>
              <option value="FINISHED_GOODS">Nhập thành phẩm sản xuất</option>
              <option value="RETURN">Nhập hàng khách hoàn trả</option>
              <option value="ADJUSTMENT">Nhập điều chỉnh kiểm kê</option>
            </select>
          </div>

          {/* Kho nhận hàng */}
          <div className="col-span-1 sm:col-span-3 lg:col-span-4">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1 truncate">
              Kho lưu trữ nhận hàng <span className="text-red-500">*</span>
            </label>
            <select
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              className="w-full h-9 px-2.5 py-1 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-red-500 font-semibold text-slate-800 bg-white"
            >
              <option value="">-- Chọn kho lưu trữ --</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name} ({wh.code})
                </option>
              ))}
            </select>
          </div>

          {/* HÀNG 2: NGUỒN GỐC HÀNG HÓA (ĐỐI TÁC CUNG ỨNG / NGUỒN NỘI BỘ) */}
          {/* Nhà cung cấp hoặc nguồn nhập */}
          <div className="col-span-1 sm:col-span-3 lg:col-span-6">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1 truncate">
              Nhà cung cấp / Đối tác cung ứng
            </label>
            <select
              value={supplierId}
              onChange={(e) => {
                setSupplierId(e.target.value);
                if (e.target.value) setSourceName('');
              }}
              className="w-full h-9 px-2.5 py-1 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-red-500 text-slate-800 bg-white"
            >
              <option value="">-- Chọn Nhà cung cấp --</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          {/* Nguồn nhập tự do */}
          <div className="col-span-1 sm:col-span-3 lg:col-span-6">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1 truncate">
              Nguồn nhập khác (Xưởng, Chi nhánh...)
            </label>
            <input
              type="text"
              value={sourceName}
              onChange={(e) => setSourceName(e.target.value)}
              placeholder="VD: Xưởng in ấn, đơn vị trả hàng..."
              className="w-full h-9 px-2.5 py-1 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-red-500 text-slate-800"
            />
          </div>

          {/* HÀNG 3: BỘ CHỨNG TỪ GỐC, HÓA ĐƠN & THUẾ VAT */}
          {/* Số chứng từ gốc */}
          <div className="col-span-1 sm:col-span-3 lg:col-span-3">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1 truncate">
              Số hóa đơn / Chứng từ gốc
            </label>
            <input
              type="text"
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              placeholder="Số HĐ đỏ, PO, BBGN..."
              className="w-full h-9 px-2.5 py-1 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-red-500 font-mono text-slate-800"
            />
          </div>

          {/* Ngày chứng từ gốc */}
          <div className="col-span-1 sm:col-span-3 lg:col-span-3">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1 truncate">
              Ngày ghi chứng từ gốc
            </label>
            <input
              type="date"
              value={documentDate}
              onChange={(e) => setDocumentDate(e.target.value)}
              className="w-full h-9 px-2.5 py-1 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-red-500 text-slate-800"
            />
          </div>

          {/* Thuế suất VAT */}
          <div className="col-span-1 sm:col-span-3 lg:col-span-3">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1 truncate">
              Thuế suất VAT (%)
            </label>
            <select
              value={vatRate}
              onChange={(e) => {
                const r = Number(e.target.value);
                setVatRate(r);
                setItems((prev) => prev.map((it) => ({ ...it, vatRate: r })));
              }}
              className="w-full h-9 px-2.5 py-1 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-red-500 font-semibold text-slate-800 bg-white"
            >
              <option value="0">0% (Không chịu thuế)</option>
              <option value="5">5%</option>
              <option value="8">8% (Thuế chuẩn GTGT)</option>
              <option value="10">10%</option>
            </select>
          </div>

          {/* File đính kèm */}
          <div className="col-span-1 sm:col-span-3 lg:col-span-3">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1 truncate">
              Tệp tin đính kèm
            </label>
            <div className="h-9">
              {fileName ? (
                <div className="flex items-center justify-between h-full px-2 text-xs text-emerald-700 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div className="flex items-center gap-1 min-w-0">
                    <FileCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="font-semibold truncate text-[11px]" title={fileName}>
                      {fileName}
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0 ml-1">
                    {fileUrl && (
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 text-emerald-800 hover:text-emerald-950"
                        title="Xem file"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setFileUrl('');
                        setFileName('');
                      }}
                      className="p-1 text-slate-400 hover:text-red-500"
                      title="Xóa tệp đính kèm"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ) : (
                <label className="cursor-pointer h-full px-2.5 text-xs font-semibold border border-dashed border-slate-300 hover:border-red-500 hover:bg-red-50/50 rounded-lg flex items-center justify-center gap-1.5 transition-colors text-slate-600 bg-slate-50/50">
                  <Upload className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{uploading ? 'Đang tải...' : 'Chọn file đính kèm'}</span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xlsx"
                  />
                </label>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. CARD 2: CHI TIẾT MẶT HÀNG & NVL */}
      <div className="card p-6 rounded-3xl border border-slate-100/80 shadow-card bg-white space-y-4">
        <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#E53935]" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              2. Danh sách mặt hàng & Vị trí lưu kho ({items.length} mặt hàng)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Nút Chọn hàng hóa có sẵn trong kho để nhập thêm */}
            <button
              type="button"
              onClick={() => setIsSelectExistingModalOpen(true)}
              className="px-3.5 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              title="Mở danh mục hàng hóa cũ có sẵn trong kho để chọn nhập thêm số lượng"
            >
              <Boxes className="w-4 h-4 text-blue-600" />
              <span>+ Chọn hàng hóa có sẵn trong kho</span>
            </button>

            {/* Nút Nhập từ file Excel/CSV */}
            <button
              type="button"
              onClick={() => setIsImportExcelModalOpen(true)}
              className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              title="Nhập nhanh danh sách từ file Excel/CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Nhập file Excel/CSV</span>
            </button>

            {/* Nút Thêm mặt hàng mới */}
            <button
              type="button"
              onClick={handleAddItem}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#E53935] hover:bg-[#D32F2F] rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              title="Thêm một dòng mặt hàng mới chưa có trong hệ thống"
            >
              <Plus className="w-4 h-4" />
              <span>+ Thêm mặt hàng mới</span>
            </button>
          </div>
        </div>

        {/* Bảng mặt hàng đầy đủ kích thước */}
        <div className="border border-slate-200 rounded-2xl overflow-x-auto shadow-xs">
          <table className="w-full text-left text-xs min-w-[950px]">
            <thead>
              <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 text-center select-none">
                <th className="px-2 py-3 w-10">STT</th>
                <th className="px-3 py-3 w-36 text-left">Mã hàng hóa</th>
                <th className="px-3 py-3 text-left w-64">Tên hàng hóa / Mặt hàng</th>
                <th className="px-2 py-3 w-16">ĐVT</th>
                <th className="px-2 py-3 w-24">Số lượng</th>
                <th className="px-2 py-3 w-28 text-right">Đơn giá (VNĐ)</th>
                <th className="px-2 py-3 w-28 text-right">Thành tiền</th>
                <th className="px-2 py-3 w-40">Vị trí kho lưu trữ</th>
                <th className="px-2 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-2 py-2.5 text-center text-slate-400 font-bold">{idx + 1}</td>

                  {/* Mã hàng hóa (Mã SKU) */}
                  <td className="px-3 py-2.5">
                    <input
                      type="text"
                      value={item.productCode}
                      onChange={(e) => {
                        const codeVal = e.target.value;
                        handleItemChange(idx, 'productCode', codeVal);
                        const matched = availableProducts.find(
                          (p) => p.code.toLowerCase() === codeVal.trim().toLowerCase()
                        );
                        if (matched) {
                          handleSelectProduct(idx, matched);
                        }
                      }}
                      placeholder="Mã SKU..."
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 bg-white uppercase focus:ring-1 focus:ring-red-500"
                    />
                  </td>

                  {/* Tên sản phẩm & chọn Master Data */}
                  <td className="px-3 py-2.5">
                    <ProductAutocompleteInput
                      value={item.productName}
                      onChange={(val) => handleItemChange(idx, 'productName', val)}
                      onSelectProduct={(prod) => handleSelectProduct(idx, prod)}
                      onClearProduct={() => handleClearSelectedProduct(idx)}
                      productId={item.productId}
                      currentStock={item.currentStock}
                      unit={item.unit}
                      actualQuantity={item.actualQuantity}
                      availableProducts={availableProducts}
                      placeholder="Gõ tìm hàng có sẵn hoặc nhập tên mới..."
                    />
                  </td>

                  {/* Đơn vị tính */}
                  <td className="px-2 py-2.5">
                    <input
                      type="text"
                      value={item.unit}
                      onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                      placeholder="ĐVT"
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-center font-medium"
                    />
                  </td>

                  {/* Số lượng */}
                  <td className="px-2 py-2.5">
                    <input
                      type="number"
                      min="1"
                      value={item.actualQuantity}
                      onChange={(e) => {
                        const val = Math.max(0, Number(e.target.value) || 0);
                        handleItemChange(idx, 'actualQuantity', val);
                        handleItemChange(idx, 'expectedQuantity', val);
                        handleItemChange(idx, 'acceptedQuantity', val);
                      }}
                      className="w-full px-2 py-1.5 border border-red-300 rounded-lg text-xs text-center font-black text-[#E53935] bg-red-50/30"
                    />
                  </td>

                  {/* Đơn giá */}
                  <td className="px-2 py-2.5">
                    <input
                      type="number"
                      min="0"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-right font-semibold text-slate-800"
                    />
                  </td>

                  {/* Thành tiền */}
                  <td className="px-2 py-2.5 text-right font-black text-slate-900">
                    {Number(item.amount).toLocaleString('vi-VN')} đ
                  </td>

                  {/* Vị trí kho: Khu vực / Kệ / Ô */}
                  <td className="px-2 py-2.5 space-y-1">
                    <div className="grid grid-cols-2 gap-1">
                      <input
                        type="text"
                        value={item.locationArea}
                        onChange={(e) => handleItemChange(idx, 'locationArea', e.target.value)}
                        placeholder="Khu"
                        className="w-full px-1.5 py-1 border border-slate-200 rounded-lg text-[11px]"
                      />
                      <input
                        type="text"
                        value={item.locationRack}
                        onChange={(e) => handleItemChange(idx, 'locationRack', e.target.value)}
                        placeholder="Kệ"
                        className="w-full px-1.5 py-1 border border-slate-200 rounded-lg text-[11px]"
                      />
                    </div>
                    <input
                      type="text"
                      value={item.locationBin}
                      onChange={(e) => handleItemChange(idx, 'locationBin', e.target.value)}
                      placeholder="Tầng / Ô lưu trữ"
                      className="w-full px-1.5 py-0.5 border border-slate-200 rounded-lg text-[11px]"
                    />
                  </td>

                  {/* Xóa dòng */}
                  <td className="px-2 py-2.5 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      title="Xóa dòng mặt hàng này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. CARD 3: GHI CHÚ & TỔNG KẾT TIỀN HÀNG */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Ghi chú */}
        <div className="card p-6 rounded-3xl border border-slate-100/80 shadow-card bg-white space-y-2">
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
            3. Ghi chú diễn giải phiếu nhập kho
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Ghi chú về tình trạng bàn giao, niêm phong container, lý do hoàn trả hàng hoặc điều chỉnh kho..."
            className="w-full p-3.5 text-xs border border-slate-200 rounded-2xl focus:ring-2 focus:ring-red-500 text-slate-800"
          />
        </div>

        {/* Tóm tắt tiền */}
        <div className="card p-6 rounded-3xl border border-slate-100/80 shadow-card bg-white space-y-3">
          <div className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">
            Tổng kết giá trị phiếu nhập kho
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-600">
              <span>Tổng tiền hàng (chưa VAT):</span>
              <span className="font-semibold text-slate-900 text-sm">
                {subtotal.toLocaleString('vi-VN')} đ
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-600">
              <span>Thuế GTGT (VAT {vatRate}%):</span>
              <span className="font-semibold text-slate-900 text-sm">
                {vatAmount.toLocaleString('vi-VN')} đ
              </span>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
              <span className="text-sm font-black text-slate-900 uppercase">
                Tổng cộng tiền thanh toán:
              </span>
              <span className="text-xl font-black text-[#E53935]">
                {totalAmount.toLocaleString('vi-VN')} đ
              </span>
            </div>

            <div className="text-[11px] text-slate-500 italic pt-1">
              <strong>Bằng chữ:</strong> {numberToWords(totalAmount)}
            </div>
          </div>
        </div>
      </div>

      {/* 5. THANH HÀNH ĐỘNG DÍNH Ở ĐÁY MÀN HÌNH (STICKY BOTTOM BAR) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-6 py-3 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6 text-xs text-slate-600">
          <div>
            Số mặt hàng: <strong className="text-slate-900">{totalItemsCount}</strong>
          </div>
          <div>
            Tổng SL thực nhận: <strong className="text-blue-600 font-bold">{totalActualQty}</strong>
          </div>
          <div>
            Tổng giá trị: <strong className="text-[#E53935] font-black text-sm">{totalAmount.toLocaleString('vi-VN')} đ</strong>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Hủy bỏ
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => handleSubmit('DRAFT')}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 text-slate-500" />}
            <span>Lưu bản nháp (DRAFT)</span>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => handleSubmit('CHECKING')}
            className="px-5 py-2 text-xs font-bold text-white bg-[#E53935] hover:bg-[#D32F2F] rounded-xl flex items-center gap-1.5 transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>{editingReceipt ? 'Cập nhật phiếu nhập kho' : 'Tạo phiếu & Chờ kiểm hàng'}</span>
          </button>
        </div>
      </div>

      {/* Modal Chọn hàng hóa có sẵn trong kho */}
      <SelectExistingProductsModal
        isOpen={isSelectExistingModalOpen}
        onClose={() => setIsSelectExistingModalOpen(false)}
        products={availableProducts}
        currentWarehouseId={warehouseId}
        warehouses={warehouses}
        onSelectProducts={handleSelectExistingProducts}
      />

      {/* Modal Nhập hàng từ Excel / CSV */}
      <ImportItemsModal
        isOpen={isImportExcelModalOpen}
        onClose={() => setIsImportExcelModalOpen(false)}
        products={availableProducts}
        onImport={handleImportFromExcel}
        defaultVatRate={vatRate}
      />
    </div>
  );
};
