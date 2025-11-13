import axios from "axios"


const api = axios.create({
  baseURL: "http://localhost:8000"
});

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
    const res = await api.post(`/users/${userId}/portfolios`, portfolioData)
    return res.data
}

export async function getUserPortfolios(
    userId: number
): Promise<PortfolioOut[]>
{
    const res = await api.get(`users/${userId}/portfolios`)
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
