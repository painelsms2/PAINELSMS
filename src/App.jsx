import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import ErrorBoundary from './components/ErrorBoundary';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import PanelLayout from './components/PanelLayout';
import Servicos from './pages/panel/Servicos';
import Dashboard from './pages/panel/Dashboard';
import Carteira from './pages/panel/Carteira';
import Configuracoes from './pages/panel/Configuracoes';
import Ajuda from './pages/panel/Ajuda';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import AdminRoute from './components/AdminRoute';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminServices from './pages/admin/AdminServices';
import AdminProviders from './pages/admin/AdminProviders';

const Placeholder = ({ title }) => (
  <div className="page-header"><h1 className="page-title">{title}</h1><p className="text-muted">Em breve.</p></div>
);

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              
              <Route element={<PublicRoute />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
              </Route>

              {/* Protected Routes (Panel) */}
              <Route element={<ProtectedRoute />}>
                <Route path="/panel" element={<PanelLayout />}>
                  <Route index element={<Navigate to="/panel/servicos" replace />} />
                  <Route path="servicos" element={<Servicos />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="carteira" element={<Carteira />} />
                  <Route path="configuracoes" element={<Configuracoes />} />
                  <Route path="ajuda" element={<Ajuda />} />
                </Route>
              </Route>

              {/* Admin Routes */}
              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<PanelLayout />}>
                  <Route index element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="usuarios" element={<AdminUsers />} />
                  <Route path="servicos" element={<AdminServices />} />
                  <Route path="fornecedores" element={<AdminProviders />} />
                </Route>
              </Route>

              {/* Rota 404 */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
