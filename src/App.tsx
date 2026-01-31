// App.tsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./components/AuthContext";
import TickerList from "./pages/TickerList";
import OrderBookDetail from "./pages/OrderBookDetail";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Portfolio from "./pages/Portfolio";
import CreatePortfolio from "./pages/CreatePortfolio";
import PortfolioDetail from "./pages/PortfolioDetail";
import OrderBook from "./pages/OrderBook";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/orderbook" element={<TickerList />} />
          <Route path="/orderbook/:ticker_id" element={<OrderBookDetail />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/portfolio/create" element={<CreatePortfolio />} />
          <Route path="/portfolio/:portfolioId" element={<PortfolioDetail />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
