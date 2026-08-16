import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import './PricingSection.css';

const pricingTiers = [
  { amount: 20, description: 'Ideal para testes rápidos e poucas verificações.', recommended: false },
  { amount: 50, description: 'Perfeito para uso moderado. O pacote mais escolhido.', recommended: true },
  { amount: 100, description: 'Para profissionais e agências que gerenciam múltiplas contas.', recommended: false },
  { amount: 200, description: 'Volume alto com o melhor custo-benefício por SMS.', recommended: false }
];

const PricingSection = () => {
  return (
    <section id="precos" className="pricing-section">
      <div className="container">
        <div className="section-header text-center">
          <h2 className="section-title">Recarregue e use quando precisar</h2>
          <p className="section-subtitle">
            Sem mensalidades. Adicione saldo à sua carteira e pague apenas pelos números que gerar com sucesso.
          </p>
        </div>

        <div className="pricing-grid">
          {pricingTiers.map((tier, index) => (
            <div key={index} className={`pricing-card ${tier.recommended ? 'recommended' : ''}`}>
              {tier.recommended && <div className="recommended-badge">Mais Popular</div>}
              
              <div className="pricing-header">
                <span className="currency">R$</span>
                <span className="amount">{tier.amount}</span>
                <span className="cents">,00</span>
              </div>
              
              <p className="pricing-description">{tier.description}</p>
              
              <ul className="pricing-features">
                <li><CheckCircle2 size={18} className="feature-icon" /> Saldo nunca expira</li>
                <li><CheckCircle2 size={18} className="feature-icon" /> Acesso a todos serviços</li>
                <li><CheckCircle2 size={18} className="feature-icon" /> Cobrado só se receber SMS</li>
              </ul>
            </div>
          ))}
        </div>

        <div className="pricing-cta">
          <Link to="/register" className="btn btn-primary btn-large">Criar Conta e Recarregar</Link>
          <p className="cta-hint">Crie sua conta em 30 segundos. Aceitamos Pix.</p>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
