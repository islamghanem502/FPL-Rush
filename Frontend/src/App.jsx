import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Shell } from '@/components/layout/Shell';
import { GuestOnly, RequireAuth } from '@/components/layout/RequireAuth';
import { ScrollToTop } from '@/components/layout/ScrollToTop';

import Landing from '@/pages/Landing';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import Partnership from '@/pages/Partnership';
import Bonus from '@/pages/Bonus';
import Home from '@/pages/Home';
import Challenges from '@/pages/Challenges';
import ChallengeDetails from '@/pages/ChallengeDetails';
import CreateChallenge from '@/pages/CreateChallenge';
import JoinInvite from '@/pages/JoinInvite';
import PublicChallengeInfo from '@/pages/PublicChallengeInfo';
import Profile from '@/pages/Profile';
import Admin from '@/pages/Admin';

// Hash routing is kept on purpose: invite links from the backend are /#/join/CODE.
export default function App() {
  return (
    <HashRouter>
      <ScrollToTop />
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

          {/* Signed in */}
          <Route element={<RequireAuth />}>
            <Route path="/home" element={<Home />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Signed in + FPL linked (the backend requires it for challenges) */}
          <Route element={<RequireAuth fpl />}>
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
    </HashRouter>
  );
}
