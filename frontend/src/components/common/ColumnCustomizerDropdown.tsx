import React, { useState, useRef, useEffect } from 'react';
import { Settings, GripVertical, RotateCcw } from 'lucide-react';

export interface ColumnCustomizerProps {
  /** Full list of column keys in their current order */
  columnOrder?: string[];
  /** Mapping of column key to display label */
  columnLabels: Record<string, string>;
  /** Visibility map of column keys */
  visibleColumns: Record<string, boolean>;
  /** Callback when a column's visibility is toggled */
  onToggleColumn: (key: string) => void;
  /** Callback when column order changes */
  onReorderColumns?: (newOrder: string[]) => void;
  /** Optional callback to reset to default order & visibility */
  onReset?: () => void;
  /** Keys to exclude from the customizer dropdown (kept fixed in original positions). Default: ['stt', 'actions'] */
  fixedKeys?: string[];
  /** Keys that cannot be unchecked (disabled checkbox) */
  disabledKeys?: string[];
  /** Optional button class name override */
  buttonClassName?: string;
  /** Optional button style override */
  buttonStyle?: React.CSSProperties;
  /** Title attribute for the trigger button */
  title?: string;
  /** Alignment of dropdown: 'left' | 'right'. Default: 'right' */
  align?: 'left' | 'right';
}

export const ColumnCustomizerDropdown: React.FC<ColumnCustomizerProps> = ({
  columnOrder,
  columnLabels,
  visibleColumns,
  onToggleColumn,
  onReorderColumns,
  onReset,
  fixedKeys = ['stt', 'actions'],
  disabledKeys = [],
  buttonClassName,
  buttonStyle,
  title = 'Tùy chỉnh cột hiển thị & sắp xếp thứ tự',
  align = 'right'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [draggedKey, setDraggedKey] = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Determine current ordered keys
  const effectiveKeys = columnOrder && columnOrder.length > 0 
    ? columnOrder 
    : Object.keys(columnLabels);

  // Filter out fixed keys from the customizable list
  const customizableKeys = effectiveKeys.filter((k) => !fixedKeys.includes(k));

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, key: string) => {
    setDraggedKey(key);
    e.dataTransfer.setData('text/plain', key);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, key: string) => {
    e.preventDefault();
    if (draggedKey && draggedKey !== key) {
      setDragOverKey(key);
    }
  };

  const handleDragLeave = () => {
    setDragOverKey(null);
  };

  const handleDrop = (e: React.DragEvent, targetKey: string) => {
    e.preventDefault();
    if (!draggedKey || draggedKey === targetKey || !onReorderColumns) {
      setDraggedKey(null);
      setDragOverKey(null);
      return;
    }

    const currentCustomizable = [...customizableKeys];
    const sourceIdx = currentCustomizable.indexOf(draggedKey);
    const targetIdx = currentCustomizable.indexOf(targetKey);

    if (sourceIdx !== -1 && targetIdx !== -1) {
      currentCustomizable.splice(sourceIdx, 1);
      currentCustomizable.splice(targetIdx, 0, draggedKey);

      // Reconstruct full column order preserving leading and trailing fixed keys
      const leadingFixed: string[] = [];
      for (const k of effectiveKeys) {
        if (fixedKeys.includes(k)) {
          leadingFixed.push(k);
        } else {
          break;
        }
      }
      const trailingFixed: string[] = [];
      for (let i = effectiveKeys.length - 1; i >= 0; i--) {
        const k = effectiveKeys[i];
        if (fixedKeys.includes(k) && !leadingFixed.includes(k)) {
          trailingFixed.unshift(k);
        } else {
          break;
        }
      }

      const newFullOrder = [...leadingFixed, ...currentCustomizable, ...trailingFixed];
      onReorderColumns(newFullOrder);
    }

    setDraggedKey(null);
    setDragOverKey(null);
  };

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      {/* Trigger Button: Settings icon + "Cột" */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title={title}
        style={buttonStyle}
        className={
          buttonClassName ||
          "flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-medium shadow-xs transition-colors cursor-pointer select-none"
        }
      >
        <Settings className="w-3.5 h-3.5 text-gray-600" />
        <span className="text-[13px] font-medium text-gray-800">Cột</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{ width: '270px' }}
          className={`absolute ${
            align === 'left' ? 'left-0' : 'right-0'
          } top-full mt-1.5 bg-white rounded-xl shadow-2xl border border-gray-100 p-3 z-50 select-none animate-in fade-in zoom-in-95 duration-100`}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-1.5 border-b border-gray-100">
            <span className="text-[11px] font-bold text-gray-400 tracking-wider uppercase select-none">
              TUỲ CHỈNH CỘT (KÉO ĐỂ SẮP XẾP)
            </span>
            {onReset && (
              <button
                type="button"
                onClick={onReset}
                className="text-[11px] text-red-600 hover:text-red-700 font-medium flex items-center gap-1 cursor-pointer transition-colors"
                title="Khôi phục thứ tự và hiển thị mặc định"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Mặc định</span>
              </button>
            )}
          </div>

          {/* List of Columns */}
          <div className="max-h-72 overflow-y-auto space-y-0.5 pr-0.5 custom-scrollbar">
            {customizableKeys.map((key) => {
              const label = columnLabels[key] || key;
              const isVisible = visibleColumns[key] ?? true;
              const isDisabled = disabledKeys.includes(key);
              const isDragging = draggedKey === key;
              const isOver = dragOverKey === key;

              return (
                <div
                  key={key}
                  draggable={Boolean(onReorderColumns)}
                  onDragStart={(e) => handleDragStart(e, key)}
                  onDragOver={(e) => handleDragOver(e, key)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, key)}
                  className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg transition-all ${
                    isDragging ? 'opacity-40 bg-gray-100' : 'hover:bg-gray-50'
                  } ${
                    isOver ? 'border-t-2 border-[#E53935] bg-red-50/40' : ''
                  }`}
                  style={{ cursor: onReorderColumns ? 'grab' : 'default' }}
                >
                  {/* Drag Handle: 6 dots / GripVertical */}
                  <span title="Kéo thả để sắp xếp thứ tự cột" className="shrink-0 cursor-grab">
                    <GripVertical className="w-3.5 h-3.5 text-gray-300 hover:text-gray-500" />
                  </span>

                  {/* Red Square Checkbox with White Checkmark */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isDisabled) onToggleColumn(key);
                    }}
                    className={`w-4 h-4 rounded-[4px] flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                      isVisible
                        ? 'bg-[#E53935] border border-[#E53935] text-white'
                        : 'bg-white border border-gray-300 hover:border-gray-400'
                    } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={isDisabled ? 'Cột cố định' : isVisible ? 'Ẩn cột' : 'Hiện cột'}
                  >
                    {isVisible && (
                      <svg className="w-2.5 h-2.5 fill-none stroke-current stroke-[3]" viewBox="0 0 24 24">
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>

                  {/* Column Label */}
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isDisabled) onToggleColumn(key);
                    }}
                    className={`text-[13px] font-medium text-gray-800 select-none truncate flex-1 cursor-pointer ${
                      isDisabled ? 'cursor-default' : ''
                    }`}
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
