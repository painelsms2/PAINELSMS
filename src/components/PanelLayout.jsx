import { useState, useRef, useEffect, useCallback } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useTheme } from '../contexts/ThemeContext';
import { LogOut, User, Menu, ChevronDown, Smartphone, LayoutDashboard, LayoutGrid, Signal, Settings, HelpCircle, Network, Home, Wallet, Sun, Moon, LifeBuoy, X } from 'lucide-react';
import './PanelLayout.css';

import { RechargeModal } from './RechargeModal';
import AnimatedBackground from './AnimatedBackground';
import FloatingSupport from './FloatingSupport';
import NotificationBell from './NotificationBell';

const MODULE_TABS = [
  { key: 'dashboard', path: '/panel/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'servicos', path: '/panel/servicos', label: 'Serviços', icon: LayoutGrid },
  { key: 'numeros', path: null, label: 'Números e SMS', icon: Signal, disabled: true },
];

const ModuleSwitcher = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const switcherRef = useRef(null);
  const indicatorRef = useRef(null);
  const tabRefs = useRef({});

  const activeKey = location.pathname.includes('/servicos') ? 'servicos' : 'dashboard';

  const updateIndicator = useCallback(() => {
    const activeEl = tabRefs.current[activeKey];
    const container = switcherRef.current;
    if (!activeEl || !container) return;

    const containerRect = container.getBoundingClientRect();
    const activeRect = activeEl.getBoundingClientRect();
    const indicator = indicatorRef.current;
    if (!indicator) return;

    indicator.style.width = `${activeRect.width}px`;
    indicator.style.transform = `translateX(${activeRect.left - containerRect.left}px)`;
  }, [activeKey]);

  useEffect(() => {
    updateIndicator();
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [updateIndicator]);

  return (
    <div className="module-switcher" ref={switcherRef}>
      <div className="module-switcher-indicator" ref={indicatorRef} />
      {MODULE_TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.key === activeKey;
        return (
          <button
            key={tab.key}
            ref={(el) => { tabRefs.current[tab.key] = el; }}
            className={`module-btn ${isActive ? 'active' : ''} ${tab.disabled ? 'disabled' : ''}`}
            onClick={() => {
              if (!tab.disabled && tab.path) navigate(tab.path);
            }}
            disabled={tab.disabled}
          >
            <Icon size={16} />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

const PanelLayout = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Close drawer and dropdowns when navigating
  useEffect(() => {
    setIsDrawerOpen(false);
    setIsUserMenuOpen(false);
  }, [location.pathname]);

  // Show module-switcher only on dashboard and servicos pages
  const showModuleSwitcher = location.pathname.includes('/panel/dashboard') || location.pathname.includes('/panel/servicos');

  return (
    <div className="panel-layout">
      {/* Animated Background (Light Mode only) */}
      <AnimatedBackground />

      {/* Floating Support Widget */}
      {user && <FloatingSupport />}

      {/* Recharge Modal */}
      <RechargeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {/* Mobile Navigation Drawer */}
      <div className={`nav-drawer-overlay ${isDrawerOpen ? 'open' : ''}`} onClick={() => setIsDrawerOpen(false)}></div>
      <div className={`nav-drawer ${isDrawerOpen ? 'open' : ''}`}>
        <div className="nav-drawer-header">
          <Link to="/panel/servicos" className="logo-text" onClick={() => setIsDrawerOpen(false)}>
            SMS<span style={{ color: 'var(--topbar-text)' }}>facil</span>
          </Link>
          <button className="drawer-close-btn" onClick={() => setIsDrawerOpen(false)}>
            <X size={24} />
          </button>
        </div>
        <div className="nav-drawer-body">
          <div className="drawer-user-info">
            <div className="user-avatar-large">
              {user?.name?.charAt(0).toUpperCase() || <User size={24} />}
            </div>
            <div>
              <strong>{user?.name || user?.email?.split('@')[0] || 'Usuário'}</strong>
              <div className="text-muted text-sm">{user?.role === 'admin' ? 'Administrador' : 'Cliente'}</div>
            </div>
          </div>
          
          <div className="drawer-balance-card">
            <div className="balance-info">
              <span className="text-muted text-sm">Saldo Atual</span>
              <strong>R$ {Number(user?.balance || 0).toFixed(2)}</strong>
            </div>
            <button className="btn btn-primary w-full" onClick={() => { setIsDrawerOpen(false); setIsModalOpen(true); }}>
              Adicionar Saldo
            </button>
          </div>

          <div className="drawer-menu-links">
            {MODULE_TABS.map(tab => (
              <Link 
                key={tab.key}
                to={tab.disabled ? '#' : tab.path}
                className={`drawer-link ${tab.disabled ? 'disabled' : ''} ${location.pathname.includes(tab.path) ? 'active' : ''}`}
                onClick={() => !tab.disabled && setIsDrawerOpen(false)}
              >
                <tab.icon size={20} /> {tab.label}
              </Link>
            ))}
          </div>
          
          <div className="dropdown-divider"></div>
          
          <div className="drawer-menu-links">
            <Link to="/panel/configuracoes" className="drawer-link"><Settings size={20} /> Configurações</Link>
            <Link to="/panel/ajuda" className="drawer-link"><HelpCircle size={20} /> Ajuda</Link>
            <button className="drawer-link" onClick={toggleTheme}>
              {theme === 'light' ? <><Moon size={20} /> Modo Escuro</> : <><Sun size={20} /> Modo Claro</>}
            </button>
          </div>

          {user?.role === 'admin' && (
            <>
              <div className="dropdown-divider"></div>
              <div className="drawer-label">Admin</div>
              <div className="drawer-menu-links">
                <Link to="/admin/dashboard" className="drawer-link"><LayoutDashboard size={20} /> Métricas</Link>
                <Link to="/admin/usuarios" className="drawer-link"><User size={20} /> Usuários</Link>
                <Link to="/admin/servicos" className="drawer-link"><Settings size={20} /> Gestão Serviços</Link>
                <Link to="/admin/fornecedores" className="drawer-link"><Network size={20} /> Fornecedores</Link>
                <Link to="/admin/suporte" className="drawer-link"><LifeBuoy size={20} /> Suporte Inbox</Link>
              </div>
            </>
          )}
          
          <div className="dropdown-divider"></div>
          <button className="drawer-link text-danger" onClick={handleLogout}><LogOut size={20} /> Sair</button>
        </div>
      </div>

      {/* Main Content (Full Width) */}
      <div className="panel-main">
        {/* Topbar Navigation */}
        <header className="panel-topbar">
          <div className="topbar-search">
            <button className="hamburger-btn show-mobile" onClick={() => setIsDrawerOpen(true)}>
              <Menu size={24} />
            </button>
            <Link to="/panel/servicos" className="logo-text hide-mobile" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.15)' }}>
              SMS<span style={{ color: 'var(--topbar-text)' }}>facil</span>
            </Link>
            {/* Compact mobile logo */}
            <Link to="/panel/servicos" className="logo-text show-mobile" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.15)', fontSize: '1.25rem' }}>
              SMS
            </Link>
          </div>

          <div className="topbar-user">
            {/* Brazil Flag (Visual) */}
            <img 
              src="https://flagcdn.com/w40/br.png" 
              alt="Brasil" 
              className="country-flag hide-mobile" 
              title="Brasil"
            />

            <span className="balance-display hide-mobile">
              R$ {Number(user?.balance || 0).toFixed(2)}
            </span>
            <span className="balance-display show-mobile" style={{ fontSize: '0.875rem' }}>
              R$ {Number(user?.balance || 0).toFixed(0)}
            </span>

            <button className="btn-comprar-credito hide-mobile" onClick={() => setIsModalOpen(true)}>
              Adicionar Saldo
            </button>

            <button 
              className="theme-toggle-btn hide-mobile" 
              onClick={toggleTheme}
              title={theme === 'light' ? 'Mudar para Dark Mode' : 'Mudar para Light Mode'}
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            {user && <NotificationBell />}

            <div className="user-menu-container hide-mobile" style={{ position: 'relative' }}>
              <div className="user-menu" onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}>
                <div className="user-avatar">
                  {user?.name?.charAt(0).toUpperCase() || <User size={20} />}
                </div>
                <div className="user-info hide-mobile">
                  <span className="user-name">{user?.name?.split(' ')[0] || 'Usuário'}</span>
                  <span className="user-role">{user?.role === 'admin' ? 'Administrador' : 'Cliente'}</span>
                </div>
                <ChevronDown size={16} className="text-muted" style={{ marginLeft: '4px' }} />
              </div>

              {isUserMenuOpen && (
                <>
                  <div className="dropdown-overlay" onClick={() => setIsUserMenuOpen(false)}></div>
                  <div className="profile-dropdown fade-in">
                    <div className="dropdown-header">
                      <div className="dropdown-avatar-large">
                        {user?.name?.charAt(0).toUpperCase() || <User size={24} />}
                      </div>
                      <div className="dropdown-header-info">
                        <strong>{user?.name || user?.email?.split('@')[0] || 'Usuário'}</strong>
                        <span className="text-muted text-sm">{user?.role === 'admin' ? 'Administrador' : 'Cliente'}</span>
                      </div>
                    </div>
                    
                    <div className="dropdown-balance">
                      <Wallet size={16} />
                      <span>Saldo: R$ {Number(user?.balance || 0).toFixed(2)}</span>
                    </div>
                    
                    <div className="dropdown-divider"></div>
                    
                    <Link to="/panel/servicos" className="dropdown-item" onClick={() => setIsUserMenuOpen(false)}>
                      <Home size={16} /> Início
                    </Link>
                    <Link to="/panel/configuracoes" className="dropdown-item" onClick={() => setIsUserMenuOpen(false)}>
                      <Settings size={16} /> Configurações
                    </Link>
                    <Link to="/panel/ajuda" className="dropdown-item" onClick={() => setIsUserMenuOpen(false)}>
                      <HelpCircle size={16} /> Ajuda
                    </Link>

                    {user?.role === 'admin' && (
                      <>
                        <div className="dropdown-divider"></div>
                        <div className="dropdown-label">Admin</div>
                        <Link to="/admin/dashboard" className="dropdown-item" onClick={() => setIsUserMenuOpen(false)}>
                          <LayoutDashboard size={16} /> Métricas
                        </Link>
                        <Link to="/admin/usuarios" className="dropdown-item" onClick={() => setIsUserMenuOpen(false)}>
                          <User size={16} /> Usuários
                        </Link>
                        <Link to="/admin/servicos" className="dropdown-item" onClick={() => setIsUserMenuOpen(false)}>
                          <Settings size={16} /> Gestão Serviços
                        </Link>
                        <Link to="/admin/fornecedores" className="dropdown-item" onClick={() => setIsUserMenuOpen(false)}>
                          <Network size={16} /> Fornecedores
                        </Link>
                        <Link to="/admin/suporte" className="dropdown-item" onClick={() => setIsUserMenuOpen(false)}>
                          <LifeBuoy size={16} /> Suporte Inbox
                        </Link>
                      </>
                    )}

                    <div className="dropdown-divider"></div>
                    
                    <button onClick={handleLogout} className="dropdown-item text-danger w-full text-left">
                      <LogOut size={16} /> Sair
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="panel-content">
          {showModuleSwitcher && (
            <div className="panel-module-switcher-row hide-mobile">
              <ModuleSwitcher />
              <div className="country-selector">
                <img src="https://flagcdn.com/w40/br.png" alt="Brasil" />
                <span>Brasil</span>
                <ChevronDown size={14} className="text-muted" />
              </div>
            </div>
          )}
          <Outlet context={{ openRechargeModal: () => setIsModalOpen(true) }} />
        </main>
      </div>
    </div>
  );
};

export default PanelLayout;

