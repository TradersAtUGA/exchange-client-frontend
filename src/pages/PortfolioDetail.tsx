import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPortfolioHoldings, getPortfolioTranscations } from "../services/portfolio";
import Navbar from "../components/Navbar";
import styles from "./PortfolioDetail.module.css";

interface HoldingOut {
  holdingId: number;
  ticker_id: number;
  quantity: number;
  averagePrice: number;
}

interface TransactionOut {
  transactionId: number;
  portfolioId: number;
  tickerId: number;
  type: "YES" | "NO";
  quantity: number;
  price: number;
  total: number;
  timestamp: string;
}

export default function PortfolioDetail() {
  const { portfolioId } = useParams<{ portfolioId: string }>();
  const [holdings, setHoldings] = useState<HoldingOut[]>([]);
  const [transactions, setTransactions] = useState<TransactionOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"holdings" | "transactions">("holdings");
  const navigate = useNavigate();

  useEffect(() => {
    if (!portfolioId) {
      navigate("/portfolio");
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const [holdingsData, transactionsData] = await Promise.all([
          getPortfolioHoldings(parseInt(portfolioId)),
          getPortfolioTranscations(parseInt(portfolioId)),
        ]);
        setHoldings(holdingsData);
        setTransactions(transactionsData);
      } catch (err: any) {
        setError(err.message || "Failed to fetch portfolio details");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [portfolioId, navigate]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className={styles.container}>
          <div className={styles.loading}>Loading portfolio details...</div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className={styles.container}>
          <div className={styles.error}>{error}</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className={styles.container}>
        <div className={styles.header}>
          <button onClick={() => navigate("/portfolio")} className={styles.backButton}>
            ← Back to Portfolios
          </button>
          <h1 className={styles.title}>Portfolio #{portfolioId}</h1>
        </div>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === "holdings" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("holdings")}
          >
            Holdings
          </button>
          <button
            className={`${styles.tab} ${activeTab === "transactions" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("transactions")}
          >
            Transactions
          </button>
        </div>

        {activeTab === "holdings" && (
          <div className={styles.content}>
            {holdings.length === 0 ? (
              <div className={styles.emptyState}>No holdings in this portfolio</div>
            ) : (
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Holding ID</th>
                      <th>Ticker ID</th>
                      <th>Quantity</th>
                      <th>Avg Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holdings.map((holding) => (
                      <tr key={holding.holdingId}>
                        <td>{holding.holdingId}</td>
                        <td>{holding.ticker_id}</td>
                        <td>{holding.quantity}</td>
                        <td>${holding.averagePrice.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "transactions" && (
          <div className={styles.content}>
            {transactions.length === 0 ? (
              <div className={styles.emptyState}>No transactions in this portfolio</div>
            ) : (
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Ticker ID</th>
                      <th>Type</th>
                      <th>Quantity</th>
                      <th>Price</th>
                      <th>Total</th>
                      <th>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr key={transaction.transactionId}>
                        <td>{transaction.transactionId}</td>
                        <td>{transaction.tickerId}</td>
                        <td>
                          <span className={transaction.type === "YES" ? styles.buyBadge : styles.sellBadge}>
                            {transaction.type}
                          </span>
                        </td>
                        <td>{transaction.quantity}</td>
                        <td>${transaction.price.toFixed(2)}</td>
                        <td>${transaction.total.toFixed(2)}</td>
                        <td>{new Date(transaction.timestamp).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
