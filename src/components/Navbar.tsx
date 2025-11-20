import { Link } from "react-router-dom";
import { useAuth } from "./AuthContext";
import styles from "../styles/AuthNavbar.module.css";

export default function Navbar() {
  const { userId, logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.navContainer}>
        <Link to={userId ? "/symbolhome" : "/"} className={styles.logo}>
          Traders@UGA
        </Link>

        <div className={styles.navLinks}>
          {userId ? (
            <>
              <Link to="/symbolhome" className={styles.navLink}>
                Home
              </Link>
              <Link to="/portfolio" className={styles.navLink}>
                Portfolios
              </Link>
            </>
          ) : null}
        </div>

        <div className={styles.authButtons}>
          {userId ? (
            <button onClick={handleLogout} className={styles.logoutButton}>
              Logout
            </button>
          ) : (
            <>
              <Link to="/login" className={styles.authButton}>
                Login
              </Link>
              <Link to="/signup" className={styles.authButton}>
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
