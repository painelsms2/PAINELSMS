import { useState } from 'react';
import { Plus, MessageCircle } from 'lucide-react';
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
        <div className="faq-layout">
          <div className="faq-left-col">
            <span className="faq-eyebrow">FAQ</span>
            <h2 className="section-title display-font">Perguntas Frequentes</h2>
            <p className="section-subtitle">Tire suas dúvidas sobre o SMSfacil antes de começar.</p>

            <a href="#comecar" className="faq-support-card">
              <div className="faq-support-icon">
                <MessageCircle size={20} />
              </div>
              <div>
                <div className="faq-support-title">Ainda com dúvidas?</div>
                <div className="faq-support-text">Fale com nosso suporte</div>
              </div>
            </a>
          </div>

          <div className="faq-right-col">
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index;

              return (
                <div key={index} className={`faq-item ${isOpen ? 'open' : ''}`}>
                  <button
                    className="faq-question display-font"
                    onClick={() => toggleAccordion(index)}
                    aria-expanded={isOpen}
                  >
                    <span>{faq.question}</span>
                    <span className="faq-icon-wrap">
                      <Plus className={`faq-icon ${isOpen ? 'rotate' : ''}`} size={18} />
                    </span>
                  </button>
                  <div className="faq-answer-wrapper">
                    <p className="faq-answer">{faq.answer}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FaqSection;
