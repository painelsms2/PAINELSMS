import { CheckCircle2, Zap, ShieldCheck, LifeBuoy } from 'lucide-react';
import './TrustStrip.css';

const TrustStrip = () => {
  const trustPoints = [
    {
      icon: <CheckCircle2 size={24} className="trust-icon" />,
      text: "Números sempre ativos"
    },
    {
      icon: <Zap size={24} className="trust-icon" />,
      text: "Ativação instantânea"
    },
    {
      icon: <ShieldCheck size={24} className="trust-icon" />,
      text: "Pagamento seguro"
    },
    {
      icon: <LifeBuoy size={24} className="trust-icon" />,
      text: "Suporte rápido"
    }
  ];

  return (
    <section className="trust-strip">
      <div className="container">
        <div className="trust-container">
          {trustPoints.map((point, index) => (
            <div key={index} className="trust-item">
              <div className="trust-icon-wrapper">
                {point.icon}
              </div>
              <span className="trust-text">{point.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustStrip;
