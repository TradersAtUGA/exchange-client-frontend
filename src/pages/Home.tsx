import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getAllStocks, type Stock } from "../api/exchangeApi";
import MainNavbar from "../components/MainNavbar";
import styles from "./Home.module.css";

type SortField = "ticker" | "name" | "currentPrice" | "priceChange" | "priceChangePercent" | "volume" | "marketCap";
type SortDirection = "asc" | "desc";

export default function Home() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("ticker");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const navigate = useNavigate();

  // ============================================
  // DATA FETCHING - Replace with your API call
  // ============================================
  useEffect(() => {
    const fetchStocks = async () => {
      try {
        setLoading(true);
        // TODO: Replace getAllStocks() with your actual API endpoint
        // Example: const response = await axios.get('/api/stocks');
        // const data = response.data;
        const data = await getAllStocks();
        setStocks(data);
        setError(null);
      } catch (err) {
        setError("Failed to load stocks. Please try again later.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStocks();
    
    // Optional: Set up polling/refresh interval for real-time updates
    // const interval = setInterval(fetchStocks, 5000); // Refresh every 5 seconds
    // return () => clearInterval(interval);
  }, []);

  const handleStockClick = () => {
    navigate("/orderbook");
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredAndSortedStocks = useMemo(() => {
    let filtered = stocks.filter((stock) => {
      const query = searchQuery.toLowerCase();
      return (
        stock.ticker.toLowerCase().includes(query) ||
        stock.name.toLowerCase().includes(query)
      );
    });

    const sorted = [...filtered].sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;

      switch (sortField) {
        case "ticker":
          aValue = a.ticker;
          bValue = b.ticker;
          break;
        case "name":
          aValue = a.name;
          bValue = b.name;
          break;
        case "currentPrice":
          aValue = a.currentPrice;
          bValue = b.currentPrice;
          break;
        case "priceChange":
          aValue = a.priceChange ?? 0;
          bValue = b.priceChange ?? 0;
          break;
        case "priceChangePercent":
          aValue = a.priceChangePercent ?? 0;
          bValue = b.priceChangePercent ?? 0;
          break;
        case "volume":
          aValue = a.volume ?? 0;
          bValue = b.volume ?? 0;
          break;
        case "marketCap":
          aValue = a.marketCap ?? 0;
          bValue = b.marketCap ?? 0;
          break;
        default:
          return 0;
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortDirection === "asc"
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });

    return sorted;
  }, [stocks, searchQuery, sortField, sortDirection]);

  const formatPrice = (price: number) => {
    return price.toFixed(2);
  };

  const formatChange = (change: number) => {
    return change >= 0 ? `+${change.toFixed(2)}` : change.toFixed(2);
  };

  const formatChangePercent = (percent: number) => {
    return percent >= 0 ? `+${percent.toFixed(2)}%` : `${percent.toFixed(2)}%`;
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(2)}M`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(2)}K`;
    }
    return volume.toLocaleString();
  };

  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 1000000000000) {
      return `$${(marketCap / 1000000000000).toFixed(2)}T`;
    } else if (marketCap >= 1000000000) {
      return `$${(marketCap / 1000000000).toFixed(2)}B`;
    } else if (marketCap >= 1000000) {
      return `$${(marketCap / 1000000).toFixed(2)}M`;
    }
    return `$${marketCap.toLocaleString()}`;
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className={styles.sortIcon}>↕</span>;
    return (
      <span className={styles.sortIcon}>
        {sortDirection === "asc" ? "↑" : "↓"}
      </span>
    );
  };

  if (loading) {
    return (
      <>
        <MainNavbar />
        <div className={styles.container}>
          <div className={styles.loading}>Loading stocks...</div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <MainNavbar />
        <div className={styles.container}>
          <div className={styles.error}>{error}</div>
        </div>
      </>
    );
  }

  return (
    <>
      <MainNavbar />
      <div className={styles.container}>
        <div className={styles.header}>
        <div className={styles.headerTop}>
          <h1 className={styles.title}>Market Overview</h1>
        </div>
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search by ticker or company name..."
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.stocksTable}>
          <thead>
            <tr>
              <th
                className={styles.sortableHeader}
                onClick={() => handleSort("ticker")}
              >
                Symbol <SortIcon field="ticker" />
              </th>
              <th
                className={styles.sortableHeader}
                onClick={() => handleSort("name")}
              >
                Company <SortIcon field="name" />
              </th>
              <th
                className={`${styles.sortableHeader} ${styles.rightAlign}`}
                onClick={() => handleSort("currentPrice")}
              >
                Price <SortIcon field="currentPrice" />
              </th>
              <th
                className={`${styles.sortableHeader} ${styles.rightAlign}`}
                onClick={() => handleSort("priceChange")}
              >
                Change <SortIcon field="priceChange" />
              </th>
              <th
                className={`${styles.sortableHeader} ${styles.rightAlign}`}
                onClick={() => handleSort("priceChangePercent")}
              >
                Change % <SortIcon field="priceChangePercent" />
              </th>
              <th
                className={`${styles.sortableHeader} ${styles.rightAlign}`}
                onClick={() => handleSort("volume")}
              >
                Volume <SortIcon field="volume" />
              </th>
              <th
                className={`${styles.sortableHeader} ${styles.rightAlign}`}
                onClick={() => handleSort("marketCap")}
              >
                Market Cap <SortIcon field="marketCap" />
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedStocks.map((stock) => (
              <tr
                key={stock.id}
                className={styles.tableRow}
                onClick={handleStockClick}
              >
                <td className={styles.tickerCell}>
                  <span className={styles.ticker}>{stock.ticker}</span>
                </td>
                <td className={styles.nameCell}>{stock.name}</td>
                <td className={`${styles.priceCell} ${styles.rightAlign}`}>
                  ${formatPrice(stock.currentPrice)}
                </td>
                <td
                  className={`${styles.changeCell} ${styles.rightAlign} ${
                    stock.priceChange !== undefined
                      ? stock.priceChange >= 0
                        ? styles.positive
                        : styles.negative
                      : ""
                  }`}
                >
                  {stock.priceChange !== undefined
                    ? formatChange(stock.priceChange)
                    : "-"}
                </td>
                <td
                  className={`${styles.changeCell} ${styles.rightAlign} ${
                    stock.priceChangePercent !== undefined
                      ? stock.priceChangePercent >= 0
                        ? styles.positive
                        : styles.negative
                      : ""
                  }`}
                >
                  {stock.priceChangePercent !== undefined
                    ? formatChangePercent(stock.priceChangePercent)
                    : "-"}
                </td>
                <td className={`${styles.volumeCell} ${styles.rightAlign}`}>
                  {stock.volume ? formatVolume(stock.volume) : "-"}
                </td>
                <td className={`${styles.marketCapCell} ${styles.rightAlign}`}>
                  {stock.marketCap ? formatMarketCap(stock.marketCap) : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>
    </>
  );
}
