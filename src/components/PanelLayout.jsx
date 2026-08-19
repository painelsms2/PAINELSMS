import { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { LogOut, User, Menu, ChevronDown, Smartphone, LayoutDashboard, Settings, HelpCircle, X, Loader2 } from 'lucide-react';
import { SidebarCanvas } from './SidebarCanvas';
import './PanelLayout.css';

import { RechargeModal } from './RechargeModal';

const PanelLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path) => {
    return location.pathname.startsWith(path) ? 'active' : '';
  };

  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="panel-layout">
      {/* Recharge Modal */}
      <RechargeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={closeSidebar}></div>
      )}

      {/* Sidebar */}
      <aside className={`panel-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <SidebarCanvas />
        <div className="sidebar-header" style={{ position: 'relative', zIndex: 10 }}>
          <Link to="/panel" className="logo-text" onClick={closeSidebar}>
            Painel<span style={{ color: 'var(--primary-color)' }}>SMS</span>
          </Link>
          <button className="btn-close-sidebar" onClick={closeSidebar}>
            <X size={24} />
          </button>
        </div>
        
        <nav className="sidebar-nav" style={{ position: 'relative', zIndex: 10 }}>
          <Link to="/panel/servicos" className={`nav-item ${isActive('/panel/servicos')}`} onClick={closeSidebar}>
            <Smartphone size={20} />
            <span>Serviços</span>
          </Link>
          <Link to="/panel/dashboard" className={`nav-item ${isActive('/panel/dashboard')}`} onClick={closeSidebar}>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </Link>
          <Link to="/panel/configuracoes" className={`nav-item ${isActive('/panel/configuracoes')}`} onClick={closeSidebar}>
            <Settings size={20} />
            <span>Configurações</span>
          </Link>
          <Link to="/panel/ajuda" className={`nav-item ${isActive('/panel/ajuda')}`} onClick={closeSidebar}>
            <HelpCircle size={20} />
            <span>Ajuda</span>
          </Link>

          {user?.role === 'admin' && (
            <>
              <div style={{ marginTop: '2rem', marginBottom: '0.5rem', paddingLeft: '1.5rem', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold', letterSpacing: '1px' }}>
                Administração
              </div>
              <Link to="/admin/dashboard" className={`nav-item ${isActive('/admin/dashboard')}`} onClick={closeSidebar}>
                <LayoutDashboard size={20} />
                <span>Métricas</span>
              </Link>
              <Link to="/admin/usuarios" className={`nav-item ${isActive('/admin/usuarios')}`} onClick={closeSidebar}>
                <User size={20} />
                <span>Usuários</span>
              </Link>
              <Link to="/admin/servicos" className={`nav-item ${isActive('/admin/servicos')}`} onClick={closeSidebar}>
                <Settings size={20} />
                <span>Gestão Serviços</span>
              </Link>
            </>
          )}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="panel-main">
        {/* Topbar Navigation */}
        <header className="panel-topbar">
          <div className="topbar-search">
            <button className="btn-hamburger" onClick={() => setIsSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <span className="text-muted font-semibold hide-mobile">Painel de Controle</span>
          </div>

          <div className="topbar-user">
            {/* Brazil Flag (Visual) */}
            <img 
              src="https://flagcdn.com/w40/br.png" 
              alt="Brasil" 
              className="country-flag hide-mobile" 
              title="Brasil"
            />

            <span className="balance-display">
              R$ {Number(user?.balance || 0).toFixed(2)}
            </span>

            <button className="btn-comprar-credito" onClick={() => setIsModalOpen(true)}>
              Adicionar Saldo
            </button>

            <div className="user-menu hide-mobile">
              <div className="user-avatar">
                {user?.name?.charAt(0).toUpperCase() || <User size={20} />}
              </div>
              <div className="user-info">
                <span className="user-name">{user?.name?.split(' ')[0] || 'Usuário'}</span>
                <span className="user-role">Cliente</span>
              </div>
              <ChevronDown size={16} className="text-muted" style={{ marginLeft: '4px' }} />
            </div>

            <button onClick={handleLogout} className="btn-logout" title="Sair">
              <LogOut size={20} />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="panel-content">
          <Outlet context={{ openRechargeModal: () => setIsModalOpen(true) }} />
        </main>
      </div>
    </div>
  );
};

export default PanelLayout;
