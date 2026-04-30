import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import Dashboard from "./components/Dashboard";
import Login from "./components/Login";
import Signup from "./components/Signup";
import api from "./api";

const getStoredAuth = () => {
  const token = localStorage.getItem("token");
  const userRaw = localStorage.getItem("user");
  let user = null;

  if (userRaw) {
    try {
      user = JSON.parse(userRaw);
    } catch (error) {
      localStorage.removeItem("user");
    }
  }

  return { token, user };
};

function App() {
  const [auth, setAuth] = useState(getStoredAuth);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const clearAuth = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setAuth({ token: null, user: null });
  };

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (!token) {
        setIsCheckingAuth(false);
        return;
      }

      if (storedUser) {
        setIsCheckingAuth(false);
        return;
      }

      try {
        const response = await api.get("/auth/me");
        const user = response.data?.user || null;
        localStorage.setItem("user", JSON.stringify(user));
        setAuth((prev) => ({ ...prev, user }));
      } catch (error) {
        clearAuth();
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, []);

  const handleAuthSuccess = ({ token, user }) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setAuth({ token, user });
  };

  if (isCheckingAuth) {
    return <div className="loader-screen">Checking session...</div>;
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to={auth.token ? "/dashboard" : "/login"} replace />} />
      <Route
        path="/login"
        element={
          auth.token ? <Navigate to="/dashboard" replace /> : <Login onLoginSuccess={handleAuthSuccess} />
        }
      />
      <Route
        path="/signup"
        element={
          auth.token ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Signup onSignupSuccess={handleAuthSuccess} />
          )
        }
      />
      <Route
        path="/dashboard"
        element={
          auth.token ? (
            <Dashboard user={auth.user} onLogout={clearAuth} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="*"
        element={
          auth.token ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}

export default App;
