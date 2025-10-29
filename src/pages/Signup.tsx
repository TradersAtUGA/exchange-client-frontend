import React, { useState } from "react";
import styles from "./Signup.module.css";
import axios from "axios";
import AuthNavbar from "../components/AuthNavbar";


export default function Signup() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setconfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const passwordValidation =
      /^(?=.*[A-Z])(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;

    if (!passwordValidation.test(password)) {
      setError(
        "Password must be at least 8 characters long, contain one uppercase letter, and one special character."
      );
      setLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }
    
    try {
      const response = await axios.post("http://localhost:8000/signup", {
        email,
        password,
      });
      const { access_token } = response.data;

      if (response.status === 200 && access_token) {
        localStorage.setItem("access_token", access_token);
        window.location.href = "/orderbook";
      }
    } catch (err) {
      setError("Server is unavailable");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
    <AuthNavbar />
    <div className={styles.signupContainer}>
      <div className={styles.signupInfo}>
        <h1>Create your login</h1>
        <p>
          We need your full name, email, and password of choice. You'll use this
          to access your personal account.
        </p>
      </div>

      <div className={styles.divider}></div>

      <form className={styles.signupForm} onSubmit={handleSubmit}>
        <div className={styles.nameRow}>
          <div className={styles.inputGroup}>
            <input
              id="firstName"
              value={firstName}
              placeholder="First name"
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <input
              id="lastName"
              value={lastName}
              placeholder="Last name"
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>
        </div>

        <div className={styles.inputGroup}>
          <input
            id="email"
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className={styles.inputGroup}>
          <input
            id="password"
            type="password"
            placeholder="Password (must be at least 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className={styles.inputGroup}>
          <input
            id="confirmPassword"
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setconfirmPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className={styles.signupButton} disabled={loading}>
          Create Account
        </button>
        {error && <p className={styles.errorText}>{error}</p>}

        <p className={styles.redirectText}>
        Already have an account?{" "}
        <a className={styles.logInRedirect} href="/login">
            Log in
        </a>
        </p>

      </form>
    </div>
        </div>

  );
}
