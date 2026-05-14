import { lazy, Suspense } from 'react';
import { Route, Routes, useLocation } from 'react-router';
import { VaultProvider } from './context/VaultContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/Layout/DashboardLayout';
import { VaultProtectedRoute } from './components/VaultProtectedRoute';
import VaultUnlock from './components/VaultUnlock';
import ScrollToTop from './components/ScrollToTop';
import { Toaster } from './components/ui/toaster';
import { NetworkProvider } from './context/NetworkContext';
import Header from './components/Header';
import Footer from './components/footer';

// Pages — code-split so each route only loads what it needs
const Welcome = lazy(() => import('./pages/welcome/Welcome'));
const CoreGenerator = lazy(() => import('./pages/core-generator/CoreGenerator'));
const Login = lazy(() => import('./pages/auth/login'));
const Signup = lazy(() => import('./pages/auth/signup'));
const Status = lazy(() => import('./pages/status/Status'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/forgot-password/ForgotPassword'));
const ResetPasswordPage = lazy(() => import('./pages/auth/forgot-password/ResetPassword'));
const About = lazy(() => import('./pages/about/About'));
const Pricing = lazy(() => import('./pages/pricing/Pricing'));
const Privacy = lazy(() => import('./pages/privacy/Privacy'));
const Terms = lazy(() => import('./pages/terms/Terms'));

const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'));
const Vault = lazy(() => import('./pages/vault/Vault'));
const Settings = lazy(() => import('./pages/settings/Settings'));
const AuditLogs = lazy(() => import('./pages/settings/AuditLogs'));
const EnvironmentPage = lazy(() => import('./pages/environment/EnvironmentPage'));
const TeamsPage = lazy(() => import('./pages/teams/TeamsPage'));
const TeamDetailsPage = lazy(() => import('./pages/teams/TeamDetailsPage'));
const FamilyPage = lazy(() => import('./pages/family/FamilyPage'));

const Checkout = lazy(() => import('./pages/pricing/Checkout'));
const SetupMaster = lazy(() => import('./pages/auth/SetupMaster'));
const Mandatory2FA = lazy(() => import('./pages/auth/Mandatory2FA'));
const Recovery = lazy(() => import('./pages/auth/Recovery'));
const ApproveRecovery = lazy(() => import('./pages/auth/ApproveRecovery'));

// Exact auth paths that suppress header/footer — O(1) lookup
const AUTH_PATHS = new Set([
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/unlock-vault',
  '/setup-master',
  '/setup-2fa',
  '/recovery',
]);

const isAuthRoute = (path: string) => AUTH_PATHS.has(path) || path.startsWith('/auth/');

function App() {
  const location = useLocation();

  const showFooter =
    !isAuthRoute(location.pathname) &&
    !location.pathname.startsWith('/dashboard') &&
    !location.pathname.startsWith('/vault') &&
    !location.pathname.startsWith('/settings') &&
    !location.pathname.startsWith('/environment') &&
    !location.pathname.startsWith('/teams') &&
    !location.pathname.startsWith('/checkout') &&
    !location.pathname.startsWith('/status');

  return (
    <NetworkProvider>
      <Toaster />
      <VaultProvider>
        <ScrollToTop disallowedRoutes={['/login', '/signup', '/forgot-password', '/reset-password', '/setup-master']} />
        <Header />
        <Suspense fallback={null}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Welcome />} />
            <Route path="/generator" element={<CoreGenerator />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/status" element={<Status />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            <Route path="/about" element={<About />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/unlock-vault" element={<VaultUnlock />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<VaultProtectedRoute><DashboardLayout /></VaultProtectedRoute>}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/vault" element={<Vault />} />
                <Route path="/settings" element={<Settings />} />

                <Route path="/settings/audit" element={<AuditLogs />} />

                {/* Infrastructure */}
                <Route path="/environment" element={<EnvironmentPage />} />

                {/* Collaboration */}
                <Route path="/teams" element={<TeamsPage />} />
                <Route path="/teams/:teamId" element={<TeamDetailsPage />} />
                <Route path="/family" element={<FamilyPage />} />
              </Route>

              <Route path="/checkout" element={<Checkout />} />
              <Route path="/setup-master" element={<SetupMaster />} />
              <Route path="/setup-2fa" element={<Mandatory2FA />} />
              <Route path="/recovery" element={<Recovery />} />
              <Route path="/auth/recover/approve/:token" element={<ApproveRecovery />} />
            </Route>
          </Routes>
        </Suspense>
        {showFooter && <Footer />}
      </VaultProvider>
    </NetworkProvider>
  );
}

export default App;
