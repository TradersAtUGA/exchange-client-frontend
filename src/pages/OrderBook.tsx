// src/pages/OrderBook.tsx
import Navbar from "../components/Navbar";
import React, { useEffect, useMemo, useState } from "react";
import BuySellModal from "../components/BuySellModal";
import "./OrderBook.css";

type Level = {
  // undefined bid or ask sizes mean there is no volume at that price
  price: number;
  bidSize?: number; 
  askSize?: number; 
};

//hard coded data

export default function OrderBook() {
  const [levels, setLevels] = useState<Level[]>([]);

  // Placing orders
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [orderSide, setOrderSide] = useState<"buy" | "sell" | null>(null);
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [limitPrice, setLimitPrice] = useState<number | null>(null);
  const [qty, setQty] = useState("");


  useEffect(() => {
    const mid = 2769.5; 
    const tick = 0.25;
    const rows = 41; 
    const top = mid + Math.floor(rows / 2) * tick;

    const data: Level[] = [];
    for (let i = 0; i < rows; i++) {
      const price = parseFloat((top - i * tick).toFixed(2));

      const bidSize = Math.random() > 0.4 ? Math.round(Math.random() * 150) : 0;
      const askSize = Math.random() > 0.4 ? Math.round(Math.random() * 150) : 0;
      data.push({
        price,
        bidSize: bidSize > 0 ? bidSize : undefined,
        askSize: askSize > 0 ? askSize : undefined,
      });
    }
    setLevels(data);
  }, []);

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

  

  return (
    <>
      <Navbar />
      <div className="orderbook-container">
        {/* Header with symbol info and market buttons */}
        <div className="orderbook-header">
        <div className="symbol-info">
          <div>
            <div className="symbol-name">Tesla</div>
            <div className="symbol-description">Telsa</div>
          </div>
          <div>
            <div className="last-price">{levels[Math.floor(levels.length/2)]?.price?.toFixed(2) ?? "-"}</div>
            <div className="last-price-label">Last</div>
          </div>
        </div>

        <div className="market-buttons">
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
                  <div className={`price-display ${
                    isBestBid ? 'best-bid' : 
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
      onClose={() => {
        setIsModalOpen(false);
        setQty("");
        setLimitPrice(null);
      }}
      onConfirm={() => {
        console.log({
          side: orderSide,
          type: orderType,
          qty,
          limitPrice,
        });
        setIsModalOpen(false);
      }}
    />
    </>
  );
}
