import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, ChevronDown, Check, Package } from 'lucide-react';
import { Product } from '../../types';

interface ProductSearchSelectProps {
  products: Product[];
  selectedProductId?: string;
  valueDisplay?: string;
  onSelect: (product: Product) => void;
  placeholder?: string;
  className?: string;
  clearOnSelect?: boolean;
  minWidth?: number;
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
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .trim();
};

// Hàm lấy hệ số CSS zoom hiện tại của tài liệu (ví dụ: html { zoom: 0.9 })
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

export const ProductSearchSelect: React.FC<ProductSearchSelectProps> = ({
  products,
  selectedProductId,
  valueDisplay,
  onSelect,
  placeholder = 'Tìm tên hoặc mã sản phẩm...',
  className = '',
  clearOnSelect = false,
  minWidth = 340
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownCoords, setDropdownCoords] = useState<DropdownCoords>({
    top: 0,
    left: 0,
    width: 340,
    maxHeight: 280,
    openUpward: false
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Tìm product hiện tại nếu có
  const currentProduct = products.find((p) => p.id === selectedProductId);
  const resolvedDisplay =
    valueDisplay || (currentProduct ? `[${currentProduct.code}] ${currentProduct.name}` : '');

  // Cập nhật vị trí dropdown nổi chuẩn xác, khắc phục 100% sai lệch do CSS zoom
  const updateCoords = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const zoom = getDocZoom();

    // Tính khoảng trống phía dưới và phía trên theo kích thước viewport hiển thị
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    // Chỉ mở hướng lên trên nếu bên dưới cực kỳ hẹp (< 200px) và bên trên rộng rãi hơn
    const openUpward = spaceBelow < 200 && spaceAbove > spaceBelow;

    // Chiều rộng dropdown
    const effectiveWidth = Math.max(rect.width, minWidth);

    // Xử lý tràn viền phải màn hình
    let visualLeft = rect.left;
    if (visualLeft + effectiveWidth > viewportWidth - 10) {
      visualLeft = Math.max(10, viewportWidth - effectiveWidth - 10);
    }

    // Quy đổi tọa độ visual sang tọa độ CSS trong ngữ cảnh zoom
    const coords: DropdownCoords = {
      left: Math.round(visualLeft / zoom),
      width: Math.round(effectiveWidth / zoom),
      openUpward,
      maxHeight: 280
    };

    if (openUpward) {
      // Neo vào cạnh trên của ô input: cạnh đáy của dropdown cách đỉnh ô input 4px
      coords.bottom = Math.round((viewportHeight - rect.top) / zoom) + 4;
      coords.maxHeight = Math.min(280, Math.max(160, Math.round((spaceAbove - 16) / zoom)));
    } else {
      // Neo vào cạnh dưới của ô input: đỉnh của dropdown cách đáy ô input 4px
      coords.top = Math.round(rect.bottom / zoom) + 4;
      coords.maxHeight = Math.min(280, Math.max(160, Math.round((spaceBelow - 16) / zoom)));
    }

    setDropdownCoords(coords);
  };

  const handleOpen = () => {
    setIsOpen(true);
    setSearchQuery('');
    updateCoords();
  };

  // Lắng nghe scroll / resize để cập nhật vị trí dropdown thời gian thực
  useEffect(() => {
    if (!isOpen) return;

    updateCoords();
    const rafId = requestAnimationFrame(updateCoords);

    const handleScrollOrResize = () => {
      updateCoords();
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen]);

  // Click outside để đóng dropdown
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
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Phím Escape để đóng dropdown
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Lọc sản phẩm theo query
  const filteredProducts = products.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = normalizeText(searchQuery);
    const code = normalizeText(p.code || '');
    const name = normalizeText(p.name || '');
    const unit = normalizeText(p.unit || '');
    const barcode = normalizeText(p.barcode || '');
    return code.includes(q) || name.includes(q) || unit.includes(q) || barcode.includes(q);
  });

  const handleSelectProduct = (product: Product) => {
    onSelect(product);
    setIsOpen(false);
    setSearchQuery('');
  };

  const formatVND = (amount: number) => {
    return amount.toLocaleString('vi-VN') + ' đ';
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div className="relative flex items-center">
        <Search className="w-3.5 h-3.5 absolute left-2.5 text-gray-400 pointer-events-none shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? searchQuery : resolvedDisplay}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (!isOpen) {
              setIsOpen(true);
            }
          }}
          onFocus={handleOpen}
          placeholder={isOpen && resolvedDisplay ? `Hiện tại: ${resolvedDisplay}` : placeholder}
          className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#E53935]/20 focus:border-[#E53935] transition-colors truncate placeholder:text-gray-400"
        />

        {isOpen && searchQuery ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSearchQuery('');
              inputRef.current?.focus();
            }}
            className="absolute right-2 text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer bg-transparent border-none"
            title="Xóa tìm kiếm"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (isOpen) {
                setIsOpen(false);
                setSearchQuery('');
              } else {
                handleOpen();
                inputRef.current?.focus();
              }
            }}
            className="absolute right-2 text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer bg-transparent border-none"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {/* Floating Dropdown Portal */}
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
            className="bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden flex flex-col text-xs"
          >
            {/* Thanh tiêu đề nhỏ trong dropdown */}
            <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between text-[11px] text-gray-500 shrink-0">
              <span className="font-semibold text-gray-600 flex items-center gap-1">
                <Package className="w-3.5 h-3.5 text-[#E53935]" />
                {searchQuery ? `Tìm thấy: ${filteredProducts.length} sản phẩm` : `Kho VPP (${products.length} sản phẩm)`}
              </span>
              <span className="text-[10px] text-gray-400">Nhấp vào dòng để chọn</span>
            </div>

            {/* Danh sách sản phẩm cuộn được */}
            <div
              className="overflow-y-auto divide-y divide-gray-50 flex-1"
              style={{ maxHeight: `${dropdownCoords.maxHeight - 32}px` }}
            >
              {filteredProducts.length === 0 ? (
                <div className="py-6 text-center text-gray-400">
                  <p className="text-xs">Không tìm thấy sản phẩm nào phù hợp</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Thử gõ từ khóa không dấu hoặc mã SKU</p>
                </div>
              ) : (
                filteredProducts.map((p) => {
                  const isSelected = p.id === selectedProductId;
                  return (
                    <div
                      key={p.id}
                      onClick={() => handleSelectProduct(p)}
                      className={`px-3 py-2 flex items-center justify-between gap-2.5 cursor-pointer transition-colors ${
                        isSelected ? 'bg-red-50/80 text-[#E53935]' : 'hover:bg-gray-50 text-gray-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="font-mono text-[10.5px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 font-semibold shrink-0">
                          {p.code}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 truncate leading-tight">{p.name}</p>
                          <p className="text-[10.5px] text-gray-400 mt-0.5">
                            ĐVT: <span className="text-gray-600 font-medium">{p.unit}</span>
                            {p.stockQuantity !== undefined && (
                              <span className="ml-2 text-gray-500">
                                • Tồn kho: <strong className="text-gray-700">{p.stockQuantity}</strong>
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 text-right">
                        <span className="font-semibold text-[#E53935] font-mono text-xs">
                          {formatVND(Number(p.sellingPrice || 0))}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#E53935] shrink-0" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
