import { BrowserRouter, Routes, Route, Navigate, Outlet, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from './layouts/AppLayout';
import { HomePage } from './pages/Home';
import { LocalityPage } from './pages/Locality';
import { PropertyPage } from './pages/Property';
import { ComparePage } from './pages/Compare';
import { MapPage } from './pages/Map';
import { AnalyticsPage } from './pages/Analytics';
import { LoginPage } from './pages/Login';
import { SignupPage } from './pages/Signup';
import { ForgotPasswordPage } from './pages/ForgotPassword';
import { VerifyEmailPage } from './pages/VerifyEmail';
import { ToastProvider } from './components/ui/Toast';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const NotFoundPage = () => (
  <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
    <div className="text-6xl font-bold mb-4" style={{ color: '#000000', letterSpacing: '-0.05em' }}>404</div>
    <p className="text-sm mb-6" style={{ color: '#6B7280' }}>This page doesn't exist.</p>
    <Link to="/" className="text-sm font-semibold underline" style={{ color: '#000000' }}>Back to overview</Link>
  </div>
);

// Guard helper: Redirects to /login if not authenticated
const ProtectedRoute = () => {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

// Guest helper: Redirects to / if already authenticated
const PublicRoute = () => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Protected Main Application Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/locality/:id" element={<LocalityPage />} />
                <Route path="/locality/slug/:slug" element={<LocalityPage />} />
                <Route path="/property/:id" element={<PropertyPage />} />
                <Route path="/compare" element={<ComparePage />} />
                <Route path="/map" element={<MapPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Route>

            {/* Public Guest Routes */}
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;

