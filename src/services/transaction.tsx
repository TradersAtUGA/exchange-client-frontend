import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
});

api.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem("access_token");
      if (token) {
        config.headers = {
          ...(config.headers as any),
          Authorization: `Bearer ${token}`,
        };
      }
    } catch (e) {
      // ignore localStorage errors
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export interface TransactionPayload {
  user_id: number;
  portfolio_id: number;
  ticker_id: number;
  type: "BUY" | "SELL";
  price_per_share: number;
  quantity: number;
  timestamp: string;
}

export interface TransactionResult {
  transaction_id: number;
  status: string;
}

export async function createTransaction(
  payload: TransactionPayload
): Promise<TransactionResult> {
  const res = await api.post("/transactions/", payload);
  return res.data;
}
