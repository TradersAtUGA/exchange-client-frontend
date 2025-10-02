import React, { useState } from "react";
import "./Login.css"; 
import axios from "axios";

export default function Login() {
  // start off as empty inputs 
  const [email, updateEmail] = useState(""); 
  const [password, updatePassword] = useState("");
  const [loading, updateLoading] = useState(false)
  const [error, updateError] = useState("")

  // function to handle form submissions
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    updateLoading(true);
    updateError("");
  
    try {
      const response = await axios.post('http://localhost:8000/login', { email, password });
      const { access_token } = response.data;
  
      if (response.status === 200 && access_token) {
        localStorage.setItem("access_token", access_token);
        window.location.href = "/orderbook"; // redirect only on success
      } else {
        updateError("Login failed: Invalid credentials.");
      }
  
    } catch (err) {
      updateError("Server is unavailable");
    } finally {
      updateLoading(false);
    }
  };


  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h1>Log in</h1>

        <div className="input-group">
          <label>Email:</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => updateEmail(e.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <label>Password:</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => updatePassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="login-button" disabled={loading}>
          Log in
        </button>
      {error && <p style={{ color: "red" }}>{error}</p>}
      </form>

      <div className="divider" />

      <div className="welcome-section">
        <h1>Traders@UGA</h1>
        <p>Log in to access the exchange</p>
        <div className="new-user-redirect">
          <p>New user?</p>
          <a id="sign-up-redirect" href="/">
            Create an account
          </a>
        </div>
      </div>
    </div>
  );
  }