import React from "react";
import styles from "../styles/BuySellModal.module.css";

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
        </div>

        <div className={styles.actions}>
          <button
            className={`${styles.confirmButton} ${sideColor}`}
            onClick={onConfirm}
          >
            Confirm
          </button>
          <button className={styles.closeButton} onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
