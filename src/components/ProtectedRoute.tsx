import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { userId } = useAuth();
  const token = localStorage.getItem("access_token");

  if (!token || !userId) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

