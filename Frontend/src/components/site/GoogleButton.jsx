import { useEffect, useRef, useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import { errorMessage } from '@/lib/api';
import { useGoogleLogin } from '@/hooks/useAuth';

const MAX = 400; // Google's button can't be wider

// The fastest way in, so it comes first and full width. The button itself
// must be Google's (the backend verifies its ID token), so we frame it: white
// pill inside the kit's black edge + hard shadow — it reads as our button.
// Rendered only when a client id is configured.
export function GoogleButton({ onDone, text = 'continue_with' }) {
  const google = useGoogleLogin();
  const box = useRef(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!box.current) return undefined;
    const measure = () => setWidth(Math.min(MAX, Math.floor(box.current.clientWidth)));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(box.current);
    return () => ro.disconnect();
  }, []);

  if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) return null;
  return (
    <div ref={box} className="w-full">
      <div className="mx-auto w-fit max-w-full overflow-hidden rounded-full border-2 border-edge bg-white shadow-hard transition-[translate,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-hard-lg">
        {width > 0 && (
          <GoogleLogin
            key={width} // Google draws the button once; redraw on resize
            onSuccess={(res) => google.mutate(res.credential, { onSuccess: ({ data }) => onDone(data.user), onError: (e) => toast.error(errorMessage(e)) })}
            onError={() => toast.error('تعذر الدخول بحساب Google')}
            text={text}
            locale="ar"
            shape="pill"
            theme="outline"
            size="large"
            logo_alignment="center"
            width={String(width - 4)}
          />
        )}
      </div>
      {google.isPending && <p className="mt-3 text-center text-[13px] text-white/55">لحظة…</p>}
    </div>
  );
}

// "or with email" — between the Google button and the form.
export const OrEmail = () => (
  <div className="flex items-center gap-3 text-[13px] text-white/40">
    <span className="h-px flex-1 bg-white/10" />
    أو بالبريد الإلكتروني
    <span className="h-px flex-1 bg-white/10" />
  </div>
);
