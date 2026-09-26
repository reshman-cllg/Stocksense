import React, { useState } from 'react';
import { StockMovementPoint } from '../../types/inventory';

interface ProductMovementChartProps {
  data: StockMovementPoint[];
  productName: string;
  unit: string;
}

export const ProductMovementChart: React.FC<ProductMovementChartProps> = ({
  data,
  unit,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
        No 30-day movement data recorded for this product yet.
      </div>
    );
  }

  // Calculate totals over the 30 days
  const totalInput = data.reduce((acc, d) => acc + d.input, 0);
  const totalOutput = data.reduce((acc, d) => acc + d.output, 0);
  const totalDamage = data.reduce((acc, d) => acc + d.damage, 0);
  const netChange = totalInput - totalOutput - totalDamage;

  const maxVal = Math.max(
    10,
    ...data.flatMap((d) => [d.input, d.output, d.damage, d.stockBalance])
  );

  const height = 220;
  const paddingBottom = 30;
  const paddingTop = 20;
  const availableHeight = height - paddingBottom - paddingTop;
  const width = 720;
  const paddingLeft = 40;
  const chartWidth = width - paddingLeft - 20;
  const step = chartWidth / (data.length - 1 || 1);

  const activePoint = hoveredIndex !== null ? data[hoveredIndex] : data[data.length - 1];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
      {/* 30-Day Summary Stat Pills */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900">30-Day Stock Movement & Analytics</h3>
          <p className="text-xs text-slate-500">Historical stock velocity and loss audit</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg font-semibold border border-blue-100">
            Total In: <span className="font-mono font-bold">+{totalInput}</span> {unit}
          </div>
          <div className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg font-semibold border border-amber-100">
            Total Out: <span className="font-mono font-bold">-{totalOutput}</span> {unit}
          </div>
          <div className="px-2.5 py-1 bg-rose-50 text-rose-700 rounded-lg font-semibold border border-rose-100">
            Damaged: <span className="font-mono font-bold">-{totalDamage}</span> {unit}
          </div>
          <div
            className={`px-2.5 py-1 rounded-lg font-semibold border ${
              netChange >= 0
                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            Net: <span className="font-mono font-bold">{netChange >= 0 ? `+${netChange}` : netChange}</span> {unit}
          </div>
        </div>
      </div>

      {/* Interactive Legend & Active Hover Tooltip */}
      <div className="flex items-center justify-between mt-3 text-xs text-slate-600">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-blue-500 rounded-xs" />
            <span>Input</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-amber-500 rounded-xs" />
            <span>Output</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-rose-500 rounded-xs" />
            <span>Damage</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-0.5 bg-emerald-600" />
            <span className="font-semibold text-emerald-700">Stock Balance</span>
          </div>
        </div>

        {activePoint && (
          <div className="text-xs font-mono bg-slate-100 px-2.5 py-1 rounded-lg text-slate-800">
            <span className="text-slate-500">{activePoint.date}: </span>
            <span className="text-blue-600 font-bold">+{activePoint.input}</span> |{' '}
            <span className="text-amber-600 font-bold">-{activePoint.output}</span> |{' '}
            <span className="text-rose-600 font-bold">-{activePoint.damage}</span> |{' '}
            <span className="text-emerald-700 font-bold">Bal {activePoint.stockBalance}</span>
          </div>
        )}
      </div>

      {/* SVG Chart Canvas */}
      <div className="relative mt-3 w-full h-[220px]">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          {[0, 0.33, 0.66, 1].map((pct, idx) => {
            const y = paddingTop + availableHeight * (1 - pct);
            const val = Math.round(maxVal * pct);
            return (
              <g key={idx}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - 20}
                  y2={y}
                  stroke="#f1f5f9"
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 8}
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

          {/* Daily Bars: Input (Blue), Output (Amber), Damage (Rose) */}
          {data.map((d, i) => {
            const x = paddingLeft + i * step;
            const barW = Math.max(3, step * 0.25);

            const inH = (d.input / maxVal) * availableHeight;
            const outH = (d.output / maxVal) * availableHeight;
            const dmgH = (d.damage / maxVal) * availableHeight;

            const isHovered = hoveredIndex === i;

            return (
              <g
                key={i}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="cursor-pointer"
              >
                {/* Hit area */}
                <rect
                  x={x - step / 2}
                  y={paddingTop}
                  width={step}
                  height={availableHeight}
                  fill="transparent"
                />

                {/* Input Bar */}
                {d.input > 0 && (
                  <rect
                    x={x - barW - 1}
                    y={paddingTop + availableHeight - inH}
                    width={barW}
                    height={Math.max(2, inH)}
                    fill="#3b82f6"
                    rx="1"
                    opacity={isHovered ? 1 : 0.8}
                  />
                )}

                {/* Output Bar */}
                {d.output > 0 && (
                  <rect
                    x={x + 1}
                    y={paddingTop + availableHeight - outH}
                    width={barW}
                    height={Math.max(2, outH)}
                    fill="#f59e0b"
                    rx="1"
                    opacity={isHovered ? 1 : 0.8}
                  />
                )}

                {/* Damage Bar */}
                {d.damage > 0 && (
                  <rect
                    x={x - barW / 2}
                    y={paddingTop + availableHeight - dmgH}
                    width={barW}
                    height={Math.max(2, dmgH)}
                    fill="#f43f5e"
                    rx="1"
                  />
                )}

                {/* X Axis Date ticks (show every 5 days) */}
                {i % 5 === 0 && (
                  <text
                    x={x}
                    y={height - 8}
                    textAnchor="middle"
                    fontSize="9"
                    fill="#94a3b8"
                    fontFamily="monospace"
                  >
                    {d.date.substring(5)}
                  </text>
                )}
              </g>
            );
          })}

          {/* Running Stock Balance Line Area & Stroke */}
          {(() => {
            const points = data.map((d, i) => {
              const x = paddingLeft + i * step;
              const y = paddingTop + availableHeight - (d.stockBalance / maxVal) * availableHeight;
              return `${x},${y}`;
            });

            return (
              <>
                <polyline
                  points={points.join(' ')}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {data.map((d, i) => {
                  const x = paddingLeft + i * step;
                  const y = paddingTop + availableHeight - (d.stockBalance / maxVal) * availableHeight;
                  if (hoveredIndex === i || i === data.length - 1) {
                    return (
                      <circle
                        key={i}
                        cx={x}
                        cy={y}
                        r={hoveredIndex === i ? 5 : 3.5}
                        fill="#10b981"
                        stroke="#ffffff"
                        strokeWidth="2"
                      />
                    );
                  }
                  return null;
                })}
              </>
            );
          })()}
        </svg>
      </div>
    </div>
  );
};
