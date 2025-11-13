import { Link } from "react-router-dom";
import { useAuth } from "./AuthContext";
import styles from "../styles/AuthNavbar.module.css";

export default function Navbar() {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.navContainer}>
        <Link to="/orderbook" className={styles.logo}>
          Traders@UGA
        </Link>
        
        <div className={styles.navLinks}>
          <Link to="/orderbook" className={styles.navLink}>
            Order Book
          </Link>
          <Link to="/portfolio" className={styles.navLink}>
            Portfolios
          </Link>
        </div>

        <button onClick={handleLogout} className={styles.logoutButton}>
          Logout
        </button>
      </div>
    </nav>
  );
}
