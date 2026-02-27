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
import TradeLog from "../components/TradeLog";
import CandleChart from "../components/CandleChart";
import { useBotSimulation } from "../hooks/useBotSimulation";
import type {CandleStore} from "../hooks/useBotSimulation";


type Level = {
  price: number;
  bidSize?: number;
  askSize?: number;
};

type Ticker = {
  ticker_id: number;
  symbol: string;
  name: string;
};

type TradeEvent = {
  id: number;
  side: "buy" | "sell";
  price: number;
  size: number;
  timestamp: Date;
  type: "aggressive" | "passive";
};

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

  // Trade log
  const [tradeLog, setTradeLog] = useState<TradeEvent[]>([]);
  const [isTradeLogOpen, setIsTradeLogOpen] = useState(true);
  const tradeIdRef = useRef(1);
  const candleStoreRef = useRef<CandleStore>(new Map());
  const [candleStore, setCandleStore] = useState<CandleStore>(new Map());

  useBotSimulation(
    simulate, levels, setLevels, setTradeLog, tradeIdRef,
    (store) => { candleStoreRef.current = store; setCandleStore(new Map(store)); }
  );

  // Get ticker info
  useEffect(() => {
    if (!symbol) return;
    async function fetchTicker() {
      try {
        const data = await getTickerBySymbol(symbol);
        setTicker(data);
      } catch (error: any) {
        console.error("Error fetching ticker:", error);
        setError(error.message || "Failed to fetch ticker information.");
      }
    }
    fetchTicker();
  }, [symbol]);

  // Fetch user portfolios
  useEffect(() => {
    if (!userId) return;
    async function fetchPortfolios() {
      try {
        const data = await getUserPortfolios(userId!);
        setPortfolios(data.map((p: any) => ({ portfolioId: p.portfolioId, name: p.name })));
        if (data.length > 0) setSelectedPortfolioId(data[0].portfolioId);
      } catch (err) {
        console.error("Error fetching portfolios:", err);
      }
    }
    fetchPortfolios();
  }, [userId]);

  // Init order book levels
  useEffect(() => {
    const marketPrice = 98 + 0.25 * Math.floor(Math.random() * 17);
    const tick = 0.25;
    const rows = 41;
    const top = marketPrice + Math.floor(rows / 2) * tick;

    const data: Level[] = [];
    for (let i = 0; i < rows; i++) {
      const price = parseFloat((top - i * tick).toFixed(2));
      let bidSize: number | undefined;
      let askSize: number | undefined;

      if (price <= marketPrice) {
        bidSize = Math.round(Math.random() * 10) || undefined;
      } else {
        askSize = Math.round(Math.random() * 10) || undefined;
      }
      data.push({ price, bidSize, askSize });
    }
    setLevels(data);
  }, []);

  // Scroll to market price on first load
  const centerRowRef = useRef<HTMLDivElement>(null);
  const isFirstLoad = useRef(true);
  useEffect(() => {
    if (levels.length > 0 && centerRowRef.current && isFirstLoad.current) {
      centerRowRef.current.scrollIntoView({ block: "center" });
      isFirstLoad.current = false;
    }
  }, [levels]);

  const maxSize = useMemo(() => {
    let m = 1;
    levels.forEach((l) => {
      if (l.bidSize && l.bidSize > m) m = l.bidSize;
      if (l.askSize && l.askSize > m) m = l.askSize;
    });
    return m;
  }, [levels]);

  const bestBid = useMemo(
    () => [...levels].filter((l) => l.bidSize).sort((a, b) => b.price - a.price)[0]?.price,
    [levels]
  );
  const bestAsk = useMemo(
    () => [...levels].filter((l) => l.askSize).sort((a, b) => a.price - b.price)[0]?.price,
    [levels]
  );

  const handleClickMarketBuy  = () => { setOrderSide("buy");  setOrderType("market"); setIsModalOpen(true); };
  const handleClickMarketSell = () => { setOrderSide("sell"); setOrderType("market"); setIsModalOpen(true); };
  const handleClickLevelBuy   = (price: number) => { setOrderSide("buy");  setOrderType("limit"); setLimitPrice(price); setIsModalOpen(true); };
  const handleClickLevelSell  = (price: number) => { setOrderSide("sell"); setOrderType("limit"); setLimitPrice(price); setIsModalOpen(true); };

  if (!symbol) {
    return <>
      <Navbar />
      <div className="orderbook-container">
        <div style={{ color: "#fff", textAlign: "center", padding: "40px" }}>No symbol found.</div>
      </div>
    </>;
  }

  if (error) {
    return <>
      <Navbar />
      <div className="orderbook-container">
        <div style={{ color: "#fff", textAlign: "center", padding: "40px" }}>{error}</div>
      </div>
    </>;
  }

  return (
    <>
      <Navbar />
      <div className="orderbook-container">

        {/* ── Top header ── */}
        <div className="orderbook-header">
          <div className="symbol-info">
            <div>
              <div className="symbol-name">{symbol.toUpperCase()}</div>
              <div className="symbol-description">{ticker?.name}</div>
            </div>
            <div>
              <div className="last-price">
                {levels[Math.floor(levels.length / 2)]?.price?.toFixed(2) ?? "-"}
              </div>
              <div className="last-price-label">Last</div>
            </div>
          </div>

          <div className="market-buttons">
            <button
              className={`sim-button ${simulate ? "sim-active" : ""}`}
              onClick={() => setSimulate(!simulate)}
            >
              {simulate ? "Stop Sim" : "Start Sim"}
            </button>
            <button
              onClick={() => setIsTradeLogOpen(!isTradeLogOpen)}
              style={{
                background:   isTradeLogOpen ? "#374151" : "#1f2937",
                border:       "1px solid #374151",
                borderRadius: "8px",
                color:        isTradeLogOpen ? "#60a5fa" : "#d1d5db",
                cursor:       "pointer",
                padding:      "8px 12px",
                fontSize:     "14px",
                fontWeight:   "700",
                display:      "flex",
                alignItems:   "center",
              }}
            >
              {isTradeLogOpen ? "Hide Log" : "Show Log"}
            </button>
            <button onClick={handleClickMarketBuy}  className="buy-button">BUY MARKET</button>
            <button onClick={handleClickMarketSell} className="sell-button">SELL MARKET</button>
          </div>
        </div>

        {/* ── Main body: [trade log] [order book] [candle chart] ── */}
        <div className="orderbook-body">

          {/* Trade log — fixed width, collapsible */}
          {isTradeLogOpen && (
            <div className="panel-tradelog">
              <TradeLog trades={tradeLog} onClose={() => setIsTradeLogOpen(false)} />
            </div>
          )}

          {/* Order book ladder */}
          <div className="orderbook-panel panel-ladder">
            <div className="orderbook-header-row">
              <div className="header-cell bid-size">Bid Size</div>
              <div className="header-cell bid">Bid</div>
              <div className="header-cell price">Price</div>
              <div className="header-cell ask">Ask</div>
              <div className="header-cell ask-size">Ask Size</div>
            </div>

            <div className="orderbook-ladder">
              {levels.map((lvl, index) => {
                const bidPct  = lvl.bidSize ? Math.min(100, (lvl.bidSize / maxSize) * 100) : 0;
                const askPct  = lvl.askSize ? Math.min(100, (lvl.askSize / maxSize) * 100) : 0;
                const isBestBid = bestBid === lvl.price;
                const isBestAsk = bestAsk === lvl.price;
                const isCenter  = index === Math.floor(levels.length / 2);

                return (
                  <div
                    key={lvl.price}
                    ref={isCenter ? centerRowRef : null}
                    className={`orderbook-row ${isCenter ? "center-row" : ""}`}
                  >
                    {/* Bid Size */}
                    <div className="orderbook-cell bid-size-cell">
                      {lvl.bidSize ? (
                        <>
                          <div className="bid-size-bar" style={{ width: `${bidPct}%` }} />
                          <div className="bid-size-text">{lvl.bidSize.toLocaleString()}</div>
                        </>
                      ) : (
                        <div className="empty-cell">-</div>
                      )}
                    </div>

                    {/* Bid Price */}
                    <div className="orderbook-cell bid-price-cell">
                      {lvl.bidSize ? (
                        <button
                          className={`bid-price-button ${isBestBid ? "best-bid" : "normal-bid"}`}
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
                      <div className={`price-display ${isBestBid ? "best-bid" : isBestAsk ? "best-ask" : "normal"}`}>
                        {lvl.price.toFixed(2)}
                      </div>
                    </div>

                    {/* Ask Price */}
                    <div className="orderbook-cell ask-price-cell">
                      {lvl.askSize ? (
                        <button
                          className={`ask-price-button ${isBestAsk ? "best-ask" : "normal-ask"}`}
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
                          <div className="ask-size-bar" style={{ width: `${askPct}%` }} />
                          <div className="ask-size-text">{lvl.askSize.toLocaleString()}</div>
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

          {/* Candle chart — fixed width panel */}
          <div className="panel-chart">
            <CandleChart candleStore={candleStore} />
          </div>

        </div>

        {/* ── Footer market info ── */}
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
            <span className="live-dot" />
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
        onClose={() => { setIsModalOpen(false); setQty(""); setLimitPrice(null); setSubmitError(null); }}
        onConfirm={async () => {
          if (!ticker || !selectedPortfolioId || !userId) {
            setSubmitError("Missing portfolio, ticker, or login info.");
            return;
          }
          const quantity = parseInt(qty, 10);
          if (!quantity || quantity <= 0) { setSubmitError("Enter a valid quantity."); return; }

          let price: number;
          if (orderType === "limit" && limitPrice != null) price = limitPrice;
          else if (orderSide === "buy"  && bestAsk != null) price = bestAsk;
          else if (orderSide === "sell" && bestBid != null) price = bestBid;
          else { setSubmitError("No market price available."); return; }

          try {
            setSubmitting(true);
            setSubmitError(null);
            await createTransaction({
              user_id:          userId,
              portfolio_id:     selectedPortfolioId,
              ticker_id:        ticker.ticker_id,
              type:             orderSide === "buy" ? "BUY" : "SELL",
              price_per_share:  price,
              quantity,
              timestamp:        new Date().toISOString(),
            });
            setIsModalOpen(false);
            setQty("");
            setLimitPrice(null);
            setSubmitError(null);
          } catch (err: any) {
            setSubmitError(err?.response?.data?.detail || err.message || "Transaction failed.");
          } finally {
            setSubmitting(false);
          }
        }}
      />
    </>
  );
}