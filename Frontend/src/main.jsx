import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'react-hot-toast';
import { queryClient } from '@/lib/queryClient';
import App from '@/App';
import '@/styles.css';

// v3 toasts: a raised night pill with the black edge; pitch = success.
// (Old v2 screens get them too — a dark toast reads fine on either.)
const toastOptions = {
  duration: 3000,
  style: {
    background: '#25262a',
    color: '#fff',
    border: '2px solid #000',
    boxShadow: '0 4px 0 0 #000',
    fontFamily: '"IBM Plex Sans Arabic", system-ui, sans-serif',
    fontWeight: 600,
    fontSize: 14,
    borderRadius: 999,
    padding: '10px 16px',
    direction: 'rtl',
  },
  success: { iconTheme: { primary: '#13a853', secondary: '#000' } },
  error: { iconTheme: { primary: '#ff6b5a', secondary: '#000' } },
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
      <QueryClientProvider client={queryClient}>
        <App />
        <Toaster position="top-center" toastOptions={toastOptions} />
      </QueryClientProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>,
);
