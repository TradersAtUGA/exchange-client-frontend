// src/hooks/useBotSimulation.ts
import { useEffect, useRef } from "react";
import { applyOrderUpdate } from "../services/applyOrderUpdate";

export type Level = {
  price: number;
  bidSize?: number;
  askSize?: number;
};

export type TradeEvent = {
  id: number;
  side: "buy" | "sell";
  price: number;
  size: number;
  timestamp: Date;
  type: "aggressive" | "passive";
};

/**
 * Bot Simulation Hook
 */
export function useBotSimulation(
  simulate: boolean,
  levels: Level[],
  setLevels: React.Dispatch<React.SetStateAction<Level[]>>,
  setTradeLog: React.Dispatch<React.SetStateAction<TradeEvent[]>>,
  tradeIdRef: React.MutableRefObject<number>
) {
  const levelsRef = useRef(levels);

  useEffect(() => {
    levelsRef.current = levels;
  }, [levels]);

  useEffect(() => {
    if (!simulate || levelsRef.current.length === 0) return;

    const interval = setInterval(() => {
      const currentLevels = levelsRef.current;
      const tick = 0.25;
      const EPS = 1e-6;

      // --- 1. Cosine Momentum (Breathing Market) ---
      const periodMs = 6000;
      const buyProb = 0.5 + 0.3 * Math.cos((Date.now() / periodMs) * 2 * Math.PI);
      const side: "buy" | "sell" = Math.random() < buyProb ? "buy" : "sell";

      const bestAskIdx = currentLevels
        .map((l, i) => ({ l, i }))
        .filter(({ l }) => l.askSize && l.askSize > 0)
        .sort((a, b) => a.l.price - b.l.price)[0]?.i ?? -1;

      const bestBidIdx = currentLevels
        .map((l, i) => ({ l, i }))
        .filter(({ l }) => l.bidSize && l.bidSize > 0)
        .sort((a, b) => b.l.price - a.l.price)[0]?.i ?? -1;

      const bestAskPrice = bestAskIdx !== -1 ? currentLevels[bestAskIdx].price : null;
      const bestBidPrice = bestBidIdx !== -1 ? currentLevels[bestBidIdx].price : null;

      const centerPrice =
        bestAskPrice !== null && bestBidPrice !== null
          ? Math.random() < 0.5
            ? bestBidPrice
            : bestAskPrice
          : bestAskPrice ??
            bestBidPrice ??
            currentLevels[Math.floor(currentLevels.length / 2)].price;

      if (centerPrice == null) return;

      const offset = Math.random() < 0.7 ? 0 : Math.floor(Math.random() * 3) - 1;
      const rawPrice = side === "buy" ? centerPrice - offset * tick : centerPrice + offset * tick;
      const orderPrice = Math.round(rawPrice / tick) * tick;
      const orderSize = Math.floor(Math.random() * 6) + 1;

      let remainingSize = orderSize;

      // --- 2. Walk the Book (Matching Math) ---
      if (side === "buy") {
        const eligibleAsks = currentLevels
          .map((l, i) => ({ l, i }))
          .filter(({ l }) => l.askSize && l.askSize > 0 && l.price <= orderPrice + EPS)
          .sort((a, b) => a.l.price - b.l.price);

        for (const ask of eligibleAsks) {
          if (remainingSize <= 0) break;

          const availableSize = ask.l.askSize ?? 0;
          const filled = Math.min(availableSize, remainingSize);
          remainingSize -= filled;

          // Aggressive Fill
          applyOrderUpdate("buy", ask.l.price, filled, true, new Date(), setLevels, setTradeLog, tradeIdRef);
        }

        if (remainingSize > 0) {
          // Passive Placement
          applyOrderUpdate("buy", orderPrice, remainingSize, false, new Date(), setLevels, setTradeLog, tradeIdRef);
        }

      } else {
        const eligibleBids = currentLevels
          .map((l, i) => ({ l, i }))
          .filter(({ l }) => l.bidSize && l.bidSize > 0 && l.price >= orderPrice - EPS)
          .sort((a, b) => b.l.price - a.l.price);

        for (const bid of eligibleBids) {
          if (remainingSize <= 0) break;

          const availableSize = bid.l.bidSize ?? 0;
          const filled = Math.min(availableSize, remainingSize);
          remainingSize -= filled;

          // Aggressive Fill
          applyOrderUpdate("sell", bid.l.price, filled, true, new Date(), setLevels, setTradeLog, tradeIdRef);
        }

        if (remainingSize > 0) {
          // Passive Placement
          applyOrderUpdate("sell", orderPrice, remainingSize, false, new Date(), setLevels, setTradeLog, tradeIdRef);
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [simulate, setLevels, setTradeLog, tradeIdRef]);
}