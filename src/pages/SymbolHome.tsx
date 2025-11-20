import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../components/AuthContext";
import styles from "./SymbolHome.module.css";

// Placeholder symbol data for now
const stubSymbols = [
  { symbol: "TSLA", name: "Tesla Inc.", last: 273.42, change: 1.8, sector: "Automotive" },
  { symbol: "AAPL", name: "Apple Inc.", last: 212.15, change: -0.4, sector: "Consumer Tech" },
  { symbol: "MSFT", name: "Microsoft Corp.", last: 415.87, change: 0.7, sector: "Software" },
  { symbol: "AMZN", name: "Amazon.com Inc.", last: 187.66, change: 2.1, sector: "E‑Commerce" },
  { symbol: "NVDA", name: "NVIDIA Corp.", last: 912.30, change: 3.2, sector: "Semiconductors" },
];

export default function SymbolHome() {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const [query, setQuery] = useState("");
  const [symbols, setSymbols] = useState(stubSymbols);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!userId && !token) navigate("/login");
    // TODO: fetch symbols from backend here and setSymbols(response)
  }, [userId, navigate]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return symbols;
    return symbols.filter(
      (s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
    );
  }, [symbols, query]);

  const handleSelect = (symbol: string) => {
    navigate(`/orderbook/${symbol.toUpperCase()}`);
  };

  return (
    <>
      <Navbar />
      <div className={styles.page}>
        <header className={styles.hero}>
          <div>
            <p className={styles.eyebrow}>Market Center</p>
            <h1 className={styles.title}>Choose a symbol to open its order book</h1>
            <p className={styles.subtitle}>
              Search or tap one of the trending tickers to view its order book.
            </p>
            <div className={styles.searchRow}>
              <input
                className={styles.searchInput}
                placeholder="Search ticker or company..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && filtered[0]) handleSelect(filtered[0].symbol);
                }}
              />
              <button className={styles.searchButton} onClick={() => filtered[0] && handleSelect(filtered[0].symbol)}>
                View Order Book
              </button>
            </div>
          </div>
        </header>

        <section className={styles.grid}>
          {filtered.map((s) => (
            <button key={s.symbol} className={styles.card} onClick={() => handleSelect(s.symbol)}>
              <div className={styles.cardHeader}>
                <span className={styles.symbol}>{s.symbol}</span>
                <span className={`${styles.change} ${s.change >= 0 ? styles.up : styles.down}`}>
                  {s.change >= 0 ? "+" : ""}
                  {s.change.toFixed(1)}%
                </span>
              </div>
              <div className={styles.name}>{s.name}</div>
              <div className={styles.meta}>
                <span className={styles.last}>${s.last.toFixed(2)}</span>
                <span className={styles.sector}>{s.sector}</span>
              </div>
            </button>
          ))}
        </section>
      </div>
    </>
  );
}
