// src/pages/TickerList.tsx
import Navbar from "../components/Navbar";
import React, { useEffect, useState } from "react";
import { data, useNavigate } from "react-router-dom";
import "./TickerList.css";
import { getTickers, getTickerById } from "../services/ticker";

type Ticker = {
  ticker_id: number;
  symbol: string;
  name: string;
};

export default function TickerList() {
  const [tickers, setTickers] = useState<Ticker[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
        async function fetchTickers() {
            try {
                const res = await getTickers();
                setTickers(res);
                setLoading(false);
            } catch (error) {
                console.error("Failed to fetch tickers:", error);
            }
        }

        fetchTickers();
        }, []);

  const handleTickerClick = (tickerId: number) => {
    navigate(`/orderbook/${tickerId}`);
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="ticker-list-container">
          <div className="loading-message">Loading tickers...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="ticker-list-container">
        <div className="ticker-list-header">
          <h1>Open Markets</h1>
          <p className="ticker-list-subtitle">Select a market to view its order book</p>
        </div>

        <div className="ticker-grid">
          {tickers.map((ticker) => (
            <div key={ticker.ticker_id} className="ticker-card">
              <div className="ticker-card-content">
                <div className="ticker-symbol">{ticker.symbol}</div>
                <div className="ticker-name">{ticker.name}</div>
              </div>
              <button
                className="ticker-view-button"
                onClick={() => handleTickerClick(ticker.ticker_id)}
              >
                View Order Book
              </button>
            </div>
          ))}
        </div>

        {tickers.length === 0 && (
          <div className="no-tickers-message">
            No tickers available.
          </div>
        )}
      </div>
    </>
  );
}
