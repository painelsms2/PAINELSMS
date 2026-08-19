import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-brand">
            <Link to="/" className="logo-text">SMSfacil</Link>
            <p className="footer-description text-muted">
              Sua plataforma segura e confiável para recebimento de códigos SMS virtuais.
            </p>
          </div>
          
          <div className="footer-links-group">
            <h4 className="footer-title">Links Úteis</h4>
            <ul className="footer-links">
              <li><a href="#como-funciona">Como funciona</a></li>
              <li><a href="#precos">Preços</a></li>
              <li><a href="#termos">Termos de Serviço</a></li>
              <li><a href="#privacidade">Política de Privacidade</a></li>
            </ul>
          </div>

          <div className="footer-links-group">
            <h4 className="footer-title">Suporte</h4>
            <ul className="footer-links">
              <li><a href="#faq">Perguntas Frequentes</a></li>
              <li><a href="#contato">Fale Conosco</a></li>
              <li><a href="#api">Documentação da API</a></li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p className="copyright text-muted">
            &copy; {currentYear} PainelSMS. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
