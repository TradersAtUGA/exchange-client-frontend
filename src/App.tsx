// App.tsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./components/AuthContext";
import OrderBook from "./pages/OrderBook";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Portfolio from "./pages/Portfolio";
import CreatePortfolio from "./pages/CreatePortfolio";
import PortfolioDetail from "./pages/PortfolioDetail";
import SymbolHome from "./pages/SymbolHome";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/orderbook/:symbol" element={<OrderBook />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/portfolio/create" element={<CreatePortfolio />} />
          <Route path="/portfolio/:portfolioId" element={<PortfolioDetail />} />
          <Route path="/symbolhome" element={<SymbolHome />} />

        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
