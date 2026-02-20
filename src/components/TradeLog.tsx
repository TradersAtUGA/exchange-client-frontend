import React from "react";
import "./TradeLog.css";

type TradeEvent = {
    id: number;
    side: "buy" | "sell";
    price: number;
    size: number;
    timestamp: Date;
    type: "aggressive" | "passive";
};

export default function TradeLog({ trades, onClose }: { trades: TradeEvent[]; onClose: () => void }) {
    return (
        <div className="tradelog">
            <div className="tradelog-header">
                <span className="tradelog-title">ORDER FLOW</span>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <span className="tradelog-count">{trades.length} events</span>
                    <button
                        onClick={onClose}
                        style={{
                            background: "none",
                            border: "none",
                            color: "#6b7280",
                            cursor: "pointer",
                            fontSize: "16px",
                            padding: "0 4px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                        title="Close Trade Log"
                    >
                        ✕
                    </button>
                </div>
            </div>
            <div className="tradelog-header-row">
                <span>TIME</span>
                <span>SIDE</span>
                <span>PRICE</span>
                <span>SIZE</span>
            </div>
            <div className="tradelog-body">
                {trades.map((t) => (
                    <div key={t.id} className={`tradelog-row tradelog-row--${t.type === "aggressive" ? t.side : "passive"}`}>
                        <span className="tradelog-time">
                            {t.timestamp.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </span>
                        <span className="tradelog-side">
                            {t.side === "buy" ? "BUY" : "SELL"}
                        </span>
                        <span className="tradelog-price">{t.price.toFixed(2)}</span>
                        <span className="tradelog-size">{t.size}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}