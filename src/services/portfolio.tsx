import axios from "axios"


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
            // ignore localStorage errors (e.g. not available)
        }
        return config;
    },
    (error) => Promise.reject(error)
);

interface HoldingOut {
    holdingId: number,
    ticker_id: number,
    quantity: number,
    averagePrice: number
}

interface TransactionOut{
    transactionId: number,
    portfolioId: number,
    tickerId: number,
    type: "YES" | "NO",
    quantity: number,
    price: number,
    total: number,
    timestamp: string
}

interface PortfolioOut{
    portfolioId: number
    userId: number
    name: string
    description: string | null
}

export async function createUserPortfolio(
    userId: number, 
    portfolioData: { name: string, description: string | null}
): Promise<PortfolioOut>
{
    const res = await api.post(`/users/portfolios`, portfolioData)
    return res.data
}

export async function getUserPortfolios(
    userId: number
): Promise<PortfolioOut[]>
{
    const res = await api.get(`/users/portfolios`)
    return res.data;
}

export async function getPortfolioHoldings(
    portfolioId: number 
): Promise<HoldingOut[]>
{
    const res = await api.get(`/portfolios/${portfolioId}/holdings`)
    return res.data
}

export async function getPortfolioTranscations(
    portfolioId: number
): Promise<TransactionOut[]>
{
    const res = await api.get(`/portfolios/${portfolioId}/transactions`)
    return res.data
}
