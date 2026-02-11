import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import styles from "./MainNavbar.module.css";

export default function MainNavbar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.navLeft}>
        <img src="/images/ugatraderslogo.png" alt="Logo" className={styles.logo} />
        <span className={styles.title}>Traders @ UGA</span>
      </div>
      <div className={styles.navRight}>

        <button className={styles.logoutButton} onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}

