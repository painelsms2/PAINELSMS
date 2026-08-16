import './HowItWorks.css';

const HowItWorks = () => {
  const steps = [
    {
      number: "1",
      title: "Cadastre-se",
      description: "Crie sua conta em poucos segundos e adicione saldo de forma rápida e segura."
    },
    {
      number: "2",
      title: "Escolha o serviço",
      description: "Selecione o aplicativo (WhatsApp, Telegram, etc) e o país desejado para o número."
    },
    {
      number: "3",
      title: "Receba o SMS",
      description: "O número é gerado na hora. Use-o no app e aguarde o código aparecer no painel."
    }
  ];

  return (
    <section className="section how-it-works" id="como-funciona">
      <div className="container">
        <div className="section-header text-center">
          <h2 className="section-title">Como funciona</h2>
          <p className="section-subtitle text-muted">
            Receber seu código de verificação é simples e rápido. Siga os três passos abaixo:
          </p>
        </div>

        <div className="steps-container">
          {steps.map((step, index) => (
            <div key={index} className="step-card">
              <div className="step-number">{step.number}</div>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-description text-muted">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
