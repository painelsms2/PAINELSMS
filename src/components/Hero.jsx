import ServicesPhoneMockup from './ServicesPhoneMockup';
import './Hero.css';

const Hero = () => {
  return (
    <section className="hero">
      <div className="container hero-container">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            +50.000 números ativados
          </div>
          <h1 className="hero-title display-font">
            Receba códigos SMS <span className="text-highlight">instantaneamente</span>
          </h1>
          <p className="hero-subtitle">
            Números virtuais descartáveis para verificar contas no WhatsApp, Telegram, Instagram, Google e outros aplicativos, com total privacidade e sem usar seu número real.
          </p>
          <div className="hero-actions">
            <a href="#comecar" className="btn btn-primary btn-lg">Começar Agora</a>
            <a href="#servicos" className="btn btn-outline btn-lg">Ver Serviços</a>
          </div>
          <div className="hero-trust">
            <div className="hero-trust-stars">★★★★★</div>
            <span>4.9/5 de mais de 2.000 avaliações</span>
          </div>
        </div>

        <div className="hero-visual">
          <ServicesPhoneMockup />
        </div>
      </div>
    </section>
  );
};

export default Hero;
