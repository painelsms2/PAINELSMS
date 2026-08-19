import { useState } from 'react';

export const ServiceIcon = ({ service }) => {
  const [imgError, setImgError] = useState(false);

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

  const color = brandColors[service.name] || 'var(--primary-color)';
  const letter = service.name ? service.name.charAt(0).toUpperCase() : '?';

  if (service.icon && !imgError) {
    return (
      <img 
        src={`/img/servicesImg/${service.icon}`} 
        alt={service.name}
        onError={() => setImgError(true)}
        style={{ width: '100%', height: '100%', borderRadius: '14px', objectFit: 'cover', display: 'block' }}
      />
    );
  }

  return (
    <div className="service-brand-icon" style={{ '--brand-color': color }}>
      <div className="brand-letter">{letter}</div>
    </div>
  );
};
