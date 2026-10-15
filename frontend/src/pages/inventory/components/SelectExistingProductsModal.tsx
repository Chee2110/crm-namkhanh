import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Check,
  Package,
  Boxes,
  Warehouse as WarehouseIcon,
  Filter,
  CheckSquare,
  Square,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { Product, Warehouse } from '../../../types';

interface SelectExistingProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  currentWarehouseId?: string;
  warehouses: Warehouse[];
  onSelectProducts: (selectedProducts: Product[]) => void;
}

export const SelectExistingProductsModal: React.FC<SelectExistingProductsModalProps> = ({
  isOpen,
  onClose,
  products,
  currentWarehouseId,
  warehouses,
  onSelectProducts
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [warehouseFilter, setWarehouseFilter] = useState(currentWarehouseId || 'ALL');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('ALL');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Danh sách các danh mục hàng hóa duy nhất
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set).sort();
  }, [products]);

  // Lọc sản phẩm theo điều kiện tìm kiếm và bộ lọc
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // 1. Tìm kiếm theo từ khóa (Mã SKU, Tên, Mã vạch, Thương hiệu)
      if (search.trim()) {
        const term = search.toLowerCase().trim();
        const matchCode = p.code?.toLowerCase().includes(term);
        const matchName = p.name?.toLowerCase().includes(term);
        const matchBarcode = p.barcode?.toLowerCase().includes(term);
        const matchBrand = p.brand?.toLowerCase().includes(term);
        if (!matchCode && !matchName && !matchBarcode && !matchBrand) {
          return false;
        }
      }

      // 2. Lọc theo danh mục
      if (categoryFilter !== 'ALL' && p.category !== categoryFilter) {
        return false;
      }

      // 3. Lọc theo kho hàng nếu có chỉ định
      if (warehouseFilter !== 'ALL' && p.warehouseId && p.warehouseId !== warehouseFilter) {
        return false;
      }

      // 4. Lọc theo trạng thái tồn kho
      const stock = p.stockQuantity || 0;
      const minStock = p.minStockLevel || 10;
      if (stockFilter === 'IN_STOCK' && stock <= 0) return false;
      if (stockFilter === 'OUT_OF_STOCK' && stock > 0) return false;
      if (stockFilter === 'LOW_STOCK' && (stock <= 0 || stock > minStock)) return false;

      return true;
    });
  }, [products, search, categoryFilter, warehouseFilter, stockFilter]);

  if (!isOpen) return null;

  // Toggle chọn một sản phẩm
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Toggle chọn tất cả sản phẩm đang hiển thị trong bộ lọc
  const handleToggleSelectAll = () => {
    const allFilteredSelected = filteredProducts.length > 0 && filteredProducts.every((p) => selectedIds.has(p.id));
    if (allFilteredSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredProducts.forEach((p) => next.delete(p.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredProducts.forEach((p) => next.add(p.id));
        return next;
      });
    }
  };

  // Xác nhận thêm sản phẩm vào phiếu nhập
  const handleConfirm = () => {
    const selectedList = products.filter((p) => selectedIds.has(p.id));
    onSelectProducts(selectedList);
    setSelectedIds(new Set());
    onClose();
  };

  const isAllFilteredSelected = filteredProducts.length > 0 && filteredProducts.every((p) => selectedIds.has(p.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold border border-blue-100 shadow-xs">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Chọn Hàng Hóa Có Sẵn Trong Kho Để Nhập Thêm
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Chọn các mặt hàng cũ đã có trong danh mục để ghi nhận số lượng nhập kho và tự động cộng dồn tồn kho
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thanh tìm kiếm & bộ lọc */}
        <div className="p-4 bg-white border-b border-slate-100 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            {/* Ô tìm kiếm */}
            <div className="sm:col-span-6 relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-slate-400" />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên sản phẩm, mã SKU, mã vạch..."
                className="w-full pl-10 pr-8 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-800"
                autoFocus
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  title="Xóa tìm kiếm"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Lọc danh mục */}
            <div className="sm:col-span-3">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-700 bg-white"
              >
                <option value="ALL">Tất cả ngành hàng</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Lọc tồn kho */}
            <div className="sm:col-span-3">
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-700 bg-white"
              >
                <option value="ALL">Tất cả trạng thái tồn</option>
                <option value="IN_STOCK">Còn hàng tồn (&gt; 0)</option>
                <option value="LOW_STOCK">Sắp hết hàng (≤ Tối thiểu)</option>
                <option value="OUT_OF_STOCK">Đã hết hàng (= 0)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Danh sách sản phẩm (Bảng) */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 sticky top-0 z-10 select-none">
                <tr>
                  <th className="p-3 w-10 text-center">
                    <button
                      type="button"
                      onClick={handleToggleSelectAll}
                      className="text-slate-600 hover:text-blue-600 transition-colors"
                      title={isAllFilteredSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                    >
                      {isAllFilteredSelected ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-2 w-28">Mã SKU</th>
                  <th className="py-3 px-3">Tên hàng hóa & Quy cách</th>
                  <th className="py-3 px-3 w-36">Danh mục</th>
                  <th className="py-3 px-2 w-16 text-center">ĐVT</th>
                  <th className="py-3 px-3 w-28 text-center">Tồn hiện tại</th>
                  <th className="py-3 px-3 w-28 text-right">Giá vốn (VNĐ)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => {
                  const isSelected = selectedIds.has(p.id);
                  const isLowStock = (p.stockQuantity || 0) <= (p.minStockLevel || 10);
                  const isOut = (p.stockQuantity || 0) <= 0;

                  return (
                    <tr
                      key={p.id}
                      onClick={() => handleToggleSelect(p.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50/70 hover:bg-blue-100/60' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(p.id)}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                        />
                      </td>
                      <td className="py-2.5 px-2 font-mono font-bold text-slate-800">
                        {p.code}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">{p.name}</div>
                        {p.specification && (
                          <div className="text-[10px] text-slate-400 font-medium">
                            {p.specification}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                          {p.category || 'Chưa phân loại'}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-center text-slate-700 font-semibold">
                        {p.unit}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            isOut
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : isLowStock
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {p.stockQuantity} {p.unit}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                        {Number(p.costPrice).toLocaleString('vi-VN')} đ
                      </td>
                    </tr>
                  );
                })}

                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                      <Package className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      Không tìm thấy hàng hóa nào phù hợp với bộ lọc hiện tại.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Modal */}
        <div className="px-6 py-3.5 border-t border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="text-xs text-slate-600">
            Tổng cộng: <strong className="text-slate-900">{filteredProducts.length}</strong> hàng hóa |{' '}
            Đã chọn: <strong className="text-blue-600 font-black text-sm">{selectedIds.size}</strong> mặt hàng
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors"
            >
              Hủy bỏ
            </button>

            <button
              type="button"
              disabled={selectedIds.size === 0}
              onClick={handleConfirm}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
            >
              <span>Thêm {selectedIds.size > 0 ? selectedIds.size : ''} hàng hóa vào phiếu nhập</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
