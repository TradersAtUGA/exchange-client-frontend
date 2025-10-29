
import styles from "../styles/AuthNavbar.module.css"

export default function Navbar() {
  return (
    <nav className={styles.navbar}>
      <img src="/images/ugatraderslogo.png" alt="Logo" className={styles.logo} />
      <span className={styles.title}>Traders @ UGA</span>
    </nav>
  );
}