// src/routes/PrivateRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function PrivateRoute({ children, allowedRoles }) {
  const { user } = useAuth();

  // Pas connecté
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si le rôle ne correspond pas, on redirige vers SON dashboard
  if (!allowedRoles.includes(user.role)) {
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
