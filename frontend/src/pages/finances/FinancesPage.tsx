import React, { useState, useEffect } from 'react';
import {
  Receipt,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Search,
  Filter,
  Printer,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  DollarSign,
  Layers,
  Tag,
  TrendingUp,
  FileText,
  Calendar,
  Lock,
  Unlock,
  Building2,
  User,
  ShoppingBag,
  ExternalLink,
  Edit2,
  Trash2,
  RefreshCw,
  X,
  FileSpreadsheet,
  Columns,
  RotateCcw,
  Phone
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  PaymentVoucher,
  ReceiptVoucher,
  ExpenseCategory,
  ExpenseType,
  RevenueType,
  CashflowSummary,
  Customer,
  Order
} from '../../types';
import { useTableResize } from '../../hooks/useTableResize';
import { VoucherPrintModal } from './components/VoucherPrintModal';

export const FinancesPage: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const isCeoOrAdmin = user?.roles?.includes('CEO') || user?.roles?.includes('ADMIN');

  // Tab điều hướng chính
  const [activeTab, setActiveTab] = useState<'receipts' | 'payments' | 'categories' | 'revenue-types' | 'reports'>('receipts');

  // Dữ liệu chính
  const [receipts, setReceipts] = useState<ReceiptVoucher[]>([]);
  const [payments, setPayments] = useState<PaymentVoucher[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [revenueTypes, setRevenueTypes] = useState<RevenueType[]>([]);
  const [cashflow, setCashflow] = useState<CashflowSummary | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);

  // Cấu hình ẩn / hiện cột Phiếu thu
  const defaultReceiptsCols: Record<string, boolean> = {
    stt: true,
    voucherDate: true,
    code: true,
    payer: true,
    order: true,
    reason: true,
    amount: true,
    status: true,
    actions: true
  };

  const receiptsColLabels: Record<string, string> = {
    stt: 'STT',
    voucherDate: 'Ngày thu',
    code: 'Số phiếu thu',
    payer: 'Người nộp tiền',
    order: 'Đơn hàng liên kết',
    reason: 'Nội dung thu',
    amount: 'Số tiền (VNĐ)',
    status: 'Trạng thái',
    actions: 'Thao tác'
  };

  const [receiptsVisibleCols, setReceiptsVisibleCols] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('namkhanh_finances_receipts_visible_cols');
      return saved ? JSON.parse(saved) : defaultReceiptsCols;
    } catch {
      return defaultReceiptsCols;
    }
  });

  // Cấu hình ẩn / hiện cột Phiếu chi
  const defaultPaymentsCols: Record<string, boolean> = {
    stt: true,
    voucherDate: true,
    code: true,
    recipient: true,
    type: true,
    reason: true,
    amount: true,
    status: true,
    actions: true
  };

  const paymentsColLabels: Record<string, string> = {
    stt: 'STT',
    voucherDate: 'Ngày chi',
    code: 'Số phiếu chi',
    recipient: 'Người nhận tiền',
    type: 'Loại chi phí',
    reason: 'Nội dung chi',
    amount: 'Số tiền chi (VNĐ)',
    status: 'Trạng thái',
    actions: 'Thao tác'
  };

  const [paymentsVisibleCols, setPaymentsVisibleCols] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('namkhanh_finances_payments_visible_cols');
      return saved ? JSON.parse(saved) : defaultPaymentsCols;
    } catch {
      return defaultPaymentsCols;
    }
  });

  const defaultReceiptWidths: Record<string, number> = {
    stt: 60,
    voucherDate: 120,
    code: 140,
    payer: 260,
    order: 160,
    reason: 260,
    amount: 150,
    status: 130,
    actions: 140
  };

  const {
    columnWidths: receiptWidths,
    startResize: startReceiptResize,
    resetWidths: resetReceiptWidths,
    getTableWidth: getReceiptTableWidth
  } = useTableResize({
    tableKey: 'finances_receipts',
    defaultWidths: defaultReceiptWidths,
    minWidth: 50,
    minWidths: { stt: 45, actions: 120 }
  });

  const defaultPaymentWidths: Record<string, number> = {
    stt: 60,
    voucherDate: 120,
    code: 140,
    recipient: 260,
    type: 150,
    reason: 260,
    amount: 150,
    status: 130,
    actions: 140
  };

  const {
    columnWidths: paymentWidths,
    startResize: startPaymentResize,
    resetWidths: resetPaymentWidths,
    getTableWidth: getPaymentTableWidth
  } = useTableResize({
    tableKey: 'finances_payments',
    defaultWidths: defaultPaymentWidths,
    minWidth: 50,
    minWidths: { stt: 45, actions: 120 }
  });

  const [isReceiptsColDropdownOpen, setIsReceiptsColDropdownOpen] = useState(false);
  const [isPaymentsColDropdownOpen, setIsPaymentsColDropdownOpen] = useState(false);

  const toggleReceiptsCol = (colKey: string) => {
    const updated = { ...receiptsVisibleCols, [colKey]: !receiptsVisibleCols[colKey] };
    setReceiptsVisibleCols(updated);
    try {
      localStorage.setItem('namkhanh_finances_receipts_visible_cols', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const resetReceiptsCols = () => {
    setReceiptsVisibleCols(defaultReceiptsCols);
    resetReceiptWidths();
    try {
      localStorage.setItem('namkhanh_finances_receipts_visible_cols', JSON.stringify(defaultReceiptsCols));
    } catch (e) {
      console.error(e);
    }
  };

  const togglePaymentsCol = (colKey: string) => {
    const updated = { ...paymentsVisibleCols, [colKey]: !paymentsVisibleCols[colKey] };
    setPaymentsVisibleCols(updated);
    try {
      localStorage.setItem('namkhanh_finances_payments_visible_cols', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const resetPaymentsCols = () => {
    setPaymentsVisibleCols(defaultPaymentsCols);
    resetPaymentWidths();
    try {
      localStorage.setItem('namkhanh_finances_payments_visible_cols', JSON.stringify(defaultPaymentsCols));
    } catch (e) {
      console.error(e);
    }
  };

  // Bộ lọc & Trạng thái tải
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [reportPeriod, setReportPeriod] = useState<'month' | 'quarter' | 'year' | 'all'>('month');

  // Modal In chứng từ
  const [printModalData, setPrintModalData] = useState<{
    voucher: PaymentVoucher | ReceiptVoucher | null;
    type: 'PAYMENT' | 'RECEIPT';
  }>({ voucher: null, type: 'RECEIPT' });

  // Modal Form Phiếu Thu
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptFormData, setReceiptFormData] = useState({
    id: '',
    voucherDate: new Date().toISOString().split('T')[0],
    typeId: '',
    customerId: '',
    orderId: '',
    payer: '',
    phone: '',
    address: '',
    reason: '',
    amount: '',
    paymentMethod: 'BANK_TRANSFER',
    invoiceNumber: '',
    notes: ''
  });

  // State phân bổ gạch nợ đa đơn hàng (Multi-order Allocation)
  const [allocations, setAllocations] = useState<Array<{
    orderId: string;
    orderCode: string;
    orderDate: string;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    allocatedAmount: number;
  }>>([]);

  // Modal Form Phiếu Chi
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentFormData, setPaymentFormData] = useState({
    id: '',
    voucherDate: new Date().toISOString().split('T')[0],
    categoryId: '',
    typeId: '',
    recipient: '',
    phone: '',
    address: '',
    reason: '',
    amount: '',
    paymentMethod: 'CASH',
    invoiceNumber: '',
    notes: ''
  });

  // Modal Override TGĐ
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [overrideVoucher, setOverrideVoucher] = useState<{
    id: string;
    type: 'PAYMENT' | 'RECEIPT';
    amount: string;
    reason: string;
    person: string;
  } | null>(null);

  // Modal Danh mục chi phí & Loại chi phí
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState({ id: '', code: '', name: '', description: '' });
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [typeFormData, setTypeFormData] = useState({ id: '', code: '', name: '', categoryId: '', description: '' });

  // Modal Nhóm khoản thu
  const [isRevenueTypeModalOpen, setIsRevenueTypeModalOpen] = useState(false);
  const [revenueTypeFormData, setRevenueTypeFormData] = useState({ id: '', code: '', name: '', description: '' });

  // ================= LOAD DỮ LIỆU =================
  const loadData = async () => {
    try {
      setLoading(true);
      const [recRes, payRes, catRes, revRes, flowRes, cusRes] = await Promise.all([
        api.get('/receipt-vouchers'),
        api.get('/payment-vouchers'),
        api.get('/expense-categories'),
        api.get('/revenue-types'),
        api.get(`/cashflow-reports/summary?period=${reportPeriod}`),
        api.get('/customers')
      ]);

      setReceipts(recRes.data || []);
      setPayments(payRes.data || []);
      setCategories(catRes.data || []);
      setRevenueTypes(revRes.data || []);
      setCashflow(flowRes.data || null);
      setCustomers(cusRes.data || []);
    } catch (err: any) {
      console.error('Lỗi tải dữ liệu tài chính:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [reportPeriod]);

  // Khi chọn khách hàng trong form Phiếu Thu -> tải danh sách đơn hàng còn nợ
  const handleCustomerChangeForReceipt = async (customerId: string) => {
    setReceiptFormData((prev) => ({ ...prev, customerId, orderId: '' }));
    if (!customerId) {
      setCustomerOrders([]);
      setAllocations([]);
      return;
    }

    try {
      const selectedCus = customers.find((c) => c.id === customerId);
      if (selectedCus) {
        setReceiptFormData((prev) => ({
          ...prev,
          payer: selectedCus.contactPerson || selectedCus.name,
          phone: selectedCus.phone || '',
          address: selectedCus.address || ''
        }));
      }

      const res = await api.get(`/orders?customerId=${customerId}`);
      const orders: Order[] = res.data || [];
      setCustomerOrders(orders);

      // Lọc các đơn còn nợ đưa vào bảng phân bổ gạch nợ đa đơn
      const unpaid = orders.filter(
        (o) => Number(o.remainingAmount) > 0 && o.deliveryStatus !== 'CANCELLED'
      );
      setAllocations(
        unpaid.map((o) => ({
          orderId: o.id,
          orderCode: o.code,
          orderDate: o.orderDate,
          totalAmount: Number(o.totalAmount),
          paidAmount: Number(o.paidAmount || 0),
          remainingAmount: Number(o.remainingAmount),
          allocatedAmount: 0
        }))
      );
    } catch (err) {
      console.error('Lỗi tải đơn hàng của khách:', err);
    }
  };

  // Phân bổ tự động theo nguyên tắc FIFO (Đơn cũ nhất trả trước)
  const handleAutoAllocateFIFO = () => {
    let remainingBudget = Number(receiptFormData.amount) || 0;
    if (remainingBudget <= 0) {
      alert('Vui lòng nhập Số tiền thu hợp lệ trước khi phân bổ tự động');
      return;
    }

    const sorted = [...allocations].sort(
      (a, b) => new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime()
    );

    const updated = sorted.map((item) => {
      if (remainingBudget <= 0) {
        return { ...item, allocatedAmount: 0 };
      }
      const alloc = Math.min(item.remainingAmount, remainingBudget);
      remainingBudget -= alloc;
      return { ...item, allocatedAmount: alloc };
    });

    setAllocations(updated);
  };

  // ================= THAO TÁC PHIẾU THU =================
  const handleSaveReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!receiptFormData.payer || !receiptFormData.amount || !receiptFormData.reason) {
        alert('Vui lòng nhập đầy đủ Người nộp tiền, Lý do thu và Số tiền');
        return;
      }

      const validAllocations = allocations
        .filter((a) => Number(a.allocatedAmount) > 0)
        .map((a) => ({ orderId: a.orderId, amount: Number(a.allocatedAmount) }));

      const totalAllocated = validAllocations.reduce((sum, a) => sum + a.amount, 0);
      if (totalAllocated > Number(receiptFormData.amount)) {
        alert(
          `Tổng số tiền phân bổ (${totalAllocated.toLocaleString(
            'vi-VN'
          )}đ) không được vượt quá số tiền phiếu thu (${Number(
            receiptFormData.amount
          ).toLocaleString('vi-VN')}đ)`
        );
        return;
      }

      const payload: any = {
        ...receiptFormData,
        amount: Number(receiptFormData.amount)
      };

      if (validAllocations.length > 0) {
        payload.allocations = validAllocations;
      }

      if (receiptFormData.id) {
        await api.put(`/receipt-vouchers/${receiptFormData.id}`, payload);
      } else {
        await api.post('/receipt-vouchers', payload);
      }

      setIsReceiptModalOpen(false);
      resetReceiptForm();
      loadData();
    } catch (err: any) {
      alert(err.message || 'Lỗi lưu phiếu thu');
    }
  };

  const handleApproveReceipt = async (id: string, action: 'APPROVE' | 'PAID' | 'REJECT') => {
    const confirmMsg =
      action === 'PAID'
        ? 'Xác nhận ĐÃ THU TIỀN? Hệ thống sẽ TỰ ĐỘNG GẠCH NỢ đơn hàng liên kết và KHÓA SỬA chứng từ!'
        : action === 'APPROVE'
        ? 'Xác nhận DUYỆT phiếu thu này?'
        : 'Từ chối phiếu thu này?';

    if (!window.confirm(confirmMsg)) return;

    try {
      await api.patch(`/receipt-vouchers/${id}/approve`, { action });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Lỗi phê duyệt phiếu thu');
    }
  };

  const handleDeleteReceipt = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa phiếu thu này?')) return;
    try {
      await api.delete(`/receipt-vouchers/${id}`);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Lỗi xóa phiếu thu');
    }
  };

  const resetReceiptForm = () => {
    setReceiptFormData({
      id: '',
      voucherDate: new Date().toISOString().split('T')[0],
      typeId: revenueTypes[0]?.id || '',
      customerId: '',
      orderId: '',
      payer: '',
      phone: '',
      address: '',
      reason: '',
      amount: '',
      paymentMethod: 'BANK_TRANSFER',
      invoiceNumber: '',
      notes: ''
    });
    setCustomerOrders([]);
    setAllocations([]);
  };

  // ================= THAO TÁC PHIẾU CHI =================
  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!paymentFormData.recipient || !paymentFormData.amount || !paymentFormData.reason) {
        alert('Vui lòng nhập đầy đủ Người nhận tiền, Lý do chi và Số tiền');
        return;
      }

      if (paymentFormData.id) {
        await api.put(`/payment-vouchers/${paymentFormData.id}`, paymentFormData);
      } else {
        await api.post('/payment-vouchers', paymentFormData);
      }

      setIsPaymentModalOpen(false);
      resetPaymentForm();
      loadData();
    } catch (err: any) {
      alert(err.message || 'Lỗi lưu phiếu chi');
    }
  };

  const handleApprovePayment = async (id: string, action: 'APPROVE' | 'PAID' | 'REJECT') => {
    const confirmMsg =
      action === 'PAID'
        ? 'Xác nhận ĐÃ CHI TIỀN? Hệ thống sẽ ghi nhận chi quỹ và KHÓA SỬA chứng từ tuyệt đối!'
        : action === 'APPROVE'
        ? 'Xác nhận DUYỆT CHI phiếu này?'
        : 'Từ chối chi phiếu này?';

    if (!window.confirm(confirmMsg)) return;

    try {
      await api.patch(`/payment-vouchers/${id}/approve`, { action });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Lỗi phê duyệt phiếu chi');
    }
  };

  const handleDeletePayment = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa phiếu chi này?')) return;
    try {
      await api.delete(`/payment-vouchers/${id}`);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Lỗi xóa phiếu chi');
    }
  };

  const resetPaymentForm = () => {
    setPaymentFormData({
      id: '',
      voucherDate: new Date().toISOString().split('T')[0],
      categoryId: categories[0]?.id || '',
      typeId: categories[0]?.types?.[0]?.id || '',
      recipient: '',
      phone: '',
      address: '',
      reason: '',
      amount: '',
      paymentMethod: 'CASH',
      invoiceNumber: '',
      notes: ''
    });
  };

  // ================= OVERRIDE ĐẶC QUYỀN TGĐ =================
  const handleSaveOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideVoucher) return;

    try {
      const endpoint =
        overrideVoucher.type === 'PAYMENT'
          ? `/payment-vouchers/${overrideVoucher.id}/override-edit`
          : `/receipt-vouchers/${overrideVoucher.id}/override-edit`;

      const payload =
        overrideVoucher.type === 'PAYMENT'
          ? {
              recipient: overrideVoucher.person,
              amount: overrideVoucher.amount,
              reason: overrideVoucher.reason
            }
          : {
              payer: overrideVoucher.person,
              amount: overrideVoucher.amount,
              reason: overrideVoucher.reason
            };

      await api.post(endpoint, payload);
      alert('Đã cập nhật chứng từ và ghi vết thành công vào Audit Log!');
      setIsOverrideModalOpen(false);
      setOverrideVoucher(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Lỗi mở khóa sửa chứng từ');
    }
  };

  // ================= HELPER RENDER STATUS BADGE =================
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="badge-green">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Đã thu / Đã chi (Đã khóa)
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Đã duyệt chi
          </span>
        );
      case 'PENDING':
        return (
          <span className="badge-yellow">
            <Clock className="w-3 h-3 mr-1" />
            Chờ phê duyệt
          </span>
        );
      case 'REJECTED':
        return (
          <span className="badge-red">
            <XCircle className="w-3 h-3 mr-1" />
            Từ chối
          </span>
        );
      default:
        return <span className="badge-yellow">{status}</span>;
    }
  };

  // Lọc danh sách theo tìm kiếm và trạng thái
  const filteredReceipts = receipts.filter((r) => {
    const matchSearch =
      r.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.payer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.reason.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const filteredPayments = payments.filter((p) => {
    const matchSearch =
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.reason.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // ================= XUẤT FILE EXCEL / CSV HỖ TRỢ TIẾNG VIỆT (UTF-8 BOM) =================
  const handleExportReceiptsExcel = () => {
    if (filteredReceipts.length === 0) {
      alert('Không có dữ liệu phiếu thu để xuất');
      return;
    }

    const headers = [
      'STT',
      'Số phiếu thu',
      'Ngày thu',
      'Người nộp tiền',
      'Số điện thoại',
      'Địa chỉ',
      'Đơn hàng liên kết',
      'Nội dung thu',
      'Số tiền (VNĐ)',
      'Phương thức thanh toán',
      'Số hóa đơn/chứng từ kèm theo',
      'Trạng thái',
      'Ghi chú'
    ];

    const getStatusText = (st: string) => {
      switch (st) {
        case 'PAID': return 'Đã thu (Khóa sửa)';
        case 'APPROVED': return 'Đã duyệt';
        case 'PENDING': return 'Chờ duyệt';
        case 'REJECTED': return 'Từ chối';
        default: return st;
      }
    };

    const rows = filteredReceipts.map((r, idx) => {
      let orderInfo = '';
      if (r.allocations && r.allocations.length > 0) {
        orderInfo = `Phân bổ ${r.allocations.length} đơn: ` + r.allocations.map((a) => a.order?.code).filter(Boolean).join('; ');
      } else if (r.order) {
        orderInfo = `${r.order.code} (Còn nợ: ${Number(r.order.remainingAmount).toLocaleString('vi-VN')}đ)`;
      }

      return [
        idx + 1,
        r.code,
        new Date(r.voucherDate).toLocaleDateString('vi-VN'),
        `"${(r.payer || '').replace(/"/g, '""')}"`,
        `"${r.phone || ''}"`,
        `"${(r.address || '').replace(/"/g, '""')}"`,
        `"${orderInfo.replace(/"/g, '""')}"`,
        `"${(r.reason || '').replace(/"/g, '""')}"`,
        r.amount,
        r.paymentMethod === 'BANK_TRANSFER' ? 'Chuyển khoản' : 'Tiền mặt',
        `"${r.invoiceNumber || ''}"`,
        getStatusText(r.status),
        `"${(r.notes || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Phieu_Thu_Nam_Khanh_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPaymentsExcel = () => {
    if (filteredPayments.length === 0) {
      alert('Không có dữ liệu phiếu chi để xuất');
      return;
    }

    const headers = [
      'STT',
      'Số phiếu chi',
      'Ngày chi',
      'Người nhận tiền',
      'Số điện thoại',
      'Địa chỉ',
      'Danh mục chi phí',
      'Loại chi phí',
      'Nội dung chi',
      'Số tiền (VNĐ)',
      'Phương thức thanh toán',
      'Số hóa đơn/chứng từ kèm theo',
      'Trạng thái',
      'Ghi chú'
    ];

    const getStatusText = (st: string) => {
      switch (st) {
        case 'PAID': return 'Đã chi (Khóa sửa)';
        case 'APPROVED': return 'Đã duyệt chi';
        case 'PENDING': return 'Chờ duyệt';
        case 'REJECTED': return 'Từ chối';
        default: return st;
      }
    };

    const rows = filteredPayments.map((p, idx) => [
      idx + 1,
      p.code,
      new Date(p.voucherDate).toLocaleDateString('vi-VN'),
      `"${(p.recipient || '').replace(/"/g, '""')}"`,
      `"${p.phone || ''}"`,
      `"${(p.address || '').replace(/"/g, '""')}"`,
      `"${(p.category?.name || '').replace(/"/g, '""')}"`,
      `"${(p.type?.name || '').replace(/"/g, '""')}"`,
      `"${(p.reason || '').replace(/"/g, '""')}"`,
      p.amount,
      p.paymentMethod === 'BANK_TRANSFER' ? 'Chuyển khoản' : 'Tiền mặt',
      `"${p.invoiceNumber || ''}"`,
      getStatusText(p.status),
      `"${(p.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Phieu_Chi_Nam_Khanh_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCashflowExcel = () => {
    if (!cashflow) {
      alert('Chưa có dữ liệu dòng tiền để xuất');
      return;
    }

    const periodLabel = reportPeriod === 'month' ? 'Tháng này' : reportPeriod === 'quarter' ? 'Quý này' : reportPeriod === 'year' ? 'Năm nay' : 'Toàn bộ thời gian';

    const lines: string[] = [
      '\uFEFFBÁO CÁO DÒNG TIỀN & THU CHI - CÔNG TY TNHH NK NAM KHÁNH',
      `Kỳ báo cáo: ${periodLabel}`,
      `Ngày xuất: ${new Date().toLocaleString('vi-VN')}`,
      '',
      '=== TỔNG HỢP CHỈ SỐ KPI DÒNG TIỀN ===',
      `Tổng đề nghị thu: ${Number(cashflow.kpis.totalReceipts).toLocaleString('vi-VN')} VNĐ`,
      `Tổng thực thu: ${Number(cashflow.kpis.paidReceipts).toLocaleString('vi-VN')} VNĐ`,
      `Tổng đề nghị chi: ${Number(cashflow.kpis.totalPayments).toLocaleString('vi-VN')} VNĐ`,
      `Tổng thực chi: ${Number(cashflow.kpis.paidPayments).toLocaleString('vi-VN')} VNĐ`,
      `Dòng tiền ròng (Thực thu - Thực chi): ${Number(cashflow.kpis.netCashflow).toLocaleString('vi-VN')} VNĐ`,
      '',
      '=== CƠ CẤU KHOẢN THU THEO NHÓM ===',
      'Mã nhóm,Tên nhóm khoản thu,Số tiền thu (VNĐ),Tỷ lệ (%)',
      ...cashflow.revenueBreakdown.map((r: any) => `"${r.code}","${r.name}",${r.amount},"${r.percentage}%"`),
      '',
      '=== CƠ CẤU KHOẢN CHI THEO DANH MỤC ===',
      'Mã DM,Tên danh mục chi phí,Số tiền chi (VNĐ),Tỷ lệ (%)',
      ...cashflow.expenseBreakdown.map((p: any) => `"${p.code}","${p.name}",${p.amount},"${p.percentage}%"`)
    ];

    const csvContent = lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Bao_Cao_Dong_Tien_${reportPeriod}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* TIÊU ĐỀ PHÂN HỆ & CÁC TAB ĐIỀU HƯỚNG */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#E53935]">
            <Receipt className="w-4 h-4" />
            <span>Phân Hệ E • Sprint 4</span>
          </div>
          <h1 className="text-xl font-black text-gray-900 mt-1">
            Quản Lý Thu - Chi & Tài Chính Doanh Nghiệp
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Theo dõi dòng tiền, gạch nợ đơn hàng tự động và kiểm soát tính bất biến chứng từ tài chính
          </p>
        </div>

        {/* Nút hành động nhanh */}
        <div className="flex items-center gap-2">
          {hasPermission('E_RECEIPT_VOUCHERS', 'create') && (
            <button
              onClick={() => {
                resetReceiptForm();
                setIsReceiptModalOpen(true);
              }}
              className="btn-primary text-xs px-3.5 py-2"
            >
              <ArrowDownLeft className="w-4 h-4" />
              Lập phiếu thu
            </button>
          )}

          {hasPermission('E_PAYMENT_VOUCHERS', 'create') && (
            <button
              onClick={() => {
                resetPaymentForm();
                setIsPaymentModalOpen(true);
              }}
              className="btn-secondary text-xs px-3.5 py-2 border-red-200 text-[#E53935] hover:bg-red-50"
            >
              <ArrowUpRight className="w-4 h-4" />
              Lập phiếu chi
            </button>
          )}
        </div>
      </div>

      {/* 5 TABS CHÍNH */}
      <div className="flex items-center gap-2 border-b border-gray-100 overflow-x-auto pb-1 text-sm font-semibold">
        <button
          onClick={() => {
            setActiveTab('receipts');
            setStatusFilter('ALL');
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all ${
            activeTab === 'receipts'
              ? 'bg-red-50 text-[#E53935] border-b-2 border-[#E53935]'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <ArrowDownLeft className="w-4 h-4 text-green-600" />
          Phiếu thu tiền ({receipts.length})
        </button>

        <button
          onClick={() => {
            setActiveTab('payments');
            setStatusFilter('ALL');
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all ${
            activeTab === 'payments'
              ? 'bg-red-50 text-[#E53935] border-b-2 border-[#E53935]'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <ArrowUpRight className="w-4 h-4 text-red-600" />
          Phiếu chi tiền ({payments.length})
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all ${
            activeTab === 'reports'
              ? 'bg-red-50 text-[#E53935] border-b-2 border-[#E53935]'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-blue-600" />
          Báo cáo dòng tiền
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all ${
            activeTab === 'categories'
              ? 'bg-red-50 text-[#E53935] border-b-2 border-[#E53935]'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <Layers className="w-4 h-4 text-purple-600" />
          Danh mục chi phí ({categories.length})
        </button>

        <button
          onClick={() => setActiveTab('revenue-types')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all ${
            activeTab === 'revenue-types'
              ? 'bg-red-50 text-[#E53935] border-b-2 border-[#E53935]'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <Tag className="w-4 h-4 text-amber-600" />
          Nhóm khoản thu ({revenueTypes.length})
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: DANH SÁCH PHIẾU THU TIỀN                          */}
      {/* ======================================================== */}
      {activeTab === 'receipts' && (
        <div className="space-y-4">
          {/* Thanh tìm kiếm và bộ lọc trạng thái */}
          <div className="card p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm theo số phiếu thu, người nộp, lý do thu..."
                className="input pl-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-semibold text-gray-500">Trạng thái:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input text-xs w-44 py-1.5"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="PAID">Đã thu (Khóa sửa)</option>
                <option value="APPROVED">Đã duyệt</option>
                <option value="PENDING">Chờ duyệt</option>
                <option value="REJECTED">Từ chối</option>
              </select>

              <button
                onClick={handleExportReceiptsExcel}
                className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3 whitespace-nowrap"
                title="Xuất danh sách phiếu thu sang file Excel/CSV"
              >
                <FileSpreadsheet className="w-4 h-4 text-green-600" />
                <span>Xuất Excel</span>
              </button>

              {/* Menu ẩn/hiện cột Phiếu thu */}
              <div className="relative">
                <button
                  onClick={() => setIsReceiptsColDropdownOpen(!isReceiptsColDropdownOpen)}
                  className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3 whitespace-nowrap cursor-pointer"
                  title="Tùy biến hiển thị các cột trên bảng phiếu thu"
                >
                  <Columns className="w-4 h-4 text-gray-500" />
                  <span>Tùy chỉnh cột</span>
                </button>

                {isReceiptsColDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 p-3 z-30 space-y-1.5 text-xs">
                    <div className="font-bold text-gray-800 pb-1.5 border-b border-gray-100 flex justify-between items-center">
                      <span>Cột hiển thị</span>
                      <button
                        onClick={resetReceiptsCols}
                        className="text-red-600 hover:text-red-700 flex items-center gap-1 font-medium cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Mặc định</span>
                      </button>
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-1">
                      {Object.keys(receiptsColLabels).map((key) => (
                        <label key={key} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                          <input
                            type="checkbox"
                            checked={receiptsVisibleCols[key] ?? true}
                            onChange={() => toggleReceiptsCol(key)}
                            disabled={key === 'code' || key === 'amount'}
                            className="rounded text-[#E53935]"
                          />
                          <span>{receiptsColLabels[key]}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bảng DataGrid Phiếu thu */}
          <div className="card overflow-hidden p-0 border border-gray-100 shadow-sm rounded-xl">
            <div className="overflow-x-auto">
              <table
                className="w-full text-left"
                style={{
                  width: `${getReceiptTableWidth(Object.keys(receiptsColLabels).filter((k) => receiptsVisibleCols[k]))}px`,
                  minWidth: '100%',
                  tableLayout: 'fixed',
                  borderCollapse: 'separate',
                  borderSpacing: 0
                }}
              >
                <thead className="bg-slate-50/90 border-b border-gray-200">
                  <tr className="whitespace-nowrap">
                    {receiptsVisibleCols.stt && (
                      <th className="table-th text-center select-none" style={{ width: `${receiptWidths.stt || defaultReceiptWidths.stt}px`, position: 'relative' }}>
                        <span>STT</span>
                        <div className="col-resizer" onMouseDown={(e) => startReceiptResize('stt', e)} onClick={(e) => e.stopPropagation()} title="Kéo để chỉnh độ rộng" />
                      </th>
                    )}
                    {receiptsVisibleCols.voucherDate && (
                      <th className="table-th select-none" style={{ width: `${receiptWidths.voucherDate || defaultReceiptWidths.voucherDate}px`, position: 'relative' }}>
                        <span>Ngày thu</span>
                        <div className="col-resizer" onMouseDown={(e) => startReceiptResize('voucherDate', e)} onClick={(e) => e.stopPropagation()} title="Kéo để chỉnh độ rộng" />
                      </th>
                    )}
                    {receiptsVisibleCols.code && (
                      <th className="table-th select-none" style={{ width: `${receiptWidths.code || defaultReceiptWidths.code}px`, position: 'relative' }}>
                        <span>Số phiếu</span>
                        <div className="col-resizer" onMouseDown={(e) => startReceiptResize('code', e)} onClick={(e) => e.stopPropagation()} title="Kéo để chỉnh độ rộng" />
                      </th>
                    )}
                    {receiptsVisibleCols.payer && (
                      <th className="table-th select-none" style={{ width: `${receiptWidths.payer || defaultReceiptWidths.payer}px`, position: 'relative' }}>
                        <span>Người nộp tiền</span>
                        <div className="col-resizer" onMouseDown={(e) => startReceiptResize('payer', e)} onClick={(e) => e.stopPropagation()} title="Kéo để chỉnh độ rộng" />
                      </th>
                    )}
                    {receiptsVisibleCols.order && (
                      <th className="table-th select-none" style={{ width: `${receiptWidths.order || defaultReceiptWidths.order}px`, position: 'relative' }}>
                        <span>Đơn hàng liên kết</span>
                        <div className="col-resizer" onMouseDown={(e) => startReceiptResize('order', e)} onClick={(e) => e.stopPropagation()} title="Kéo để chỉnh độ rộng" />
                      </th>
                    )}
                    {receiptsVisibleCols.reason && (
                      <th className="table-th select-none" style={{ width: `${receiptWidths.reason || defaultReceiptWidths.reason}px`, position: 'relative' }}>
                        <span>Nội dung thu</span>
                        <div className="col-resizer" onMouseDown={(e) => startReceiptResize('reason', e)} onClick={(e) => e.stopPropagation()} title="Kéo để chỉnh độ rộng" />
                      </th>
                    )}
                    {receiptsVisibleCols.amount && (
                      <th className="table-th text-right select-none" style={{ width: `${receiptWidths.amount || defaultReceiptWidths.amount}px`, position: 'relative' }}>
                        <span>Số tiền (VNĐ)</span>
                        <div className="col-resizer" onMouseDown={(e) => startReceiptResize('amount', e)} onClick={(e) => e.stopPropagation()} title="Kéo để chỉnh độ rộng" />
                      </th>
                    )}
                    {receiptsVisibleCols.status && (
                      <th className="table-th select-none" style={{ width: `${receiptWidths.status || defaultReceiptWidths.status}px`, position: 'relative' }}>
                        <span>Trạng thái</span>
                        <div className="col-resizer" onMouseDown={(e) => startReceiptResize('status', e)} onClick={(e) => e.stopPropagation()} title="Kéo để chỉnh độ rộng" />
                      </th>
                    )}
                    {receiptsVisibleCols.actions && (
                      <th className="table-th text-center sticky-action-th" style={{ width: `${receiptWidths.actions || defaultReceiptWidths.actions}px` }}>
                        <span>Thao tác</span>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredReceipts.length === 0 ? (
                    <tr>
                      <td colSpan={Object.values(receiptsVisibleCols).filter(Boolean).length || 9} className="p-8 text-center text-sm text-gray-400">
                        Chưa có phiếu thu nào phù hợp điều kiện lọc.
                      </td>
                    </tr>
                  ) : (
                    filteredReceipts.map((r, idx) => (
                      <tr key={r.id} className="hover:bg-gray-50/80 transition-colors">
                        {receiptsVisibleCols.stt && (
                          <td className="table-td text-center text-xs text-gray-500 font-mono overflow-hidden">
                            {idx + 1}
                          </td>
                        )}
                        {receiptsVisibleCols.voucherDate && (
                          <td className="table-td text-xs font-mono text-gray-600 whitespace-nowrap overflow-hidden">
                            {new Date(r.voucherDate).toLocaleDateString('vi-VN')}
                          </td>
                        )}
                        {receiptsVisibleCols.code && (
                          <td className="table-td whitespace-nowrap overflow-hidden">
                            <span className="font-bold text-xs text-[#E53935] font-mono">
                              {r.code}
                            </span>
                          </td>
                        )}
                        {receiptsVisibleCols.payer && (
                          <td className="table-td overflow-hidden" style={{ maxWidth: `${receiptWidths.payer || defaultReceiptWidths.payer}px` }}>
                            <div className="flex flex-col min-w-0" title={`${r.payer}${r.phone ? ` (${r.phone})` : ''}`}>
                              <span className="font-semibold text-xs text-gray-900 truncate">{r.payer}</span>
                              {r.phone && (
                                <span className="text-[11px] text-gray-400 font-mono flex items-center gap-1 truncate mt-0.5">
                                  <Phone className="w-3 h-3 shrink-0 text-gray-400" />
                                  {r.phone}
                                </span>
                              )}
                            </div>
                          </td>
                        )}
                        {receiptsVisibleCols.order && (
                          <td className="table-td whitespace-nowrap overflow-hidden">
                            {r.allocations && r.allocations.length > 0 ? (
                              <span className="inline-flex items-center text-[11px] font-bold font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 truncate max-w-full" title={r.allocations.map((a) => a.order?.code).filter(Boolean).join(', ')}>
                                Phân bổ {r.allocations.length} đơn
                              </span>
                            ) : r.order ? (
                              <div className="flex items-center gap-1.5 min-w-0" title={`Còn nợ: ${Number(r.order.remainingAmount).toLocaleString('vi-VN')}đ`}>
                                <span className="inline-flex items-center text-[11px] font-bold font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                  {r.order.code}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400 italic">Không gắn đơn</span>
                            )}
                          </td>
                        )}
                        {receiptsVisibleCols.reason && (
                          <td className="table-td text-xs text-gray-700 overflow-hidden">
                            <div className="truncate max-w-full" title={r.reason}>
                              {r.reason}
                            </div>
                          </td>
                        )}
                        {receiptsVisibleCols.amount && (
                          <td className="table-td text-right font-bold text-xs text-emerald-600 whitespace-nowrap tabular-nums overflow-hidden">
                            +{Number(r.amount).toLocaleString('vi-VN')}đ
                          </td>
                        )}
                        {receiptsVisibleCols.status && (
                          <td className="table-td whitespace-nowrap overflow-hidden">
                            {renderStatusBadge(r.status)}
                          </td>
                        )}
                        {receiptsVisibleCols.actions && (
                          <td className="table-td text-center sticky-action-td whitespace-nowrap overflow-hidden">
                            <div className="flex items-center justify-center gap-1">
                              {/* Nút In phiếu A4/A5 */}
                              <button
                                onClick={() => setPrintModalData({ voucher: r, type: 'RECEIPT' })}
                                className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded"
                                title="In phiếu thu A4 / A5"
                              >
                                <Printer className="w-4 h-4" />
                              </button>

                              {/* Duyệt chuyển sang ĐÃ THU (PAID) - Kế toán / Quản lý */}
                              {r.status !== 'PAID' && (
                                <button
                                  onClick={() => handleApproveReceipt(r.id, 'PAID')}
                                  className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                                  title="Xác nhận Đã thu (Tự động gạch nợ đơn hàng)"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                              )}

                              {/* Từ chối */}
                              {r.status === 'PENDING' && (
                                <button
                                  onClick={() => handleApproveReceipt(r.id, 'REJECT')}
                                  className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                                  title="Từ chối thu"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              )}

                              {/* Đặc quyền TGĐ mở khóa sửa khi ĐÃ THU */}
                              {r.status === 'PAID' && isCeoOrAdmin && (
                                <button
                                  onClick={() => {
                                    setOverrideVoucher({
                                      id: r.id,
                                      type: 'RECEIPT',
                                      amount: String(r.amount),
                                      reason: r.reason,
                                      person: r.payer
                                    });
                                    setIsOverrideModalOpen(true);
                                  }}
                                  className="p-1.5 text-amber-600 hover:bg-amber-50 rounded"
                                  title="Đặc quyền TGĐ: Mở khóa sửa kèm Audit Log"
                                >
                                  <Unlock className="w-4 h-4" />
                                </button>
                              )}

                              {/* Xóa nếu chưa PAID */}
                              {r.status !== 'PAID' && hasPermission('E_RECEIPT_VOUCHERS', 'delete') && (
                                <button
                                  onClick={() => handleDeleteReceipt(r.id)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                                  title="Xóa phiếu thu"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: DANH SÁCH PHIẾU CHI TIỀN                          */}
      {/* ======================================================== */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          {/* Thanh tìm kiếm và bộ lọc trạng thái */}
          <div className="card p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm theo số phiếu chi, người nhận tiền, nội dung chi..."
                className="input pl-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-semibold text-gray-500">Trạng thái:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input text-xs w-44 py-1.5"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="PAID">Đã chi (Khóa sửa)</option>
                <option value="APPROVED">Đã duyệt chi</option>
                <option value="PENDING">Chờ duyệt</option>
                <option value="REJECTED">Từ chối</option>
              </select>

              <button
                onClick={handleExportPaymentsExcel}
                className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3 whitespace-nowrap"
                title="Xuất danh sách phiếu chi sang file Excel/CSV"
              >
                <FileSpreadsheet className="w-4 h-4 text-green-600" />
                <span>Xuất Excel</span>
              </button>

              {/* Menu ẩn/hiện cột Phiếu chi */}
              <div className="relative">
                <button
                  onClick={() => setIsPaymentsColDropdownOpen(!isPaymentsColDropdownOpen)}
                  className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3 whitespace-nowrap cursor-pointer"
                  title="Tùy biến hiển thị các cột trên bảng phiếu chi"
                >
                  <Columns className="w-4 h-4 text-gray-500" />
                  <span>Tùy chỉnh cột</span>
                </button>

                {isPaymentsColDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 p-3 z-30 space-y-1.5 text-xs">
                    <div className="font-bold text-gray-800 pb-1.5 border-b border-gray-100 flex justify-between items-center">
                      <span>Cột hiển thị</span>
                      <button
                        onClick={resetPaymentsCols}
                        className="text-red-600 hover:text-red-700 flex items-center gap-1 font-medium cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Mặc định</span>
                      </button>
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-1">
                      {Object.keys(paymentsColLabels).map((key) => (
                        <label key={key} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                          <input
                            type="checkbox"
                            checked={paymentsVisibleCols[key] ?? true}
                            onChange={() => togglePaymentsCol(key)}
                            disabled={key === 'code' || key === 'amount'}
                            className="rounded text-[#E53935]"
                          />
                          <span>{paymentsColLabels[key]}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bảng DataGrid Phiếu chi */}
          <div className="card overflow-hidden p-0 border border-gray-100 shadow-sm rounded-xl">
            <div className="overflow-x-auto">
              <table
                className="w-full text-left"
                style={{
                  width: `${getPaymentTableWidth(Object.keys(paymentsColLabels).filter((k) => paymentsVisibleCols[k]))}px`,
                  minWidth: '100%',
                  tableLayout: 'fixed',
                  borderCollapse: 'separate',
                  borderSpacing: 0
                }}
              >
                <thead className="bg-slate-50/90 border-b border-gray-200">
                  <tr className="whitespace-nowrap">
                    {paymentsVisibleCols.stt && (
                      <th className="table-th text-center select-none" style={{ width: `${paymentWidths.stt || defaultPaymentWidths.stt}px`, position: 'relative' }}>
                        <span>STT</span>
                        <div className="col-resizer" onMouseDown={(e) => startPaymentResize('stt', e)} onClick={(e) => e.stopPropagation()} title="Kéo để chỉnh độ rộng" />
                      </th>
                    )}
                    {paymentsVisibleCols.voucherDate && (
                      <th className="table-th select-none" style={{ width: `${paymentWidths.voucherDate || defaultPaymentWidths.voucherDate}px`, position: 'relative' }}>
                        <span>Ngày chi</span>
                        <div className="col-resizer" onMouseDown={(e) => startPaymentResize('voucherDate', e)} onClick={(e) => e.stopPropagation()} title="Kéo để chỉnh độ rộng" />
                      </th>
                    )}
                    {paymentsVisibleCols.code && (
                      <th className="table-th select-none" style={{ width: `${paymentWidths.code || defaultPaymentWidths.code}px`, position: 'relative' }}>
                        <span>Số phiếu</span>
                        <div className="col-resizer" onMouseDown={(e) => startPaymentResize('code', e)} onClick={(e) => e.stopPropagation()} title="Kéo để chỉnh độ rộng" />
                      </th>
                    )}
                    {paymentsVisibleCols.recipient && (
                      <th className="table-th select-none" style={{ width: `${paymentWidths.recipient || defaultPaymentWidths.recipient}px`, position: 'relative' }}>
                        <span>Người nhận tiền</span>
                        <div className="col-resizer" onMouseDown={(e) => startPaymentResize('recipient', e)} onClick={(e) => e.stopPropagation()} title="Kéo để chỉnh độ rộng" />
                      </th>
                    )}
                    {paymentsVisibleCols.type && (
                      <th className="table-th select-none" style={{ width: `${paymentWidths.type || defaultPaymentWidths.type}px`, position: 'relative' }}>
                        <span>Loại chi phí</span>
                        <div className="col-resizer" onMouseDown={(e) => startPaymentResize('type', e)} onClick={(e) => e.stopPropagation()} title="Kéo để chỉnh độ rộng" />
                      </th>
                    )}
                    {paymentsVisibleCols.reason && (
                      <th className="table-th select-none" style={{ width: `${paymentWidths.reason || defaultPaymentWidths.reason}px`, position: 'relative' }}>
                        <span>Nội dung chi</span>
                        <div className="col-resizer" onMouseDown={(e) => startPaymentResize('reason', e)} onClick={(e) => e.stopPropagation()} title="Kéo để chỉnh độ rộng" />
                      </th>
                    )}
                    {paymentsVisibleCols.amount && (
                      <th className="table-th text-right select-none" style={{ width: `${paymentWidths.amount || defaultPaymentWidths.amount}px`, position: 'relative' }}>
                        <span>Số tiền chi (VNĐ)</span>
                        <div className="col-resizer" onMouseDown={(e) => startPaymentResize('amount', e)} onClick={(e) => e.stopPropagation()} title="Kéo để chỉnh độ rộng" />
                      </th>
                    )}
                    {paymentsVisibleCols.status && (
                      <th className="table-th select-none" style={{ width: `${paymentWidths.status || defaultPaymentWidths.status}px`, position: 'relative' }}>
                        <span>Trạng thái</span>
                        <div className="col-resizer" onMouseDown={(e) => startPaymentResize('status', e)} onClick={(e) => e.stopPropagation()} title="Kéo để chỉnh độ rộng" />
                      </th>
                    )}
                    {paymentsVisibleCols.actions && (
                      <th className="table-th text-center sticky-action-th" style={{ width: `${paymentWidths.actions || defaultPaymentWidths.actions}px` }}>
                        <span>Thao tác</span>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan={Object.values(paymentsVisibleCols).filter(Boolean).length || 9} className="p-8 text-center text-sm text-gray-400">
                        Chưa có phiếu chi nào phù hợp điều kiện lọc.
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map((p, idx) => (
                      <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                        {paymentsVisibleCols.stt && (
                          <td className="table-td text-center text-xs text-gray-500 font-mono overflow-hidden">
                            {idx + 1}
                          </td>
                        )}
                        {paymentsVisibleCols.voucherDate && (
                          <td className="table-td text-xs font-mono text-gray-600 whitespace-nowrap overflow-hidden">
                            {new Date(p.voucherDate).toLocaleDateString('vi-VN')}
                          </td>
                        )}
                        {paymentsVisibleCols.code && (
                          <td className="table-td whitespace-nowrap overflow-hidden">
                            <span className="font-bold text-xs text-blue-600 font-mono">
                              {p.code}
                            </span>
                          </td>
                        )}
                        {paymentsVisibleCols.recipient && (
                          <td className="table-td overflow-hidden" style={{ maxWidth: `${paymentWidths.recipient || defaultPaymentWidths.recipient}px` }}>
                            <div className="flex flex-col min-w-0" title={`${p.recipient}${p.phone ? ` (${p.phone})` : ''}`}>
                              <span className="font-semibold text-xs text-gray-900 truncate">{p.recipient}</span>
                              {p.phone && (
                                <span className="text-[11px] text-gray-400 font-mono flex items-center gap-1 truncate mt-0.5">
                                  <Phone className="w-3 h-3 shrink-0 text-gray-400" />
                                  {p.phone}
                                </span>
                              )}
                            </div>
                          </td>
                        )}
                        {paymentsVisibleCols.type && (
                          <td className="table-td whitespace-nowrap overflow-hidden">
                            <span className="inline-flex items-center text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 truncate max-w-[150px]" title={p.type?.name || p.category?.name || 'Chi phí chung'}>
                              {p.type?.name || p.category?.name || 'Chi phí chung'}
                            </span>
                          </td>
                        )}
                        {paymentsVisibleCols.reason && (
                          <td className="table-td text-xs text-gray-700 overflow-hidden">
                            <div className="truncate max-w-full" title={p.reason}>
                              {p.reason}
                            </div>
                          </td>
                        )}
                        {paymentsVisibleCols.amount && (
                          <td className="table-td text-right font-bold text-xs text-[#E53935] whitespace-nowrap tabular-nums overflow-hidden">
                            -{Number(p.amount).toLocaleString('vi-VN')}đ
                          </td>
                        )}
                        {paymentsVisibleCols.status && (
                          <td className="table-td whitespace-nowrap overflow-hidden">
                            {renderStatusBadge(p.status)}
                          </td>
                        )}
                        {paymentsVisibleCols.actions && (
                          <td className="table-td text-center sticky-action-td whitespace-nowrap overflow-hidden">
                            <div className="flex items-center justify-center gap-1">
                              {/* In phiếu chi */}
                              <button
                                onClick={() => setPrintModalData({ voucher: p, type: 'PAYMENT' })}
                                className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded"
                                title="In phiếu chi A4 / A5"
                              >
                                <Printer className="w-4 h-4" />
                              </button>

                              {/* Duyệt chi */}
                              {p.status === 'PENDING' && (
                                <button
                                  onClick={() => handleApprovePayment(p.id, 'APPROVE')}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                                  title="Duyệt chi"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                              )}

                              {/* Xác nhận ĐÃ CHI (PAID) */}
                              {p.status === 'APPROVED' && (
                                <button
                                  onClick={() => handleApprovePayment(p.id, 'PAID')}
                                  className="p-1.5 text-green-600 hover:bg-green-50 rounded font-semibold text-xs"
                                  title="Xác nhận Đã xuất quỹ chi tiền"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                              )}

                              {/* Từ chối chi */}
                              {p.status === 'PENDING' && (
                                <button
                                  onClick={() => handleApprovePayment(p.id, 'REJECT')}
                                  className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                                  title="Từ chối duyệt chi"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              )}

                              {/* Đặc quyền TGĐ mở khóa sửa */}
                              {p.status === 'PAID' && isCeoOrAdmin && (
                                <button
                                  onClick={() => {
                                    setOverrideVoucher({
                                      id: p.id,
                                      type: 'PAYMENT',
                                      amount: String(p.amount),
                                      reason: p.reason,
                                      person: p.recipient
                                    });
                                    setIsOverrideModalOpen(true);
                                  }}
                                  className="p-1.5 text-amber-600 hover:bg-amber-50 rounded"
                                  title="Đặc quyền TGĐ: Mở khóa sửa kèm Audit Log"
                                >
                                  <Unlock className="w-4 h-4" />
                                </button>
                              )}

                              {/* Xóa nếu chưa PAID */}
                              {p.status !== 'PAID' && hasPermission('E_PAYMENT_VOUCHERS', 'delete') && (
                                <button
                                  onClick={() => handleDeletePayment(p.id)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                                  title="Xóa phiếu chi"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: BÁO CÁO DÒNG TIỀN (CASHFLOW REPORT)                */}
      {/* ======================================================== */}
      {activeTab === 'reports' && cashflow && (
        <div className="space-y-6">
          {/* Bộ chọn kỳ báo cáo */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="text-xs font-semibold text-gray-700">
              Chọn kỳ báo cáo thống kê dòng tiền:
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg text-xs font-semibold">
                {(['month', 'quarter', 'year', 'all'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setReportPeriod(p)}
                    className={`px-3 py-1.5 rounded-md transition-all ${
                      reportPeriod === p
                        ? 'bg-white text-[#E53935] shadow-sm font-bold'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    {p === 'month' ? 'Tháng này' : p === 'quarter' ? 'Quý này' : p === 'year' ? 'Năm nay' : 'Toàn bộ'}
                  </button>
                ))}
              </div>

              <button
                onClick={handleExportCashflowExcel}
                className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3 whitespace-nowrap"
                title="Xuất báo cáo dòng tiền và cơ cấu thu chi sang file Excel/CSV"
              >
                <FileSpreadsheet className="w-4 h-4 text-green-600" />
                <span>Xuất Excel Báo Cáo</span>
              </button>
            </div>
          </div>

          {/* 4 Thẻ KPI dòng tiền */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card border-l-4 border-l-green-500">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-gray-500">Tổng Thực Thu</span>
                <ArrowDownLeft className="w-5 h-5 text-green-500" />
              </div>
              <div className="text-2xl font-black text-green-600 mt-2">
                {Number(cashflow.kpis.paidReceipts).toLocaleString('vi-VN')}đ
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Tổng đề nghị thu: {Number(cashflow.kpis.totalReceipts).toLocaleString('vi-VN')}đ
              </div>
            </div>

            <div className="card border-l-4 border-l-red-500">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-gray-500">Tổng Thực Chi</span>
                <ArrowUpRight className="w-5 h-5 text-[#E53935]" />
              </div>
              <div className="text-2xl font-black text-[#E53935] mt-2">
                {Number(cashflow.kpis.paidPayments).toLocaleString('vi-VN')}đ
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Tổng đề nghị chi: {Number(cashflow.kpis.totalPayments).toLocaleString('vi-VN')}đ
              </div>
            </div>

            <div className={`card border-l-4 ${cashflow.kpis.netCashflow >= 0 ? 'border-l-blue-500' : 'border-l-amber-500'}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-gray-500">Dòng Tiền Ròng (Net)</span>
                <TrendingUp className="w-5 h-5 text-blue-500" />
              </div>
              <div className={`text-2xl font-black mt-2 ${cashflow.kpis.netCashflow >= 0 ? 'text-blue-600' : 'text-amber-600'}`}>
                {Number(cashflow.kpis.netCashflow).toLocaleString('vi-VN')}đ
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Chênh lệch Thực thu – Thực chi
              </div>
            </div>

            <div className="card border-l-4 border-l-purple-500">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-gray-500">Số Lượng Chứng Từ</span>
                <Receipt className="w-5 h-5 text-purple-500" />
              </div>
              <div className="text-2xl font-black text-purple-700 mt-2">
                {cashflow.kpis.receiptCount + cashflow.kpis.paymentCount}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {cashflow.kpis.receiptCount} phiếu thu | {cashflow.kpis.paymentCount} phiếu chi
              </div>
            </div>
          </div>

          {/* 2 Biểu đồ cơ cấu Thu & Chi */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cơ cấu Thu */}
            <div className="card space-y-4">
              <h3 className="text-sm font-bold text-gray-900 uppercase flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                Cơ Cấu Nguồn Thu Theo Nhóm
              </h3>
              <div className="space-y-3">
                {cashflow.revenueBreakdown.length === 0 ? (
                  <div className="text-xs text-gray-400 italic py-4 text-center">Chưa có phát sinh thu tiền trong kỳ</div>
                ) : (
                  cashflow.revenueBreakdown.map((item) => (
                    <div key={item.id} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-gray-700">{item.name}</span>
                        <span className="text-green-600 font-bold">
                          {Number(item.amount).toLocaleString('vi-VN')}đ ({item.percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-green-500 h-full rounded-full"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Cơ cấu Chi */}
            <div className="card space-y-4">
              <h3 className="text-sm font-bold text-gray-900 uppercase flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E53935]" />
                Cơ Cấu Chi Phí Theo Danh Mục
              </h3>
              <div className="space-y-3">
                {cashflow.expenseBreakdown.length === 0 ? (
                  <div className="text-xs text-gray-400 italic py-4 text-center">Chưa có phát sinh chi tiền trong kỳ</div>
                ) : (
                  cashflow.expenseBreakdown.map((item) => (
                    <div key={item.id} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-gray-700">{item.name}</span>
                        <span className="text-[#E53935] font-bold">
                          {Number(item.amount).toLocaleString('vi-VN')}đ ({item.percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-[#E53935] h-full rounded-full"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: DANH MỤC & LOẠI CHI PHÍ (2 CẤP)                   */}
      {/* ======================================================== */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-500">
              Cấu trúc phân loại chi phí 2 tầng phục vụ tổng hợp báo cáo tài chính
            </div>
            {hasPermission('E_EXPENSES', 'create') && (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setCategoryFormData({ id: '', code: '', name: '', description: '' });
                    setIsCategoryModalOpen(true);
                  }}
                  className="btn-primary text-xs px-3 py-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Thêm danh mục (Cấp 1)
                </button>
                <button
                  onClick={() => {
                    setTypeFormData({ id: '', code: '', name: '', categoryId: categories[0]?.id || '', description: '' });
                    setIsTypeModalOpen(true);
                  }}
                  className="btn-secondary text-xs px-3 py-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Thêm loại chi phí (Cấp 2)
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map((cat) => (
              <div key={cat.id} className="card space-y-3">
                <div className="flex justify-between items-start border-b border-gray-100 pb-2">
                  <div>
                    <div className="text-xs font-mono font-bold text-[#E53935]">{cat.code}</div>
                    <div className="font-bold text-sm text-gray-900">{cat.name}</div>
                    {cat.description && <div className="text-xs text-gray-500 mt-0.5">{cat.description}</div>}
                  </div>
                  <span className="badge badge-green text-[10px]">
                    {cat.types?.length || 0} loại con
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="text-xs font-bold text-gray-400 uppercase">Loại chi phí con:</div>
                  {cat.types && cat.types.length > 0 ? (
                    cat.types.map((t) => (
                      <div
                        key={t.id}
                        className="flex justify-between items-center p-2 rounded bg-gray-50 text-xs hover:bg-gray-100 transition-colors"
                      >
                        <div>
                          <span className="font-mono font-bold text-gray-500 mr-2">{t.code}</span>
                          <span className="font-semibold text-gray-800">{t.name}</span>
                        </div>
                        <span className="text-[11px] text-gray-400">
                          {t._count?.vouchers || 0} phiếu chi
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-gray-400 italic">Chưa có loại con</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: NHÓM LOẠI KHOẢN THU                               */}
      {/* ======================================================== */}
      {activeTab === 'revenue-types' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-500">
              Danh mục các nguồn thu phục vụ phân loại hạch toán dòng tiền
            </div>
            {hasPermission('E_REVENUE_TYPES', 'create') && (
              <button
                onClick={() => {
                  setRevenueTypeFormData({ id: '', code: '', name: '', description: '' });
                  setIsRevenueTypeModalOpen(true);
                }}
                className="btn-primary text-xs px-3 py-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm nhóm thu
              </button>
            )}
          </div>

          <div className="card overflow-hidden p-0 border border-gray-100 shadow-sm rounded-xl">
            <table className="w-full text-left" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead className="bg-slate-50/90 border-b border-gray-200">
                <tr>
                  <th className="table-th text-center w-16">STT</th>
                  <th className="table-th w-36">Mã khoản thu</th>
                  <th className="table-th w-60">Tên nguồn thu</th>
                  <th className="table-th">Mô tả chi tiết</th>
                  <th className="table-th text-center w-48">Số phiếu thu phát sinh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {revenueTypes.map((rt, idx) => (
                  <tr key={rt.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="table-td text-center text-xs text-gray-500 font-mono overflow-hidden">{idx + 1}</td>
                    <td className="table-td font-mono font-bold text-xs text-green-700 overflow-hidden">{rt.code}</td>
                    <td className="table-td font-semibold text-xs text-gray-900 overflow-hidden">{rt.name}</td>
                    <td className="table-td text-xs text-gray-600 overflow-hidden">{rt.description || 'Chưa có mô tả'}</td>
                    <td className="table-td text-center font-bold text-xs text-gray-700 overflow-hidden">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-700">
                        {rt._count?.vouchers || 0} phiếu
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL LẬP PHIẾU THU TIỀN                                 */}
      {/* ======================================================== */}
      {isReceiptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-100">
              <div className="flex items-center gap-2 font-bold text-gray-800 text-sm">
                <ArrowDownLeft className="w-5 h-5 text-green-600" />
                <span>Lập Phiếu Thu Tiền Mới</span>
              </div>
              <button
                onClick={() => setIsReceiptModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReceipt} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Ngày thu tiền:</label>
                  <input
                    type="date"
                    value={receiptFormData.voucherDate}
                    onChange={(e) => setReceiptFormData({ ...receiptFormData, voucherDate: e.target.value })}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Nhóm khoản thu:</label>
                  <select
                    value={receiptFormData.typeId}
                    onChange={(e) => setReceiptFormData({ ...receiptFormData, typeId: e.target.value })}
                    className="input"
                    required
                  >
                    <option value="">-- Chọn nhóm thu --</option>
                    {revenueTypes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.code} - {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Chọn khách hàng & Gạch nợ đơn hàng (Đơn lẻ hoặc Đa đơn hàng) */}
              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-gray-800 text-xs flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4 text-blue-600" />
                    <span>Liên kết Khách Hàng & Gạch Nợ Đơn Hàng:</span>
                  </div>
                  {allocations.length > 1 && (
                    <button
                      type="button"
                      onClick={handleAutoAllocateFIFO}
                      className="text-xs bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 font-bold px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      title="Tự động phân bổ số tiền thu vào các đơn nợ cũ nhất trước"
                    >
                      <span>⚡ Phân bổ tự động FIFO</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-600 mb-1 font-semibold">Khách hàng đối tác:</label>
                    <select
                      value={receiptFormData.customerId}
                      onChange={(e) => handleCustomerChangeForReceipt(e.target.value)}
                      className="input"
                    >
                      <option value="">-- Thu khách lẻ / không gắn mã KH --</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.code} - {c.name} {Number(c.creditBalance || 0) > 0 ? `(Ví: ${Number(c.creditBalance).toLocaleString('vi-VN')}đ)` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-600 mb-1 font-semibold">Đơn hàng cụ thể (hoặc phân bổ đa đơn bên dưới):</label>
                    <select
                      value={receiptFormData.orderId}
                      onChange={(e) => {
                        const orderId = e.target.value;
                        setReceiptFormData({ ...receiptFormData, orderId });
                        const o = customerOrders.find((ord) => ord.id === orderId);
                        if (o) {
                          setReceiptFormData((prev) => ({
                            ...prev,
                            orderId,
                            amount: String(o.remainingAmount || o.totalAmount),
                            reason: `Thanh toán công nợ đơn hàng ${o.code}`
                          }));
                          // Đồng thời tự động điền vào bảng allocations
                          setAllocations((prev) =>
                            prev.map((a) =>
                              a.orderId === orderId
                                ? { ...a, allocatedAmount: Number(o.remainingAmount || o.totalAmount) }
                                : { ...a, allocatedAmount: 0 }
                            )
                          );
                        }
                      }}
                      className="input"
                      disabled={!receiptFormData.customerId}
                    >
                      <option value="">-- Tự chọn / Phân bổ đa đơn hàng bên dưới --</option>
                      {customerOrders.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.code} (Còn nợ: {Number(o.remainingAmount).toLocaleString('vi-VN')}đ)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* BẢNG PHÂN BỔ ĐA ĐƠN HÀNG NẾU KHÁCH CÓ ĐƠN NỢ */}
                {receiptFormData.customerId && allocations.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-gray-200">
                    <div className="flex items-center justify-between text-[11px] text-gray-600 font-semibold">
                      <span>Bảng phân bổ gạch nợ ({allocations.length} đơn hàng còn nợ):</span>
                      <span className="text-gray-500">Nhập số tiền muốn gạch cho từng đơn hoặc bấm FIFO</span>
                    </div>

                    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white max-h-48 overflow-y-auto">
                      <table className="w-full text-[11px] text-left">
                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase text-[10px]">
                          <tr>
                            <th className="p-2">Mã đơn</th>
                            <th className="p-2">Ngày đặt</th>
                            <th className="p-2 text-right">Tổng tiền</th>
                            <th className="p-2 text-right">Còn nợ</th>
                            <th className="p-2 text-right w-36">Tiền gạch nợ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {allocations.map((a, aIdx) => (
                            <tr key={a.orderId} className={a.allocatedAmount > 0 ? 'bg-purple-50/40' : ''}>
                              <td className="p-2 font-mono font-bold text-gray-900">{a.orderCode}</td>
                              <td className="p-2 text-gray-500">
                                {new Date(a.orderDate).toLocaleDateString('vi-VN')}
                              </td>
                              <td className="p-2 text-right text-gray-700">
                                {Number(a.totalAmount).toLocaleString('vi-VN')}đ
                              </td>
                              <td className="p-2 text-right font-semibold text-[#E53935]">
                                {Number(a.remainingAmount).toLocaleString('vi-VN')}đ
                              </td>
                              <td className="p-2 text-right">
                                <div className="flex items-center gap-1 justify-end">
                                  <input
                                    type="number"
                                    min="0"
                                    max={a.remainingAmount}
                                    step="1000"
                                    value={a.allocatedAmount || ''}
                                    onChange={(e) => {
                                      const val = Math.max(0, parseInt(e.target.value) || 0);
                                      const updated = [...allocations];
                                      updated[aIdx].allocatedAmount = val;
                                      setAllocations(updated);
                                    }}
                                    placeholder="0"
                                    className="w-24 p-1 text-right font-bold text-purple-700 border border-purple-200 rounded focus:outline-none focus:border-purple-500"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = [...allocations];
                                      updated[aIdx].allocatedAmount = a.remainingAmount;
                                      setAllocations(updated);
                                    }}
                                    className="text-[10px] text-gray-500 hover:text-purple-600 underline cursor-pointer"
                                    title="Gạch hết nợ đơn này"
                                  >
                                    Hết
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Thanh tổng kết phân bổ */}
                    {(() => {
                      const totalAlloc = allocations.reduce((sum, a) => sum + (Number(a.allocatedAmount) || 0), 0);
                      const voucherAmt = Number(receiptFormData.amount) || 0;
                      const isOver = totalAlloc > voucherAmt;
                      return (
                        <div className={`p-2 rounded-lg text-xs flex justify-between items-center ${
                          isOver ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-purple-50/70 text-purple-900 border border-purple-100'
                        }`}>
                          <div className="font-semibold">
                            Đã phân bổ: <span className="font-black">{totalAlloc.toLocaleString('vi-VN')}đ</span> / Phiếu thu: <span className="font-black">{voucherAmt.toLocaleString('vi-VN')}đ</span>
                          </div>
                          {isOver ? (
                            <span className="font-bold text-red-600">Vượt quá số tiền phiếu thu!</span>
                          ) : voucherAmt > totalAlloc ? (
                            <span className="text-[11px] text-purple-700">
                              Dư: {(voucherAmt - totalAlloc).toLocaleString('vi-VN')}đ (cộng vào ký quỹ KH)
                            </span>
                          ) : (
                            <span className="text-[11px] text-green-700 font-bold">Phân bổ đủ 100%</span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block font-semibold text-gray-700 mb-1">Người nộp tiền *:</label>
                  <input
                    type="text"
                    value={receiptFormData.payer}
                    onChange={(e) => setReceiptFormData({ ...receiptFormData, payer: e.target.value })}
                    className="input"
                    placeholder="Họ tên người nộp"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Số điện thoại:</label>
                  <input
                    type="text"
                    value={receiptFormData.phone}
                    onChange={(e) => setReceiptFormData({ ...receiptFormData, phone: e.target.value })}
                    className="input"
                    placeholder="09xx..."
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Hình thức:</label>
                  <select
                    value={receiptFormData.paymentMethod}
                    onChange={(e) => setReceiptFormData({ ...receiptFormData, paymentMethod: e.target.value })}
                    className="input"
                  >
                    <option value="BANK_TRANSFER">Chuyển khoản</option>
                    <option value="CASH">Tiền mặt tại quỹ</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Địa chỉ người nộp:</label>
                <input
                  type="text"
                  value={receiptFormData.address}
                  onChange={(e) => setReceiptFormData({ ...receiptFormData, address: e.target.value })}
                  className="input"
                  placeholder="Địa chỉ..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Số tiền thu (VNĐ) *:</label>
                  <input
                    type="number"
                    value={receiptFormData.amount}
                    onChange={(e) => setReceiptFormData({ ...receiptFormData, amount: e.target.value })}
                    className="input font-bold text-green-600 text-sm"
                    placeholder="0"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Số chứng từ / Ủy nhiệm chi:</label>
                  <input
                    type="text"
                    value={receiptFormData.invoiceNumber}
                    onChange={(e) => setReceiptFormData({ ...receiptFormData, invoiceNumber: e.target.value })}
                    className="input font-mono"
                    placeholder="UNC-xxx hoặc Hóa đơn"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Lý do nộp tiền *:</label>
                <textarea
                  value={receiptFormData.reason}
                  onChange={(e) => setReceiptFormData({ ...receiptFormData, reason: e.target.value })}
                  className="input h-16"
                  placeholder="Ghi rõ nội dung nộp tiền..."
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsReceiptModalOpen(false)}
                  className="btn-secondary text-xs px-4 py-2"
                >
                  Hủy bỏ
                </button>
                <button type="submit" className="btn-primary text-xs px-5 py-2">
                  Lưu phiếu thu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL LẬP PHIẾU CHI TIỀN                                 */}
      {/* ======================================================== */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-100">
              <div className="flex items-center gap-2 font-bold text-gray-800 text-sm">
                <ArrowUpRight className="w-5 h-5 text-[#E53935]" />
                <span>Lập Phiếu Chi Tiền Mới</span>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Ngày chi tiền:</label>
                  <input
                    type="date"
                    value={paymentFormData.voucherDate}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, voucherDate: e.target.value })}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Hình thức thanh toán:</label>
                  <select
                    value={paymentFormData.paymentMethod}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, paymentMethod: e.target.value })}
                    className="input"
                  >
                    <option value="CASH">Tiền mặt tại quỹ</option>
                    <option value="BANK_TRANSFER">Chuyển khoản</option>
                  </select>
                </div>
              </div>

              {/* Danh mục & Loại chi phí */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Danh mục chi phí (Cấp 1):</label>
                  <select
                    value={paymentFormData.categoryId}
                    onChange={(e) => {
                      const categoryId = e.target.value;
                      const selectedCat = categories.find((c) => c.id === categoryId);
                      setPaymentFormData({
                        ...paymentFormData,
                        categoryId,
                        typeId: selectedCat?.types?.[0]?.id || ''
                      });
                    }}
                    className="input"
                    required
                  >
                    <option value="">-- Chọn danh mục --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} - {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Loại chi phí (Cấp 2):</label>
                  <select
                    value={paymentFormData.typeId}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, typeId: e.target.value })}
                    className="input"
                    required
                  >
                    <option value="">-- Chọn loại chi phí --</option>
                    {categories
                      .find((c) => c.id === paymentFormData.categoryId)
                      ?.types?.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.code} - {t.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Người nhận tiền *:</label>
                  <input
                    type="text"
                    value={paymentFormData.recipient}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, recipient: e.target.value })}
                    className="input"
                    placeholder="Họ tên người nhận"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Số điện thoại:</label>
                  <input
                    type="text"
                    value={paymentFormData.phone}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, phone: e.target.value })}
                    className="input"
                    placeholder="09xx..."
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Địa chỉ người nhận:</label>
                <input
                  type="text"
                  value={paymentFormData.address}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, address: e.target.value })}
                  className="input"
                  placeholder="Địa chỉ..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Số tiền chi (VNĐ) *:</label>
                  <input
                    type="number"
                    value={paymentFormData.amount}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, amount: e.target.value })}
                    className="input font-bold text-[#E53935] text-sm"
                    placeholder="0"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Số hóa đơn / Chứng từ gốc:</label>
                  <input
                    type="text"
                    value={paymentFormData.invoiceNumber}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, invoiceNumber: e.target.value })}
                    className="input font-mono"
                    placeholder="Số hóa đơn đỏ (nếu có)"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Nội dung chi tiền *:</label>
                <textarea
                  value={paymentFormData.reason}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, reason: e.target.value })}
                  className="input h-16"
                  placeholder="Ghi rõ nội dung chi tiền..."
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="btn-secondary text-xs px-4 py-2"
                >
                  Hủy bỏ
                </button>
                <button type="submit" className="btn-primary text-xs px-5 py-2">
                  Lập phiếu chi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL OVERRIDE ĐẶC QUYỀN TGĐ (CEO)                      */}
      {/* ======================================================== */}
      {isOverrideModalOpen && overrideVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
              <Unlock className="w-5 h-5" />
              <span>Đặc Quyền TGĐ: Mở Khóa Sửa Chứng Từ</span>
            </div>
            <p className="text-xs text-gray-500">
              Chứng từ này đã ở trạng thái <strong>[Đã chi / Đã thu]</strong> và bị khóa sửa thông thường. Với tư cách Tổng Giám Đốc, bạn có quyền cập nhật và hệ thống sẽ tự động ghi vết vào <strong>Audit Log</strong>.
            </p>

            <form onSubmit={handleSaveOverride} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  {overrideVoucher.type === 'PAYMENT' ? 'Người nhận tiền:' : 'Người nộp tiền:'}
                </label>
                <input
                  type="text"
                  value={overrideVoucher.person}
                  onChange={(e) => setOverrideVoucher({ ...overrideVoucher, person: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Số tiền (VNĐ):</label>
                <input
                  type="number"
                  value={overrideVoucher.amount}
                  onChange={(e) => setOverrideVoucher({ ...overrideVoucher, amount: e.target.value })}
                  className="input font-bold text-red-600 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Nội dung chứng từ:</label>
                <textarea
                  value={overrideVoucher.reason}
                  onChange={(e) => setOverrideVoucher({ ...overrideVoucher, reason: e.target.value })}
                  className="input h-16"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsOverrideModalOpen(false);
                    setOverrideVoucher(null);
                  }}
                  className="btn-secondary text-xs px-3 py-1.5"
                >
                  Hủy bỏ
                </button>
                <button type="submit" className="btn-primary text-xs px-4 py-1.5 bg-amber-600 hover:bg-amber-700">
                  Xác nhận sửa & Ghi Audit Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL IN CHỨNG TỪ A4/A5 */}
      {printModalData.voucher && (
        <VoucherPrintModal
          voucher={printModalData.voucher}
          type={printModalData.type}
          onClose={() => setPrintModalData({ voucher: null, type: 'RECEIPT' })}
        />
      )}
    </div>
  );
};
