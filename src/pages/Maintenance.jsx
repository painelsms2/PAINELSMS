import React from 'react';
import { Wrench } from 'lucide-react';

const Maintenance = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#0a0a0a',
      color: '#ffffff',
      textAlign: 'center',
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }}>
        <Wrench size={80} color="#6366f1" style={{ marginBottom: '24px' }} />
      </div>
      <h1 style={{ fontSize: '3rem', marginBottom: '16px', fontWeight: 'bold', background: 'linear-gradient(to right, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        Site em Manutenção
      </h1>
      <p style={{ fontSize: '1.25rem', color: '#a3a3a3', maxWidth: '600px', lineHeight: '1.6' }}>
        Estamos realizando atualizações importantes em nosso sistema para oferecer uma experiência ainda melhor.
        <br /><br />
        Previsão de retorno: <strong>Amanhã às 13:00h</strong>.
        <br /><br />
        Agradecemos a sua compreensão e paciência!
      </p>
      <style>
        {`
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
              transform: scale(1);
            }
            50% {
              opacity: .5;
              transform: scale(0.95);
            }
          }
        `}
      </style>
    </div>
  );
};

export default Maintenance;
