import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';

export interface StatusOption {
  value: string;
  label: string;
  colorClass: string;
  disabled?: boolean;
}

interface StatusBadgeDropdownProps {
  value: string;
  options: StatusOption[];
  onChange: (newValue: string) => void | Promise<void>;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const StatusBadgeDropdown: React.FC<StatusBadgeDropdownProps> = ({
  value,
  options,
  onChange,
  disabled = false,
  className = '',
  style
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; openUp: boolean }>({
    top: 0,
    left: 0,
    openUp: false
  });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeOption = options.find((opt) => opt.value === value) || {
    value,
    label: value,
    colorClass: 'bg-gray-100 text-gray-700 border-gray-300'
  };

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const dropdownHeight = options.length * 42 + 24;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

    const popoverWidth = 180;
    const halfWidth = popoverWidth / 2;
    let left = rect.left + window.scrollX + rect.width / 2;
    if (rect.left + rect.width / 2 - halfWidth < 12) {
      left = window.scrollX + halfWidth + 12;
    } else if (rect.left + rect.width / 2 + halfWidth > window.innerWidth - 12) {
      left = window.scrollX + window.innerWidth - halfWidth - 12;
    }

    setCoords({
      top: openUp ? rect.top + window.scrollY - 6 : rect.bottom + window.scrollY + 6,
      left,
      openUp
    });
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (disabled) return;

    if (!isOpen) {
      updatePosition();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleScrollOrResize = () => {
      updatePosition();
    };

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, options.length]);

  const handleSelect = (opt: StatusOption, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (opt.disabled || opt.value === value) {
      setIsOpen(false);
      return;
    }
    setIsOpen(false);
    onChange(opt.value);
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        title="Nhấp để thay đổi trạng thái"
        style={style}
        className={`inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all select-none shadow-2xs ${
          activeOption.colorClass
        } ${
          disabled
            ? 'opacity-60 cursor-not-allowed'
            : 'cursor-pointer hover:shadow-xs hover:brightness-95 active:scale-95'
        } ${className}`}
      >
        <span>{activeOption.label}</span>
        {!disabled && (
          <ChevronDown
            size={13}
            className={`text-current opacity-60 transition-transform duration-200 shrink-0 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        )}
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              transform: coords.openUp ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
              zIndex: 99999
            }}
            className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 min-w-[170px] flex flex-col gap-1.5 animate-in fade-in zoom-in-95 duration-150"
          >
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={(e) => handleSelect(opt, e)}
                  disabled={opt.disabled}
                  className={`w-full flex items-center justify-center px-2 py-1 rounded-xl transition-all ${
                    isSelected ? 'bg-rose-50/70 border border-rose-100/60' : 'hover:bg-gray-50 border border-transparent'
                  } ${opt.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <span
                    className={`inline-flex items-center justify-center px-3.5 py-1 rounded-full text-xs font-semibold border ${
                      opt.colorClass
                    } ${isSelected ? 'shadow-2xs' : ''}`}
                  >
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </>
  );
};
