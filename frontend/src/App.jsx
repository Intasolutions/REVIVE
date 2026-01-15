import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './layouts/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Reception from './pages/Reception';
import Pharmacy from './pages/Pharmacy';
import Doctor from './pages/Doctor';
import ReportsPage from './pages/Reports';
import ManagePage from './pages/Manage';
import UsersPage from './pages/Users';
import Laboratory from './pages/Laboratory';
import Casualty from './pages/Casualty';
import { SearchProvider } from './context/SearchContext';
import { ToastProvider } from './context/ToastContext';
import { DialogProvider } from './context/DialogContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><div className="w-8 h-8 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/login" />;
  return <AppLayout>{children}</AppLayout>;
};

// Simple Error Boundary Component
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-50 flex flex-col items-center justify-center p-8 text-center">
          <h1 className="text-3xl font-bold text-red-600 mb-4">Something went wrong.</h1>
          <p className="text-slate-700 mb-4 font-mono text-sm bg-red-100 p-4 rounded-lg text-left overflow-auto max-w-3xl">
            {this.state.error?.toString()}
          </p>
          <pre className="text-xs text-slate-500 text-left bg-slate-100 p-4 rounded overflow-auto max-w-3xl max-h-96">
            {this.state.errorInfo?.componentStack}
          </pre>
          <button
            onClick={() => window.location.href = '/'}
            className="mt-6 px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition"
          >
            Go to Dashboard
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <DialogProvider>
          <AuthProvider>
            <SearchProvider>
              <BrowserRouter>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/reception" element={<ProtectedRoute><Reception /></ProtectedRoute>} />
                  <Route path="/lab" element={<ProtectedRoute><Laboratory /></ProtectedRoute>} />
                  <Route path="/casualty" element={<ProtectedRoute><Casualty /></ProtectedRoute>} />
                  <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
                  <Route path="/manage" element={<ProtectedRoute><ManagePage /></ProtectedRoute>} />
                  <Route path="/users" element={<ProtectedRoute><UsersPage /></ProtectedRoute>} />
                  <Route path="/doctor" element={<ProtectedRoute><Doctor /></ProtectedRoute>} />
                  <Route path="/pharmacy" element={<ProtectedRoute><Pharmacy /></ProtectedRoute>} />
                  {/* Default fallback */}
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </BrowserRouter>
            </SearchProvider>
          </AuthProvider>
        </DialogProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
