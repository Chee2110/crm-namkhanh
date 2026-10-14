import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X } from 'lucide-react';

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  wrapperClassName?: string;
  wrapperStyle?: React.CSSProperties;
  debounceMs?: number;
  autoFocus?: boolean;
  disabled?: boolean;
  onSearchImmediate?: (value: string) => void;
  showClearButton?: boolean;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Tìm kiếm...',
  className = '',
  style,
  wrapperClassName = '',
  wrapperStyle,
  debounceMs = 350,
  autoFocus = false,
  disabled = false,
  onSearchImmediate,
  showClearButton = true
}) => {
  const [localValue, setLocalValue] = useState(value);
  const isComposingRef = useRef(false);
  const timerRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevValueRef = useRef(value);

  // Đồng bộ từ props value xuống localValue khi cha reset hoặc đổi từ ngoài
  useEffect(() => {
    if (value !== prevValueRef.current) {
      prevValueRef.current = value;
      // Chỉ đồng bộ khi không đang gõ IME để tránh gián đoạn bộ gõ tiếng Việt
      if (!isComposingRef.current && value !== localValue) {
        setLocalValue(value);
      }
    }
  }, [value, localValue]);

  // Cleanup timer khi unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const triggerChange = useCallback((val: string) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    prevValueRef.current = val;
    onChange(val);
  }, [onChange]);

  const scheduleChange = useCallback((val: string) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      if (!isComposingRef.current) {
        triggerChange(val);
      }
    }, debounceMs);
  }, [debounceMs, triggerChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalValue(val);
    if (!isComposingRef.current) {
      scheduleChange(val);
    }
  };

  const handleCompositionStart = () => {
    isComposingRef.current = true;
  };

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    isComposingRef.current = false;
    const val = e.currentTarget.value;
    setLocalValue(val);
    scheduleChange(val);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (isComposingRef.current) return;
      e.preventDefault();
      triggerChange(localValue);
      if (onSearchImmediate) {
        onSearchImmediate(localValue);
      }
    } else if (e.key === 'Escape') {
      if (localValue) {
        e.preventDefault();
        setLocalValue('');
        triggerChange('');
      }
    }
  };

  const handleClear = () => {
    setLocalValue('');
    triggerChange('');
    inputRef.current?.focus();
  };

  return (
    <div
      className={`relative flex items-center ${wrapperClassName}`}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        ...wrapperStyle
      }}
    >
      <Search
        size={14}
        className="pointer-events-none text-gray-400"
        style={{
          position: 'absolute',
          left: '0.65rem',
          top: '50%',
          transform: 'translateY(-50%)',
          color: '#9CA3AF',
          pointerEvents: 'none',
          zIndex: 1
        }}
      />
      <input
        ref={inputRef}
        type="text"
        disabled={disabled}
        autoFocus={autoFocus}
        placeholder={placeholder}
        value={localValue}
        onChange={handleChange}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        onKeyDown={handleKeyDown}
        className={`input ${className}`}
        style={{
          width: '100%',
          paddingLeft: '2.25rem',
          paddingRight: showClearButton && localValue ? '1.9rem' : '0.75rem',
          fontSize: '12.5px',
          height: '32px',
          borderRadius: '12px',
          ...style
        }}
      />
      {showClearButton && localValue && !disabled && (
        <button
          type="button"
          onClick={handleClear}
          title="Xóa tìm kiếm"
          style={{
            position: 'absolute',
            right: '0.55rem',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'transparent',
            border: 'none',
            padding: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#9CA3AF',
            zIndex: 2
          }}
          className="hover:text-gray-700 transition-colors"
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
};
