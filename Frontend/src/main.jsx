import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'react-hot-toast';
import { queryClient } from '@/lib/queryClient';
import App from '@/App';
import '@/styles.css';

// Toasts follow the law: ink surface, cream text, no icons.
const toastOptions = {
  duration: 2800,
  style: {
    background: '#1A1A1A',
    color: '#F5F0E8',
    fontFamily: 'Cairo, system-ui, sans-serif',
    fontWeight: 700,
    fontSize: 13.5,
    borderRadius: 999,
    padding: '10px 16px',
    direction: 'rtl',
  },
  success: { iconTheme: { primary: '#00B5AD', secondary: '#1A1A1A' } },
  error: { iconTheme: { primary: '#E8333A', secondary: '#1A1A1A' } },
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
