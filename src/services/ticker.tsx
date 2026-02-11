import axios from 'axios';

const api = axios.create({
    baseURL: "http://localhost:8000"
});

// attach Authorization header with access_token from localStorage to all requests
api.interceptors.request.use(
    (config) => {
        try {
            const token = localStorage.getItem("access_token");
            if (token) {
                config.headers = { ...(config.headers as any), Authorization: `Bearer ${token}` };
            }
        } catch (e) {
            console.log("Failed to retrieve access token:", e);
        }
        return config;
    },
    (error) => Promise.reject(error)
);

interface Ticker {
    ticker_id: number;
    symbol: string;
    name: string;
}

export async function getTickers(): Promise<Ticker[]> {
    const res = await api.get('/ticker');
    return res.data;
}

export async function getTickerById(ticker_id: number): Promise<Ticker> {
    const res = await api.get(`/ticker/${ticker_id}`);
    return res.data;
}

export async function getTickerBySymbol(symbol: string): Promise<Ticker> {
    const res = await api.get(`/ticker/symbol/${symbol}`);
    return res.data;
}