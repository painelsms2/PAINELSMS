import { MessageCircle, Send, Camera, Users, Globe, Music, MessageSquare, Car, Hash, Tv, ShoppingBag, Gamepad2 } from 'lucide-react';
import './ServicesGrid.css';

const services = [
  { name: 'WhatsApp', icon: <MessageCircle size={32} /> },
  { name: 'Telegram', icon: <Send size={32} /> },
  { name: 'Instagram', icon: <Camera size={32} /> },
  { name: 'Facebook', icon: <Users size={32} /> },
  { name: 'Google', icon: <Globe size={32} /> },
  { name: 'TikTok', icon: <Music size={32} /> },
  { name: 'Discord', icon: <MessageSquare size={32} /> },
  { name: 'Uber', icon: <Car size={32} /> },
  { name: 'X / Twitter', icon: <Hash size={32} /> },
  { name: 'Netflix', icon: <Tv size={32} /> },
  { name: 'Mercado Livre', icon: <ShoppingBag size={32} /> },
  { name: 'Steam', icon: <Gamepad2 size={32} /> },
];

const ServicesGrid = () => {
  return (
    <section id="servicos" className="services-section">
      <div className="container">
        <div className="section-header text-center">
          <h2 className="section-title">Serviços mais populares</h2>
          <p className="section-subtitle">
            Receba SMS de verificação instantaneamente para as maiores plataformas do mundo.
          </p>
        </div>

        <div className="services-grid-wrapper">
          {services.map((service, index) => (
            <div key={index} className="service-logo-card">
              <div className="service-logo-icon">
                {service.icon}
              </div>
              <span className="service-logo-name">{service.name}</span>
            </div>
          ))}
        </div>

        <div className="services-footer">
          <span className="more-services-badge">+ de 500 serviços disponíveis no painel</span>
        </div>
      </div>
    </section>
  );
};

export default ServicesGrid;
