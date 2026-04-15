import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#161616',
            color: '#f9fafb',
            border: '1px solid #222222',
            borderRadius: '8px',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#3b82f6', secondary: '#0a0a0a' } },
        }}
      />
    </QueryClientProvider>
  </React.StrictMode>
);
