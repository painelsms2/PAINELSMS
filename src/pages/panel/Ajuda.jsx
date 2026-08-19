import { useState } from 'react';
import { ChevronDown, MessageSquareText, HelpCircle, Mail } from 'lucide-react';
import './Ajuda.css';

const faqs = [
  {
    question: 'O código SMS não foi recebido, o que fazer?',
    answer: 'Tente se registrar usando um smartphone, tente mudar de operadora móvel. Cancele o número se o sms não for entregue em 5 minutos e peça outro gratuitamente. Experimente pelo menos 10 números.'
  },
  {
    question: 'O número já foi usado/registrado/obtido.',
    answer: 'Essa situação ocorre por causa do número de telefone que já foi utilizado para um registo, reemitido pela operadora móvel. Infelizmente, é impossível verificar a disponibilidade do número antes de fornecê-lo por motivos técnicos.'
  },
  {
    question: 'Como posso reutilizar um número que comprei antes?',
    answer: 'A ativação adicional é usada se o tempo de ativação acabar, mas você precisar restaurar o acesso à sua conta e receber um SMS.\n\nNão sabemos por quanto tempo você poderá receber SMS para restaurar o acesso após a conclusão da ativação.\n\nVia de regra, o número fica indisponível em um dia. Mas, se o número ainda estiver online, daremos a você a oportunidade de receber SMS.'
  },
  {
    question: 'Minha conta foi banida, qual o motivo?',
    answer: 'Um motivo frequente para banir uma conta é a substituição de números. O sistema bloqueia automaticamente sua conta se a porcentagem de SMS recebidos for inferior a 10%. Configure seu software para que a porcentagem de ativações bem-sucedidas seja superior a 10%. Então você não será banido. Se você acha que houve um erro, entre em contato conosco.'
  },
  {
    question: 'Paguei, mas o dinheiro não foi creditado.',
    answer: 'Se já se passaram mais de 3 horas, entre em contato com o suporte. Se o seu pagamento for bem-sucedido, ele será 100% creditado antes do vencimento de 3 horas.'
  }
];

const Ajuda = () => {
  const [activeIndex, setActiveIndex] = useState(null);

  const toggleFaq = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className="ajuda-page">
      <div className="page-header ajuda-header">
        <h1 className="page-title">Ajuda e Suporte</h1>
        <p className="text-muted">Encontre respostas rápidas para as dúvidas mais comuns ou entre em contato com nossa equipe.</p>
      </div>

      <div className="faq-section fade-in">
        <h2 className="mb-4" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem' }}>
          <HelpCircle size={24} className="text-primary" /> 
          Perguntas Frequentes
        </h2>
        
        <div className="faq-container">
          {faqs.map((faq, index) => (
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
          ))}
        </div>
      </div>

      <div className="support-card fade-in-up">
        <div className="support-icon-wrapper">
          <MessageSquareText size={24} />
        </div>
        <div className="support-content">
          <h3>Entrando em contato com o serviço de suporte</h3>
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
  );
};

export default Ajuda;
