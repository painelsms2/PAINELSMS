import { MessageCircle, Send, Camera, Users, Globe, Music, MessageSquare, Car, Hash, Tv, ShoppingBag } from 'lucide-react';
import './ServicesGrid.css';

const services = [
  { name: 'WhatsApp', icon: <MessageCircle size={32} />, color: '#25D366', bg: 'rgba(37,211,102,0.08)', span: 'col-span-2 row-span-2' },
  { name: 'Telegram', icon: <Send size={28} />, color: '#0088cc', bg: 'rgba(0,136,204,0.08)', span: 'col-span-2' },
  { name: 'Instagram', icon: <Camera size={24} />, color: '#E1306C', bg: 'rgba(225,48,108,0.06)', span: 'col-span-1' },
  { name: 'Facebook', icon: <Users size={24} />, color: '#1877F2', bg: 'rgba(24,119,242,0.06)', span: 'col-span-1' },
  { name: 'Google', icon: <Globe size={24} />, color: '#EA4335', bg: 'rgba(234,67,53,0.06)', span: 'col-span-1' },
  { name: 'TikTok', icon: <Music size={24} />, color: '#ff0050', bg: 'rgba(255,0,80,0.06)', span: 'col-span-1' },
  { name: 'Discord', icon: <MessageSquare size={24} />, color: '#5865F2', bg: 'rgba(88,101,242,0.06)', span: 'col-span-1' },
  { name: 'Uber', icon: <Car size={24} />, color: '#276EF1', bg: 'rgba(39,110,241,0.06)', span: 'col-span-1' },
  { name: 'X / Twitter', icon: <Hash size={24} />, color: '#A1A1AA', bg: 'rgba(161,161,170,0.06)', span: 'col-span-1' },
  { name: 'Netflix', icon: <Tv size={24} />, color: '#E50914', bg: 'rgba(229,9,20,0.06)', span: 'col-span-1' },
  { name: 'Mercado Livre', icon: <ShoppingBag size={24} />, color: '#FFE600', bg: 'rgba(255,230,0,0.06)', span: 'col-span-2' },
];

const ServicesGrid = () => {
  return (
    <section id="servicos" className="services-section">
      <div className="container">
        <div className="section-header text-center">
          <h2 className="section-title display-font">Serviços mais populares</h2>
          <p className="section-subtitle">
            Receba SMS de verificação instantaneamente para as maiores plataformas do mundo.
          </p>
        </div>

        <div className="services-bento-grid">
          {services.map((service, index) => (
            <div 
              key={index} 
              className={`service-bento-card fade-in ${service.span}`} 
              style={{ 
                animationDelay: `${index * 0.08}s`,
                backgroundColor: service.bg,
                borderColor: `${service.color}20`
              }}
            >
              <div 
                className="service-bento-icon" 
                style={{ 
                  backgroundColor: `${service.color}18`, 
                  color: service.color 
                }}
              >
                {service.icon}
              </div>
              <span className="service-bento-name display-font">{service.name}</span>
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
