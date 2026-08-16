import { MessageCircle, Send, Camera, Users, Globe, Music, MessageSquare, Car, Hash, Tv } from 'lucide-react';

export const ServiceIcon = ({ service }) => {
  const brandColors = {
    WhatsApp: '#25D366',
    Instagram: '#E1306C',
    Telegram: '#0088cc',
    Facebook: '#1877F2',
    Google: '#DB4437',
    TikTok: '#000000',
    Discord: '#5865F2',
    'X/Twitter': '#1DA1F2',
    Uber: '#000000',
    iFood: '#EA1D2C',
    Twitch: '#9146FF',
    Netflix: '#E50914'
  };
  
  const icons = {
    MessageCircle: <MessageCircle size={20} />,
    Send: <Send size={20} />,
    Camera: <Camera size={20} />,
    Facebook: <Users size={20} />,
    Chrome: <Globe size={20} />,
    Music: <Music size={20} />,
    MessageSquare: <MessageSquare size={20} />,
    Car: <Car size={20} />,
    Twitter: <Hash size={20} />,
    Tv: <Tv size={20} />
  };

  const color = brandColors[service.name] || 'var(--primary-color)';
  const letter = service.name.charAt(0).toUpperCase();

  return (
    <div className="service-brand-icon" style={{ '--brand-color': color }}>
      {icons[service.icon] ? (
        <div style={{ color: 'white' }}>{icons[service.icon]}</div>
      ) : (
        <div className="brand-letter">{letter}</div>
      )}
    </div>
  );
};
