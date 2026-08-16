import './Hero.css';

const Hero = () => {
  return (
    <section className="hero">
      <div className="container hero-container">
        <div className="hero-content">
          <h1 className="hero-title">
            Receba códigos SMS <span className="text-highlight">instantaneamente</span>
          </h1>
          <p className="hero-subtitle">
            Números virtuais descartáveis para verificar contas no WhatsApp, Telegram, Instagram, Google e outros aplicativos, com total privacidade e sem usar seu número real.
          </p>
          <div className="hero-actions">
            <a href="#comecar" className="btn btn-primary btn-lg">Começar Agora</a>
            <a href="#servicos" className="btn btn-outline btn-lg">Ver Serviços</a>
          </div>
        </div>
        
        <div className="hero-visual">
          <div className="mockup-placeholder">
            <div className="mockup-header">
              <span className="dot dot-red"></span>
              <span className="dot dot-yellow"></span>
              <span className="dot dot-green"></span>
            </div>
            <div className="mockup-body">
              <div className="sms-message">
                <div className="sms-icon">WhatsApp</div>
                <div className="sms-text">Seu código do WhatsApp: <strong>839-102</strong></div>
              </div>
              <div className="sms-message">
                <div className="sms-icon">Telegram</div>
                <div className="sms-text">Código do Telegram: <strong>49102</strong></div>
              </div>
              <div className="sms-message">
                <div className="sms-icon">Google</div>
                <div className="sms-text">G-291380 é o seu código de verificação.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
