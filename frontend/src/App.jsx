import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './layouts/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Reception from './pages/Reception';
import Pharmacy from './pages/Pharmacy';
import Doctor from './pages/Doctor';
import Billing from './pages/Billing';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Laboratory from './pages/Laboratory';
import { SearchProvider } from './context/SearchContext';
import { ToastProvider } from './context/ToastContext';
import { DialogProvider } from './context/DialogContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><div className="w-8 h-8 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/login" />;
  return <AppLayout>{children}</AppLayout>;
};

function App() {
  return (
    <ToastProvider>
      <DialogProvider>
        <AuthProvider>
          <SearchProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/reception" element={<ProtectedRoute><Reception /></ProtectedRoute>} />
                <Route path="/pharmacy" element={<ProtectedRoute><Pharmacy /></ProtectedRoute>} />
                <Route path="/doctor" element={<ProtectedRoute><Doctor /></ProtectedRoute>} />
                <Route path="/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
                <Route path="/lab" element={<ProtectedRoute><Laboratory /></ProtectedRoute>} />
                <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
                <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
                {/* Default fallback */}
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </BrowserRouter>
          </SearchProvider>
        </AuthProvider>
      </DialogProvider>
    </ToastProvider>
  );
}

export default App;
