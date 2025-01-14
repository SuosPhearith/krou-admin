import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import App from './App.tsx';
import axios from 'axios';

// ✅ Set the Authorization token globally
axios.defaults.headers.common['Authorization'] = `Bearer ${localStorage.getItem('authToken')}`;

// ✅ Add Axios Interceptor to handle 401 and 403 errors
axios.interceptors.response.use(
  (response) => response, // Pass through successful responses
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Remove token from localStorage
      localStorage.removeItem('authToken');

      // Redirect to login page
      window.location.href = '/';
    }
    return Promise.reject(error); // Pass the error to be handled by the request
  }
);

// ✅ Create a React Query Client
const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);
