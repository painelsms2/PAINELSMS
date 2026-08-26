import { useState, useMemo } from 'react';
import { ChevronDown, MessageSquareText, HelpCircle, Mail, Search, LifeBuoy } from 'lucide-react';
import { allFaqs } from '../../constants/faqs';
import './Ajuda.css';

const Ajuda = () => {
  const [activeIndex, setActiveIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleFaq = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const filteredFaqs = useMemo(() => {
    if (!searchQuery.trim()) return allFaqs;
    const lowerQuery = searchQuery.toLowerCase();
    return allFaqs.filter(faq => 
      faq.question.toLowerCase().includes(lowerQuery) || 
      faq.answer.toLowerCase().includes(lowerQuery)
    );
  }, [searchQuery]);

  return (
    <div className="ajuda-page">
      <div className="page-header ajuda-header">
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <LifeBuoy size={28} className="text-primary" />
          Ajuda e Suporte
        </h1>
        <p className="text-muted">Encontre respostas rápidas para as dúvidas mais comuns ou entre em contato com nossa equipe.</p>
        <div className="support-badge mt-2">
          <span className="badge-dot"></span> Tempo médio de resposta: poucas horas
        </div>
      </div>

      <div className="faq-section fade-in">
        <div className="faq-section-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', margin: 0 }}>
            <HelpCircle size={24} className="text-primary" /> 
            Perguntas Frequentes
          </h2>
          
          <div className="faq-search">
            <Search size={16} className="faq-search-icon" />
            <input 
              type="text" 
              placeholder="Buscar dúvida..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="faq-search-input"
            />
          </div>
        </div>
        
        <div className="faq-container">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq, index) => (
              <div 
                key={index} 
                className={`faq-item ${activeIndex === index ? 'active' : ''}`}
              >
                <button 
                  className="faq-question" 
                  onClick={() => toggleFaq(index)}
                  aria-expanded={activeIndex === index}
                >
                  <span>{faq.question}</span>
                  <ChevronDown size={20} className="faq-icon" />
                </button>
                
                <div className="faq-answer">
                  <div className="faq-answer-content">
                    {faq.answer.split('\n').map((line, i) => (
                      line.trim() ? <p key={i}>{line}</p> : <br key={i} />
                    ))}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="faq-empty">
              Nenhuma pergunta encontrada para "{searchQuery}"
            </div>
          )}
        </div>
      </div>

      <div className="support-section fade-in-up">
        <div className="support-bridge">
          <h3>Ainda com dúvidas?</h3>
          <div className="bridge-line"></div>
        </div>
        
        <div className="support-card">
          <div className="support-icon-wrapper">
            <MessageSquareText size={24} />
          </div>
          <div className="support-content">
            <h3>Entrando em contato com o suporte</h3>
            <p>
              Descreva o problema detalhadamente. Você certamente deve fornecer o 
              <strong> número adquirido</strong>, o <strong>ID da sua conta</strong> ou o 
              <strong> e-mail</strong> ao qual sua conta está vinculada.
            </p>
            <a href="mailto:suporte@painelsms.com" className="btn-support">
              <Mail size={18} />
              Contatar Suporte
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Ajuda;
