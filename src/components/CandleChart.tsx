import React, { useMemo } from "react";
import "./CandleChart.css";

type TradeEvent = {
  id: number;
  side: "buy" | "sell";
  price: number;
  size: number;
  timestamp: Date;
  type: "aggressive" | "passive";
};

type Candle = {
  open: number;
  high: number;
  low: number;
  close: number;
  time: number; // bucket start ms
};

function buildCandles(trades: TradeEvent[], bucketMs: number): Candle[] {
  if (trades.length === 0) return [];

  const now = Date.now();
  const windowStart = now - 60_000;
  const buckets = new Map<number, number[]>();

  trades.forEach(t => {
    const ts = t.timestamp.getTime();
    if (ts < windowStart) return;
    const bucket = Math.floor(ts / bucketMs) * bucketMs;
    if (!buckets.has(bucket)) buckets.set(bucket, []);
    buckets.get(bucket)!.push(t.price);
  });

  return Array.from(buckets.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([time, prices]) => ({
      time,
      open: prices[0],
      close: prices[prices.length - 1],
      high: Math.max(...prices),
      low: Math.min(...prices),
    }));
}

export default function CandleChart({ trades }: { trades: TradeEvent[] }) {
  const candles = useMemo(() => buildCandles(trades, 5000), [trades]);

  const ASPECT_RATIO = 2; // width:height ratio
  const HEIGHT = 200;
  const WIDTH = HEIGHT * ASPECT_RATIO;
  const PADDING = { top: 12, bottom: 20, left: 44, right: 8 };
  const chartW = WIDTH - PADDING.left - PADDING.right;
  const chartH = HEIGHT - PADDING.top - PADDING.bottom;

  const allPrices = candles.flatMap(c => [c.high, c.low]);
  const minPrice = allPrices.length ? Math.min(...allPrices) : 0;
  const maxPrice = allPrices.length ? Math.max(...allPrices) : 1;
  const priceRange = maxPrice - minPrice || 0.5;

  const toY = (p: number) =>
    PADDING.top + chartH - ((p - minPrice) / priceRange) * chartH;

  const candleW = Math.max(4, Math.floor(chartW / 12) - 2);

  // evenly space candles across the chart width
  const toX = (i: number) =>
    PADDING.left + (i / Math.max(candles.length - 1, 1)) * chartW;

  // price gridlines
  const ticks = 4;
  const gridTicks = Array.from({ length: ticks + 1 }, (_, i) =>
    minPrice + (i / ticks) * priceRange
  );

  const now = Date.now();
  const windowStart = now - 60_000;
  const timeLabels = [0, 30, 60].map(s => ({
    x: PADDING.left + ((s * 1000) / 60_000) * chartW,
    label: s === 0 ? "-60s" : s === 30 ? "-30s" : "now",
  }));

  return (
    <div className="candlechart">
      <div className="candlechart-header">
        <span className="candlechart-title">PRICE CHART</span>
        <span className="candlechart-subtitle">5s candles · last 60s</span>
      </div>

      {candles.length < 2 ? (
        <div className="candlechart-empty">Waiting for data...</div>
      ) : (
        <svg width="100%" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="candlechart-svg">
          {/* Grid lines */}
          {gridTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={PADDING.left} y1={toY(tick)}
                x2={WIDTH - PADDING.right} y2={toY(tick)}
                stroke="#1f2937" strokeWidth="1"
              />
              <text
                x={PADDING.left - 4} y={toY(tick) + 4}
                textAnchor="end" fontSize="9" fill="#4b5563"
              >
                {tick.toFixed(2)}
              </text>
            </g>
          ))}

          {/* Time labels */}
          {timeLabels.map((tl, i) => (
            <text key={i} x={tl.x} y={HEIGHT - 4}
              textAnchor="middle" fontSize="9" fill="#4b5563">
              {tl.label}
            </text>
          ))}

          {/* Candles */}
          {candles.map((c, i) => {
            const x = toX(i);
            const isUp = c.close >= c.open;
            const color = isUp ? "#4ade80" : "#f87171";
            const bodyTop = toY(Math.max(c.open, c.close));
            const bodyBot = toY(Math.min(c.open, c.close));
            const bodyH = Math.max(1, bodyBot - bodyTop);

            return (
              <g key={c.time}>
                {/* Wick */}
                <line
                  x1={x} y1={toY(c.high)}
                  x2={x} y2={toY(c.low)}
                  stroke={color} strokeWidth="1"
                />
                {/* Body */}
                <rect
                  x={x - candleW / 2}
                  y={bodyTop}
                  width={candleW}
                  height={bodyH}
                  fill={isUp ? "rgba(74,222,128,0.7)" : "rgba(248,113,113,0.7)"}
                  stroke={color}
                  strokeWidth="1"
                />
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}