import { useState, useEffect, createContext, useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { Toaster, toast } from "sonner";
import "@/App.css";

// Pages
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Lots from "@/pages/Lots";
import Challans from "@/pages/Challans";
import CuttingForm from "@/pages/CuttingForm";
import StitchingForm from "@/pages/StitchingForm";
import BartackForm from "@/pages/BartackForm";
import WashingForm from "@/pages/WashingForm";
import LotDetail from "@/pages/LotDetail";
import ChallanView from "@/pages/ChallanView";
import ImportExport from "@/pages/ImportExport";
import Reports from "@/pages/Reports";
import ChangePassword from "@/pages/ChangePassword";
import Settings from "@/pages/Settings";
import Layout from "@/components/Layout";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

// API instance with auth
export const api = axios.create({
  baseURL: API,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("fabverse_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("fabverse_token");
      localStorage.removeItem("fabverse_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Protected Route
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Layout>{children}</Layout>;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("fabverse_token");
    const savedUser = localStorage.getItem("fabverse_user");
    if (token && savedUser) {
      setIsAuthenticated(true);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await axios.post(`${API}/auth/login`, { username, password });
      const { token, username: user } = response.data;
      localStorage.setItem("fabverse_token", token);
      localStorage.setItem("fabverse_user", JSON.stringify({ username: user }));
      setIsAuthenticated(true);
      setUser({ username: user });
      toast.success("Login successful");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.detail || "Login failed");
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("fabverse_token");
    localStorage.removeItem("fabverse_user");
    setIsAuthenticated(false);
    setUser(null);
    toast.success("Logged out");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <div className="animate-pulse text-2xl font-bold text-blue-600">FABVERSE</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      <BrowserRouter>
        <Toaster richColors position="top-right" />
        <Routes>
          <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/lots" element={<ProtectedRoute><Lots /></ProtectedRoute>} />
          <Route path="/challans" element={<ProtectedRoute><Challans /></ProtectedRoute>} />
          <Route path="/cutting/new" element={<ProtectedRoute><CuttingForm /></ProtectedRoute>} />
          <Route path="/cutting/:lotId" element={<ProtectedRoute><CuttingForm /></ProtectedRoute>} />
          <Route path="/lot/:lotId" element={<ProtectedRoute><LotDetail /></ProtectedRoute>} />
          <Route path="/lot/:lotId/stitching" element={<ProtectedRoute><StitchingForm /></ProtectedRoute>} />
          <Route path="/lot/:lotId/bartack" element={<ProtectedRoute><BartackForm /></ProtectedRoute>} />
          <Route path="/lot/:lotId/washing" element={<ProtectedRoute><WashingForm /></ProtectedRoute>} />
          <Route path="/challan/:challanId" element={<ProtectedRoute><ChallanView /></ProtectedRoute>} />
          <Route path="/import-export" element={<ProtectedRoute><ImportExport /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

export default App;
