import React, { useState } from 'react';
import { Activity, BarChart3 } from 'lucide-react';
import { getLowToHighColor, getValueRatio } from '../../utils/chartColors';

export interface MonthlyChartPoint {
  label: string;      // VD: "T1", "T2"...
  fullLabel: string;  // VD: "Tháng 1/2026"
  revenue: number;
  orderCount?: number;
}

interface RevenueTrendChartProps {
  data: MonthlyChartPoint[];
  height?: number;
  defaultMode?: 'line' | 'bar';
  formatVND: (val: number) => string;
}

const formatCompactVND = (val: number): string => {
  if (val >= 1_000_000_000) {
    return `${(val / 1_000_000_000).toFixed(1).replace(/\.0$/, '')} tỷ`;
  }
  if (val >= 1_000_000) {
    return `${(val / 1_000_000).toFixed(0)} tr`;
  }
  if (val >= 1_000) {
    return `${(val / 1_000).toFixed(0)}k`;
  }
  return '0';
};

export const RevenueTrendChart: React.FC<RevenueTrendChartProps> = ({
  data,
  height = 220,
  defaultMode = 'line',
  formatVND
}) => {
  const [mode, setMode] = useState<'line' | 'bar'>(defaultMode);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const revenues = data.map((d) => d.revenue);
  const maxRev = Math.max(...revenues, 0);
  const nonZeroRevenues = revenues.filter((r) => r > 0);
  const minPositiveRev = nonZeroRevenues.length > 0 ? Math.min(...nonZeroRevenues) : 0;

  // Hệ tọa độ SVG chuẩn
  const svgWidth = 720;
  const svgHeight = 200;
  const padLeft = 48;
  const padRight = 20;
  const padTop = 22;
  const padBottom = 28;
  const plotW = svgWidth - padLeft - padRight;
  const plotH = svgHeight - padTop - padBottom;

  const points = data.map((d, idx) => {
    const x = padLeft + (data.length > 1 ? (idx / (data.length - 1)) * plotW : plotW / 2);
    const ratioToMax = maxRev > 0 ? d.revenue / maxRev : 0;
    const y = padTop + plotH - ratioToMax * plotH;
    // Tỷ lệ màu từ Đỏ (thấp nhất) -> Xanh lá (cao nhất)
    const colorRatio =
      d.revenue <= 0
        ? 0
        : nonZeroRevenues.length > 1
        ? getValueRatio(d.revenue, minPositiveRev * 0.85, maxRev)
        : 1;
    const color = getLowToHighColor(colorRatio);
    return {
      ...d,
      idx,
      x,
      y,
      ratioToMax,
      colorRatio,
      color
    };
  });

  // Tạo đường cong mượt (Cubic Bezier Catmull-Rom) qua các điểm
  const buildSmoothPath = (pts: typeof points): string => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
    let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(i - 1, 0)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(i + 2, pts.length - 1)];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = Math.max(padTop, Math.min(padTop + plotH, p1.y + (p2.y - p0.y) / 6));
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = Math.max(padTop, Math.min(padTop + plotH, p2.y - (p3.y - p1.y) / 6));

      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return d;
  };

  const linePath = buildSmoothPath(points);
  const areaPath =
    points.length > 1
      ? `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${(padTop + plotH).toFixed(1)} L ${points[0].x.toFixed(1)} ${(padTop + plotH).toFixed(1)} Z`
      : '';

  const gradId = React.useId().replace(/:/g, '');

  return (
    <div className="space-y-2.5">
      {/* Thanh chú giải Thấp (Đỏ) -> Cao (Xanh lá) & Nút chuyển đổi Đường / Cột */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium text-[11px]">Thang màu:</span>
          <span className="text-[11px] font-bold text-red-500">Thấp</span>
          <div
            className="w-24 h-2 rounded-full shadow-inner"
            style={{
              background: 'linear-gradient(90deg, #EF4444 0%, #F97316 28%, #F59E0B 52%, #84CC16 76%, #10B981 100%)'
            }}
            title="Chuyển sắc tự động từ Đỏ (Thấp) sang Xanh lá (Cao)"
          />
          <span className="text-[11px] font-bold text-emerald-600">Cao</span>
        </div>

        <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/80">
          <button
            type="button"
            onClick={() => setMode('line')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
              mode === 'line'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Xem dạng Biểu đồ đường (Line Chart)"
          >
            <Activity className="w-3 h-3 text-emerald-600" />
            <span>Biểu đồ đường</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('bar')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
              mode === 'bar'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Xem dạng Biểu đồ cột (Bar Chart)"
          >
            <BarChart3 className="w-3 h-3 text-amber-500" />
            <span>Biểu đồ cột</span>
          </button>
        </div>
      </div>

      {/* Vùng hiển thị biểu đồ */}
      {mode === 'line' ? (
        <div className="relative w-full select-none" style={{ height: `${height}px` }}>
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            preserveAspectRatio="none"
            className="w-full h-full overflow-visible"
          >
            <defs>
              {/* Gradient dọc cho đường biểu đồ: Đáy (Đỏ) -> Giữa (Vàng) -> Đỉnh (Xanh lá) */}
              <linearGradient id={`line-grad-${gradId}`} x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#EF4444" />
                <stop offset="30%" stopColor="#F97316" />
                <stop offset="55%" stopColor="#F59E0B" />
                <stop offset="78%" stopColor="#84CC16" />
                <stop offset="100%" stopColor="#10B981" />
              </linearGradient>

              {/* Gradient miền (Area) phía dưới đường biểu đồ */}
              <linearGradient id={`area-grad-${gradId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.24" />
                <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.11" />
                <stop offset="100%" stopColor="#EF4444" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* Các đường lưới ngang (Grid lines) & Nhãn trục tung */}
            {[0, 0.25, 0.5, 0.75, 1].map((step, i) => {
              const yPos = padTop + plotH - step * plotH;
              const labelVal = maxRev * step;
              return (
                <g key={i}>
                  <line
                    x1={padLeft}
                    y1={yPos}
                    x2={svgWidth - padRight}
                    y2={yPos}
                    stroke={step === 0 ? '#CBD5E1' : '#E2E8F0'}
                    strokeDasharray={step === 0 ? undefined : '4 4'}
                    strokeWidth="1"
                  />
                  <text
                    x={padLeft - 6}
                    y={yPos + 3.5}
                    textAnchor="end"
                    fontSize="10"
                    fontWeight="600"
                    fill="#94A3B8"
                  >
                    {maxRev > 0 ? formatCompactVND(labelVal) : '0'}
                  </text>
                </g>
              );
            })}

            {/* Miền màu dưới đường cong */}
            {areaPath && <path d={areaPath} fill={`url(#area-grad-${gradId})`} />}

            {/* Đường biểu đồ chuyển sắc từ Đỏ (Thấp) -> Xanh lá (Cao) */}
            {linePath && (
              <path
                d={linePath}
                fill="none"
                stroke={`url(#line-grad-${gradId})`}
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Đường gióng dọc khi hover */}
            {hoveredIdx !== null && points[hoveredIdx] && (
              <line
                x1={points[hoveredIdx].x}
                y1={padTop}
                x2={points[hoveredIdx].x}
                y2={padTop + plotH}
                stroke={points[hoveredIdx].color}
                strokeWidth="1.2"
                strokeDasharray="3 3"
                opacity="0.7"
              />
            )}

            {/* Các nút điểm dữ liệu (Nodes) và nhãn tháng */}
            {points.map((pt) => {
              const isHovered = hoveredIdx === pt.idx;
              const isPeak = pt.revenue === maxRev && maxRev > 0;
              return (
                <g
                  key={pt.idx}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(pt.idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  {/* Vùng bắt chuột rộng cho từng tháng */}
                  <rect
                    x={pt.x - plotW / 24}
                    y={padTop - 10}
                    width={plotW / 12}
                    height={plotH + 30}
                    fill="transparent"
                  />

                  {/* Vòng hào quang khi hover hoặc điểm cao nhất */}
                  {(isHovered || isPeak) && (
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? 8 : 6.5}
                      fill={pt.color}
                      opacity={isHovered ? 0.25 : 0.18}
                    />
                  )}

                  {/* Điểm tròn dữ liệu mang màu theo độ cao (Đỏ -> Vàng -> Xanh lá) */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? 5.2 : isPeak ? 4.5 : 3.8}
                    fill="#FFFFFF"
                    stroke={pt.color}
                    strokeWidth={isHovered ? 3 : 2.5}
                  />

                  {/* Nhãn trục hoành (T1..T12) */}
                  <text
                    x={pt.x}
                    y={svgHeight - 6}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight={isHovered || isPeak ? '800' : '600'}
                    fill={isHovered || isPeak ? pt.color : '#64748B'}
                  >
                    {pt.label}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Tooltip nổi khi di chuột vào điểm */}
          {hoveredIdx !== null && points[hoveredIdx] && (
            <div
              className="absolute z-20 pointer-events-none bg-slate-900/95 backdrop-blur-md text-white text-xs rounded-xl px-3 py-2 shadow-xl border border-white/15 whitespace-nowrap transition-all duration-100"
              style={{
                left: `${Math.min(82, Math.max(12, ((points[hoveredIdx].x - padLeft) / plotW) * 100))}%`,
                top: `${Math.max(4, (points[hoveredIdx].y / svgHeight) * 100 - 26)}%`,
                transform: 'translate(-50%, -100%)'
              }}
            >
              <div className="flex items-center gap-1.5 font-bold">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 border border-white/40"
                  style={{ backgroundColor: points[hoveredIdx].color }}
                />
                <span>{points[hoveredIdx].fullLabel}</span>
              </div>
              <div className="font-extrabold text-sm mt-0.5" style={{ color: points[hoveredIdx].color }}>
                {formatVND(points[hoveredIdx].revenue)}
              </div>
              {typeof points[hoveredIdx].orderCount === 'number' && (
                <div className="text-[10.5px] text-slate-300">
                  {points[hoveredIdx].orderCount} đơn hàng phát sinh
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Chế độ Biểu đồ cột (Bar Chart) với màu chuyển từ Đỏ (Thấp) -> Xanh lá (Cao) */
        <div
          className="flex items-end gap-2 pt-8 pb-1 px-1 select-none"
          style={{ height: `${height}px` }}
        >
          {points.map((pt) => {
            const isPeak = pt.revenue === maxRev && pt.revenue > 0;
            const heightPercent = maxRev > 0 ? (pt.revenue / maxRev) * 100 : 0;
            return (
              <div key={pt.idx} className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end">
                <div className="absolute -top-11 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10.5px] py-1 px-2.5 rounded-xl pointer-events-none whitespace-nowrap z-20 shadow-lg">
                  <div className="font-bold">{pt.fullLabel}: {formatVND(pt.revenue)}</div>
                  {typeof pt.orderCount === 'number' && (
                    <div className="text-slate-300">{pt.orderCount} đơn hàng</div>
                  )}
                </div>

                <div className="w-full bg-slate-200/70 rounded-t-lg flex-1 flex items-end overflow-hidden max-w-[28px]">
                  <div
                    style={{
                      height: `${Math.max(heightPercent, pt.revenue > 0 ? 8 : 3)}%`,
                      backgroundColor: pt.revenue > 0 ? pt.color : '#E2E8F0'
                    }}
                    className="w-full transition-all duration-300 rounded-t-lg cursor-pointer hover:brightness-110"
                  />
                </div>
                <span
                  className="text-[11px] font-bold mt-1"
                  style={{ color: isPeak ? pt.color : '#64748B' }}
                >
                  {pt.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

