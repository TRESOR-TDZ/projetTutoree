import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      console.warn("User JSON invalide");
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    const savedToken = localStorage.getItem("token");
    return savedToken || null;
  });

  const login = (userData, authToken) => {
    if (userData) {
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
    }

    if (authToken) {
      setToken(authToken);
      localStorage.setItem("token", authToken);
    } else {
      // On évite de stocker un token vide
      setToken(null);
      localStorage.removeItem("token");
    }
  };

  const logout = async () => {
    try {
      // Appel API à Laravel pour se déconnecter (optionnel selon ta logique backend)
      await api.post("/logout");

      // Nettoyage local
      setUser(null);
      setToken(null);
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    } catch (error) {
      console.error("Erreur lors de la déconnexion :", error);

      // Même en cas d'erreur, on nettoie localement
      setUser(null);
      setToken(null);
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    }
  };

  // Synchronisation automatique à l'initialisation
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      const storedToken = localStorage.getItem("token");

      if (storedUser) setUser(JSON.parse(storedUser));
      if (storedToken) setToken(storedToken);
    } catch (e) {
      console.error("Erreur lors de la lecture du stockage local", e);
      logout(); // Nettoyage en cas de corruption
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
