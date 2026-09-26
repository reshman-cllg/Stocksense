import React, { useState } from 'react';
import { DemandMatchStatus } from '../../context/InventoryContext';

interface DataPoint {
  label: string;
  input: number;
  output: number;
  demand: number;
  stock: number;
}

interface StockFlowDemandChartProps {
  data: DataPoint[];
  matchStatus: DemandMatchStatus;
  statusLabel: string;
  explanation: string;
}

export const StockFlowDemandChart: React.FC<StockFlowDemandChartProps> = ({
  data,
  matchStatus,
  statusLabel,
  explanation,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Compute maximum for scale
  const maxVal = Math.max(
    10,
    ...data.flatMap((d) => [d.input, d.output, d.demand, d.stock])
  );

  const chartHeight = 220;
  const paddingBottom = 30;
  const paddingTop = 20;
  const availableHeight = chartHeight - paddingBottom - paddingTop;

  // Status colors
  const statusStyles: Record<DemandMatchStatus, { badge: string; text: string; bg: string }> = {
    fully_covered: {
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      text: 'text-emerald-700',
      bg: 'bg-emerald-500',
    },
    partially_covered: {
      badge: 'bg-amber-50 text-amber-700 border-amber-200',
      text: 'text-amber-700',
      bg: 'bg-amber-500',
    },
    not_covered: {
      badge: 'bg-rose-50 text-rose-700 border-rose-200',
      text: 'text-rose-700',
      bg: 'bg-rose-500',
    },
    overstock_risk: {
      badge: 'bg-purple-50 text-purple-700 border-purple-200',
      text: 'text-purple-700',
      bg: 'bg-purple-500',
    },
  };

  const currentStyle = statusStyles[matchStatus] || statusStyles.fully_covered;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
      {/* Header with Inventory Demand Match indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">Stock Flow vs Demand Comparison</h3>
            <span className="text-[10px] text-slate-400 font-mono">Live Timeline</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Synchronized tracking of incoming supply, outbound dispatches, and actual demand
          </p>
        </div>

        {/* Demand Match Indicator */}
        <div className="flex items-center gap-2">
          <div className={`px-3 py-1 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${currentStyle.badge}`}>
            <span className={`w-2 h-2 rounded-full ${currentStyle.bg} animate-pulse`} />
            <span>{statusLabel}</span>
          </div>
        </div>
      </div>

      {/* Explanation Banner */}
      <div className="mt-3 p-3 bg-slate-50/80 rounded-xl border border-slate-200/60 text-xs text-slate-600 flex items-start gap-2">
        <span className="font-semibold text-slate-800 shrink-0">Demand Insight:</span>
        <span className="leading-relaxed">{explanation}</span>
      </div>

      {/* Chart Legend */}
      <div className="flex flex-wrap items-center justify-between gap-4 mt-4 text-xs font-medium text-slate-600">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-blue-500" />
            <span>Input Stock</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-amber-500" />
            <span>Output Stock</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-rose-500 rounded-full" />
            <span className="flex items-center gap-1">
              <span>Projected Demand</span>
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-emerald-500 rounded-full border-b border-dashed" />
            <span>Stock Balance</span>
          </div>
        </div>

        {hoveredIdx !== null && data[hoveredIdx] && (
          <div className="text-[11px] font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
            {data[hoveredIdx].label} : In +{data[hoveredIdx].input} | Out -{data[hoveredIdx].output} | Demand {data[hoveredIdx].demand} | Stock {data[hoveredIdx].stock}
          </div>
        )}
      </div>

      {/* Interactive SVG Chart */}
      <div className="relative mt-4 w-full h-[220px]">
        <svg
          viewBox={`0 0 700 ${chartHeight}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          {/* Horizontal Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const y = paddingTop + availableHeight * (1 - pct);
            const val = Math.round(maxVal * pct);
            return (
              <g key={i}>
                <line
                  x1="30"
                  y1={y}
                  x2="690"
                  y2={y}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                  strokeDasharray={pct === 0 ? '' : '3 3'}
                />
                <text
                  x="24"
                  y={y + 3}
                  textAnchor="end"
                  fontSize="10"
                  fill="#94a3b8"
                  fontFamily="monospace"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Grouped Bars: Input (Blue) & Output (Amber) */}
          {data.map((d, idx) => {
            const step = (690 - 40) / data.length;
            const xCenter = 40 + idx * step + step / 2;
            const barWidth = Math.max(4, Math.min(18, step * 0.35));

            const inputHeight = (d.input / maxVal) * availableHeight;
            const inputY = paddingTop + availableHeight - inputHeight;

            const outputHeight = (d.output / maxVal) * availableHeight;
            const outputY = paddingTop + availableHeight - outputHeight;

            const isHovered = hoveredIdx === idx;

            return (
              <g
                key={idx}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer transition-opacity"
              >
                {/* Input Bar */}
                <rect
                  x={xCenter - barWidth - 1}
                  y={inputY}
                  width={barWidth}
                  height={Math.max(2, inputHeight)}
                  rx="3"
                  className="fill-blue-500 hover:fill-blue-600 transition-colors"
                  opacity={isHovered ? 1 : 0.85}
                />

                {/* Output Bar */}
                <rect
                  x={xCenter + 1}
                  y={outputY}
                  width={barWidth}
                  height={Math.max(2, outputHeight)}
                  rx="3"
                  className="fill-amber-500 hover:fill-amber-600 transition-colors"
                  opacity={isHovered ? 1 : 0.85}
                />

                {/* X Axis Label */}
                <text
                  x={xCenter}
                  y={chartHeight - 8}
                  textAnchor="middle"
                  fontSize="10"
                  fill={isHovered ? '#0f172a' : '#64748b'}
                  fontWeight={isHovered ? 'bold' : 'normal'}
                >
                  {d.label}
                </text>
              </g>
            );
          })}

          {/* Demand Line & Points (Rose) */}
          {(() => {
            const step = (690 - 40) / data.length;
            const points = data.map((d, idx) => {
              const x = 40 + idx * step + step / 2;
              const y = paddingTop + availableHeight - (d.demand / maxVal) * availableHeight;
              return `${x},${y}`;
            });
            return (
              <>
                <polyline
                  points={points.join(' ')}
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {data.map((d, idx) => {
                  const x = 40 + idx * step + step / 2;
                  const y = paddingTop + availableHeight - (d.demand / maxVal) * availableHeight;
                  return (
                    <circle
                      key={idx}
                      cx={x}
                      cy={y}
                      r={hoveredIdx === idx ? 5 : 3}
                      fill="#f43f5e"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                  );
                })}
              </>
            );
          })()}

          {/* Stock Balance Line (Emerald dashed) */}
          {(() => {
            const step = (690 - 40) / data.length;
            const points = data.map((d, idx) => {
              const x = 40 + idx * step + step / 2;
              const y = paddingTop + availableHeight - (d.stock / maxVal) * availableHeight;
              return `${x},${y}`;
            });
            return (
              <polyline
                points={points.join(' ')}
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
                strokeDasharray="4 3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          })()}
        </svg>
      </div>
    </div>
  );
};
