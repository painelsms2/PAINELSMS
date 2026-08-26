import './ServicesPhoneMockup.css';

const services = [
  { name: 'WhatsApp', color: '#25D366', price: 'R$ 1,50', icon: 'M17.498 14.382c-.301-.15-1.767-.867-2.04-.966-.274-.101-.473-.15-.673.15-.197.295-.771.964-.944 1.162-.175.195-.349.21-.646.075-.3-.15-1.263-.465-2.403-1.485-.888-.795-1.484-1.77-1.66-2.07-.174-.3-.019-.465.13-.615.136-.135.301-.345.451-.523.146-.181.194-.301.297-.496.098-.21.046-.39-.026-.54-.075-.15-.673-1.62-.922-2.206-.24-.584-.487-.51-.672-.51-.172-.015-.371-.015-.571-.015-.2 0-.523.074-.797.359-.273.3-1.045 1.02-1.045 2.475s1.07 2.865 1.219 3.075c.149.195 2.105 3.195 5.1 4.485.714.3 1.27.48 1.704.629.714.227 1.365.195 1.88.121.574-.091 1.767-.721 2.016-1.426.255-.705.255-1.29.18-1.425-.074-.135-.27-.21-.57-.345z' },
  { name: 'Telegram', color: '#0088cc', price: 'R$ 0,80', icon: 'M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.888-.662 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z' },
  { name: 'Instagram', color: '#E1306C', price: 'R$ 1,20', icon: 'M12 2c-2.716 0-3.056.012-4.123.06-1.064.049-1.791.218-2.427.465a4.902 4.902 0 0 0-1.772 1.153A4.902 4.902 0 0 0 2.525 5.45c-.247.636-.416 1.363-.465 2.427C2.012 8.944 2 9.284 2 12s.012 3.056.06 4.123c.049 1.064.218 1.791.465 2.427a4.902 4.902 0 0 0 1.153 1.772 4.902 4.902 0 0 0 1.772 1.153c.636.247 1.363.416 2.427.465C8.944 21.988 9.284 22 12 22s3.056-.012 4.123-.06c1.064-.049 1.791-.218 2.427-.465a4.902 4.902 0 0 0 1.772-1.153 4.902 4.902 0 0 0 1.153-1.772c.247-.636.416-1.363.465-2.427.048-1.067.06-1.407.06-4.123s-.012-3.056-.06-4.123c-.049-1.064-.218-1.791-.465-2.427a4.902 4.902 0 0 0-1.153-1.772A4.902 4.902 0 0 0 18.55 2.525c-.636-.247-1.363-.416-2.427-.465C15.056 2.012 14.716 2 12 2zm0 1.802c2.67 0 2.987.01 4.042.059.976.045 1.505.207 1.858.344.467.182.8.399 1.15.748.35.35.566.683.748 1.15.137.353.3.882.344 1.858.048 1.055.059 1.372.059 4.042s-.01 2.987-.059 4.042c-.045.976-.207 1.505-.344 1.858a3.1 3.1 0 0 1-.748 1.15 3.1 3.1 0 0 1-1.15.748c-.353.137-.882.3-1.858.344-1.054.048-1.371.059-4.042.059s-2.987-.01-4.042-.059c-.976-.045-1.505-.207-1.858-.344a3.1 3.1 0 0 1-1.15-.748 3.1 3.1 0 0 1-.748-1.15c-.137-.353-.3-.882-.344-1.858-.048-1.055-.059-1.372-.059-4.042s.01-2.987.059-4.042c.045-.976.207-1.505.344-1.858.182-.467.399-.8.748-1.15.35-.35.683-.566 1.15-.748.353-.137.882-.3 1.858-.344 1.055-.048 1.372-.059 4.042-.059zM12 6.865a5.135 5.135 0 1 0 0 10.27 5.135 5.135 0 0 0 0-10.27zm0 8.468a3.333 3.333 0 1 1 0-6.666 3.333 3.333 0 0 1 0 6.666zm6.538-8.671a1.2 1.2 0 1 1-2.4 0 1.2 1.2 0 0 1 2.4 0z' },
  { name: 'Google', color: '#EA4335', price: 'R$ 2,10', icon: 'M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12s3.36-7.27 7.19-7.27c3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.19 2C6.42 2 1.94 6.8 1.94 12s4.48 10 10.25 10c5.34 0 9.29-3.65 9.29-9.03 0-1.15-.14-1.87-.13-1.87z' },
];

const ServicesPhoneMockup = () => {
  return (
    <div className="phone-mockup" role="img" aria-label="Tela de serviços do painel SMSfacil mostrando WhatsApp, Telegram, Instagram e Google disponíveis para verificação">
      <div className="phone-mockup__glow" />
      <div className="phone-mockup__frame">
        <div className="phone-mockup__notch" />
        <div className="phone-mockup__screen">
          <div className="phone-mockup__statusbar">
            <span>9:41</span>
            <div className="phone-mockup__statusicons">
              <svg width="14" height="10" viewBox="0 0 16 10" fill="currentColor"><path d="M0 10h2V6H0v4zm4 0h2V4H4v6zm4 0h2V2H8v8zm4-10v10h2V0h-2z"/></svg>
              <div className="phone-mockup__battery"><div className="phone-mockup__battery-fill" /></div>
            </div>
          </div>

          <div className="phone-mockup__header">
            <div>
              <div className="phone-mockup__label">Saldo Atual</div>
              <div className="phone-mockup__balance">R$ 142,50</div>
            </div>
            <div className="phone-mockup__add-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF6B00" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
            </div>
          </div>

          <div className="phone-mockup__search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            Buscar serviços...
          </div>

          <div className="phone-mockup__list">
            <div className="phone-mockup__list-title">Mais Populares</div>
            {services.map((svc) => (
              <div key={svc.name} className="phone-mockup__item">
                <div className="phone-mockup__item-left">
                  <div className="phone-mockup__item-icon" style={{ background: `${svc.color}18` }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill={svc.color}><path d={svc.icon} /></svg>
                  </div>
                  <div>
                    <div className="phone-mockup__item-name">{svc.name}</div>
                    <div className="phone-mockup__item-status">Alta Disponibilidade</div>
                  </div>
                </div>
                <div className="phone-mockup__item-right">
                  <span className="phone-mockup__item-price">{svc.price}</span>
                  <span className="phone-mockup__item-unit">/ SMS</span>
                </div>
              </div>
            ))}
          </div>

          <div className="phone-mockup__homebar" />
        </div>
      </div>

      <div className="phone-mockup__badge phone-mockup__badge--top">
        <span className="phone-mockup__badge-dot" />
        Código recebido
      </div>
      <div className="phone-mockup__badge phone-mockup__badge--bottom">
        +500 serviços
      </div>
    </div>
  );
};

export default ServicesPhoneMockup;
