// src/components/CandleChart.tsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import  type {CandleStore } from "../hooks/useBotSimulation";
import "./CandleChart.css";

type Candle = {
  open:     number;
  high:     number;
  low:      number;
  close:    number;
  volume:   number;
  time:     number;
  isClosed: boolean;
};

type IntervalOption = {
  label:   string;
  ms:      number;
  visible: number;
};

const INTERVALS: IntervalOption[] = [
  { label: "1m",   ms:      60_000, visible: 20 },
  { label: "5m",   ms:     300_000, visible: 24 },
  { label: "30m",  ms:   1_800_000, visible: 28 },
  { label: "1hr",  ms:   3_600_000, visible: 36 },
  { label: "1day", ms:  86_400_000, visible: 40 },
];

const UP_COLOR = "#26a17b";
const DN_COLOR = "#cf4b4b";
const WICK_W   = 2;
const CANDLE_W = 9;
const CANDLE_G = 4;
const STEP     = CANDLE_W + CANDLE_G;
const PAD      = { top: 16, bottom: 30, left: 6, right: 60 };
const SVG_H    = 240;
const TICK_N   = 5;

interface Props {
  candleStore: CandleStore;
}

export default function CandleChart({ candleStore }: Props) {
  const [intervalIdx, setIntervalIdx] = useState(0);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [hover, setHover] = useState<{ candle: Candle; slot: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Tick every 500ms — drives live candle updates and window shifting
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => { setHover(null); }, [intervalIdx]);

  // ── Read from store ───────────────────────────────────────────────────────
  const { ms: bucketMs, visible: VISIBLE_CANDLES } = INTERVALS[intervalIdx];
  const SVG_W   = VISIBLE_CANDLES * STEP + PAD.left + PAD.right;
  const CHART_H = SVG_H - PAD.top - PAD.bottom;
  const CHART_W = SVG_W - PAD.left - PAD.right;

  const currentBucket = Math.floor(nowMs / bucketMs) * bucketMs;
  const windowStart   = currentBucket - (VISIBLE_CANDLES - 1) * bucketMs;

  // Get the interval's candle map from the store (may be undefined before sim starts)
  const intervalMap = candleStore.get(bucketMs);

  const visibleCandles: Candle[] = [];
  if (intervalMap) {
    for (let s = 0; s < VISIBLE_CANDLES; s++) {
      const c = intervalMap.get(windowStart + s * bucketMs);
      if (c) visibleCandles.push(c);
    }
  }

  // ── Coordinate helpers ────────────────────────────────────────────────────
  const slotOf = (c: Candle) => Math.round((c.time - windowStart) / bucketMs);
  const slotX  = (s: number) => PAD.left + s * STEP + CANDLE_W / 2;

  const allP   = visibleCandles.flatMap(c => [c.high, c.low]);
  const rawMin = allP.length ? Math.min(...allP) : 99;
  const rawMax = allP.length ? Math.max(...allP) : 101;
  const spr    = rawMax - rawMin || 1;
  const minP   = rawMin - spr * 0.1;
  const maxP   = rawMax + spr * 0.1;
  const rangeP = maxP - minP;
  const toY    = (p: number) => PAD.top + CHART_H - ((p - minP) / rangeP) * CHART_H;

  const gridTicks = Array.from({ length: TICK_N }, (_, i) => minP + (i / (TICK_N - 1)) * rangeP);

  const labelStep  = Math.max(1, Math.floor(VISIBLE_CANDLES / 5));
  const timeLabels = Array.from({ length: Math.floor(VISIBLE_CANDLES / labelStep) + 1 }, (_, i) => {
    const slot  = i * labelStep;
    const d     = new Date(windowStart + slot * bucketMs);
    const hh    = String(d.getHours()).padStart(2, "0");
    const mm    = String(d.getMinutes()).padStart(2, "0");
    const label = bucketMs >= 86_400_000
      ? `${d.getMonth() + 1}/${d.getDate()}`
      : `${hh}:${mm}`;
    return { x: slotX(slot), label };
  });

  const lastCandle = visibleCandles.at(-1) ?? null;
  const lastPrice  = lastCandle?.close;
  const prevCandle = visibleCandles.length >= 2 ? visibleCandles.at(-2)! : null;
  const prevPrice  = prevCandle?.close ?? lastPrice;
  const priceUp    = lastPrice !== undefined && prevPrice !== undefined ? lastPrice >= prevPrice : true;

  const fmtTime = (ms: number) => {
    const d  = new Date(ms);
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    if (bucketMs >= 86_400_000) return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
    return `${hh}:${mm}`;
  };

  // ── Mouse ─────────────────────────────────────────────────────────────────
  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || !intervalMap) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mx   = (e.clientX - rect.left) * (SVG_W / rect.width);
    const slot = Math.round((mx - PAD.left - CANDLE_W / 2) / STEP);
    if (slot < 0 || slot >= VISIBLE_CANDLES) { setHover(null); return; }
    const candle = intervalMap.get(windowStart + slot * bucketMs);
    setHover(candle ? { candle, slot } : null);
  }, [intervalMap, windowStart, bucketMs, SVG_W, VISIBLE_CANDLES]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="cc-root">

      {/* Header */}
      <div className="cc-header">
        <div className="cc-header-left">
          <span className="cc-title">CHART</span>
          {lastPrice !== undefined && (
            <span className={`cc-live-price ${priceUp ? "up" : "dn"}`}>
              {lastPrice.toFixed(2)}
            </span>
          )}
        </div>
        <div className="cc-intervals">
          {INTERVALS.map((iv, i) => (
            <button
              key={iv.label}
              className={`cc-iv-btn ${i === intervalIdx ? "active" : ""}`}
              onClick={() => setIntervalIdx(i)}
            >
              {iv.label}
            </button>
          ))}
        </div>
      </div>

      {/* OHLC bar */}
      <div className="cc-ohlc-bar">
        {hover ? (
          <>
            <span className="cc-ohlc-time">{fmtTime(hover.candle.time)}</span>
            <span>O <em>{hover.candle.open.toFixed(2)}</em></span>
            <span>H <em className="up">{hover.candle.high.toFixed(2)}</em></span>
            <span>L <em className="dn">{hover.candle.low.toFixed(2)}</em></span>
            <span>C <em>{hover.candle.close.toFixed(2)}</em></span>
            <span>V <em className="vol">{hover.candle.volume}</em></span>
          </>
        ) : (
          <span className="cc-ohlc-hint">Hover a candle for OHLC</span>
        )}
      </div>

      {/* Chart */}
      <div className="cc-chart-wrap">
        {visibleCandles.length === 0 ? (
          <div className="cc-empty">
            <div className="cc-empty-icon">◈</div>
            <div>Start simulation to see candles</div>
          </div>
        ) : (
          <svg
            ref={svgRef}
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            className="cc-svg"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHover(null)}
          >
            <defs>
              <linearGradient id="ccBg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#0d1117" />
                <stop offset="100%" stopColor="#090d12" />
              </linearGradient>
            </defs>

            <rect x={PAD.left} y={PAD.top} width={CHART_W} height={CHART_H} fill="url(#ccBg)" />

            {/* Grid lines + price labels */}
            {gridTicks.map((tick, i) => (
              <g key={i}>
                <line
                  x1={PAD.left} y1={toY(tick)}
                  x2={SVG_W - PAD.right} y2={toY(tick)}
                  stroke="#161f2e" strokeWidth="1"
                  strokeDasharray={i === 0 || i === TICK_N - 1 ? "none" : "3 6"}
                />
                <text
                  x={SVG_W - PAD.right + 6} y={toY(tick) + 3.5}
                  fontSize="9" fill="#3a5272"
                  fontFamily="'SF Mono','Roboto Mono',monospace"
                >
                  {tick.toFixed(2)}
                </text>
              </g>
            ))}

            {/* Time labels */}
            {timeLabels.map((tl, i) => (
              <text key={i}
                x={tl.x} y={SVG_H - 7}
                textAnchor="middle" fontSize="7.5" fill="#253545"
                fontFamily="'SF Mono','Roboto Mono',monospace"
              >
                {tl.label}
              </text>
            ))}

            {/* Candles */}
            {visibleCandles.map((c) => {
              const slot  = slotOf(c);
              if (slot < 0 || slot >= VISIBLE_CANDLES) return null;
              const x         = slotX(slot);
              const isUp      = c.close >= c.open;
              const color     = isUp ? UP_COLOR : DN_COLOR;
              const wickColor = isUp ? "#3de0a0" : "#e06060";
              const isHov     = hover?.candle.time === c.time;

              const rawBodyTop = toY(Math.max(c.open, c.close));
              const rawBodyBot = toY(Math.min(c.open, c.close));
              const rawBodyH   = rawBodyBot - rawBodyTop;
              const isDoji     = rawBodyH < 2;
              const bodyH      = isDoji ? 0 : Math.max(3, rawBodyH);
              const midY       = (rawBodyTop + rawBodyBot) / 2;
              const bodyTop    = isDoji ? midY : midY - bodyH / 2;
              const bodyBot    = isDoji ? midY : midY + bodyH / 2;
              const highY      = toY(c.high);
              const lowY       = toY(c.low);

              return (
                <g key={c.time}>
                  {isHov && (
                    <rect
                      x={PAD.left + slot * STEP} y={PAD.top}
                      width={STEP} height={CHART_H}
                      fill="rgba(255,255,255,0.035)"
                    />
                  )}
                  {/* Shadow behind wicks */}
                  <line x1={x} y1={highY} x2={x} y2={lowY}
                    stroke="rgba(0,0,0,0.5)" strokeWidth={WICK_W + 2.5}
                    strokeLinecap="round"
                  />
                  {/* Body or doji */}
                  {isDoji ? (
                    <line
                      x1={x - CANDLE_W / 2} y1={midY}
                      x2={x + CANDLE_W / 2} y2={midY}
                      stroke={color} strokeWidth="3" strokeLinecap="round"
                    />
                  ) : (
                    <rect
                      x={x - CANDLE_W / 2} y={bodyTop}
                      width={CANDLE_W} height={bodyH}
                      fill={color} rx="1.5"
                      opacity={isHov ? 1 : 0.9}
                    />
                  )}
                  {/* Upper wick on top of body */}
                  <line x1={x} y1={highY} x2={x} y2={bodyTop}
                    stroke={wickColor} strokeWidth={WICK_W} strokeLinecap="round"
                  />
                  {/* Lower wick on top of body */}
                  <line x1={x} y1={bodyBot} x2={x} y2={lowY}
                    stroke={wickColor} strokeWidth={WICK_W} strokeLinecap="round"
                  />
                  {isHov && !isDoji && (
                    <rect
                      x={x - CANDLE_W / 2 - 1.5} y={bodyTop - 1.5}
                      width={CANDLE_W + 3} height={bodyH + 3}
                      fill="none" rx="2.5"
                      stroke={color} strokeWidth="1" opacity="0.5"
                    />
                  )}
                </g>
              );
            })}

            {/* Crosshair */}
            {hover && (
              <line
                x1={slotX(hover.slot)} y1={PAD.top}
                x2={slotX(hover.slot)} y2={PAD.top + CHART_H}
                stroke="rgba(150,180,220,0.2)"
                strokeWidth="1" strokeDasharray="3 4"
                pointerEvents="none"
              />
            )}

            {/* Live price line + tag */}
            {lastPrice !== undefined && (
              <g>
                <line
                  x1={PAD.left} y1={toY(lastPrice)}
                  x2={SVG_W - PAD.right} y2={toY(lastPrice)}
                  stroke={priceUp ? UP_COLOR : DN_COLOR}
                  strokeWidth="1" strokeDasharray="4 3" opacity="0.6"
                />
                <rect
                  x={SVG_W - PAD.right + 2} y={toY(lastPrice) - 9}
                  width={PAD.right - 4} height={18} rx="3"
                  fill={priceUp ? "#0d2b20" : "#2b0d0d"}
                  stroke={priceUp ? UP_COLOR : DN_COLOR}
                  strokeWidth="1"
                />
                <text
                  x={SVG_W - PAD.right + (PAD.right - 4) / 2 + 2}
                  y={toY(lastPrice) + 4.5}
                  textAnchor="middle" fontSize="8.5" fontWeight="700"
                  fill={priceUp ? "#34d399" : "#f87171"}
                  fontFamily="'SF Mono','Roboto Mono',monospace"
                >
                  {lastPrice.toFixed(2)}
                </text>
              </g>
            )}
          </svg>
        )}
      </div>
    </div>
  );
}