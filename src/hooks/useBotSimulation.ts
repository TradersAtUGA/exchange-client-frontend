// src/hooks/useBotSimulation.ts
import { useEffect, useRef } from "react";

type Level = {
  price: number;
  bidSize?: number;
  askSize?: number;
};

type TradeEvent = {
  id: number;
  side: "buy" | "sell";
  price: number;
  size: number;
  timestamp: Date;
  type: "aggressive" | "passive";
};

export type Candle = {
  open:     number;
  high:     number;
  low:      number;
  close:    number;
  volume:   number;
  time:     number;
  isClosed: boolean;
};

// CandleStore: Map<intervalMs, Map<bucketStartMs, Candle>>
// Sealed candles are permanent. Live (current) candle is always re-updated.
export type CandleStore = Map<number, Map<number, Candle>>;

const INTERVAL_MS = [60_000, 300_000, 1_800_000, 3_600_000, 86_400_000];
const TRADE_LOG_MAX = 2_000; // trade log is UI-only, stays small

export function useBotSimulation(
  simulate: boolean,
  levels: Level[],
  setLevels: React.Dispatch<React.SetStateAction<Level[]>>,
  setTradeLog: React.Dispatch<React.SetStateAction<TradeEvent[]>>,
  tradeIdRef: React.MutableRefObject<number>,
  // Callback to push candle updates to the chart
  onCandleUpdate: (store: CandleStore) => void,
) {
  const levelsRef    = useRef(levels);
  const candleStore  = useRef<CandleStore>(new Map());

  useEffect(() => { levelsRef.current = levels; }, [levels]);

  // Initialise an empty map for each interval
  useEffect(() => {
    for (const ms of INTERVAL_MS) {
      if (!candleStore.current.has(ms)) {
        candleStore.current.set(ms, new Map());
      }
    }
  }, []);

  useEffect(() => {
    if (!simulate || levelsRef.current.length === 0) return;

    const interval = setInterval(() => {
      const currentLevels = levelsRef.current;
      const next = currentLevels.map(l => ({ ...l }));
      const tick = 0.25;
      const EPS  = 1e-6;

      // ── Cosine momentum ───────────────────────────────────────────────────
      const periodMs = 6000;
      const buyProb  = 0.5 + 0.3 * Math.cos((Date.now() / periodMs) * 2 * Math.PI);
      const side: "bid" | "ask" = Math.random() < buyProb ? "bid" : "ask";

      const bestAskIdx = next
        .map((l, i) => ({ l, i }))
        .filter(({ l }) => l.askSize && l.askSize > 0)
        .sort((a, b) => a.l.price - b.l.price)[0]?.i ?? -1;

      const bestBidIdx = next
        .map((l, i) => ({ l, i }))
        .filter(({ l }) => l.bidSize && l.bidSize > 0)
        .sort((a, b) => b.l.price - a.l.price)[0]?.i ?? -1;

      const bestAskPrice = bestAskIdx !== -1 ? next[bestAskIdx].price : null;
      const bestBidPrice = bestBidIdx !== -1 ? next[bestBidIdx].price : null;

      const centerPrice =
        bestAskPrice !== null && bestBidPrice !== null
          ? Math.random() < 0.5 ? bestBidPrice : bestAskPrice
          : bestAskPrice ?? bestBidPrice ?? next[Math.floor(next.length / 2)].price;

      if (centerPrice == null) return;

      const offset     = Math.random() < 0.7 ? 0 : Math.floor(Math.random() * 3) - 1;
      const rawPrice   = side === "bid" ? centerPrice - offset * tick : centerPrice + offset * tick;
      const orderPrice = Math.round(rawPrice / tick) * tick;
      const orderSize  = Math.floor(Math.random() * 6) + 1;

      let remainingSize = orderSize;
      const newTrades: TradeEvent[] = [];

      // ── Match engine ──────────────────────────────────────────────────────
      if (side === "bid") {
        const eligibleAsks = next
          .map((l, i) => ({ l, i }))
          .filter(({ l }) => l.askSize && l.askSize > 0 && l.price <= orderPrice + EPS)
          .sort((a, b) => a.l.price - b.l.price);

        for (const ask of eligibleAsks) {
          if (remainingSize <= 0) break;
          const available = ask.l.askSize ?? 0;
          const filled    = Math.min(available, remainingSize);
          remainingSize  -= filled;
          next[ask.i].askSize = available - filled > 0 ? available - filled : undefined;
          newTrades.push({
            id: tradeIdRef.current++, side: "buy",
            price: ask.l.price, size: filled,
            timestamp: new Date(), type: "aggressive",
          });
        }
        if (remainingSize > 0) {
          const idx = next.findIndex(l => Math.abs(l.price - orderPrice) < EPS);
          if (idx !== -1) {
            next[idx].bidSize = (next[idx].bidSize ?? 0) + remainingSize;
            newTrades.push({
              id: tradeIdRef.current++, side: "buy",
              price: orderPrice, size: remainingSize,
              timestamp: new Date(), type: "passive",
            });
          }
        }
      } else {
        const eligibleBids = next
          .map((l, i) => ({ l, i }))
          .filter(({ l }) => l.bidSize && l.bidSize > 0 && l.price >= orderPrice - EPS)
          .sort((a, b) => b.l.price - a.l.price);

        for (const bid of eligibleBids) {
          if (remainingSize <= 0) break;
          const available = bid.l.bidSize ?? 0;
          const filled    = Math.min(available, remainingSize);
          remainingSize  -= filled;
          next[bid.i].bidSize = available - filled > 0 ? available - filled : undefined;
          newTrades.push({
            id: tradeIdRef.current++, side: "sell",
            price: bid.l.price, size: filled,
            timestamp: new Date(), type: "aggressive",
          });
        }
        if (remainingSize > 0) {
          const idx = next.findIndex(l => Math.abs(l.price - orderPrice) < EPS);
          if (idx !== -1) {
            next[idx].askSize = (next[idx].askSize ?? 0) + remainingSize;
            newTrades.push({
              id: tradeIdRef.current++, side: "sell",
              price: orderPrice, size: remainingSize,
              timestamp: new Date(), type: "passive",
            });
          }
        }
      }

      // ── Update candle store incrementally ─────────────────────────────────
      // For each new trade, update every interval's current bucket directly.
      // Sealing happens here too — if a trade's bucket is not the current one,
      // it means the bucket just rolled over and we seal it immediately.
      const now = Date.now();
      let storeUpdated = false;

      for (const trade of newTrades) {
        const tradeTime = trade.timestamp.getTime();

        for (const ms of INTERVAL_MS) {
          const tradeBucket   = Math.floor(tradeTime / ms) * ms;
          const currentBucket = Math.floor(now / ms) * ms;
          const intervalMap   = candleStore.current.get(ms)!;

          if (tradeBucket === currentBucket) {
            // Update live candle incrementally
            const existing = intervalMap.get(currentBucket);
            if (!existing) {
              intervalMap.set(currentBucket, {
                time: currentBucket, isClosed: false,
                open: trade.price, close: trade.price,
                high: trade.price, low:   trade.price,
                volume: 1,
              });
            } else {
              intervalMap.set(currentBucket, {
                ...existing,
                close:  trade.price,
                high:   Math.max(existing.high, trade.price),
                low:    Math.min(existing.low,  trade.price),
                volume: existing.volume + 1,
                isClosed: false,
              });
            }
          } else {
            // Trade belongs to a past bucket — seal it if not already
            if (!intervalMap.has(tradeBucket)) {
              intervalMap.set(tradeBucket, {
                time: tradeBucket, isClosed: true,
                open: trade.price, close: trade.price,
                high: trade.price, low:   trade.price,
                volume: 1,
              });
            } else if (!intervalMap.get(tradeBucket)!.isClosed) {
              intervalMap.set(tradeBucket, {
                ...intervalMap.get(tradeBucket)!,
                isClosed: true,
              });
            }
          }

          // Seal the previous live candle when the bucket rolls over
          // (detect by checking if existing live candle has an old time)
          const liveCandle = intervalMap.get(currentBucket);
          if (!liveCandle) {
            // Check if there's an unsealed candle from a previous bucket
            for (const [bucketTime, candle] of intervalMap) {
              if (bucketTime !== currentBucket && !candle.isClosed) {
                intervalMap.set(bucketTime, { ...candle, isClosed: true });
              }
            }
          }

          storeUpdated = true;
        }
      }

      if (storeUpdated) {
        // Pass the same Map reference — CandleChart reads it via ref so
        // it doesn't need a new object to trigger updates (chart ticks independently)
        onCandleUpdate(candleStore.current);
      }

      setLevels(next);
      setTradeLog(prev => [...newTrades, ...prev].slice(0, TRADE_LOG_MAX));
    }, 100);

    return () => clearInterval(interval);
  }, [simulate, setLevels, setTradeLog, tradeIdRef, onCandleUpdate]);
}