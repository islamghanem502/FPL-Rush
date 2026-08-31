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
import PrivateChallengesPage from './pages/PrivateChallengesPage';
import PrivateChallengeFormPage from './pages/PrivateChallengeFormPage';
import JoinPrivateChallengePage from './pages/JoinPrivateChallengePage';
import PublicChallengeInfoPage from './pages/PublicChallengeInfoPage';

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
                <ProtectedRoute requireFplLink>
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
                <ProtectedRoute requireFplLink>
                  <ChallengePage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/my-challenges"
              element={
                <ProtectedRoute requireFplLink>
                  <PrivateChallengesPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/private-challenge/new"
              element={
                <ProtectedRoute requireFplLink>
                  <PrivateChallengeFormPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/private-challenge/:id/edit"
              element={
                <ProtectedRoute requireFplLink>
                  <PrivateChallengeFormPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/public-challenge"
              element={
                <ProtectedRoute requireFplLink>
                  <PublicChallengeInfoPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/join/:inviteCode"
              element={
                <ProtectedRoute requireFplLink>
                  <JoinPrivateChallengePage />
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
