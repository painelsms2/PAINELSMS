import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import './FaqSection.css';

const faqs = [
  {
    question: 'Como funciona o recebimento de SMS?',
    answer: 'Você escolhe o serviço desejado, clica em comprar e nós fornecemos um número de telefone virtual. Basta inserir esse número no aplicativo/site e aguardar. O código de verificação aparecerá no seu painel em alguns segundos.'
  },
  {
    question: 'Os números são reais?',
    answer: 'Sim! Utilizamos chips GSM reais (números físicos não-VoIP) de diversas operadoras. Isso garante que praticamente 100% dos serviços (como WhatsApp e Telegram) aceitem nossos números sem bloqueios.'
  },
  {
    question: 'Quanto tempo o número fica ativo?',
    answer: 'O número fica reservado exclusivamente para você por 15 a 20 minutos. Tempo mais do que suficiente para solicitar e receber o código de verificação do aplicativo.'
  },
  {
    question: 'E se o código SMS não chegar?',
    answer: 'Você não paga nada! O valor só é descontado do seu saldo quando o código SMS é efetivamente recebido e exibido na sua tela. Se o tempo expirar ou você cancelar antes, o dinheiro volta pra sua carteira.'
  },
  {
    question: 'Quais são as formas de pagamento?',
    answer: 'Atualmente aceitamos pagamentos via Pix com aprovação imediata. O valor mínimo para adicionar saldo na carteira é de R$ 10,00.'
  },
  {
    question: 'Posso reutilizar o mesmo número no futuro?',
    answer: 'Não. Os números são temporários e descartáveis para proteger sua privacidade. Após o uso, o número é desativado e você não terá acesso a ele novamente no futuro.'
  }
];

const FaqSection = () => {
  const [openIndex, setOpenIndex] = useState(0);

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? -1 : index);
  };

  return (
    <section id="faq" className="faq-section">
      <div className="container">
        <div className="section-header text-center">
          <h2 className="section-title">Perguntas Frequentes (FAQ)</h2>
          <p className="section-subtitle">Tire suas dúvidas sobre o PainelSMS antes de começar.</p>
        </div>

        <div className="faq-accordion">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            
            return (
              <div key={index} className={`faq-item ${isOpen ? 'open' : ''}`}>
                <button 
                  className="faq-question" 
                  onClick={() => toggleAccordion(index)}
                  aria-expanded={isOpen}
                >
                  {faq.question}
                  <ChevronDown className={`faq-icon ${isOpen ? 'rotate' : ''}`} />
                </button>
                <div 
                  className="faq-answer-wrapper"
                  style={{ maxHeight: isOpen ? '200px' : '0' }}
                >
                  <p className="faq-answer">{faq.answer}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FaqSection;
