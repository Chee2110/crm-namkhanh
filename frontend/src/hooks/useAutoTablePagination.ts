import { useState, useEffect, useCallback } from 'react';

export interface UseAutoPaginationOptions {
  totalItems: number;
  rowHeight?: number; // Chiều cao trung bình 1 dòng (px), mặc định 38px
  topOffset?: number; // Tổng chiều cao các thành phần ngoài tbody, mặc định 260px
  minRows?: number; // Số dòng tối thiểu hiển thị trên 1 trang, mặc định 4
  maxRows?: number; // Số dòng tối đa, mặc định 50
  initialPage?: number;
}

export function useAutoTablePagination({
  totalItems,
  rowHeight = 38,
  topOffset = 260,
  minRows = 4,
  maxRows = 50,
  initialPage = 1,
}: UseAutoPaginationOptions) {
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [isAutoPageSize, setIsAutoPageSize] = useState<boolean>(true);

  // Tính toán số dòng tối ưu để chiều dài bảng vừa vặn màn hình laptop:
  // vh: chiều cao viewport trình duyệt (khi zoom to thì vh giảm, zoom nhỏ thì vh tăng)
  // available: khoảng không khả dụng cho tbody (vh - topOffset)
  // rows: available / rowHeight
  const computeRows = useCallback(() => {
    const vh = window.innerHeight;
    const available = vh - topOffset;
    const rows = Math.floor(available / rowHeight);
    return Math.max(minRows, Math.min(maxRows, rows));
  }, [topOffset, rowHeight, minRows, maxRows]);

  const [pageSize, setPageSize] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const vh = window.innerHeight;
      const available = vh - topOffset;
      const rows = Math.floor(available / rowHeight);
      return Math.max(minRows, Math.min(maxRows, rows));
    }
    return 10;
  });

  useEffect(() => {
    const handleZoomOrResize = () => {
      if (isAutoPageSize) {
        setPageSize(computeRows());
      }
    };

    handleZoomOrResize();
    window.addEventListener('resize', handleZoomOrResize);
    window.visualViewport?.addEventListener('resize', handleZoomOrResize);

    return () => {
      window.removeEventListener('resize', handleZoomOrResize);
      window.visualViewport?.removeEventListener('resize', handleZoomOrResize);
    };
  }, [isAutoPageSize, computeRows]);

  // Đảm bảo không bị out-of-range trang khi dữ liệu hoặc pageSize thay đổi
  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(totalItems / pageSize));
    if (currentPage > maxPage) {
      setCurrentPage(maxPage);
    }
  }, [totalItems, pageSize, currentPage]);

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  const paginate = useCallback(
    <T>(items: T[]): T[] => {
      return items.slice(startIndex, startIndex + pageSize);
    },
    [startIndex, pageSize]
  );

  return {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize: (size: number) => {
      setIsAutoPageSize(false);
      setPageSize(size);
    },
    resetToAuto: () => {
      setIsAutoPageSize(true);
      setPageSize(computeRows());
    },
    isAutoPageSize,
    totalPages,
    startIndex,
    endIndex,
    paginate,
  };
}
