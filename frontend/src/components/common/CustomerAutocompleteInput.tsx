import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, ChevronDown, Check, User, Phone, MapPin, Building2 } from 'lucide-react';
import { Customer } from '../../types';

export interface CustomerAutocompleteInputProps {
  value: string; // customerId
  onChange: (customerId: string, customer?: Customer) => void;
  customers: Customer[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

// Hàm chuẩn hóa chuỗi tiếng Việt không dấu để tìm kiếm thông minh theo mặt chữ
const normalizeText = (str: string): string => {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .trim();
};

export const CustomerAutocompleteInput: React.FC<CustomerAutocompleteInputProps> = ({
  value,
  onChange,
  customers = [],
  placeholder = '-- Chọn khách hàng --',
  required = false,
  disabled = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Tìm khách hàng đang được chọn theo ID
  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === value);
  }, [customers, value]);

  // Đồng bộ inputText khi selectedCustomer thay đổi và người dùng không đang gõ
  useEffect(() => {
    if (!isTyping) {
      if (selectedCustomer) {
        setInputText(`${selectedCustomer.name} (${selectedCustomer.code}) - ${selectedCustomer.phone}`);
      } else {
        setInputText('');
      }
    }
  }, [selectedCustomer, isTyping]);

  // Danh sách khách hàng đã được lọc theo từ khóa tìm kiếm ("nhập đến đâu tìm đến đấy")
  const filteredCustomers = useMemo(() => {
    if (!isTyping || !inputText.trim()) {
      return customers;
    }
    const query = normalizeText(inputText);
    return customers.filter((c) => {
      const name = normalizeText(c.name);
      const code = normalizeText(c.code);
      const phone = normalizeText(c.phone);
      const tax = normalizeText(c.taxCode || '');
      const contact = normalizeText(c.contactPerson || '');
      const addr = normalizeText(c.deliveryAddress || c.address || '');

      return (
        name.includes(query) ||
        code.includes(query) ||
        phone.includes(query) ||
        tax.includes(query) ||
        contact.includes(query) ||
        addr.includes(query)
      );
    });
  }, [customers, inputText, isTyping]);

