import { Star } from 'lucide-react';
import './TestimonialsSection.css';

const testimonials = [
  {
    name: 'Lucas M.',
    role: 'Empreendedor Digital',
    quote: '"Melhor painel que já usei. Os códigos do WhatsApp chegam em menos de 10 segundos e nunca tive problemas de bloqueio."',
  },
  {
    name: 'Mariana S.',
    role: 'Gestora de Tráfego',
    quote: '"Uso diariamente para contingência das minhas contas de anúncios no Facebook. O fato do saldo não expirar é um diferencial incrível."',
  },
  {
    name: 'Rafael T.',
    role: 'Desenvolvedor',
    quote: '"Interface limpa, preços justos e funciona sempre. Quando o SMS não chega (raro), o saldo é devolvido automaticamente. Recomendo muito!"',
  }
];

const TestimonialsSection = () => {
  return (
    <section className="testimonials-section">
      <div className="container">
        
        <div className="stats-row">
          <div className="stat-item fade-in">
            <span className="stat-number display-font">10.000+</span>
            <div className="stat-accent"></div>
            <span className="stat-label">Usuários Ativos</span>
          </div>
          <div className="stat-item fade-in" style={{ animationDelay: '0.1s' }}>
            <span className="stat-number display-font">50.000+</span>
            <div className="stat-accent"></div>
            <span className="stat-label">Números Ativados</span>
          </div>
          <div className="stat-item fade-in" style={{ animationDelay: '0.2s' }}>
            <span className="stat-number display-font">99%</span>
            <div className="stat-accent"></div>
            <span className="stat-label">Satisfação</span>
          </div>
        </div>

        <div className="section-header text-center" style={{ marginTop: '5rem' }}>
          <h2 className="section-title display-font">O que nossos usuários dizem</h2>
          <p className="section-subtitle">
            Junte-se a milhares de pessoas que confiam no SMSfacil todos os dias.
          </p>
        </div>

        <div className="testimonials-staggered-grid">
          {testimonials.map((testi, index) => (
            <div key={index} className={`testimonial-card fade-in stagger-card-${index}`}>
              <div className="stars">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={18} fill="#FFB000" color="#FFB000" />
                ))}
              </div>
              <p className="testimonial-quote">{testi.quote}</p>
              <div className="testimonial-author">
                <div className="author-avatar display-font">
                  {testi.name.charAt(0)}
                </div>
                <div>
                  <h4 className="author-name display-font">{testi.name}</h4>
                  <span className="author-role">{testi.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
