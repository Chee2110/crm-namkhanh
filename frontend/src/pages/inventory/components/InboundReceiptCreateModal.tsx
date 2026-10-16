import React, { useState, useEffect } from 'react';
import {
  X,
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
  Save,
  Send,
  Loader2,
  FileCheck
} from 'lucide-react';
import { api } from '../../../services/api';
import {
  Warehouse,
  Supplier,
  Product,
  InboundReceipt,
  InboundReceiptType
} from '../../../types';
import { ProductAutocompleteInput } from '../../../components/common/ProductAutocompleteInput';

interface InboundReceiptCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (receipt: InboundReceipt) => void;
  editingReceipt?: InboundReceipt | null;
  warehouses: Warehouse[];
  suppliers: Supplier[];
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
}

export const InboundReceiptCreateModal: React.FC<InboundReceiptCreateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editingReceipt,
  warehouses,
  suppliers
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

  // Tải danh mục sản phẩm từ backend
  useEffect(() => {
    if (isOpen) {
      api.get<Product[]>('/products')
        .then((res) => {
          if (Array.isArray(res.data)) {
            setAvailableProducts(res.data.filter((p) => p.status === 'ACTIVE'));
          }
        })
        .catch((err) => console.error('Lỗi tải danh mục sản phẩm:', err));
    }
  }, [isOpen]);

  // Khởi tạo dữ liệu form (khi tạo mới hoặc chỉnh sửa)
  useEffect(() => {
    if (!isOpen) return;

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
        editingReceipt.items.map((it) => ({
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
          qualityNotes: it.qualityNotes || ''
        }))
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

      // Khởi tạo dòng hàng mẫu
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
  }, [isOpen, editingReceipt, warehouses]);

  if (!isOpen) return null;

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
        total
      };
      return copy;
    });
    setActiveItemIndexForProductSelect(null);
    setProductSearch('');
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
      onClose();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="relative w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-3 bg-gradient-to-r from-red-600 to-rose-700 text-white">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-white/10 rounded-xl backdrop-blur-sm">
              <Package className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-base font-bold">
              {editingReceipt ? `Chỉnh sửa phiếu nhập kho: ${editingReceipt.code}` : 'Lập phiếu nhập kho mới'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-gray-800 text-sm">
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* PHẦN 1: THÔNG TIN CHUNG PHIẾU NHẬP */}
          <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-200">
            <div className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-red-600" />
              <span>1. Thông tin chung phiếu nhập kho</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-6 lg:grid-cols-12 gap-x-3 gap-y-3">
              {/* HÀNG 1: ĐỊNH DANH PHIẾU & KHO TIẾP NHẬN (4 TRƯỜNG BẮT BUỘC) */}
              <div className="col-span-1 sm:col-span-3 lg:col-span-2">
                <label className="block text-[11px] font-semibold text-gray-700 mb-1 truncate">
                  Mã phiếu nhập <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="PNK-2026-XXXX"
                  className="w-full h-9 px-2.5 py-1 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-red-500 font-mono font-bold"
                />
              </div>

              <div className="col-span-1 sm:col-span-3 lg:col-span-2">
                <label className="block text-[11px] font-semibold text-gray-700 mb-1 truncate">
                  Ngày nhập kho <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={receiptDate}
                  onChange={(e) => setReceiptDate(e.target.value)}
                  className="w-full h-9 px-2.5 py-1 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div className="col-span-1 sm:col-span-3 lg:col-span-4">
                <label className="block text-[11px] font-semibold text-gray-700 mb-1 truncate">
                  Loại nhập kho <span className="text-red-500">*</span>
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as InboundReceiptType)}
                  className="w-full h-9 px-2.5 py-1 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-red-500 font-medium"
                >
                  <option value="PURCHASE">Nhập mua hàng từ NCC</option>
                  <option value="FINISHED_GOODS">Nhập thành phẩm sản xuất</option>
                  <option value="RETURN">Nhập hàng hoàn trả</option>
                  <option value="ADJUSTMENT">Nhập điều chỉnh kiểm kê</option>
                </select>
              </div>

              <div className="col-span-1 sm:col-span-3 lg:col-span-4">
                <label className="block text-[11px] font-semibold text-gray-700 mb-1 truncate">
                  Kho nhận hàng <span className="text-red-500">*</span>
                </label>
                <select
                  value={warehouseId}
                  onChange={(e) => setWarehouseId(e.target.value)}
                  className="w-full h-9 px-2.5 py-1 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-red-500 font-medium"
                >
                  <option value="">-- Chọn kho lưu trữ --</option>
                  {warehouses.map((wh) => (
                    <option key={wh.id} value={wh.id}>
                      {wh.name} ({wh.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* HÀNG 2: NGUỒN GỐC HÀNG HÓA */}
              <div className="col-span-1 sm:col-span-3 lg:col-span-6">
                <label className="block text-[11px] font-semibold text-gray-700 mb-1 truncate">
                  Nhà cung cấp / Đơn vị cung ứng
                </label>
                <select
                  value={supplierId}
                  onChange={(e) => {
                    setSupplierId(e.target.value);
                    if (e.target.value) setSourceName('');
                  }}
                  className="w-full h-9 px-2.5 py-1 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-red-500"
                >
                  <option value="">-- Chọn Nhà cung cấp (nếu có) --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-1 sm:col-span-3 lg:col-span-6">
                <label className="block text-[11px] font-semibold text-gray-700 mb-1 truncate">
                  Nguồn nhập tự do (nếu khác)
                </label>
                <input
                  type="text"
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                  placeholder="Xưởng gia công, chi nhánh..."
                  className="w-full h-9 px-2.5 py-1 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-red-500"
                />
              </div>

              {/* HÀNG 3: BỘ CHỨNG TỪ GỐC & THUẾ VAT */}
              <div className="col-span-1 sm:col-span-3 lg:col-span-3">
                <label className="block text-[11px] font-semibold text-gray-700 mb-1 truncate">
                  Số hóa đơn / Chứng từ gốc
                </label>
                <input
                  type="text"
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  placeholder="Số HĐ đỏ, PO, BBGN..."
                  className="w-full h-9 px-2.5 py-1 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div className="col-span-1 sm:col-span-3 lg:col-span-3">
                <label className="block text-[11px] font-semibold text-gray-700 mb-1 truncate">
                  Ngày chứng từ gốc
                </label>
                <input
                  type="date"
                  value={documentDate}
                  onChange={(e) => setDocumentDate(e.target.value)}
                  className="w-full h-9 px-2.5 py-1 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div className="col-span-1 sm:col-span-3 lg:col-span-3">
                <label className="block text-[11px] font-semibold text-gray-700 mb-1 truncate">
                  Thuế VAT chung (%)
                </label>
                <select
                  value={vatRate}
                  onChange={(e) => {
                    const r = Number(e.target.value);
                    setVatRate(r);
                    setItems((prev) => prev.map((it) => ({ ...it, vatRate: r })));
                  }}
                  className="w-full h-9 px-2.5 py-1 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-red-500"
                >
                  <option value="0">0% (Không chịu thuế)</option>
                  <option value="5">5%</option>
                  <option value="8">8% (Thuế chuẩn GTGT)</option>
                  <option value="10">10%</option>
                </select>
              </div>

              <div className="col-span-1 sm:col-span-3 lg:col-span-3">
                <label className="block text-[11px] font-semibold text-gray-700 mb-1 truncate">
                  Chứng từ đính kèm
                </label>
                <div className="h-9">
                  {fileName ? (
                    <div className="flex items-center justify-between h-full px-2 text-xs text-green-700 bg-green-50 rounded-lg border border-green-200">
                      <span className="truncate text-[11px] font-medium" title={fileName}>
                        {fileName}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setFileUrl('');
                          setFileName('');
                        }}
                        className="p-1 text-gray-400 hover:text-red-500"
                        title="Xóa tệp đính kèm"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer h-full px-2.5 text-xs font-medium border border-dashed border-gray-300 hover:border-red-500 hover:bg-red-50/50 rounded-lg flex items-center justify-center gap-1.5 transition-colors text-gray-600 bg-white">
                      <Upload className="w-3.5 h-3.5 text-gray-500" />
                      <span className="truncate">{uploading ? 'Đang tải...' : 'Tải file đính kèm'}</span>
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

          {/* PHẦN 2: DANH SÁCH MẶT HÀNG & NVL */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-red-600" />
                <span>2. Danh sách mặt hàng & Vị trí lưu kho ({items.length} mặt hàng)</span>
              </div>
            </div>

            {/* Bảng sản phẩm */}
            <div className="border border-gray-200 rounded-xl overflow-x-auto shadow-sm">
              <table className="w-full text-left text-xs min-w-[950px]">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 font-semibold border-b border-gray-200 text-center">
                    <th className="px-2 py-2.5 w-10">STT</th>
                    <th className="px-3 py-2.5 w-36 text-left">Mã hàng hóa</th>
                    <th className="px-3 py-2.5 text-left w-64">Sản phẩm / Mặt hàng</th>
                    <th className="px-2 py-2.5 w-16">ĐVT</th>
                    <th className="px-2 py-2.5 w-24">Số lượng</th>
                    <th className="px-2 py-2.5 w-28 text-right">Đơn giá (VNĐ)</th>
                    <th className="px-2 py-2.5 w-28 text-right">Thành tiền</th>
                    <th className="px-2 py-2.5 w-36">Vị trí kho</th>
                    <th className="px-2 py-2.5 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-2 py-2 text-center text-gray-500 font-semibold">{idx + 1}</td>

                      {/* Mã hàng hóa (Mã SKU) */}
                      <td className="px-3 py-2">
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
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs font-mono font-bold text-gray-800 bg-white uppercase focus:ring-1 focus:ring-red-500"
                        />
                      </td>

                      {/* Tên sản phẩm & chọn Master Data */}
                      <td className="px-3 py-2">
                        <ProductAutocompleteInput
                          value={item.productName}
                          onChange={(val) => handleItemChange(idx, 'productName', val)}
                          onSelectProduct={(prod) => handleSelectProduct(idx, prod)}
                          onClearProduct={() => {
                            setItems((prev) => {
                              const copy = [...prev];
                              copy[idx] = { ...copy[idx], productId: null };
                              return copy;
                            });
                          }}
                          productId={item.productId}
                          currentStock={availableProducts.find((p) => p.id === item.productId)?.stockQuantity}
                          unit={item.unit}
                          actualQuantity={item.actualQuantity}
                          availableProducts={availableProducts}
                          placeholder="Nhập hoặc chọn sản phẩm..."
                        />
                      </td>

                      {/* Đơn vị tính */}
                      <td className="px-2 py-2">
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                          placeholder="ĐVT"
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-center"
                        />
                      </td>

                      {/* Số lượng */}
                      <td className="px-2 py-2">
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
                          className="w-full px-2 py-1.5 border border-red-300 rounded text-xs text-right font-bold text-red-700 bg-red-50/30"
                        />
                      </td>

                      {/* Đơn giá */}
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-right font-medium"
                        />
                      </td>

                      {/* Thành tiền */}
                      <td className="px-2 py-2 text-right font-bold text-gray-900">
                        {Number(item.amount).toLocaleString('vi-VN')} đ
                      </td>

                      {/* Vị trí kho: Khu vực / Kệ / Ô */}
                      <td className="px-2 py-2 space-y-1">
                        <div className="grid grid-cols-2 gap-1">
                          <input
                            type="text"
                            value={item.locationArea}
                            onChange={(e) => handleItemChange(idx, 'locationArea', e.target.value)}
                            placeholder="Khu vực"
                            className="w-full px-1.5 py-1 border border-gray-300 rounded text-[11px]"
                          />
                          <input
                            type="text"
                            value={item.locationRack}
                            onChange={(e) => handleItemChange(idx, 'locationRack', e.target.value)}
                            placeholder="Kệ/Dãy"
                            className="w-full px-1.5 py-1 border border-gray-300 rounded text-[11px]"
                          />
                        </div>
                        <input
                          type="text"
                          value={item.locationBin}
                          onChange={(e) => handleItemChange(idx, 'locationBin', e.target.value)}
                          placeholder="Tầng / Ô lưu trữ"
                          className="w-full px-1.5 py-1 border border-gray-300 rounded text-[11px]"
                        />
                      </td>

                      {/* Xóa dòng */}
                      <td className="px-2 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
                          title="Xóa dòng này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Nút Thêm dòng chuyển xuống dưới bảng */}
            <div className="flex items-center justify-start pt-1">
              <button
                type="button"
                onClick={handleAddItem}
                className="px-2.5 py-1 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                title="Thêm một dòng mặt hàng mới"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm dòng</span>
              </button>
            </div>
          </div>

          {/* PHẦN 3: TỔNG KẾT VÀ GHI CHÚ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Ghi chú nội bộ phiếu nhập kho
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Ghi chú thêm về điều kiện giao hàng, niêm phong container, lý do hoàn trả..."
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              />
            </div>

            {/* Bảng tổng kết tiền */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2 text-xs">
              <div className="flex justify-between items-center text-gray-600">
                <span>Tổng tiền hàng (chưa VAT):</span>
                <span className="font-semibold text-gray-900">
                  {subtotal.toLocaleString('vi-VN')} đ
                </span>
              </div>
              <div className="flex justify-between items-center text-gray-600">
                <span>Thuế giá trị gia tăng (VAT {vatRate}%):</span>
                <span className="font-semibold text-gray-900">
                  {vatAmount.toLocaleString('vi-VN')} đ
                </span>
              </div>
              <div className="pt-2 border-t border-gray-200 flex justify-between items-center text-sm font-bold text-gray-900">
                <span className="text-red-600">Tổng giá trị phiếu nhập kho:</span>
                <span className="text-base text-red-600">
                  {totalAmount.toLocaleString('vi-VN')} đ
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Hủy bỏ
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSubmit('DRAFT')}
              className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 rounded-xl flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-gray-500" />}
              <span>Lưu bản nháp (DRAFT)</span>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleSubmit('CHECKING')}
              className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl flex items-center gap-1.5 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>Tạo phiếu & Chờ kiểm hàng</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
