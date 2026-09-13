import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Plus,
  Search,
  Printer,
  DollarSign,
  Truck,
  FileCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Trash2,
  UserCheck,
  Building,
  Calendar,
  Phone,
  MapPin,
  X,
  CreditCard,
  ArrowRightLeft,
  Download,
  RotateCcw,
  Edit3,
  SlidersHorizontal,
  PackageMinus,
  Undo2,
  GripVertical
} from 'lucide-react';
import { api } from '../../services/api';
import { Order, Customer, Product, User } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { OrderPrintModal } from './components/OrderPrintModal';

export const OrdersPage: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [deliveryFilter, setDeliveryFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [invoiceFilter, setInvoiceFilter] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);
  const [isCancelRefundModalOpen, setIsCancelRefundModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // In ấn phiếu xuất kho kiêm giao hàng A4
  const [selectedPrintOrder, setSelectedPrintOrder] = useState<Order | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Cấu hình Ẩn/Hiện cột (Column Visibility) & Kéo thả (Drag & Drop)
  const defaultVisibleCols: Record<string, boolean> = {
    code: true,
    customer: true,
    deliveryAddress: false,
    phone: false,
    dates: true,
    delivery: true,
    invoice: true,
    totalAmount: true,
    paidAmount: true,
    remainingAmount: true,
    manager: true,
    actions: true
  };

  const defaultColOrder = [
    'code',
    'customer',
    'deliveryAddress',
    'phone',
    'dates',
    'delivery',
    'invoice',
    'totalAmount',
    'paidAmount',
    'remainingAmount',
    'manager',
    'actions'
  ];

  const columnLabels: Record<string, string> = {
    code: 'Mã đơn hàng',
    customer: 'Khách hàng & Liên hệ',
    deliveryAddress: 'Địa chỉ giao',
    phone: 'Số điện thoại',
    dates: 'Ngày đặt / Giao',
    delivery: 'Giao hàng',
    invoice: 'Hóa đơn',
    totalAmount: 'Tổng giá trị đơn',
    paidAmount: 'Thực thu',
    remainingAmount: 'Còn phải thu',
    manager: 'Phụ trách',
    actions: 'Thao tác'
  };

  const [isColumnDropdownOpen, setIsColumnDropdownOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('namkhanh_orders_visible_cols');
      return saved ? JSON.parse(saved) : defaultVisibleCols;
    } catch {
      return defaultVisibleCols;
    }
  });

  const [columnOrder, setColumnOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('namkhanh_orders_col_order');
      return saved ? JSON.parse(saved) : defaultColOrder;
    } catch {
      return defaultColOrder;
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
    if (!draggedCol || draggedCol === targetCol) {
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
      setColumnOrder(newOrder);
      localStorage.setItem('namkhanh_orders_col_order', JSON.stringify(newOrder));
    }

    setDraggedCol(null);
    setDragOverCol(null);
  };

  const toggleColumnVisibility = (key: string) => {
    const updated = { ...visibleColumns, [key]: !visibleColumns[key] };
    setVisibleColumns(updated);
    localStorage.setItem('namkhanh_orders_visible_cols', JSON.stringify(updated));
  };

  const resetColumns = () => {
    setVisibleColumns(defaultVisibleCols);
    setColumnOrder(defaultColOrder);
    localStorage.removeItem('namkhanh_orders_visible_cols');
    localStorage.removeItem('namkhanh_orders_col_order');
  };

  const handleOpenPrint = (order: Order) => {
    setSelectedPrintOrder(order);
    setIsPrintModalOpen(true);
  };

  // Cancel Refund State
  const [cancelRefundData, setCancelRefundData] = useState({
    refundOption: 'CREDIT_BALANCE' as 'CREDIT_BALANCE' | 'CASH_REFUND',
    reason: ''
  });

  // Adjust Amount State
  const [adjustData, setAdjustData] = useState({
    adjustedAmount: 0,
    adjustmentReason: ''
  });

  // Order Return State (Đổi / Trả hàng hoàn kho)
  const [returnData, setReturnData] = useState({
    returnReason: '',
    refundOption: 'DEDUCT_DEBT' as 'DEDUCT_DEBT' | 'CASH_REFUND' | 'CREDIT_BALANCE',
    items: [] as Array<{
      orderItemId?: string;
      productId?: string | null;
      productCode: string;
      productName: string;
      unit: string;
      orderQuantity: number;
      returnQuantity: number;
      unitPrice: number;
    }>
  });

  // Form states
  const [formError, setFormError] = useState<string | null>(null);
  const [createData, setCreateData] = useState({
    customerId: '',
    quotationId: '',
    deliveryDate: '',
    deliveryAddress: '',
    contactPerson: '',
    phone: '',
    deliveryStatus: 'PENDING',
    paymentStatus: 'UNPAID',
    invoiceStatus: 'NOT_ISSUED',
    paidAmount: 0,
    vatRate: 8,
    useCreditBalance: false,
    notes: '',
    items: [] as Array<{
      productId: string;
      productCode: string;
      productName: string;
      unit: string;
      quantity: number;
      unitPrice: number;
      vatRate: number;
    }>
  });

  // Payment / Status Update state
  const [updatePaymentData, setUpdatePaymentData] = useState({
    paidAmount: 0,
    deliveryStatus: 'PENDING',
    invoiceStatus: 'NOT_ISSUED',
    deliveryAddress: '',
    notes: ''
  });

  // Handover state
  const [handoverData, setHandoverData] = useState({
    toUserId: '',
    reason: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      if (deliveryFilter) query.append('deliveryStatus', deliveryFilter);
      if (paymentFilter) query.append('paymentStatus', paymentFilter);
      if (invoiceFilter) query.append('invoiceStatus', invoiceFilter);

      const [resOrders, resCustomers, resProducts, resUsers] = await Promise.all([
        api.get<Order[]>(`/orders?${query.toString()}`),
        api.get<Customer[]>('/customers'),
        api.get<Product[]>('/products'),
        api.get<User[]>('/users').catch(() => ({ data: [] }))
      ]);

      setOrders(resOrders.data || []);
      setCustomers(resCustomers.data || []);
      setProducts(resProducts.data || []);
      setUsers(resUsers.data || []);
    } catch (err: any) {
      console.error('Lỗi khi tải danh sách đơn hàng:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [deliveryFilter, paymentFilter, invoiceFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleCustomerSelect = (customerId: string) => {
    const cust = customers.find((c) => c.id === customerId);
    if (cust) {
      setCreateData((prev) => ({
        ...prev,
        customerId,
        deliveryAddress: cust.deliveryAddress || cust.address || '',
        contactPerson: cust.contactPerson || '',
        phone: cust.phone || ''
      }));
    } else {
      setCreateData((prev) => ({ ...prev, customerId }));
    }
  };

  const handleAddItem = (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    // Tránh thêm trùng sản phẩm, tăng số lượng nếu đã có
    const existingIndex = createData.items.findIndex((item) => item.productId === productId);
    if (existingIndex >= 0) {
      const updated = [...createData.items];
      updated[existingIndex].quantity += 1;
      setCreateData({ ...createData, items: updated });
    } else {
      setCreateData({
        ...createData,
        items: [
          ...createData.items,
          {
            productId: prod.id,
            productCode: prod.code,
            productName: prod.name,
            unit: prod.unit,
            quantity: 1,
            unitPrice: Number(prod.sellingPrice || 0),
            vatRate: createData.vatRate
          }
        ]
      });
    }
  };

  const handleRemoveItem = (index: number) => {
    const updated = createData.items.filter((_, i) => i !== index);
    setCreateData({ ...createData, items: updated });
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...createData.items];
    updated[index] = { ...updated[index], [field]: value };
    setCreateData({ ...createData, items: updated });
  };

  // Tính toán nháp cho Modal Tạo đơn
  const subtotal = createData.items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);
  const vatAmount = (subtotal * createData.vatRate) / 100;
  const totalAmount = subtotal + vatAmount;
  const customerCredit = Number(customers.find((c) => c.id === createData.customerId)?.creditBalance || 0);
  const creditDeduction = createData.useCreditBalance ? Math.min(totalAmount, customerCredit) : 0;
  const draftRemaining = Math.max(0, totalAmount - creditDeduction - (Number(createData.paidAmount) || 0));

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!createData.customerId) {
      setFormError('Vui lòng chọn khách hàng đặt đơn');
      return;
    }
    if (createData.items.length === 0) {
      setFormError('Vui lòng thêm ít nhất một sản phẩm vào đơn hàng');
      return;
    }

    try {
      await api.post('/orders', {
        ...createData,
        deliveryDate: createData.deliveryDate ? new Date(createData.deliveryDate) : undefined,
        paidAmount: Number(createData.paidAmount) || 0,
        useCreditBalance: Boolean(createData.useCreditBalance)
      });

      setIsCreateModalOpen(false);
      setCreateData({
        customerId: '',
        quotationId: '',
        deliveryDate: '',
        deliveryAddress: '',
        contactPerson: '',
        phone: '',
        deliveryStatus: 'PENDING',
        paymentStatus: 'UNPAID',
        invoiceStatus: 'NOT_ISSUED',
        paidAmount: 0,
        vatRate: 8,
        useCreditBalance: false,
        notes: '',
        items: []
      });
      loadData();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Có lỗi xảy ra khi tạo đơn hàng');
    }
  };

  const openPaymentModal = (order: Order) => {
    setSelectedOrder(order);
    setUpdatePaymentData({
      paidAmount: Number(order.paidAmount) || 0,
      deliveryStatus: order.deliveryStatus,
      invoiceStatus: order.invoiceStatus,
      deliveryAddress: order.deliveryAddress || '',
      notes: order.notes || ''
    });
    setIsPaymentModalOpen(true);
  };

  const handleUpdatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    try {
      await api.put(`/orders/${selectedOrder.id}`, updatePaymentData);
      setIsPaymentModalOpen(false);
      setSelectedOrder(null);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Cập nhật đơn hàng thất bại');
    }
  };

  const openHandoverModal = (order: Order) => {
    setSelectedOrder(order);
    setHandoverData({ toUserId: '', reason: '' });
    setIsHandoverModalOpen(true);
  };

  const handleHandover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !handoverData.toUserId) return;

    try {
      await api.post(`/orders/${selectedOrder.id}/handover`, handoverData);
      setIsHandoverModalOpen(false);
      setSelectedOrder(null);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Bàn giao đơn hàng thất bại');
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa đơn hàng ${code}?`)) return;
    try {
      await api.delete(`/orders/${id}`);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể xóa đơn hàng đã giao hoặc đã thanh toán');
    }
  };

  const handleExportExcel = () => {
    if (orders.length === 0) {
      alert('Không có dữ liệu đơn hàng để xuất');
      return;
    }

    const headers = [
      'STT',
      'Mã đơn hàng',
      'Khách hàng',
      'Mã khách',
      'Số điện thoại',
      'Người nhận',
      'Địa chỉ giao',
      'Ngày đặt',
      'Ngày hẹn giao',
      'Giao hàng',
      'Thanh toán',
      'Hóa đơn VAT',
      'Cộng tiền hàng',
      'Thuế VAT (%)',
      'Tiền thuế VAT',
      'Tổng tiền đơn (VNĐ)',
      'Thực thu (VNĐ)',
      'Còn phải thu (VNĐ)',
      'Tiền hoàn trả (VNĐ)',
      'Tiền điều chỉnh (+/-)',
      'Lý do điều chỉnh',
      'Người phụ trách',
      'Ghi chú'
    ];

    const getDeliveryText = (st: string) => {
      switch (st) {
        case 'DELIVERED': return 'Đã giao hàng';
        case 'DELIVERING': return 'Đang giao';
        case 'PARTIAL': return 'Giao một phần';
        case 'CANCELLED': return 'Đã hủy đơn';
        default: return 'Chờ xuất kho';
      }
    };

    const getPaymentText = (st: string) => {
      switch (st) {
        case 'PAID': return 'Đã thanh toán đủ';
        case 'PARTIAL_PAID': return 'Thanh toán 1 phần';
        default: return 'Chưa thanh toán';
      }
    };

    const rows = orders.map((o, idx) => [
      idx + 1,
      o.code,
      `"${(o.customer?.name || '').replace(/"/g, '""')}"`,
      `"${o.customer?.code || ''}"`,
      `"${o.phone || o.customer?.phone || ''}"`,
      `"${(o.contactPerson || '').replace(/"/g, '""')}"`,
      `"${(o.deliveryAddress || '').replace(/"/g, '""')}"`,
      new Date(o.orderDate).toLocaleDateString('vi-VN'),
      o.deliveryDate ? new Date(o.deliveryDate).toLocaleDateString('vi-VN') : '',
      getDeliveryText(o.deliveryStatus),
      getPaymentText(o.paymentStatus),
      o.invoiceStatus === 'ISSUED' ? 'Đã xuất HĐ' : o.invoiceStatus === 'ISSUING' ? 'Đang xuất HĐ' : 'Chưa xuất HĐ',
      o.subtotal,
      o.vatRate,
      o.vatAmount,
      o.totalAmount,
      o.paidAmount,
      o.remainingAmount,
      o.refundAmount || 0,
      o.adjustedAmount || 0,
      `"${(o.adjustmentReason || '').replace(/"/g, '""')}"`,
      `"${(o.manager?.fullName || '').replace(/"/g, '""')}"`,
      `"${(o.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Don_Hang_Nam_Khanh_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openCancelRefundModal = (order: Order) => {
    setSelectedOrder(order);
    setCancelRefundData({
      refundOption: 'CREDIT_BALANCE',
      reason: ''
    });
    setIsCancelRefundModalOpen(true);
  };

  const handleCancelRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    if (!cancelRefundData.reason.trim()) {
      alert('Vui lòng nhập lý do hủy đơn hàng');
      return;
    }

    try {
      await api.post(`/orders/${selectedOrder.id}/cancel-refund`, cancelRefundData);
      alert('Đã hủy đơn hàng và xử lý tiền cọc thành công!');
      setIsCancelRefundModalOpen(false);
      setSelectedOrder(null);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi hủy đơn và hoàn cọc');
    }
  };

  const openAdjustModal = (order: Order) => {
    setSelectedOrder(order);
    setAdjustData({
      adjustedAmount: Number(order.adjustedAmount || 0),
      adjustmentReason: order.adjustmentReason || ''
    });
    setIsAdjustModalOpen(true);
  };

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    if (!adjustData.adjustmentReason.trim()) {
      alert('Vui lòng nhập lý do điều chỉnh giá trị đơn hàng');
      return;
    }

    try {
      await api.post(`/orders/${selectedOrder.id}/adjust-amount`, adjustData);
      alert('Đã điều chỉnh giá trị đơn hàng thành công!');
      setIsAdjustModalOpen(false);
      setSelectedOrder(null);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi điều chỉnh giá trị đơn');
    }
  };

  const openReturnModal = (order: Order) => {
    setSelectedOrder(order);
    setReturnData({
      returnReason: '',
      refundOption: 'DEDUCT_DEBT',
      items: (order.items || []).map((it) => ({
        orderItemId: it.id,
        productId: it.productId,
        productCode: it.productCode,
        productName: it.productName,
        unit: it.unit,
        orderQuantity: it.quantity,
        returnQuantity: 0,
        unitPrice: Number(it.unitPrice || 0)
      }))
    });
    setIsReturnModalOpen(true);
  };

  const handleOrderReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    const itemsToReturn = returnData.items.filter((it) => it.returnQuantity > 0);
    if (itemsToReturn.length === 0) {
      alert('Vui lòng nhập số lượng trả lại lớn hơn 0 cho ít nhất một sản phẩm');
      return;
    }

    if (!returnData.returnReason.trim()) {
      alert('Vui lòng nhập lý do đổi trả hàng');
      return;
    }

    try {
      await api.post(`/orders/${selectedOrder.id}/returns`, {
        returnReason: returnData.returnReason,
        refundOption: returnData.refundOption,
        items: itemsToReturn.map((it) => ({
          productId: it.productId,
          productCode: it.productCode,
          productName: it.productName,
          unit: it.unit,
          quantity: it.returnQuantity,
          unitPrice: it.unitPrice,
          amount: it.returnQuantity * it.unitPrice
        }))
      });

      alert('Lập phiếu trả hàng và hoàn kho thành công!');
      setIsReturnModalOpen(false);
      setSelectedOrder(null);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi lập phiếu đổi trả hàng');
    }
  };

  // KPIs
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
  const totalPaid = orders.reduce((sum, o) => sum + Number(o.paidAmount), 0);
  const totalRemaining = orders.reduce((sum, o) => sum + Number(o.remainingAmount), 0);
  const pendingDeliveryCount = orders.filter((o) => o.deliveryStatus === 'PENDING' || o.deliveryStatus === 'DELIVERING').length;

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);
  };

  const renderDeliveryBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">Đã giao hàng</span>;
      case 'DELIVERING':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">Đang giao hàng</span>;
      case 'PARTIAL':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">Giao một phần</span>;
      case 'CANCELLED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-200 text-gray-700">Đã hủy đơn</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">Chờ xuất kho & giao</span>;
    }
  };

  const renderPaymentBadge = (status: string, remaining: number) => {
    if (status === 'PAID') {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">Đã thanh toán đủ</span>;
    }
    if (status === 'PARTIAL_PAID') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
          Thu 1 phần (Nợ: {formatVND(remaining)})
        </span>
      );
    }
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">Chưa thanh toán</span>;
  };

  const renderInvoiceBadge = (status: string) => {
    switch (status) {
      case 'ISSUED':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">Đã xuất HĐ</span>;
      case 'ISSUING':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">Đang xuất HĐ</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">Chưa xuất HĐ</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* 4 THẺ TỔNG QUAN ĐƠN HÀNG & CÔNG NỢ */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Tổng đơn hàng</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{orders.length}</p>
            <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {pendingDeliveryCount} đơn cần xử lý giao
            </p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center text-[#E53935]">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Tổng doanh số đơn</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{formatVND(totalRevenue)}</p>
            <p className="text-xs text-gray-500 mt-1">Gồm VAT 8% VPP</p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Thực thu (Đã trả)</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{formatVND(totalPaid)}</p>
            <p className="text-xs text-emerald-700 mt-1">
              Đạt {totalRevenue > 0 ? Math.round((totalPaid / totalRevenue) * 100) : 0}% tổng giá trị
            </p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-red-200 shadow-sm flex items-center justify-between bg-red-50/20">
          <div>
            <p className="text-xs font-semibold text-[#E53935] uppercase tracking-wider">Còn phải thu (Nợ)</p>
            <p className="text-2xl font-bold text-[#E53935] mt-1">{formatVND(totalRemaining)}</p>
            <p className="text-xs text-gray-500 mt-1">Công thức: Giá trị đơn - Thực thu</p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center text-[#E53935]">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* FILTER & ACTIONS BAR */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <form onSubmit={handleSearch} className="flex flex-1 w-full md:w-auto gap-2 items-center flex-wrap">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm mã đơn, tên khách hàng, SĐT..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E53935]/20 focus:border-[#E53935]"
            />
          </div>

          <select
            value={deliveryFilter}
            onChange={(e) => setDeliveryFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-[#E53935]"
          >
            <option value="">Giao hàng: Tất cả</option>
            <option value="PENDING">Chờ xuất kho</option>
            <option value="DELIVERING">Đang giao</option>
            <option value="DELIVERED">Đã giao hàng</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-[#E53935]"
          >
            <option value="">Thanh toán: Tất cả</option>
            <option value="UNPAID">Chưa thanh toán</option>
            <option value="PARTIAL_PAID">Thanh toán 1 phần</option>
            <option value="PAID">Đã thanh toán đủ</option>
          </select>

          <select
            value={invoiceFilter}
            onChange={(e) => setInvoiceFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-[#E53935]"
          >
            <option value="">Hóa đơn VAT: Tất cả</option>
            <option value="NOT_ISSUED">Chưa xuất HĐ</option>
            <option value="ISSUING">Đang xuất HĐ</option>
            <option value="ISSUED">Đã xuất HĐ</option>
          </select>

          <button
            type="submit"
            className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Lọc dữ liệu
          </button>
        </form>

        <div className="flex items-center gap-2">
          {/* Nút Ẩn/Hiện cột DataGrid */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsColumnDropdownOpen(!isColumnDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors shadow-sm whitespace-nowrap cursor-pointer"
              title="Tùy biến cấu hình ẩn/hiện các cột trên bảng"
            >
              <SlidersHorizontal className="w-4 h-4 text-gray-500" />
              <span>Ẩn/Hiện cột</span>
            </button>
            {isColumnDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 p-3 z-30 space-y-1.5 text-xs">
                <div className="font-bold text-gray-800 pb-1.5 border-b border-gray-100 flex justify-between items-center">
                  <span>Cấu hình cột hiển thị</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={resetColumns}
                      className="text-red-600 hover:text-red-700 flex items-center gap-1 font-medium cursor-pointer"
                      title="Khôi phục mặc định"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Mặc định</span>
                    </button>
                    <button onClick={() => setIsColumnDropdownOpen(false)} className="text-gray-400 hover:text-gray-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {columnOrder.map((key) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={visibleColumns[key] ?? true}
                        onChange={() => toggleColumnVisibility(key)}
                        disabled={key === 'code' || key === 'customer'}
                        className="rounded text-[#E53935]"
                      />
                      <span>{columnLabels[key]}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors shadow-sm whitespace-nowrap cursor-pointer"
            title="Xuất toàn bộ danh sách đơn hàng sang file Excel/CSV"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            Xuất Excel
          </button>
          {hasPermission('B_ORDERS', 'create') && (
            <button
              onClick={() => {
                setFormError(null);
                setIsCreateModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-[#E53935] hover:bg-[#D32F2F] text-white rounded-lg text-sm font-medium transition-colors shadow-sm whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Tạo đơn hàng VPP mới
            </button>
          )}
        </div>
      </div>

      {/* DANH SÁCH ĐƠN HÀNG */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-600 uppercase text-[11px] font-semibold tracking-wider">
                {columnOrder
                  .filter((k) => visibleColumns[k])
                  .map((colKey) => (
                    <th
                      key={colKey}
                      draggable
                      onDragStart={(e) => handleDragStart(e, colKey)}
                      onDragOver={(e) => handleDragOver(e, colKey)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, colKey)}
                      className={`py-3.5 px-4 cursor-grab select-none transition-colors ${
                        dragOverCol === colKey ? 'bg-red-100 border-l-2 border-[#E53935]' : ''
                      } ${draggedCol === colKey ? 'opacity-50' : ''} ${
                        colKey === 'totalAmount' || colKey === 'paidAmount' || colKey === 'remainingAmount'
                          ? 'text-right'
                          : colKey === 'manager' || colKey === 'actions'
                          ? 'text-center'
                          : ''
                      }`}
                      title="Kéo thả để thay đổi vị trí cột"
                    >
                      <div
                        className={`inline-flex items-center gap-1 ${
                          colKey === 'totalAmount' || colKey === 'paidAmount' || colKey === 'remainingAmount'
                            ? 'justify-end'
                            : colKey === 'manager' || colKey === 'actions'
                            ? 'justify-center'
                            : 'justify-start'
                        }`}
                      >
                        <GripVertical className="w-3 h-3 text-gray-400 opacity-60" />
                        <span>{columnLabels[colKey]}</span>
                      </div>
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={columnOrder.filter((k) => visibleColumns[k]).length} className="py-12 text-center text-gray-500">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#E53935] mb-2"></div>
                    <p>Đang tải danh sách đơn hàng văn phòng phẩm...</p>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={columnOrder.filter((k) => visibleColumns[k]).length} className="py-12 text-center text-gray-500">
                    <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-base font-medium text-gray-700">Chưa có đơn hàng nào phù hợp</p>
                    <p className="text-xs text-gray-400 mt-1">Bấm "Tạo đơn hàng VPP mới" để ghi nhận đơn hàng</p>
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const rem = Number(order.remainingAmount) || 0;
                  return (
                    <tr key={order.id} className="hover:bg-gray-50/80 transition-colors">
                      {columnOrder
                        .filter((k) => visibleColumns[k])
                        .map((colKey) => {
                          switch (colKey) {
                            case 'code':
                              return (
                                <td key={colKey} className="py-3.5 px-4">
                                  <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                                    <ShoppingBag className="w-4 h-4 text-[#E53935]" />
                                    {order.code}
                                  </div>
                                  {order.quotation && (
                                    <span className="text-[11px] text-gray-400 block mt-0.5">
                                      Từ BG: {order.quotation.code}
                                    </span>
                                  )}
                                </td>
                              );
                            case 'customer':
                              return (
                                <td key={colKey} className="py-3.5 px-4">
                                  <div className="font-medium text-gray-900 line-clamp-1">{order.customer?.name}</div>
                                  <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                                    <span>{order.contactPerson || order.customer?.code}</span>
                                    <span>•</span>
                                    <span>{order.phone || order.customer?.phone}</span>
                                  </div>
                                </td>
                              );
                            case 'deliveryAddress':
                              return (
                                <td key={colKey} className="py-3.5 px-4 text-xs text-gray-600 max-w-xs truncate">
                                  {order.deliveryAddress || order.customer?.deliveryAddress || order.customer?.address || 'N/A'}
                                </td>
                              );
                            case 'phone':
                              return (
                                <td key={colKey} className="py-3.5 px-4 text-xs font-mono text-gray-700">
                                  {order.phone || order.customer?.phone || 'N/A'}
                                </td>
                              );
                            case 'dates':
                              return (
                                <td key={colKey} className="py-3.5 px-4">
                                  <div className="text-gray-900">
                                    {new Date(order.orderDate).toLocaleDateString('vi-VN')}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                                    <Truck className="w-3 h-3 text-gray-400" />
                                    {order.deliveryDate
                                      ? new Date(order.deliveryDate).toLocaleDateString('vi-VN')
                                      : 'Chưa hẹn giao'}
                                  </div>
                                </td>
                              );
                            case 'delivery':
                              return (
                                <td key={colKey} className="py-3.5 px-4">
                                  {renderDeliveryBadge(order.deliveryStatus)}
                                </td>
                              );
                            case 'invoice':
                              return (
                                <td key={colKey} className="py-3.5 px-4">
                                  {renderInvoiceBadge(order.invoiceStatus)}
                                </td>
                              );
                            case 'totalAmount':
                              return (
                                <td key={colKey} className="py-3.5 px-4 text-right font-bold text-gray-900">
                                  {formatVND(Number(order.totalAmount))}
                                </td>
                              );
                            case 'paidAmount':
                              return (
                                <td key={colKey} className="py-3.5 px-4 text-right font-medium text-emerald-600">
                                  {formatVND(Number(order.paidAmount))}
                                </td>
                              );
                            case 'remainingAmount':
                              return (
                                <td key={colKey} className="py-3.5 px-4 text-right">
                                  <span
                                    className={`font-bold ${
                                      rem > 0 ? 'text-[#E53935]' : 'text-emerald-700'
                                    }`}
                                  >
                                    {formatVND(rem)}
                                  </span>
                                  <div className="mt-0.5">
                                    {renderPaymentBadge(order.paymentStatus, rem)}
                                  </div>
                                </td>
                              );
                            case 'manager':
                              return (
                                <td key={colKey} className="py-3.5 px-4 text-center">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                                    {order.manager?.fullName || 'Chưa gán'}
                                  </span>
                                </td>
                              );
                            case 'actions':
                              return (
                                <td key={colKey} className="py-3.5 px-4 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    {/* In Phiếu xuất kho A4 */}
                                    <button
                                      title="In Phiếu xuất kho kiêm Biên bản giao hàng (A4)"
                                      onClick={() => handleOpenPrint(order)}
                                      className="p-1.5 text-gray-500 hover:text-[#E53935] hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                    >
                                      <Printer className="w-4 h-4 text-[#E53935]" />
                                    </button>

                                    {/* Xem chi tiết đơn */}
                                    <button
                                      title="Xem chi tiết đơn hàng"
                                      onClick={() => {
                                        setSelectedOrder(order);
                                        setIsDetailModalOpen(true);
                                      }}
                                      className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>

                                    {/* Thu tiền / Cập nhật tiến độ */}
                                    {hasPermission('B_ORDERS', 'update') && order.deliveryStatus !== 'CANCELLED' && (
                                      <button
                                        title="Cập nhật thanh toán & Trạng thái"
                                        onClick={() => openPaymentModal(order)}
                                        className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                      >
                                        <DollarSign className="w-4 h-4" />
                                      </button>
                                    )}

                                    {/* Điều chỉnh giá trị đơn hàng (+/-) */}
                                    {hasPermission('B_ORDERS', 'update') && order.deliveryStatus !== 'CANCELLED' && (
                                      <button
                                        title="Điều chỉnh giá trị đơn hàng (+/-)"
                                        onClick={() => openAdjustModal(order)}
                                        className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                      >
                                        <Edit3 className="w-4 h-4" />
                                      </button>
                                    )}

                                    {/* Hủy đơn & Hoàn tiền cọc */}
                                    {hasPermission('B_ORDERS', 'update') && order.deliveryStatus !== 'CANCELLED' && order.deliveryStatus !== 'DELIVERED' && (
                                      <button
                                        title="Hủy đơn & Hoàn tiền cọc"
                                        onClick={() => openCancelRefundModal(order)}
                                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                      >
                                        <RotateCcw className="w-4 h-4" />
                                      </button>
                                    )}

                                    {/* Lập phiếu đổi trả hàng hoàn kho */}
                                    {hasPermission('B_ORDERS', 'update') && order.deliveryStatus === 'DELIVERED' && (
                                      <button
                                        title="Lập phiếu trả hàng hoàn kho"
                                        onClick={() => openReturnModal(order)}
                                        className="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                                      >
                                        <PackageMinus className="w-4 h-4 text-orange-600" />
                                      </button>
                                    )}

                                    {/* Bàn giao đơn */}
                                    {hasPermission('B_ORDERS', 'update') && (
                                      <button
                                        title="Bàn giao đơn hàng cho nhân viên khác"
                                        onClick={() => openHandoverModal(order)}
                                        className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                                      >
                                        <ArrowRightLeft className="w-4 h-4" />
                                      </button>
                                    )}

                                    {/* Xóa đơn nếu chưa giao và chưa có thanh toán */}
                                    {hasPermission('B_ORDERS', 'delete') &&
                                      order.deliveryStatus !== 'DELIVERED' &&
                                      Number(order.paidAmount) === 0 && (
                                        <button
                                          title="Xóa đơn hàng"
                                          onClick={() => handleDelete(order.id, order.code)}
                                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
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


      {/* MODAL TẠO ĐƠN HÀNG MỚI */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center text-[#E53935]">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Lập Đơn Hàng Mới - VPP Nam Khánh</h3>
                  <p className="text-xs text-gray-500">Tự động tính toán công nợ và áp thuế VAT 8% ngành văn phòng phẩm</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="flex-1 overflow-y-auto p-6 space-y-6">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-[#E53935] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {formError}
                </div>
              )}

              {/* Thông tin chung đơn hàng */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Khách hàng đặt hàng <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={createData.customerId}
                    onChange={(e) => handleCustomerSelect(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#E53935]"
                  >
                    <option value="">-- Chọn khách hàng --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code}) - {c.phone}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Người nhận hàng</label>
                  <input
                    type="text"
                    placeholder="Tên người nhận tại kho/VP"
                    value={createData.contactPerson}
                    onChange={(e) => setCreateData({ ...createData, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#E53935]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Số điện thoại nhận</label>
                  <input
                    type="text"
                    placeholder="SĐT liên hệ giao hàng"
                    value={createData.phone}
                    onChange={(e) => setCreateData({ ...createData, phone: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#E53935]"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Địa chỉ giao hàng</label>
                  <input
                    type="text"
                    placeholder="Địa chỉ giao cụ thể..."
                    value={createData.deliveryAddress}
                    onChange={(e) => setCreateData({ ...createData, deliveryAddress: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#E53935]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Ngày hẹn giao</label>
                  <input
                    type="date"
                    value={createData.deliveryDate}
                    onChange={(e) => setCreateData({ ...createData, deliveryDate: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#E53935]"
                  />
                </div>
              </div>

              {/* Số dư trả trước / Ký quỹ của khách (Credit Balance) */}
              {(() => {
                const selectedCust = customers.find((c) => c.id === createData.customerId);
                const creditBal = Number(selectedCust?.creditBalance || 0);
                if (creditBal <= 0) return null;
                return (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <CreditCard className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-emerald-900">
                          Khách hàng có số dư trả trước / ký quỹ: {formatVND(creditBal)}
                        </p>
                        <p className="text-[11px] text-emerald-700">
                          Tích chọn để tự động cấn trừ số dư này vào tiền thanh toán đơn hàng.
                        </p>
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-xs font-bold text-emerald-800 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-emerald-300 shadow-sm hover:bg-emerald-100/50 transition-colors">
                      <input
                        type="checkbox"
                        checked={createData.useCreditBalance}
                        onChange={(e) => setCreateData({ ...createData, useCreditBalance: e.target.checked })}
                        className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                      />
                      <span>Cấn trừ số dư ví</span>
                    </label>
                  </div>
                );
              })()}

              {/* Danh sách mặt hàng VPP trong đơn */}
              <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-[#E53935]" />
                    Danh mục hàng hóa VPP xuất bán
                  </h4>
                  <div className="flex items-center gap-2">
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAddItem(e.target.value);
                          e.target.value = '';
                        }
                      }}
                      className="text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:border-[#E53935]"
                    >
                      <option value="">+ Chọn nhanh sản phẩm từ kho VPP</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.code} - {p.name} ({formatVND(Number(p.sellingPrice))}/{p.unit})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {createData.items.length === 0 ? (
                  <div className="py-8 text-center text-gray-400 bg-white rounded-lg border border-dashed border-gray-300 text-xs">
                    Chưa có mặt hàng nào. Chọn sản phẩm từ danh sách trên để thêm vào đơn.
                  </div>
                ) : (
                  <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-gray-100/70 border-b border-gray-200 text-gray-700">
                        <tr>
                          <th className="p-2">Mã & Tên SP</th>
                          <th className="p-2 w-20">ĐVT</th>
                          <th className="p-2 w-24">Số lượng</th>
                          <th className="p-2 w-32 text-right">Đơn giá (VNĐ)</th>
                          <th className="p-2 w-32 text-right">Thành tiền</th>
                          <th className="p-2 w-12 text-center">Xóa</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {createData.items.map((item, index) => (
                          <tr key={index}>
                            <td className="p-2">
                              <span className="font-semibold text-gray-800">{item.productCode}</span> - {item.productName}
                            </td>
                            <td className="p-2 text-gray-500">{item.unit}</td>
                            <td className="p-2">
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) =>
                                  handleItemChange(index, 'quantity', Math.max(1, parseInt(e.target.value) || 1))
                                }
                                className="w-full p-1 border border-gray-200 rounded text-center focus:outline-none focus:border-[#E53935]"
                              />
                            </td>
                            <td className="p-2 text-right">
                              <input
                                type="number"
                                min="0"
                                step="1000"
                                value={item.unitPrice}
                                onChange={(e) =>
                                  handleItemChange(index, 'unitPrice', Math.max(0, parseInt(e.target.value) || 0))
                                }
                                className="w-full p-1 border border-gray-200 rounded text-right focus:outline-none focus:border-[#E53935]"
                              />
                            </td>
                            <td className="p-2 text-right font-semibold text-gray-900">
                              {formatVND(item.quantity * item.unitPrice)}
                            </td>
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(index)}
                                className="text-gray-400 hover:text-red-500 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Thanh toán & Công nợ tự động */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-red-50/30 p-4 rounded-xl border border-red-100">
                <div className="space-y-3 text-xs">
                  <label className="block font-semibold text-gray-700">Ghi chú giao hàng & đóng gói</label>
                  <textarea
                    rows={3}
                    placeholder="Ghi chú yêu cầu giao giờ hành chính, bốc xếp hàng..."
                    value={createData.notes}
                    onChange={(e) => setCreateData({ ...createData, notes: e.target.value })}
                    className="w-full p-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#E53935]"
                  />
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Trạng thái giao hàng ban đầu</label>
                    <select
                      value={createData.deliveryStatus}
                      onChange={(e) => setCreateData({ ...createData, deliveryStatus: e.target.value })}
                      className="w-full p-2 text-xs border border-gray-200 rounded-lg bg-white"
                    >
                      <option value="PENDING">Chờ xuất kho</option>
                      <option value="DELIVERING">Giao ngay cho shiper/xe tải</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Tổng tiền hàng (chưa VAT):</span>
                    <span className="font-semibold text-gray-900">{formatVND(subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Thuế suất VAT:</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={createData.vatRate}
                        onChange={(e) => setCreateData({ ...createData, vatRate: parseInt(e.target.value) || 0 })}
                        className="w-14 p-1 text-xs border border-gray-200 rounded text-center"
                      />
                      <span className="text-xs font-semibold">% ({formatVND(vatAmount)})</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-200">
                    <span>Tổng thanh toán đơn:</span>
                    <span className="text-[#E53935]">{formatVND(totalAmount)}</span>
                  </div>

                  {createData.useCreditBalance && creditDeduction > 0 && (
                    <div className="flex justify-between items-center text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                      <span>Khấu trừ từ số dư trả trước:</span>
                      <span>-{formatVND(creditDeduction)}</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-dashed border-gray-200 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-gray-700">Khách trả trước / Thực thu:</span>
                      <input
                        type="number"
                        min="0"
                        max={totalAmount}
                        step="1000"
                        value={createData.paidAmount}
                        onChange={(e) => setCreateData({ ...createData, paidAmount: Math.max(0, parseInt(e.target.value) || 0) })}
                        className="w-36 p-1.5 text-xs border border-emerald-300 rounded font-semibold text-emerald-700 text-right focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold text-[#E53935]">
                      <span>Còn phải thu (Nợ tự động):</span>
                      <span className="text-sm font-black">{formatVND(draftRemaining)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#E53935] hover:bg-[#D32F2F] text-white rounded-lg text-sm font-semibold shadow-md transition-colors"
                >
                  Xác nhận lưu Đơn hàng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CẬP NHẬT THANH TOÁN THỰC THU & TIẾN ĐỘ */}
      {isPaymentModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-emerald-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Cập Nhật Thu Tiền & Tiến Độ Giao</h3>
                  <p className="text-xs text-gray-500">Đơn hàng: {selectedOrder.code} - {selectedOrder.customer?.name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdatePayment} className="p-6 space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg space-y-1 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Tổng giá trị đơn hàng:</span>
                  <span className="font-bold text-gray-900">{formatVND(Number(selectedOrder.totalAmount))}</span>
                </div>
                <div className="flex justify-between">
                  <span>Thực thu hiện tại:</span>
                  <span className="font-semibold text-emerald-600">{formatVND(Number(selectedOrder.paidAmount))}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Số tiền thực thu mới (VNĐ) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    min="0"
                    max={Number(selectedOrder.totalAmount)}
                    step="1000"
                    value={updatePaymentData.paidAmount}
                    onChange={(e) =>
                      setUpdatePaymentData({
                        ...updatePaymentData,
                        paidAmount: Number(e.target.value) || 0
                      })
                    }
                    className="w-full pl-9 pr-3 py-2 text-sm font-bold border border-gray-200 rounded-lg focus:outline-none focus:border-[#E53935]"
                  />
                </div>
                <div className="mt-1 text-xs text-gray-500 flex justify-between">
                  <span>Còn nợ sau khi cập nhật:</span>
                  <span className="font-bold text-[#E53935]">
                    {formatVND(
                      Math.max(0, Number(selectedOrder.totalAmount) - updatePaymentData.paidAmount)
                    )}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Trạng thái giao</label>
                  <select
                    value={updatePaymentData.deliveryStatus}
                    onChange={(e) =>
                      setUpdatePaymentData({ ...updatePaymentData, deliveryStatus: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white"
                  >
                    <option value="PENDING">Chờ xuất kho</option>
                    <option value="DELIVERING">Đang giao hàng</option>
                    <option value="PARTIAL">Giao một phần</option>
                    <option value="DELIVERED">Đã giao thành công</option>
                    <option value="CANCELLED">Hủy đơn</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Hóa đơn VAT</label>
                  <select
                    value={updatePaymentData.invoiceStatus}
                    onChange={(e) =>
                      setUpdatePaymentData({ ...updatePaymentData, invoiceStatus: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white"
                  >
                    <option value="NOT_ISSUED">Chưa xuất HĐ</option>
                    <option value="ISSUING">Đang viết HĐ</option>
                    <option value="ISSUED">Đã xuất HĐ</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Địa chỉ giao</label>
                <input
                  type="text"
                  value={updatePaymentData.deliveryAddress}
                  onChange={(e) =>
                    setUpdatePaymentData({ ...updatePaymentData, deliveryAddress: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Ghi chú thanh toán</label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú hình thức thanh toán (Tiền mặt / Chuyển khoản Vietcombank)..."
                  value={updatePaymentData.notes}
                  onChange={(e) =>
                    setUpdatePaymentData({ ...updatePaymentData, notes: e.target.value })
                  }
                  className="w-full p-2 text-xs border border-gray-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors"
                >
                  Lưu thanh toán
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL BÀN GIAO ĐƠN HÀNG */}
      {isHandoverModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-purple-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Bàn Giao Đơn Hàng</h3>
                  <p className="text-xs text-gray-500">Mã đơn: {selectedOrder.code}</p>
                </div>
              </div>
              <button
                onClick={() => setIsHandoverModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleHandover} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Nhân viên nhận bàn giao <span className="text-red-500">*</span>
                </label>
                <select
                  value={handoverData.toUserId}
                  onChange={(e) => setHandoverData({ ...handoverData, toUserId: e.target.value })}
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white"
                >
                  <option value="">-- Chọn nhân sự kinh doanh --</option>
                  {users
                    .filter((u) => u.id !== selectedOrder.managerId)
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} ({u.code}) - {u.email}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Lý do bàn giao đơn hàng <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ví dụ: Nhân viên cũ đi công tác, bàn giao theo dõi đôn đốc giao hàng và thu nợ..."
                  value={handoverData.reason}
                  onChange={(e) => setHandoverData({ ...handoverData, reason: e.target.value })}
                  className="w-full p-2.5 text-xs border border-gray-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsHandoverModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-xs"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-colors"
                >
                  Xác nhận bàn giao
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL HỦY ĐƠN HÀNG & HOÀN TIỀN CỌC (MỤC IX) */}
      {isCancelRefundModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-red-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center text-[#E53935]">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Hủy Đơn Hàng & Hoàn Cọc</h3>
                  <p className="text-xs text-gray-500">Mã đơn: {selectedOrder.code} - {selectedOrder.customer?.name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsCancelRefundModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCancelRefund} className="p-6 space-y-4">
              {/* Thông tin tài chính đơn hàng */}
              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tổng giá trị đơn hàng:</span>
                  <span className="font-semibold text-gray-900">{formatVND(Number(selectedOrder.totalAmount))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Đã thanh toán / Đặt cọc:</span>
                  <span className="font-bold text-emerald-600">{formatVND(Number(selectedOrder.paidAmount))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Công nợ còn lại:</span>
                  <span className="font-semibold text-gray-700">{formatVND(Number(selectedOrder.remainingAmount))}</span>
                </div>
              </div>

              {Number(selectedOrder.paidAmount) > 0 ? (
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-gray-900">
                    Chọn phương án hoàn trả tiền cọc ({formatVND(Number(selectedOrder.paidAmount))}):
                  </label>
                  <div className="space-y-2">
                    <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      cancelRefundData.refundOption === 'CREDIT_BALANCE' ? 'border-[#E53935] bg-red-50/30 ring-1 ring-[#E53935]' : 'border-gray-200 hover:bg-gray-50'
                    }`}>
                      <input
                        type="radio"
                        name="refundOption"
                        value="CREDIT_BALANCE"
                        checked={cancelRefundData.refundOption === 'CREDIT_BALANCE'}
                        onChange={() => setCancelRefundData({ ...cancelRefundData, refundOption: 'CREDIT_BALANCE' })}
                        className="mt-0.5 text-[#E53935] focus:ring-[#E53935]"
                      />
                      <div>
                        <div className="text-xs font-bold text-gray-900">Cộng vào Số dư trả trước (Credit Balance)</div>
                        <div className="text-[11px] text-gray-500 mt-0.5">
                          Số tiền cọc <span className="font-semibold text-emerald-600">{formatVND(Number(selectedOrder.paidAmount))}</span> sẽ được chuyển vào số dư ví của khách hàng để khấu trừ cho các đơn hàng kế tiếp.
                        </div>
                      </div>
                    </label>

                    <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      cancelRefundData.refundOption === 'CASH_REFUND' ? 'border-[#E53935] bg-red-50/30 ring-1 ring-[#E53935]' : 'border-gray-200 hover:bg-gray-50'
                    }`}>
                      <input
                        type="radio"
                        name="refundOption"
                        value="CASH_REFUND"
                        checked={cancelRefundData.refundOption === 'CASH_REFUND'}
                        onChange={() => setCancelRefundData({ ...cancelRefundData, refundOption: 'CASH_REFUND' })}
                        className="mt-0.5 text-[#E53935] focus:ring-[#E53935]"
                      />
                      <div>
                        <div className="text-xs font-bold text-gray-900">Lập Phiếu Chi hoàn trả tiền mặt / ngân hàng</div>
                        <div className="text-[11px] text-gray-500 mt-0.5">
                          Hệ thống sẽ tự động lập 01 Phiếu Chi (Payment Voucher) tương ứng để thủ quỹ thanh toán trả lại tiền cho khách hàng.
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                  Đơn hàng chưa phát sinh thanh toán cọc. Hệ thống sẽ chuyển trạng thái đơn sang <strong>ĐÃ HỦY</strong> và giải phóng toàn bộ công nợ phải thu.
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Lý do hủy đơn hàng <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Nhập chi tiết lý do khách hàng hoặc công ty hủy đơn..."
                  value={cancelRefundData.reason}
                  onChange={(e) => setCancelRefundData({ ...cancelRefundData, reason: e.target.value })}
                  className="w-full p-2.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#E53935]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsCancelRefundModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-xs"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#E53935] hover:bg-[#D32F2F] text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                >
                  Xác nhận hủy đơn & Hoàn tiền
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ĐIỀU CHỈNH GIÁ TRỊ ĐƠN HÀNG SAU BÁN (MỤC IX) */}
      {isAdjustModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-amber-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Điều Chỉnh Giá Trị Đơn Hàng</h3>
                  <p className="text-xs text-gray-500">Mã đơn: {selectedOrder.code} - {selectedOrder.customer?.name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjust} className="p-6 space-y-4">
              {/* Thông tin đơn hàng hiện tại */}
              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Giá trị đơn hiện tại:</span>
                  <span className="font-bold text-gray-900">{formatVND(Number(selectedOrder.totalAmount))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Thực thu (Đã trả):</span>
                  <span className="font-semibold text-emerald-600">{formatVND(Number(selectedOrder.paidAmount))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Còn phải thu hiện tại:</span>
                  <span className="font-bold text-[#E53935]">{formatVND(Number(selectedOrder.remainingAmount))}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Số tiền điều chỉnh (+ tăng / - giảm) (VNĐ) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={adjustData.adjustedAmount}
                  onChange={(e) => setAdjustData({ ...adjustData, adjustedAmount: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg font-mono font-bold focus:outline-none focus:border-amber-500"
                  placeholder="Ví dụ: -50000 hoặc 30000"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  💡 Nhập số <strong>âm (-)</strong> để giảm trừ tiền (chiết khấu thêm, giảm giá bớt hàng lỗi). Nhập số <strong>dương (+)</strong> để tăng giá trị (phát sinh phụ phí, cộng thêm cước).
                </p>
              </div>

              {/* Preview giá trị sau điều chỉnh */}
              {(() => {
                const currentTotal = Number(selectedOrder.totalAmount);
                const oldAdj = Number(selectedOrder.adjustedAmount || 0);
                const newAdj = Number(adjustData.adjustedAmount || 0);
                const newTotal = currentTotal + (newAdj - oldAdj);
                const newRem = Math.max(0, newTotal - Number(selectedOrder.paidAmount));
                return (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs space-y-1">
                    <div className="font-bold text-blue-900">Dự kiến sau khi điều chỉnh:</div>
                    <div className="flex justify-between text-gray-700">
                      <span>Tổng tiền mới của đơn:</span>
                      <span className="font-bold text-blue-800">{formatVND(newTotal)}</span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>Còn phải thu mới:</span>
                      <span className="font-bold text-[#E53935]">{formatVND(newRem)}</span>
                    </div>
                  </div>
                );
              })()}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Lý do điều chỉnh giá trị <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Ví dụ: Chiết khấu thêm thương mại 2% theo đề nghị của khách hàng..."
                  value={adjustData.adjustmentReason}
                  onChange={(e) => setAdjustData({ ...adjustData, adjustmentReason: e.target.value })}
                  className="w-full p-2.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-xs"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                >
                  Xác nhận điều chỉnh
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL LẬP PHIẾU ĐỔI / TRẢ HÀNG HOÀN KHO (ORDER RETURN) */}
      {isReturnModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-orange-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                  <PackageMinus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Lập Phiếu Đổi / Trả Hàng Hoàn Kho</h3>
                  <p className="text-xs text-gray-500">
                    Đơn hàng: <span className="font-bold text-gray-800">{selectedOrder.code}</span> - {selectedOrder.customer?.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsReturnModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleOrderReturn} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="p-3 bg-orange-50/50 border border-orange-200 rounded-xl text-[11.5px] text-orange-900 leading-relaxed">
                💡 Nhập số lượng hàng thực tế khách trả lại kho. Hệ thống sẽ tự động <strong>hoàn tồn kho</strong> sản phẩm và xử lý công nợ hoặc hoàn tiền theo phương thức bạn chọn dưới đây.
              </div>

              {/* Bảng sản phẩm trong đơn để nhập số lượng trả */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-100/80 border-b border-gray-200 text-gray-700 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5">Sản phẩm VPP</th>
                      <th className="p-2.5 text-center w-16">ĐVT</th>
                      <th className="p-2.5 text-center w-20">Đã giao</th>
                      <th className="p-2.5 text-center w-24">SL Trả lại</th>
                      <th className="p-2.5 text-right w-24">Đơn giá</th>
                      <th className="p-2.5 text-right w-28">Thành tiền trả</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {returnData.items.map((item, idx) => {
                      const itemTotal = item.returnQuantity * item.unitPrice;
                      return (
                        <tr key={idx} className={item.returnQuantity > 0 ? 'bg-orange-50/30' : ''}>
                          <td className="p-2.5">
                            <div className="font-bold text-gray-900">{item.productName}</div>
                            <div className="text-[10px] font-mono text-gray-500">{item.productCode}</div>
                          </td>
                          <td className="p-2.5 text-center text-gray-600">{item.unit}</td>
                          <td className="p-2.5 text-center font-semibold text-gray-700">{item.orderQuantity}</td>
                          <td className="p-2.5 text-center">
                            <input
                              type="number"
                              min="0"
                              max={item.orderQuantity}
                              value={item.returnQuantity}
                              onChange={(e) => {
                                const val = Math.min(item.orderQuantity, Math.max(0, parseInt(e.target.value) || 0));
                                const updated = [...returnData.items];
                                updated[idx].returnQuantity = val;
                                setReturnData({ ...returnData, items: updated });
                              }}
                              className="w-20 p-1 border border-orange-300 rounded text-center font-bold text-orange-700 focus:outline-none focus:ring-1 focus:ring-orange-500"
                            />
                          </td>
                          <td className="p-2.5 text-right text-gray-700">{formatVND(item.unitPrice)}</td>
                          <td className="p-2.5 text-right font-bold text-gray-900">
                            {formatVND(itemTotal)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Tổng tiền trả dự kiến */}
              {(() => {
                const subtotalReturn = returnData.items.reduce((s, it) => s + it.returnQuantity * it.unitPrice, 0);
                const vatReturn = (subtotalReturn * Number(selectedOrder.vatRate || 0)) / 100;
                const totalReturn = subtotalReturn + vatReturn;
                return (
                  <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-1 text-xs">
                    <div className="flex justify-between text-gray-600">
                      <span>Cộng tiền hàng trả lại:</span>
                      <span className="font-semibold">{formatVND(subtotalReturn)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Thuế VAT ({selectedOrder.vatRate}%):</span>
                      <span className="font-semibold">{formatVND(vatReturn)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-gray-900 pt-1 border-t border-gray-200">
                      <span>Tổng giá trị hàng hoàn trả:</span>
                      <span className="text-orange-600">{formatVND(totalReturn)}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Phương thức hoàn trả / cấn trừ */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-900">
                  Phương án xử lý tiền trả hàng:
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <label className={`flex items-start gap-2 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                    returnData.refundOption === 'DEDUCT_DEBT' ? 'border-orange-500 bg-orange-50/40 ring-1 ring-orange-500' : 'border-gray-200 hover:bg-gray-50'
                  }`}>
                    <input
                      type="radio"
                      name="returnRefundOption"
                      value="DEDUCT_DEBT"
                      checked={returnData.refundOption === 'DEDUCT_DEBT'}
                      onChange={() => setReturnData({ ...returnData, refundOption: 'DEDUCT_DEBT' })}
                      className="mt-0.5 text-orange-600 focus:ring-orange-500"
                    />
                    <div>
                      <div className="font-bold text-gray-900 text-xs">Cấn trừ công nợ</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">Trừ trực tiếp vào tiền nợ của đơn này</div>
                    </div>
                  </label>

                  <label className={`flex items-start gap-2 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                    returnData.refundOption === 'CREDIT_BALANCE' ? 'border-orange-500 bg-orange-50/40 ring-1 ring-orange-500' : 'border-gray-200 hover:bg-gray-50'
                  }`}>
                    <input
                      type="radio"
                      name="returnRefundOption"
                      value="CREDIT_BALANCE"
                      checked={returnData.refundOption === 'CREDIT_BALANCE'}
                      onChange={() => setReturnData({ ...returnData, refundOption: 'CREDIT_BALANCE' })}
                      className="mt-0.5 text-orange-600 focus:ring-orange-500"
                    />
                    <div>
                      <div className="font-bold text-gray-900 text-xs">Cộng số dư ví</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">Cộng vào số dư trả trước của khách</div>
                    </div>
                  </label>

                  <label className={`flex items-start gap-2 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                    returnData.refundOption === 'CASH_REFUND' ? 'border-orange-500 bg-orange-50/40 ring-1 ring-orange-500' : 'border-gray-200 hover:bg-gray-50'
                  }`}>
                    <input
                      type="radio"
                      name="returnRefundOption"
                      value="CASH_REFUND"
                      checked={returnData.refundOption === 'CASH_REFUND'}
                      onChange={() => setReturnData({ ...returnData, refundOption: 'CASH_REFUND' })}
                      className="mt-0.5 text-orange-600 focus:ring-orange-500"
                    />
                    <div>
                      <div className="font-bold text-gray-900 text-xs">Tạo Phiếu Chi</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">Tự động tạo Phiếu Chi hoàn lại tiền</div>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Lý do trả hàng <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Ghi rõ lý do: Hàng giao sai quy cách, lỗi kỹ thuật từ nhà sản xuất, thừa số lượng..."
                  value={returnData.returnReason}
                  onChange={(e) => setReturnData({ ...returnData, returnReason: e.target.value })}
                  className="w-full p-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsReturnModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-xs"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                >
                  Xác nhận Nhập kho & Trả hàng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL XEM CHI TIẾT & IN PHIẾU GIAO HÀNG A4 */}
      {isDetailModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50 no-print">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-[#E53935]" />
                <span className="font-bold text-gray-800">
                  Phiếu Xuất Kho & Giao Hàng - {selectedOrder.code}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E53935] hover:bg-[#D32F2F] text-white rounded-lg text-xs font-semibold"
                >
                  <Printer className="w-3.5 h-3.5" />
                  In phiếu A4
                </button>
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* BẢN IN KHỔ A4 */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 text-gray-800 bg-white" id="printable-order">
              {/* Header thương hiệu Nam Khánh */}
              <div className="flex justify-between items-start border-b-2 border-red-600 pb-4">
                <div className="space-y-1">
                  <h2 className="text-xl font-black text-[#E53935] tracking-tight">
                    CÔNG TY TNHH NK NAM KHÁNH
                  </h2>
                  <p className="text-xs text-gray-600">
                    Phân phối sỉ & lẻ Văn phòng phẩm, Thiết bị văn phòng chuyên nghiệp
                  </p>
                  <p className="text-xs text-gray-500">
                    Địa chỉ: Số 32, Ngõ 111 Cầu Giấy, P. Dịch Vọng, Q. Cầu Giấy, Hà Nội
                  </p>
                  <p className="text-xs text-gray-500">
                    Hotline: (024) 3768 9999 | Email: kinhdoanh@namkhanh.vn | MST: 0109876543
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-base font-black text-gray-900 uppercase">
                    PHIẾU GIAO HÀNG & XUẤT KHO
                  </div>
                  <div className="text-xs font-bold text-[#E53935] mt-0.5">Số: {selectedOrder.code}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Ngày:{' '}
                    {new Date(selectedOrder.orderDate).toLocaleDateString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </div>
                </div>
              </div>

              {/* Thông tin Khách hàng */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="space-y-1">
                  <p className="font-semibold text-gray-900">
                    Khách hàng: <span className="font-bold text-[#E53935]">{selectedOrder.customer?.name}</span>
                  </p>
                  <p>Mã khách: {selectedOrder.customer?.code} | MST: {selectedOrder.customer?.taxCode || 'N/A'}</p>
                  <p>Người nhận: {selectedOrder.contactPerson || selectedOrder.customer?.contactPerson || 'Bộ phận tiếp nhận'}</p>
                  <p>Số điện thoại: {selectedOrder.phone || selectedOrder.customer?.phone}</p>
                </div>
                <div className="space-y-1">
                  <p>Địa chỉ giao: {selectedOrder.deliveryAddress || selectedOrder.customer?.address}</p>
                  <p>
                    Ngày hẹn giao:{' '}
                    {selectedOrder.deliveryDate
                      ? new Date(selectedOrder.deliveryDate).toLocaleDateString('vi-VN')
                      : 'Giao ngay trong ngày'}
                  </p>
                  <p>Nhân viên phụ trách: {selectedOrder.manager?.fullName || 'Bộ phận kinh doanh'}</p>
                  <p>
                    Hóa đơn VAT: {selectedOrder.invoiceStatus === 'ISSUED' ? 'Đã xuất hóa đơn' : 'Chưa xuất hóa đơn'}
                  </p>
                </div>
              </div>

              {/* Bảng sản phẩm */}
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-100 border-b border-gray-300 text-gray-800 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5 text-center w-10">STT</th>
                      <th className="p-2.5 w-24">Mã SP</th>
                      <th className="p-2.5">Tên sản phẩm văn phòng phẩm</th>
                      <th className="p-2.5 text-center w-14">ĐVT</th>
                      <th className="p-2.5 text-center w-16">SL</th>
                      <th className="p-2.5 text-right w-24">Đơn giá</th>
                      <th className="p-2.5 text-right w-28">Thành tiền (VNĐ)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedOrder.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-2 text-center text-gray-500">{idx + 1}</td>
                        <td className="p-2 font-mono font-semibold text-gray-700">{item.productCode}</td>
                        <td className="p-2 font-medium text-gray-900">{item.productName}</td>
                        <td className="p-2 text-center text-gray-600">{item.unit}</td>
                        <td className="p-2 text-center font-bold">{item.quantity}</td>
                        <td className="p-2 text-right">{formatVND(Number(item.unitPrice))}</td>
                        <td className="p-2 text-right font-bold text-gray-900">
                          {formatVND(Number(item.total))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Tổng cộng & Công nợ */}
              <div className="flex justify-between items-start pt-2">
                <div className="text-xs text-gray-500 max-w-xs space-y-1">
                  <p className="font-semibold text-gray-700">Ghi chú đơn hàng:</p>
                  <p className="italic">{selectedOrder.notes || 'Hàng mới 100%, đúng quy cách mẫu mã của Nam Khánh.'}</p>
                </div>
                <div className="w-72 space-y-1.5 text-xs text-right">
                  <div className="flex justify-between text-gray-600">
                    <span>Cộng tiền hàng:</span>
                    <span className="font-medium">{formatVND(Number(selectedOrder.subtotal))}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Thuế VAT ({selectedOrder.vatRate}%):</span>
                    <span className="font-medium">{formatVND(Number(selectedOrder.vatAmount))}</span>
                  </div>
                  {Number(selectedOrder.adjustedAmount || 0) !== 0 && (
                    <div className="flex justify-between text-amber-700">
                      <span>Điều chỉnh giá trị ({selectedOrder.adjustmentReason || 'Khác'}):</span>
                      <span className="font-semibold">
                        {Number(selectedOrder.adjustedAmount) > 0 ? '+' : ''}
                        {formatVND(Number(selectedOrder.adjustedAmount))}
                      </span>
                    </div>
                  )}
                  {Number(selectedOrder.refundAmount || 0) > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Tiền đã hoàn lại:</span>
                      <span className="font-semibold">
                        -{formatVND(Number(selectedOrder.refundAmount))}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold text-gray-900 pt-1 border-t border-gray-300">
                    <span>Tổng thanh toán:</span>
                    <span className="text-[#E53935]">{formatVND(Number(selectedOrder.totalAmount))}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Đã thanh toán (Thực thu):</span>
                    <span className="font-bold text-emerald-600">{formatVND(Number(selectedOrder.paidAmount))}</span>
                  </div>
                  <div className="flex justify-between font-bold text-[#E53935] pt-1 border-t border-dashed border-red-300">
                    <span>CÒN PHẢI THU (NỢ):</span>
                    <span>{formatVND(Number(selectedOrder.remainingAmount))}</span>
                  </div>
                </div>
              </div>

              {/* Lịch sử Đổi / Trả hàng hoàn kho */}
              {selectedOrder.returns && selectedOrder.returns.length > 0 && (
                <div className="border border-orange-200 bg-orange-50/40 rounded-xl p-4 space-y-3 no-print">
                  <div className="flex items-center gap-2 text-xs font-bold text-orange-950 uppercase tracking-wide">
                    <PackageMinus className="w-4 h-4 text-orange-600" />
                    <span>Lịch sử đổi / trả hàng hoàn kho ({selectedOrder.returns.length} đợt trả)</span>
                  </div>
                  <div className="space-y-2">
                    {selectedOrder.returns.map((ret, rIdx) => (
                      <div key={rIdx} className="bg-white p-3 rounded-lg border border-orange-200 text-xs space-y-1.5 shadow-sm">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-gray-900">{ret.code} - Ngày {new Date(ret.returnDate).toLocaleDateString('vi-VN')}</span>
                          <span className="font-bold text-orange-700">Tổng hoàn trả: {formatVND(Number(ret.totalRefundAmount))}</span>
                        </div>
                        <p className="text-gray-600 italic">Lý do: {ret.reason}</p>
                        <div className="text-[11px] text-gray-500">
                          Phương án: {ret.refundMethod === 'DEDUCT_DEBT' ? 'Trừ trực tiếp công nợ' : ret.refundMethod === 'CREDIT_BALANCE' ? 'Cộng vào số dư trả trước của khách' : 'Tạo phiếu chi hoàn tiền'}
                        </div>
                        {ret.items && ret.items.length > 0 && (
                          <div className="mt-1 border-t border-gray-100 pt-1 text-[11px] text-gray-600 space-y-0.5">
                            {ret.items.map((it, itIdx) => (
                              <div key={itIdx} className="flex justify-between">
                                <span>• {it.productName} ({it.productCode})</span>
                                <span>SL: {it.quantity} {it.unit} x {formatVND(Number(it.unitPrice))}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Chữ ký xác nhận */}
              <div className="grid grid-cols-4 gap-4 text-center text-xs pt-8 border-t border-gray-200">
                <div>
                  <p className="font-bold text-gray-800">Người lập phiếu</p>
                  <p className="text-[10px] text-gray-400 italic">(Ký, ghi rõ họ tên)</p>
                  <div className="h-16"></div>
                  <p className="font-medium text-gray-700">{selectedOrder.manager?.fullName || 'Thủ kho'}</p>
                </div>
                <div>
                  <p className="font-bold text-gray-800">Thủ kho xuất</p>
                  <p className="text-[10px] text-gray-400 italic">(Ký, ghi rõ họ tên)</p>
                  <div className="h-16"></div>
                  <p className="font-medium text-gray-700">Kho VPP Nam Khánh</p>
                </div>
                <div>
                  <p className="font-bold text-gray-800">Nhân viên giao nhận</p>
                  <p className="text-[10px] text-gray-400 italic">(Ký, ghi rõ họ tên)</p>
                  <div className="h-16"></div>
                  <p className="font-medium text-gray-700">Đội xe giao hàng</p>
                </div>
                <div>
                  <p className="font-bold text-gray-800">Người nhận hàng</p>
                  <p className="text-[10px] text-gray-400 italic">(Ký, ghi rõ họ tên)</p>
                  <div className="h-16"></div>
                  <p className="font-medium text-gray-700">{selectedOrder.contactPerson || 'Đại diện bên nhận'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* MODAL IN PHIẾU XUẤT KHO A4 CHUẨN SECTION XI.6 */}
      <OrderPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => {
          setIsPrintModalOpen(false);
          setSelectedPrintOrder(null);
        }}
        order={selectedPrintOrder}
      />
    </div>
  );
};
