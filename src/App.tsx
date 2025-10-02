// App.tsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import OrderBook from "./pages/OrderBook";
import Login from "./pages/Login";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login/>}/>
        <Route path="/orderbook" element={<OrderBook />} />
      </Routes>
    </Router>
  );
}

export default App;
