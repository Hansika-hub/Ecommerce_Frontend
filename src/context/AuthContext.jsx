/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from "react";

// This context holds login state for the ENTIRE app
// Any component can call useAuth() to get/set the logged-in user
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // On refresh, restore user from localStorage so login persists
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Called after successful login — saves token + user to localStorage
  const login = (data) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify({ email: data.email, roles: data.roles }));
    setUser({ email: data.email, roles: data.roles });
  };

  // Called on logout — clears everything
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  // Helper: check if user has a specific role
  const hasRole = (role) => user?.roles?.includes(role);

  const isAdmin = hasRole("ROLE_ADMIN");
  const isLoggedIn = !!user;

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin, isLoggedIn }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook — any component uses this instead of useContext(AuthContext)
export function useAuth() {
  return useContext(AuthContext);
}
