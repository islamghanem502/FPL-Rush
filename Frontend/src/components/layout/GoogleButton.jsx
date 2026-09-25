import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import { errorMessage } from '@/lib/api';
import { useGoogleLogin } from '@/hooks/useAuth';

// Rendered only when a client id is configured, so the app still works without it.
export function GoogleButton({ onDone, text = 'continue_with' }) {
  const google = useGoogleLogin();
  if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) return null;
  return (
    <div className="mt-5 border-t border-line pt-5">
      <p className="mb-3 text-center text-[12px] font-bold text-muted">أو تابع بحساب Google</p>
      <div className="flex justify-center">
        <GoogleLogin
          onSuccess={(res) => google.mutate(res.credential, { onSuccess: ({ data }) => onDone(data.user), onError: (e) => toast.error(errorMessage(e)) })}
          onError={() => toast.error('تعذر الدخول بحساب Google')}
          text={text}
          locale="ar"
          shape="pill"
          theme="filled_black"
          width="300"
        />
      </div>
    </div>
  );
}
