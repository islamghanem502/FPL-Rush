import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { hasToken } from '@/lib/token';
import { isAdmin, isFplLinked } from '@/lib/challenge';
import { useMe } from '@/hooks/useAuth';
import { Loading } from '@/components/ui/Misc';

// Route guard. `fpl` = needs a linked FPL account (every challenge screen).
// `admin` = needs the admin role. Admins can use challenge screens unlinked,
// exactly as the backend allows.
export function RequireAuth({ fpl = false, admin = false }) {
  const location = useLocation();
  const { data: me, isPending, isError } = useMe();

  if (!hasToken()) return <Navigate to="/login" state={{ from: location }} replace />;
  if (isPending) return <Loading />;
  if (isError || !me) return <Navigate to="/login" replace />;
  if (admin && !isAdmin(me)) return <Navigate to="/home" replace />;
  if (fpl && !isAdmin(me) && !isFplLinked(me)) return <Navigate to="/register" replace />;

  return <Outlet />;
}

// Signed-in users never see the landing/login screens.
export function GuestOnly() {
  const { data: me } = useMe();
  if (hasToken() && me) return <Navigate to={isAdmin(me) ? '/admin' : '/home'} replace />;
  return <Outlet />;
}
