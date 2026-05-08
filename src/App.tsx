import { Route, Routes, useLocation } from 'react-router';
import { CoreGenerator, Login, Signup, Welcome, Status, EnvironmentPage, TeamsPage, TeamDetailsPage, FamilyPage, AuditLogs } from './pages';
import SetupMaster from './pages/auth/SetupMaster';
import Recovery from './pages/auth/Recovery';
import ApproveRecovery from './pages/auth/ApproveRecovery';
import Mandatory2FA from './pages/auth/Mandatory2FA';
import { VaultProvider } from './context/VaultContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/Layout/DashboardLayout';
import Dashboard from './pages/dashboard/Dashboard';
import Vault from './pages/vault/Vault';
import Settings from './pages/settings/Settings';

import { VaultProtectedRoute } from './components/VaultProtectedRoute';

import About from './pages/about/About';
import Privacy from './pages/privacy/Privacy';
import Terms from './pages/terms/Terms';
import VaultUnlock from './components/VaultUnlock';
import ForgotPasswordPage from './pages/auth/forgot-password/ForgotPassword';
import ResetPasswordPage from './pages/auth/forgot-password/ResetPassword';
import ScrollToTop from './components/ScrollToTop';
import { Toaster } from './components/ui/toaster';
import Pricing from './pages/pricing/Pricing';
import Checkout from './pages/pricing/Checkout';
import { NetworkProvider } from './context/NetworkContext';
import Header from './components/Header';
import Footer from './components/footer';

function App() {
  const location = useLocation();
  const isAuthRoute = (path: string) => {
    const authStartPaths = ["/login", "/signup", "/forgot-password", "/reset-password", "/unlock-vault", "/setup-master", "/setup-2fa", "/recovery"];
    return authStartPaths.includes(path) || path.startsWith("/auth/");
  };

  const showFooter = !isAuthRoute(location.pathname) && !location.pathname.startsWith('/dashboard') && !location.pathname.startsWith('/vault') && !location.pathname.startsWith('/settings') && !location.pathname.startsWith('/environment') && !location.pathname.startsWith('/teams') && !location.pathname.startsWith('/checkout') && !location.pathname.startsWith('/status');

  return (
    <NetworkProvider>
      <Toaster />
      <VaultProvider>
        <ScrollToTop disallowedRoutes={["/login", "/signup", "/forgot-password", "/reset-password", "/setup-master"]} />
        <Header />
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
        {showFooter && <Footer />}
      </VaultProvider>
    </NetworkProvider>
  );
}

export default App;
