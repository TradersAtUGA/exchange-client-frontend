import React from "react";
import styles from "../styles/BuySellModal.module.css";

interface PortfolioOption {
  portfolioId: number;
  name: string;
}

type Props = {
  isOpen: boolean;
  orderSide: "buy" | "sell" | null;
  orderType: "market" | "limit";
  setOrderType: (v: "market" | "limit") => void;
  limitPrice: number | null;
  setLimitPrice: (v: number) => void;
  qty: string;
  onQtyChange: (v: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  portfolios: PortfolioOption[];
  selectedPortfolioId: number | null;
  onPortfolioChange: (id: number) => void;
  submitting?: boolean;
  submitError?: string | null;
};

export default function BuySellModal({
  isOpen,
  orderSide,
  orderType,
  setOrderType,
  limitPrice,
  setLimitPrice,
  qty,
  onQtyChange,
  onClose,
  onConfirm,
  portfolios,
  selectedPortfolioId,
  onPortfolioChange,
  submitting = false,
  submitError = null,
}: Props) {
  if (!isOpen) return null;

  const sideColor =
    orderSide === "buy" ? styles.buyColor : styles.sellColor;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.container}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.title}>
          {orderSide?.toUpperCase()} ORDER
        </div>

        {/* MARKET / LIMIT tabs */}
        <div className={styles.typeSelector}>
          <button
            className={`${styles.typeButton} ${
              orderType === "market" ? styles.typeActive : ""
            }`}
            onClick={() => setOrderType("market")}
          >
            Market
          </button>
          <button
            className={`${styles.typeButton} ${
              orderType === "limit" ? styles.typeActive : ""
            }`}
            onClick={() => setOrderType("limit")}
          >
            Limit
          </button>
        </div>

        {/* Form fields */}
        <div className={styles.content}>

          {/* Portfolio selector */}
          <div className={styles.inputGroup}>
            <label>Portfolio</label>
            {portfolios.length === 0 ? (
              <div style={{ color: "#999", fontSize: 14 }}>
                No portfolios found, please create one first
              </div>
            ) : (
              <select
                className={styles.input}
                value={selectedPortfolioId ?? ""}
                onChange={(e) => onPortfolioChange(Number(e.target.value))}
              >
                <option value="" disabled>
                  Select a portfolio
                </option>
                {portfolios.map((p) => (
                  <option key={p.portfolioId} value={p.portfolioId}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {orderType === "limit" && (
            <div className={styles.inputGroup}>
              <label>Limit Price</label>
              <input
                type="number"
                value={limitPrice ?? ""}
                onChange={(e) => setLimitPrice(parseFloat(e.target.value))}
                className={styles.input}
              />
            </div>
          )}

          <div className={styles.inputGroup}>
            <label>Quantity</label>
            <input
              type="number"
              placeholder="Enter quantity"
              value={qty}
              onChange={(e) => onQtyChange(e.target.value)}
              className={styles.input}
            />
          </div>

          {submitError && (
            <div style={{ color: "#ef4444", fontSize: 14 }}>{submitError}</div>
          )}
        </div>

        <div className={styles.actions}>
          <button
            className={`${styles.confirmButton} ${sideColor}`}
            onClick={onConfirm}
            disabled={submitting}
          >
            {submitting ? "Processing..." : "Confirm"}
          </button>
          <button className={styles.closeButton} onClick={onClose} disabled={submitting}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
