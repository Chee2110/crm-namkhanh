import { useState, useCallback, useRef, useEffect } from 'react';

export interface UseTableResizeOptions {
  tableKey: string;
  defaultWidths: Record<string, number>;
  minWidth?: number;
  minWidths?: Record<string, number>;
}

export function useTableResize({
  tableKey,
  defaultWidths,
  minWidth = 60,
  minWidths = {}
}: UseTableResizeOptions) {
  const storageKey = `namkhanh_col_widths_${tableKey}`;

  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...defaultWidths, ...parsed };
      }
    } catch {
      // fallback to defaults on parse error
    }
    return defaultWidths;
  });

  const widthsRef = useRef(columnWidths);
  useEffect(() => {
    widthsRef.current = columnWidths;
  }, [columnWidths]);

  const startResize = useCallback(
    (colKey: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const startX = e.clientX;
      const initialWidth = widthsRef.current[colKey] || defaultWidths[colKey] || 120;
      const colMinWidth = minWidths[colKey] || minWidth;

      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      let latestWidth = initialWidth;

      const onMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = moveEvent.clientX - startX;
        const newWidth = Math.max(colMinWidth, initialWidth + deltaX);
        latestWidth = newWidth;
        setColumnWidths((prev) => ({
          ...prev,
          [colKey]: newWidth
        }));
      };

      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';

        try {
          const updated = {
            ...widthsRef.current,
            [colKey]: latestWidth
          };
          localStorage.setItem(storageKey, JSON.stringify(updated));
        } catch (err) {
          console.error('Error saving column widths to localStorage:', err);
        }
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    },
    [defaultWidths, minWidth, minWidths, storageKey]
  );

  const resetWidths = useCallback(() => {
    setColumnWidths(defaultWidths);
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
  }, [defaultWidths, storageKey]);

  const getTableWidth = useCallback(
    (visibleKeys: string[]) => {
      return visibleKeys.reduce((sum, key) => {
        const w = columnWidths[key] || defaultWidths[key] || 120;
        return sum + w;
      }, 0);
    },
    [columnWidths, defaultWidths]
  );

  return {
    columnWidths,
    setColumnWidths,
    startResize,
    resetWidths,
    getTableWidth
  };
}
