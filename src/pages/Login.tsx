import React, { useState } from "react";
import axios from "axios";
import styles from "./Login.module.css";

export default function Login() {
  // start off as empty inputs 
  const [email, setEmail] = useState(""); 
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // function to handle form submissions
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
  
    try {
      const response = await axios.post("http://localhost:8000/login", { email, password });
      const { access_token } = response.data;
  
      if (response.status === 200 && access_token) {
        localStorage.setItem("access_token", access_token);
        window.location.href = "/orderbook"; // redirect only on success
      } else {
        setError("Login failed: Invalid credentials.");
      }
  
    } catch (err) {
      setError("Server is unavailable");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <form className={styles.loginForm} onSubmit={handleSubmit}>
        <h1>Log in</h1>

        <div className={styles.inputGroup}>
          <label>Email:</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={styles.input}
          />
        </div>

        <div className={styles.inputGroup}>
          <label>Password:</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={styles.input}
          />
        </div>

        <button type="submit" className={styles.loginButton} disabled={loading}>
          Log in
        </button>

        {error && <p className={styles.errorText}>{error}</p>}
      </form>

      <div className={styles.divider} />

      <div className={styles.welcomeSection}>
        <h1>Traders@UGA</h1>
        <p>Log in to access the exchange</p>
        <div className={styles.newUserRedirect}>
          <p>New user?</p>
          <a className={styles.signUpRedirect} href="/signup">
            Create an account
          </a>
        </div>
      </div>
    </div>
  );
}
