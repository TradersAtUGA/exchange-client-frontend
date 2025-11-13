import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserPortfolios } from "../services/portfolio";
import { useAuth } from "../components/AuthContext";
import Navbar from "../components/Navbar";
import styles from "./Portfolio.module.css";

interface PortfolioOut {
  portfolioId: number;
  userId: number;
  name: string;
  description: string | null;
}

export default function Portfolio() {
  const [portfolios, setPortfolios] = useState<PortfolioOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { userId } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) {
      navigate("/login");
      return;
    }

    const fetchPortfolios = async () => {
      try {
        setLoading(true);
        const data = await getUserPortfolios(userId);
        setPortfolios(data);
      } catch (err: any) {
        setError(err.message || "Failed to fetch portfolios");
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolios();
  }, [userId, navigate]);

  const handlePortfolioClick = (portfolioId: number) => {
    navigate(`/portfolio/${portfolioId}`);
  };

  const handleCreatePortfolio = () => {
    navigate("/portfolio/create");
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className={styles.portfolioContainer}>
          <div className={styles.loading}>Loading portfolios...</div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className={styles.portfolioContainer}>
          <div className={styles.error}>{error}</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className={styles.portfolioContainer}>
        <div className={styles.header}>
          <h1 className={styles.title}>My Portfolios</h1>
          <button onClick={handleCreatePortfolio} className={styles.createButton}>
            Create Portfolio
          </button>
        </div>

        {portfolios.length === 0 ? (
          <div className={styles.emptyState}>
            No portfolios yet. Create your first portfolio to get started!
          </div>
        ) : (
          <div className={styles.portfolioGrid}>
            {portfolios.map((portfolio) => (
              <div
                key={portfolio.portfolioId}
                className={styles.portfolioCard}
                onClick={() => handlePortfolioClick(portfolio.portfolioId)}
              >
                <h2 className={styles.portfolioName}>{portfolio.name}</h2>
                <p className={styles.portfolioDescription}>
                  {portfolio.description || "No description"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
