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
      const next = currentLevels.map(l => ({ ...l }));
      const tick = 0.25;
      const EPS = 1e-6;

      // --- 1. Cosine Momentum (Breathing Market) ---
      // Calculates a smooth wave between 0.2 and 0.8 over a 6-second period
      const periodMs = 6000; 
      const buyProb = 0.5 + 0.3 * Math.cos((Date.now() / periodMs) * 2 * Math.PI);

      // Use the calculated probability to determine the side
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
          ? Math.random() < 0.5
            ? bestBidPrice
            : bestAskPrice
          : bestAskPrice ??
            bestBidPrice ??
            next[Math.floor(next.length / 2)].price;

      if (centerPrice == null) return;

      const offset = Math.random() < 0.7 ? 0 : Math.floor(Math.random() * 3) - 1;
      const rawPrice = side === "bid" ? centerPrice - offset * tick : centerPrice + offset * tick;
      const orderPrice = Math.round(rawPrice / tick) * tick;
      const orderSize = Math.floor(Math.random() * 6) + 1;
      
      let remainingSize = orderSize;
      const newTrades: TradeEvent[] = [];

      // --- 2. Walk the Book (Matching Engine Logic) ---
      if (side === "bid") {
        const eligibleAsks = next
          .map((l, i) => ({ l, i }))
          .filter(({ l }) => l.askSize && l.askSize > 0 && l.price <= orderPrice + EPS)
          .sort((a, b) => a.l.price - b.l.price);

        for (const ask of eligibleAsks) {
          if (remainingSize <= 0) break; 
          
          const availableSize = ask.l.askSize ?? 0;
          const filled = Math.min(availableSize, remainingSize);
          
          remainingSize -= filled;
          next[ask.i].askSize = availableSize - filled > 0 ? availableSize - filled : undefined;

          newTrades.push({
            id: tradeIdRef.current++,
            side: "buy",
            price: ask.l.price, 
            size: filled,
            timestamp: new Date(),
            type: "aggressive",
          });
        }

        if (remainingSize > 0) {
          const targetIdx = next.findIndex(l => Math.abs(l.price - orderPrice) < EPS);
          if (targetIdx !== -1) {
            next[targetIdx].bidSize = (next[targetIdx].bidSize ?? 0) + remainingSize;
            
            newTrades.push({
              id: tradeIdRef.current++,
              side: "buy", 
              price: orderPrice,
              size: remainingSize,
              timestamp: new Date(),
              type: "passive",
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
          
          const availableSize = bid.l.bidSize ?? 0;
          const filled = Math.min(availableSize, remainingSize);
          
          remainingSize -= filled;
          next[bid.i].bidSize = availableSize - filled > 0 ? availableSize - filled : undefined;

          newTrades.push({
            id: tradeIdRef.current++,
            side: "sell",
            price: bid.l.price,
            size: filled,
            timestamp: new Date(),
            type: "aggressive",
          });
        }

        if (remainingSize > 0) {
          const targetIdx = next.findIndex(l => Math.abs(l.price - orderPrice) < EPS);
          if (targetIdx !== -1) {
            next[targetIdx].askSize = (next[targetIdx].askSize ?? 0) + remainingSize;

            newTrades.push({
              id: tradeIdRef.current++,
              side: "sell",
              price: orderPrice,
              size: remainingSize,
              timestamp: new Date(),
              type: "passive",
            });
          }
        }
      }

      setLevels(next);
      setTradeLog(prev => [...newTrades, ...prev].slice(0, 100));

    }, 100); // Note: I bumped the interval speed to 1000ms so you can watch the wave better!

    return () => clearInterval(interval);
  }, [simulate, setLevels, setTradeLog, tradeIdRef]);
}