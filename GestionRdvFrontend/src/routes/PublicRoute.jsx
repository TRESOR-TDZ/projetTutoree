
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function PublicRoute({ children }) {
  const { user } = useAuth();

  if (user) {
    // Redirige vers le dashboard en fonction du rôle
    const dashboards = {
      0: "/patient/dashboard",
      1: "/docteur/dashboard",
      2: "/admin-structure/dashboard",
      3: "/admin-systeme/dashboard",
    };
    return <Navigate to={dashboards[user.role] || "/"} replace />;
  }

  return children;
}
