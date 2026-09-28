import { lazy, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Shell } from '@/components/layout/Shell';
import { GuestOnly, RequireAuth } from '@/components/layout/RequireAuth';
import { ScrollToTop } from '@/components/layout/ScrollToTop';
import { RouteSeo } from '@/components/layout/RouteSeo';
import Landing from '@/pages/Landing';

// The landing ships in the first bundle (it's the page people and search
// engines arrive on); every other screen loads on first visit.
const load = {
  Login: () => import('@/pages/Login'),
  Register: () => import('@/pages/Register'),
  ForgotPassword: () => import('@/pages/ForgotPassword'),
  Partnership: () => import('@/pages/Partnership'),
  Bonus: () => import('@/pages/Bonus'),
  Home: () => import('@/pages/Home'),
  Challenges: () => import('@/pages/Challenges'),
  ChallengeDetails: () => import('@/pages/ChallengeDetails'),
  CreateChallenge: () => import('@/pages/CreateChallenge'),
  JoinInvite: () => import('@/pages/JoinInvite'),
  PublicChallengeInfo: () => import('@/pages/PublicChallengeInfo'),
  Profile: () => import('@/pages/Profile'),
  Admin: () => import('@/pages/Admin'),
};
const Login = lazy(load.Login);
const Register = lazy(load.Register);
const ForgotPassword = lazy(load.ForgotPassword);
const Partnership = lazy(load.Partnership);
const Bonus = lazy(load.Bonus);
const Home = lazy(load.Home);
const Challenges = lazy(load.Challenges);
const ChallengeDetails = lazy(load.ChallengeDetails);
const CreateChallenge = lazy(load.CreateChallenge);
const JoinInvite = lazy(load.JoinInvite);
const PublicChallengeInfo = lazy(load.PublicChallengeInfo);
const Profile = lazy(load.Profile);
const Admin = lazy(load.Admin);

// Once the first screen is idle, fetch the next likely ones so tapping
// through never waits on a download.
const useWarmRoutes = () =>
  useEffect(() => {
    const warm = () => [load.Login, load.Register, load.Home, load.Challenges, load.ChallengeDetails].forEach((get) => get().catch(() => {}));
    const id = window.requestIdleCallback ? window.requestIdleCallback(warm, { timeout: 4000 }) : window.setTimeout(warm, 2500);
    return () => (window.cancelIdleCallback ? window.cancelIdleCallback(id) : window.clearTimeout(id));
  }, []);

// Clean URLs (/bonus, /challenge/ID). Old /#/… links are moved into the path
// in main.jsx; Vercel serves index.html for every route (vercel.json).
export default function App() {
  useWarmRoutes();
  return (
    <BrowserRouter>
      <ScrollToTop />
      <RouteSeo />
      <Routes>
        <Route element={<Shell />}>
          {/* Public */}
          <Route path="/bonus" element={<Bonus />} />
          <Route path="/partnership" element={<Partnership />} />
          <Route path="/register" element={<Register />} />

          {/* Guests only */}
          <Route element={<GuestOnly />}>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot" element={<ForgotPassword />} />
          </Route>

          {/* Signed in + verified (mandatory — see RequireAuth) */}
          <Route element={<RequireAuth />}>
            <Route path="/home" element={<Home />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Signed in + verified — same guard, grouped for reading */}
          <Route element={<RequireAuth />}>
            <Route path="/challenges" element={<Challenges />} />
            <Route path="/challenges/new" element={<CreateChallenge />} />
            <Route path="/challenges/:id/edit" element={<CreateChallenge />} />
            <Route path="/challenge/:id" element={<ChallengeDetails />} />
            <Route path="/join/:inviteCode" element={<JoinInvite />} />
            <Route path="/public-challenge" element={<PublicChallengeInfo />} />
          </Route>

          <Route element={<RequireAuth admin />}>
            <Route path="/admin" element={<Admin />} />
          </Route>

          {/* Old links */}
          <Route path="/dashboard" element={<Navigate to="/home" replace />} />
          <Route path="/my-challenges" element={<Navigate to="/challenges?f=mine" replace />} />
          <Route path="/private-challenge/new" element={<Navigate to="/challenges/new" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
