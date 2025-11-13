import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserPortfolio } from "../services/portfolio";
import { useAuth } from "../components/AuthContext";
import Navbar from "../components/Navbar";
import styles from "./CreatePortfolio.module.css";

export default function CreatePortfolio() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { userId } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId) {
      setError("You must be logged in to create a portfolio");
      return;
    }

    if (!name.trim()) {
      setError("Portfolio name is required");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await createUserPortfolio(userId, {
        name: name.trim(),
        description: description.trim() || null,
      });
      navigate("/portfolio");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create portfolio");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className={styles.container}>
        <div className={styles.formContainer}>
          <h1 className={styles.title}>Create New Portfolio</h1>
          
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="name" className={styles.label}>
                Portfolio Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={styles.input}
                placeholder="Enter portfolio name"
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="description" className={styles.label}>
                Description (Optional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={styles.textarea}
                placeholder="Enter portfolio description"
                rows={4}
              />
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <div className={styles.buttonGroup}>
              <button
                type="button"
                onClick={() => navigate("/portfolio")}
                className={styles.cancelButton}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.submitButton}
                disabled={loading}
              >
                {loading ? "Creating..." : "Create Portfolio"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
