import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Package, X, Check, Boxes, ChevronDown } from 'lucide-react';
import { Product } from '../../types';
import { formatVND } from '../../utils/formatCurrency';

interface ProductAutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelectProduct: (product: Product) => void;
  onClearProduct?: () => void;
  productId?: string | null;
  currentStock?: number;
  unit?: string;
  actualQuantity?: number;
  availableProducts: Product[];
  placeholder?: string;
  className?: string;
}

interface DropdownCoords {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
  maxHeight: number;
  openUpward: boolean;
}

// Hàm chuẩn hóa chuỗi tiếng Việt không dấu để tìm kiếm thông minh
const normalizeText = (str: string): string => {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .trim();
};

// Hàm lấy hệ số CSS zoom hiện tại của tài liệu
const getDocZoom = (): number => {
  try {
    const htmlZoom = getComputedStyle(document.documentElement).zoom;
    const bodyZoom = getComputedStyle(document.body).zoom;
    const parsed = parseFloat(htmlZoom) || parseFloat(bodyZoom) || 1;
    return parsed > 0 ? parsed : 1;
  } catch {
    return 1;
  }
};

export const ProductAutocompleteInput: React.FC<ProductAutocompleteInputProps> = ({
  value,
  onChange,
  onSelectProduct,
  onClearProduct,
  productId,
  currentStock,
  unit,
  actualQuantity,
  availableProducts = [],
  placeholder = 'Gõ tìm hàng có sẵn hoặc nhập tên mới...',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownCoords, setDropdownCoords] = useState<DropdownCoords>({
    top: 0,
    left: 0,
    width: 380,
    maxHeight: 280,
    openUpward: false
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Tính toán vị trí portal dropdown theo tọa độ thực tế trên viewport
  const updateCoords = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const zoom = getDocZoom();

    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    // Tự động mở lên trên nếu phía dưới không đủ không gian (< 230px)
    const openUpward = spaceBelow < 230 && spaceAbove > spaceBelow;
    const effectiveWidth = Math.max(rect.width, 380);

    // Không để dropdown tràn khỏi mép phải màn hình
    let visualLeft = rect.left;
    if (visualLeft + effectiveWidth > viewportWidth - 12) {
      visualLeft = Math.max(12, viewportWidth - effectiveWidth - 12);
    }

    const coords: DropdownCoords = {
      left: Math.round(visualLeft / zoom),
      width: Math.round(effectiveWidth / zoom),
      openUpward,
      maxHeight: 280
    };

    if (openUpward) {
      coords.bottom = Math.round((viewportHeight - rect.top) / zoom) + 4;
      coords.maxHeight = Math.min(280, Math.max(160, Math.round((spaceAbove - 16) / zoom)));
    } else {
      coords.top = Math.round(rect.bottom / zoom) + 4;
      coords.maxHeight = Math.min(280, Math.max(160, Math.round((spaceBelow - 16) / zoom)));
    }

    setDropdownCoords(coords);
  };

  // Cập nhật tọa độ khi mở dropdown
  useEffect(() => {
    if (!isOpen) return;
    updateCoords();

    const handleScrollOrResize = () => {
      updateCoords();
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen]);

  // Đóng khi click ngoài container và dropdown
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Đóng khi ấn Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Lọc sản phẩm theo chuỗi người dùng đang gõ
  const query = normalizeText(value);
  const filteredProducts = availableProducts.filter((p) => {
    if (!query) return true;
    const nameMatch = normalizeText(p.name).includes(query);
    const codeMatch = normalizeText(p.code).includes(query);
    const barcodeMatch = p.barcode ? normalizeText(p.barcode).includes(query) : false;
    const categoryMatch = p.category ? normalizeText(p.category).includes(query) : false;
    return nameMatch || codeMatch || barcodeMatch || categoryMatch;
  });

  const handleSelect = (prod: Product) => {
    onSelectProduct(prod);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Ô nhập tên mặt hàng trực tiếp */}
      <div className="flex items-center gap-1">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              if (!isOpen) {
                setIsOpen(true);
              }
            }}
            onFocus={() => {
              setIsOpen(true);
              updateCoords();
            }}
            placeholder={placeholder}
            className="w-full pl-2.5 pr-7 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-red-500 font-semibold text-slate-900 bg-white"
          />

          <button
            type="button"
            tabIndex={-1}
            onClick={() => {
              if (isOpen) {
                setIsOpen(false);
              } else {
                setIsOpen(true);
                inputRef.current?.focus();
                updateCoords();
              }
            }}
            className="absolute inset-y-0 right-0 pr-2 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
            title="Xem gợi ý danh mục hàng có sẵn"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Nút hủy liên kết hàng cũ nếu đang được chọn */}
        {productId && onClearProduct && (
          <button
            type="button"
            onClick={onClearProduct}
            className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
            title="Bỏ liên kết với hàng cũ này để nhập hàng mới"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Nhãn thông tin trạng thái hàng hóa */}
      {productId ? (
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Package className="w-3 h-3 text-blue-600" />
            Hàng cũ trong kho
          </span>
          {currentStock !== undefined && (
            <span className="text-[10px] text-slate-600 font-medium">
              • Tồn: <strong className="text-slate-900">{currentStock}</strong> {unit || ''}
            </span>
          )}
          {currentStock !== undefined && (
            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
              → Sau nhập: {currentStock + (Number(actualQuantity) || 0)} {unit || ''}
            </span>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-1.5 mt-1">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
            Hàng mới tạo
          </span>
        </div>
      )}

      {/* Floating Dropdown Portal - Render ngoài DOM cha để không bị overflow-x-auto cắt ngang */}
      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: 'fixed',
              top: dropdownCoords.openUpward ? undefined : `${dropdownCoords.top}px`,
              bottom: dropdownCoords.openUpward ? `${dropdownCoords.bottom}px` : undefined,
              left: `${dropdownCoords.left}px`,
              width: `${dropdownCoords.width}px`,
              maxHeight: `${dropdownCoords.maxHeight}px`,
              zIndex: 999999
            }}
            className="bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden flex flex-col text-xs"
          >
            {/* Header gợi ý */}
            <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-600 shrink-0">
              <span className="font-bold flex items-center gap-1.5 text-slate-800">
                <Boxes className="w-3.5 h-3.5 text-[#E53935]" />
                {query
                  ? `Khớp ${filteredProducts.length} sản phẩm có sẵn`
                  : `Danh mục sản phẩm có sẵn (${availableProducts.length})`}
              </span>
              <span className="text-[10px] text-slate-400">Chọn để nhập thêm vào hàng cũ</span>
            </div>

            {/* Danh sách cuộn */}
            <div
              className="overflow-y-auto divide-y divide-slate-100 flex-1"
              style={{ maxHeight: `${dropdownCoords.maxHeight - 40}px` }}
            >
              {filteredProducts.length === 0 ? (
                <div className="p-4 text-center text-slate-500">
                  <p className="text-xs font-semibold text-slate-700">Không tìm thấy sản phẩm cũ phù hợp</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Mặt hàng <span className="font-semibold text-slate-700">"{value}"</span> sẽ được lưu như hàng mới tạo.
                  </p>
                </div>
              ) : (
                filteredProducts.slice(0, 15).map((prod) => {
                  const isSelected = prod.id === productId;
                  return (
                    <div
                      key={prod.id}
                      onClick={() => handleSelect(prod)}
                      className={`px-3 py-2.5 flex items-center justify-between gap-2.5 cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50/80 text-blue-900' : 'hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                            {prod.code}
                          </span>
                          {prod.category && (
                            <span className="text-[10px] text-slate-500 bg-slate-50 border border-slate-200 px-1 py-0.2 rounded">
                              {prod.category}
                            </span>
                          )}
                        </div>
                        <div className="font-semibold text-slate-900 truncate">{prod.name}</div>
                        <div className="text-[10.5px] text-slate-500 mt-0.5 flex items-center gap-2">
                          <span>ĐVT: <strong className="text-slate-700">{prod.unit}</strong></span>
                          <span>• Tồn kho: <strong className="text-blue-600">{prod.stockQuantity}</strong> {prod.unit}</span>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <div className="font-bold text-slate-900">
                          {formatVND(Number(prod.costPrice || prod.sellingPrice || 0))}
                        </div>
                        {isSelected && (
                          <div className="inline-flex items-center gap-0.5 text-[10px] font-bold text-blue-600 mt-0.5">
                            <Check className="w-3 h-3" /> Đang chọn
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer nhỏ nhắc nhở người dùng */}
            <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 text-[10.5px] text-slate-500 flex items-center justify-between">
              <span>💡 Bạn có thể tự do gõ tên mới nếu đây là mặt hàng mới</span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-[10px] text-slate-400 hover:text-slate-600"
              >
                Đóng (Esc)
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
