/**
 * Hệ màu chuyển sắc từ Thấp (Đỏ) -> Trung bình (Cam/Vàng) -> Cao (Xanh cốm/Xanh lá)
 * Dùng thống nhất cho các biểu đồ đường, biểu đồ cột, biểu đồ tròn và thanh tỷ lệ.
 */

const COLOR_STOPS: Array<{ stop: number; r: number; g: number; b: number; hex: string }> = [
  { stop: 0.0, r: 239, g: 68, b: 68, hex: '#EF4444' },   // Đỏ (Thấp nhất)
  { stop: 0.28, r: 249, g: 115, b: 22, hex: '#F97316' }, // Cam
  { stop: 0.52, r: 245, g: 158, b: 11, hex: '#F59E0B' }, // Vàng Amber
  { stop: 0.76, r: 132, g: 204, b: 22, hex: '#84CC16' }, // Xanh cốm Lime
  { stop: 1.0, r: 16, g: 185, b: 129, hex: '#10B981' }   // Xanh lá Emerald (Cao nhất)
];

const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');

/**
 * Nội suy màu sắc mượt mà từ Đỏ (#EF4444) đến Xanh lá (#10B981) theo tỷ lệ 0.0 -> 1.0
 */
export function getLowToHighColor(ratio: number): string {
  const clamped = Number.isFinite(ratio) ? Math.max(0, Math.min(1, ratio)) : 0;

  for (let i = 0; i < COLOR_STOPS.length - 1; i++) {
    const start = COLOR_STOPS[i];
    const end = COLOR_STOPS[i + 1];
    if (clamped >= start.stop && clamped <= end.stop) {
      const localRatio = (clamped - start.stop) / (end.stop - start.stop || 1);
      const r = start.r + (end.r - start.r) * localRatio;
      const g = start.g + (end.g - start.g) * localRatio;
      const b = start.b + (end.b - start.b) * localRatio;
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
    }
  }

  return COLOR_STOPS[COLOR_STOPS.length - 1].hex;
}

/**
 * Tính tỷ lệ chuẩn hóa (0.0 -> 1.0) của một giá trị so với mảng hoặc min/max
 */
export function getValueRatio(value: number, minVal: number, maxVal: number): number {
  if (maxVal <= minVal) {
    return maxVal > 0 && value > 0 ? 1 : 0;
  }
  return Math.max(0, Math.min(1, (value - minVal) / (maxVal - minVal)));
}

