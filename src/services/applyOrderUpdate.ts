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

export function applyOrderUpdate(
  side: "buy" | "sell",
  price: number,
  quantity: number,
  isFill: boolean,
  time: Date,
  setLevels: React.Dispatch<React.SetStateAction<Level[]>>,
  setTradeLog: React.Dispatch<React.SetStateAction<TradeEvent[]>>,
  tradeIdRef: React.MutableRefObject<number>
) {
  const EPS = 1e-6;

  // 1. Update the Orderbook (Levels)
  setLevels((prevLevels) => {
    const next = prevLevels.map(l => ({ ...l }));
    const targetIdx = next.findIndex(l => Math.abs(l.price - price) < EPS);

    if (targetIdx !== -1) {
      if (isFill) {
        if (side === "buy") {
          const newSize = (next[targetIdx].askSize ?? 0) - quantity;
          next[targetIdx].askSize = newSize > 0 ? newSize : undefined;
        } else {
          const newSize = (next[targetIdx].bidSize ?? 0) - quantity;
          next[targetIdx].bidSize = newSize > 0 ? newSize : undefined;
        }
      } else {
        if (side === "buy") {
          next[targetIdx].bidSize = (next[targetIdx].bidSize ?? 0) + quantity;
        } else {
          next[targetIdx].askSize = (next[targetIdx].askSize ?? 0) + quantity;
        }
      }
    }
    return next;
  });

  // 2. Update the Trade Log
  setTradeLog((prevLog) => {
    const newTrade: TradeEvent = {
      id: tradeIdRef.current++,
      side,
      price,
      size: quantity,
      timestamp: time,
      type: isFill ? "aggressive" : "passive",
    };
    return [newTrade, ...prevLog].slice(0, 100);
  });
}