  // Reset highlight index khi filtered list đổi
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredCustomers]);

  // Cuộn đến mục được highlight bằng phím mũi tên
  useEffect(() => {
    if (isOpen && listRef.current && filteredCustomers.length > 0) {
      const activeEl = listRef.current.children[highlightedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen, filteredCustomers.length]);

  // Lắng nghe sự kiện click bên ngoài để đóng dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsTyping(false);
        // Khôi phục lại text hiển thị của khách hàng đã chọn
        if (selectedCustomer) {
          setInputText(`${selectedCustomer.name} (${selectedCustomer.code}) - ${selectedCustomer.phone}`);
        } else {
          setInputText('');
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedCustomer]);

  // Xử lý khi người dùng chọn 1 khách hàng
  const handleSelect = (customer: Customer) => {
    onChange(customer.id, customer);
    setInputText(`${customer.name} (${customer.code}) - ${customer.phone}`);
    setIsTyping(false);
    setIsOpen(false);
  };

  // Xử lý khi xóa lựa chọn
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setInputText('');
    setIsTyping(true);
    setIsOpen(true);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Xử lý phím điều hướng (ArrowUp, ArrowDown, Enter, Escape)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
        e.preventDefault();
        setIsOpen(true);
        setIsTyping(true);
        return;
      }
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < filteredCustomers.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredCustomers.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCustomers.length > 0 && filteredCustomers[highlightedIndex]) {
        handleSelect(filteredCustomers[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setIsTyping(false);
      if (selectedCustomer) {
        setInputText(`${selectedCustomer.name} (${selectedCustomer.code}) - ${selectedCustomer.phone}`);
      }
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Hidden input hỗ trợ HTML5 form validation khi có thuộc tính required */}
      <input
        type="text"
        tabIndex={-1}
        required={required}
        value={value || ''}
        onChange={() => {}}
        style={{
          opacity: 0,
          position: 'absolute',
          pointerEvents: 'none',
          height: 0,
          width: 0,
          bottom: 0,
          left: '50%'
        }}
      />

      {/* Khung nhập liệu tìm kiếm kết hợp chọn khách hàng */}
      <div
        className="relative flex items-center w-full"
        onClick={() => {
          if (!disabled) {
            setIsOpen(true);
            if (inputRef.current) inputRef.current.focus();
          }
        }}
      >
        <input
          ref={inputRef}
          type="text"
          disabled={disabled}
          value={inputText}
          placeholder={placeholder}
          onFocus={() => {
            setIsOpen(true);
            setIsTyping(true);
          }}
          onChange={(e) => {
            setInputText(e.target.value);
            setIsTyping(true);
            if (!isOpen) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className={`w-full pl-3 pr-16 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#E53935] focus:ring-1 focus:ring-[#E53935] transition-all bg-white text-gray-900 ${
            disabled ? 'bg-gray-100 cursor-not-allowed opacity-75' : 'cursor-text'
          } ${className}`}
        />

        {/* Nút Xóa (Clear) & Nút Mũi tên (Chevron) */}
        <div className="absolute right-2 flex items-center gap-1 text-gray-400">
          {(value || (isTyping && inputText)) && !disabled && (
            <button
              type="button"
              tabIndex={-1}
              onClick={handleClear}
              className="p-1 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
              title="Xóa lựa chọn khách hàng"
            >
              <X size={14} />
            </button>
          )}
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.stopPropagation();
              if (!disabled) {
                setIsOpen(!isOpen);
                if (!isOpen && inputRef.current) {
                  inputRef.current.focus();
                }
              }
            }}
            className="p-1 hover:text-gray-600 cursor-pointer"
            title="Mở danh sách khách hàng"
          >
            <ChevronDown
              size={15}
              className={`transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#E53935]' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Menu Dropdown hiển thị kết quả tìm kiếm thời gian thực */}
      {isOpen && !disabled && (
        <div
          className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 bg-white rounded-lg border border-gray-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100"
          style={{ maxHeight: '280px' }}
        >
          {/* Thanh tiêu đề hiển thị số lượng kết quả */}
          <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100 text-[11px] font-medium text-gray-500 flex items-center justify-between">
            <span>
              {isTyping && inputText.trim()
                ? `Tìm thấy ${filteredCustomers.length} khách hàng khớp từ khóa`
                : `Danh sách khách hàng (${customers.length})`}
            </span>
            <span className="text-[10px] text-gray-400">↑↓ chọn, Enter xác nhận</span>
          </div>

          {/* Danh sách các khách hàng */}
          <div ref={listRef} className="overflow-y-auto max-h-[235px] divide-y divide-gray-50">
            {filteredCustomers.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-500">
                <Building2 className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="font-medium text-gray-700">Không tìm thấy khách hàng nào</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Thử tìm kiếm với tên, mã KH, số điện thoại hoặc địa chỉ khác
                </p>
              </div>
            ) : (
              filteredCustomers.map((c, index) => {
                const isSelected = c.id === value;
                const isHighlighted = index === highlightedIndex;

                return (
                  <div
                    key={c.id}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    onClick={() => handleSelect(c)}
                    className={`px-3 py-2 cursor-pointer transition-colors flex items-start justify-between gap-2 ${
                      isHighlighted ? 'bg-red-50/80 text-gray-900' : 'hover:bg-gray-50 text-gray-800'
                    } ${isSelected ? 'bg-red-50/50 font-semibold' : ''}`}
                  >
                    <div className="flex-1 min-w-0 space-y-0.5">
                      {/* Dòng 1: Tên khách hàng & Mã khách hàng */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-900 truncate">
                          {c.name}
                        </span>
                        <span className="text-[11px] font-mono px-1.5 py-0.2 bg-gray-100 text-gray-700 rounded border border-gray-200">
                          {c.code}
                        </span>
                      </div>

                      {/* Dòng 2: Số điện thoại & Người liên hệ & Địa chỉ */}
                      <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                        {c.phone && (
                          <span className="flex items-center gap-1 text-gray-600">
                            <Phone size={11} className="text-gray-400" />
                            {c.phone}
                          </span>
                        )}
                        {c.contactPerson && (
                          <span className="flex items-center gap-1 text-gray-600">
                            <User size={11} className="text-gray-400" />
                            {c.contactPerson}
                          </span>
                        )}
                        {(c.deliveryAddress || c.address) && (
                          <span className="flex items-center gap-1 text-gray-400 truncate max-w-[220px]" title={c.deliveryAddress || c.address || ''}>
                            <MapPin size={11} className="text-gray-400 shrink-0" />
                            <span className="truncate">{c.deliveryAddress || c.address}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Biểu tượng Check nếu đang được chọn */}
                    {isSelected && (
                      <div className="shrink-0 text-[#E53935] mt-1">
                        <Check size={16} strokeWidth={2.5} />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
