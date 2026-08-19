import { Link } from 'react-router-dom';
import './Header.css';

const Header = () => {
  return (
    <header className="header">
      <div className="container header-container">
        <div className="logo">
          <Link to="/" className="logo-text">SMSfacil</Link>
        </div>
        
        <nav className="header-nav">
          <div className="nav-links">
            <a href="#como-funciona">Como funciona</a>
            <a href="#servicos">Serviços</a>
            <a href="#faq">FAQ</a>
          </div>
        </nav>

        <div className="header-actions" style={{ gap: '1rem' }}>
          <Link to="/login" className="btn btn-outline">Entrar</Link>
          <Link to="/register" className="btn btn-primary">Criar Conta</Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
