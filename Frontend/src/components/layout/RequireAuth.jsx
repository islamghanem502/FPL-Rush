import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { hasToken } from '@/lib/token';
import { homeFor, isAdmin, isVerified } from '@/lib/challenge';
import { useMe } from '@/hooks/useAuth';
import { Loading } from '@/components/ui/Misc';

// Route guard for the whole signed-in app. Verification (linked team +
// joined the official league) is mandatory — unverified users go back to
// onboarding, carrying where they were headed (e.g. an invite link).
// `admin` = needs the admin role; admins skip verification.
export function RequireAuth({ admin = false }) {
  const location = useLocation();
  const { data: me, isPending, isError } = useMe();

  if (!hasToken()) return <Navigate to="/login" state={{ from: location }} replace />;
  if (isPending) return <Loading />;
  if (isError || !me) return <Navigate to="/login" replace />;
  if (admin && !isAdmin(me)) return <Navigate to="/home" replace />;
  if (!isAdmin(me) && !isVerified(me)) return <Navigate to="/register" state={{ from: location }} replace />;

  return <Outlet />;
}

// Signed-in users never see the landing/login screens.
export function GuestOnly() {
  const { data: me } = useMe();
  if (hasToken() && me) return <Navigate to={homeFor(me)} replace />;
  return <Outlet />;
}
