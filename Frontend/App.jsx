import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './store/AuthContext';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PartnershipPage from './pages/PartnershipPage';
import DashboardPage from './pages/DashboardPage';
import AdminDashboard from './pages/AdminDashboard';
import ChallengePage from './pages/ChallengePage';
import VerifyLeaguePage from './pages/VerifyLeaguePage';
import ProfilePage from './pages/ProfilePage';

// Bonus Tracker
import BonusPage from './pages/BonusPage';

// Components
import ProtectedRoute from './components/ProtectedRoute';

const App = () => {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ""}>
      <AuthProvider>
      <Router>
        <AnimatePresence mode="wait">
          <Routes>

            {/* ================= Public Routes ================= */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/Partnership" element={<PartnershipPage />} />
            <Route path="/bonus" element={<BonusPage />} />

            {/* ================= Verification Route ================= */}
            <Route
              path="/verify"
              element={
                <ProtectedRoute>
                  <VerifyLeaguePage />
                </ProtectedRoute>
              }
            />

            {/* ================= Protected Routes (Verified Users Only) ================= */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />

            {/* Profile Route */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            {/* Classic Challenge Route */}
            <Route
              path="/challenge/:id"
              element={
                <ProtectedRoute>
                  <ChallengePage />
                </ProtectedRoute>
              }
            />


            {/* ================= Admin Routes ================= */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute adminOnly={true}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* ================= 404 Redirect ================= */}
            <Route path="*" element={<Navigate to="/" replace />} />

          </Routes>
        </AnimatePresence>
      </Router>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
};

export default App;