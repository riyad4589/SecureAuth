import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import authService from './services/authService';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Roles from './pages/Roles';
import AuditLogs from './pages/AuditLogs';
import Registrations from './pages/Registrations';
import Register from './pages/Register';
import AccountSecurity from './pages/AccountSecurity';
import ForceChangePassword from './pages/ForceChangePassword';
import Navbar from './components/Navbar';
import { ToastProvider } from './components/Toast';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());
  const [mustChangePassword, setMustChangePassword] = useState(false);

  useEffect(() => {
    setIsAuthenticated(authService.isAuthenticated());
    const user = authService.getUser();
    setMustChangePassword(user?.mustChangePassword || false);
  }, []);

  const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" />;
    }
    // Rediriger vers la page de changement de mot de passe si nécessaire
    if (mustChangePassword) {
      return <Navigate to="/change-password" />;
    }
    return children;
  };

  return (
    <ToastProvider>
      <Router>
        <div className="app">
          {isAuthenticated && !mustChangePassword && <Navbar setIsAuthenticated={setIsAuthenticated} />}
          <Routes>
            <Route path="/register" element={<Register />} />
            <Route 
              path="/login" 
              element={
                isAuthenticated ? <Navigate to="/dashboard" /> : <Login setIsAuthenticated={setIsAuthenticated} setMustChangePassword={setMustChangePassword} />
              } 
            />
          <Route 
            path="/change-password" 
            element={
              isAuthenticated ? <ForceChangePassword setMustChangePassword={setMustChangePassword} /> : <Navigate to="/login" />
            } 
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <Users />
              </ProtectedRoute>
            }
          />
          <Route
            path="/roles"
            element={
              <ProtectedRoute>
                <Roles />
              </ProtectedRoute>
            }
          />
          <Route
            path="/audit"
            element={
              <ProtectedRoute>
                <AuditLogs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/registrations"
            element={
              <ProtectedRoute>
                <Registrations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account/security"
            element={
              <ProtectedRoute>
                <AccountSecurity setIsAuthenticated={setIsAuthenticated} />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </div>
      </Router>
    </ToastProvider>
  );
}

export default App;
