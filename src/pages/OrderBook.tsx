// src/pages/OrderBook.tsx
import Navbar from "../components/Navbar";
import { useEffect, useMemo, useState, useRef } from "react";
import BuySellModal from "../components/BuySellModal";
import { useParams } from "react-router-dom";
import "./OrderBook.css";
import { getTickerBySymbol } from "../services/ticker";
import { getUserPortfolios } from "../services/portfolio";
import { createTransaction } from "../services/transaction";
import { useAuth } from "../components/AuthContext";

type Level = {
  // undefined bid or ask sizes mean there is no volume at that price
  price: number;
  bidSize?: number;
  askSize?: number;
};

type Ticker = {
  ticker_id: number;
  symbol: string;
  name: string;
}

//hard coded data

export default function OrderBook() {
  const { symbol = "TSLA" } = useParams<{ symbol: string }>();
  const [ticker, setTicker] = useState<Ticker | null>(null);
  const [levels, setLevels] = useState<Level[]>([]);
  const [simulate, setSimulate] = useState(false);

  // Placing orders
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [orderSide, setOrderSide] = useState<"buy" | "sell" | null>(null);
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [limitPrice, setLimitPrice] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [qty, setQty] = useState("");

  // Portfolio selection
  const { userId } = useAuth();
  const [portfolios, setPortfolios] = useState<{ portfolioId: number; name: string }[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // get ticker info
  useEffect(() => {
    if (!symbol) return;
    async function fetchTicker() {
      try {
        const data = await getTickerBySymbol(symbol);
        setTicker(data);
      } catch (error) {
        console.error("Error fetching ticker:", error);
        setError(error.message || "Failed to fetch ticker information.");
      }
    }
    fetchTicker();
  }, [symbol]);

  // fetch user portfolios
  useEffect(() => {
    if (!userId) return;
    async function fetchPortfolios() {
      try {
        const data = await getUserPortfolios(userId!);
        setPortfolios(data.map((p) => ({ portfolioId: p.portfolioId, name: p.name })));
        if (data.length > 0) {
          setSelectedPortfolioId(data[0].portfolioId);
        }
      } catch (err) {
        console.error("Error fetching portfolios:", err);
      }
    }
    fetchPortfolios();
  }, [userId]);

  useEffect(() => {
    const marketPrice = 98 + (.25 * Math.floor(Math.random() * 17)); // Random between 98 and 102
    const tick = 0.25;
    const rows = 41;
    const top = marketPrice + Math.floor(rows / 2) * tick;

    const data: Level[] = [];
    for (let i = 0; i < rows; i++) {
      const price = parseFloat((top - i * tick).toFixed(2));

      let bidSize = undefined;
      let askSize = undefined;

      if (price <= marketPrice) {
        // This is a bid level (at or below market price)
        bidSize = Math.round(Math.random() * 10);
        bidSize = bidSize > 0 ? bidSize : undefined;
      } else {
        // This is an ask level (above market price)
        askSize = Math.round(Math.random() * 10);
        askSize = askSize > 0 ? askSize : undefined;
      }

      data.push({
        price,
        bidSize,
        askSize,
      });
    }
    setLevels(data);
  }, []);

  // scroll to market price
  const centerRowRef = useRef<HTMLDivElement>(null);
  const isFirstLoad = useRef(true);
  useEffect(() => {
    if (levels.length > 0 && centerRowRef.current && isFirstLoad.current) {
      centerRowRef.current.scrollIntoView({ block: "center" });
      isFirstLoad.current = false;
    }
  }, [levels]);

  // bot activity
  useEffect(() => {
    if (levels.length === 0 || !simulate) return;

    const interval = setInterval(() => {
      setLevels(prev => {
        const next = prev.map(l => ({ ...l }));

        const tick = 0.25;
        /* const centerPrice = Math.random() < 0.5 ? bestBid : bestAsk;
        console.log(`Simulating order activity around ${centerPrice.toFixed(2)}`); */
        // Find best bid and ask
        /* const bestAskIdx = next.findIndex(l => l.askSize);
        const bestBidIdx = next.map((l, i) => ({ l, i }))
          .filter(({ l }) => l.bidSize)
          .sort((a, b) => b.l.price - a.l.price)[0]?.i; */

        const bestAskIdx = next.map((l, i) => ({ l, i }))
          .filter(({ l }) => l.askSize)
          .sort((a, b) => a.l.price - b.l.price)[0]?.i ?? -1;

        // Best bid = HIGHEST price with bidSize  
        const bestBidIdx = next.map((l, i) => ({ l, i }))
          .filter(({ l }) => l.bidSize)
          .sort((a, b) => b.l.price - a.l.price)[0]?.i ?? -1;

        const bestAskPrice = bestAskIdx !== -1 ? next[bestAskIdx].price : null;
        const bestBidPrice = bestBidIdx !== undefined ? next[bestBidIdx].price : null;

        const centerPrice = bestAskPrice !== null && bestBidPrice !== null
          ? Math.random() < .5 ? bestBidPrice : bestAskPrice
          : bestAskPrice ?? bestBidPrice ?? next[Math.floor(next.length / 2)].price;
        console.log(`Best Bid: ${bestBidPrice}, Best Ask: ${bestAskPrice}`);
        console.log(`Simulating order activity around ${centerPrice.toFixed(2)}`);
        // Generate a new order: random price within ~3 ticks of center, random size
        const side: "bid" | "ask" = Math.random() < 0.5 ? "bid" : "ask";
        const offset = Math.random() < .7 ? 0 : Math.floor(Math.random() * 3) - 1;
        const orderPrice = parseFloat(
          (side === "bid"
            ? centerPrice - offset * tick   // bids come in at or below center
            : centerPrice + offset * tick   // asks come in at or above center
          ).toFixed(2)
        );
        const orderSize = Math.floor(Math.random() * 6) + 1;

        const targetIdx = next.findIndex(l => l.price === orderPrice);
        if (targetIdx === -1) return next; // price not in ladder, skip
        //console.log(`New ${side === "bid" ? "BUY" : "SELL"} order: ${orderSize} @ ${orderPrice}`);
        if (side === "bid") {
          if (bestAskPrice !== null && orderPrice >= bestAskPrice) {
            // Aggressive bid — fills best ask
            const remaining = (next[bestAskIdx].askSize ?? 0) - orderSize;
            next[bestAskIdx] = {
              ...next[bestAskIdx],
              askSize: remaining > 0 ? remaining : undefined,
            };
          } else if (next[targetIdx].askSize) {
            // Passive bid but landed on a level that has an ask — fill it
            const remaining = (next[targetIdx].askSize ?? 0) - orderSize;
            next[targetIdx] = {
              ...next[targetIdx],
              askSize: remaining > 0 ? remaining : undefined,
            };
          } else {
            // Truly passive — place the bid
            next[targetIdx] = {
              ...next[targetIdx],
              bidSize: (next[targetIdx].bidSize ?? 0) + orderSize,
            };
          }
        } else {
          if (bestBidPrice !== null && orderPrice <= bestBidPrice) {
            // Aggressive ask — fills best bid
            const remaining = (next[bestBidIdx!].bidSize ?? 0) - orderSize;
            next[bestBidIdx!] = {
              ...next[bestBidIdx!],
              bidSize: remaining > 0 ? remaining : undefined,
            };
          } else if (next[targetIdx].bidSize) {
            // Passive ask but landed on a level that has a bid — fill it
            const remaining = (next[targetIdx].bidSize ?? 0) - orderSize;
            next[targetIdx] = {
              ...next[targetIdx],
              bidSize: remaining > 0 ? remaining : undefined,
            };
          } else {
            // Truly passive — place the ask
            next[targetIdx] = {
              ...next[targetIdx],
              askSize: (next[targetIdx].askSize ?? 0) + orderSize,
            };
          }
        }

        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [levels.length, simulate]);
  // useful derived values
  const maxSize = useMemo(() => {
    let m = 1;
    levels.forEach((l) => {
      if (l.bidSize && l.bidSize > m) m = l.bidSize;
      if (l.askSize && l.askSize > m) m = l.askSize;
    });
    return m;
  }, [levels]);

  const bestBid = useMemo(() => {
    const b = [...levels].filter((l) => l.bidSize).sort((a, b) => b.price - a.price)[0];
    return b?.price;
  }, [levels]);

  const bestAsk = useMemo(() => {
    const a = [...levels].filter((l) => l.askSize).sort((a, b) => a.price - b.price)[0];
    return a?.price;
  }, [levels]);

  const openMarketOrderModal = (side: "buy" | "sell") => {
    setOrderSide(side);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setOrderSide(null);
  };

  // --- Interaction handlers (wire these to backend later) ---
  const handleClickMarketBuy = () => {
    setOrderSide("buy");
    setOrderType("market");
    setIsModalOpen(true);
  };

  const handleClickMarketSell = () => {
    setOrderSide("sell");
    setOrderType("market");
    setIsModalOpen(true);
  };

  const handleClickLevelBuy = (price: number) => {
    setOrderSide("buy");
    setOrderType("limit");
    setLimitPrice(price);
    setIsModalOpen(true);
  };

  const handleClickLevelSell = (price: number) => {
    setOrderSide("sell");
    setOrderType("limit");
    setLimitPrice(price);
    setIsModalOpen(true);
  };

  if (!symbol) {
    return <>
      <Navbar />
      <div className="orderbook-container">
        <div style={{ color: '#fff', textAlign: 'center', padding: '40px' }}>
          No symbol found.
        </div>
      </div>
    </>
  }

  if (error) {
    return <>
      <Navbar />
      <div className="orderbook-container">
        <div style={{ color: '#fff', textAlign: 'center', padding: '40px' }}>
          {error}
        </div>
      </div>
    </>
  }

  return (
    <>
      <Navbar />
      <div className="orderbook-container">
        {/* Header with symbol info and market buttons */}
        <div className="orderbook-header">
          <div className="symbol-info">
            <div>
              <div className="symbol-name">{symbol.toUpperCase()}</div>
              <div className="symbol-description">{ticker?.name}</div>
            </div>
            <div>
              <div className="last-price">{levels[Math.floor(levels.length / 2)]?.price?.toFixed(2) ?? "-"}</div>
              <div className="last-price-label">Last</div>
            </div>
          </div>

          <div className="market-buttons">
            <button onClick={() => setSimulate(!simulate)}>
              {simulate ? "Stop Simulation" : "Start Simulation"}
            </button>
            <button
              onClick={handleClickMarketBuy}
              className="buy-button"
            >
              BUY MARKET
            </button>
            <button
              onClick={handleClickMarketSell}
              className="sell-button"
            >
              SELL MARKET
            </button>
          </div>
        </div>

        <div className="orderbook-panel">
          <div className="orderbook-header-row">
            <div className="header-cell bid-size">Bid Size</div>
            <div className="header-cell bid">Bid</div>
            <div className="header-cell price">Price</div>
            <div className="header-cell ask">Ask</div>
            <div className="header-cell ask-size">Ask Size</div>
          </div>

          {/* Orderbook ladder */}
          <div className="orderbook-ladder">
            {levels.map((lvl, index) => {
              const bidPct = lvl.bidSize ? Math.min(100, (lvl.bidSize / maxSize) * 100) : 0;
              const askPct = lvl.askSize ? Math.min(100, (lvl.askSize / maxSize) * 100) : 0;

              const isBestBid = bestBid === lvl.price;
              const isBestAsk = bestAsk === lvl.price;
              const isCenter = index === Math.floor(levels.length / 2);

              return (
                <div
                  key={lvl.price}
                  ref={isCenter ? centerRowRef : null}
                  className={`orderbook-row ${isCenter ? 'center-row' : ''}`}
                >
                  {/* Bid Size */}
                  <div className="orderbook-cell bid-size-cell">
                    {lvl.bidSize ? (
                      <>
                        <div
                          className="bid-size-bar"
                          style={{ width: `${bidPct}%` }}
                        />
                        <div className="bid-size-text">
                          {lvl.bidSize.toLocaleString()}
                        </div>
                      </>
                    ) : (
                      <div className="empty-cell">-</div>
                    )}
                  </div>

                  {/* Bid Price */}
                  <div className="orderbook-cell bid-price-cell">
                    {lvl.bidSize ? (
                      <button
                        className={`bid-price-button ${isBestBid ? 'best-bid' : 'normal-bid'}`}
                        onClick={() => handleClickLevelSell(lvl.price)}
                      >
                        {lvl.price.toFixed(2)}
                      </button>
                    ) : (
                      <div className="empty-cell">-</div>
                    )}
                  </div>

                  {/* Center Price */}
                  <div className="orderbook-cell price-cell">
                    <div className={`price-display ${isBestBid ? 'best-bid' :
                      isBestAsk ? 'best-ask' :
                        'normal'
                      }`}>
                      {lvl.price.toFixed(2)}
                    </div>
                  </div>

                  {/* Ask Price */}
                  <div className="orderbook-cell ask-price-cell">
                    {lvl.askSize ? (
                      <button
                        className={`ask-price-button ${isBestAsk ? 'best-ask' : 'normal-ask'}`}
                        onClick={() => handleClickLevelBuy(lvl.price)}
                      >
                        {lvl.price.toFixed(2)}
                      </button>
                    ) : (
                      <div className="empty-cell">-</div>
                    )}
                  </div>

                  {/* Ask Size */}
                  <div className="orderbook-cell ask-size-cell">
                    {lvl.askSize ? (
                      <>
                        <div
                          className="ask-size-bar"
                          style={{ width: `${askPct}%` }}
                        />
                        <div className="ask-size-text">
                          {lvl.askSize.toLocaleString()}
                        </div>
                      </>
                    ) : (
                      <div className="empty-cell">-</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Spread and market info */}
        <div className="market-info">
          <div className="market-info-left">
            <div className="market-info-item">
              <span className="market-info-label">Spread:</span>
              <span className="market-info-value">
                {bestBid && bestAsk ? (bestAsk - bestBid).toFixed(2) : "-"}
              </span>
            </div>
            <div className="market-info-item">
              <span className="market-info-label">Best Bid:</span>
              <span className="market-info-value bid">{bestBid?.toFixed(2) ?? "-"}</span>
            </div>
            <div className="market-info-item">
              <span className="market-info-label">Best Ask:</span>
              <span className="market-info-value ask">{bestAsk?.toFixed(2) ?? "-"}</span>
            </div>
          </div>
          <div className="live-indicator">
            <span className="live-dot"></span>
            Live Data
          </div>
        </div>
      </div>
      <BuySellModal
        isOpen={isModalOpen}
        orderSide={orderSide}
        orderType={orderType}
        setOrderType={setOrderType}
        limitPrice={limitPrice}
        setLimitPrice={setLimitPrice}
        qty={qty}
        onQtyChange={setQty}
        portfolios={portfolios}
        selectedPortfolioId={selectedPortfolioId}
        onPortfolioChange={setSelectedPortfolioId}
        submitting={submitting}
        submitError={submitError}
        onClose={() => {
          setIsModalOpen(false);
          setQty("");
          setLimitPrice(null);
          setSubmitError(null);
        }}
        onConfirm={async () => {
          if (!ticker || !selectedPortfolioId || !userId) {
            setSubmitError("Missing portfolio, ticker, or login info.");
            return;
          }
          const quantity = parseInt(qty, 10);
          if (!quantity || quantity <= 0) {
            setSubmitError("Enter a valid quantity.");
            return;
          }

          // set price
          let price: number;
          if (orderType === "limit" && limitPrice != null) {
            price = limitPrice;
          } else if (orderSide === "buy" && bestAsk != null) {
            price = bestAsk;
          } else if (orderSide === "sell" && bestBid != null) {
            price = bestBid;
          } else {
            setSubmitError("No market price available.");
            return;
          }

          try {
            setSubmitting(true);
            setSubmitError(null);
            await createTransaction({
              user_id: userId,
              portfolio_id: selectedPortfolioId,
              ticker_id: ticker.ticker_id,
              type: orderSide === "buy" ? "BUY" : "SELL",
              price_per_share: price,
              quantity,
              timestamp: new Date().toISOString(),
            });
            setIsModalOpen(false);
            setQty("");
            setLimitPrice(null);
            setSubmitError(null);
          } catch (err: any) {
            const msg =
              err?.response?.data?.detail || err.message || "Transaction failed.";
            setSubmitError(msg);
          } finally {
            setSubmitting(false);
          }
        }}
      />
    </>
  );
}
