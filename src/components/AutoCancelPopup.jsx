import { AlertTriangle } from 'lucide-react';
import './AutoCancelPopup.css';

export const AutoCancelPopup = ({ serviceName, onClose }) => {
  return (
    <div className="auto-cancel-overlay" onClick={onClose}>
      <div className="auto-cancel-modal" onClick={(e) => e.stopPropagation()}>
        <div className="auto-cancel-icon">
          <AlertTriangle size={28} />
        </div>
        <h3 className="auto-cancel-title">Número cancelado automaticamente</h3>
        <p className="auto-cancel-text">
          O tempo para receber o código de <strong>{serviceName}</strong> se esgotou
          (restava apenas 1 minuto). O número foi cancelado e o saldo já foi devolvido
          para sua carteira.
        </p>
        <button className="auto-cancel-ok-btn" onClick={onClose}>
          Entendi
        </button>
      </div>
    </div>
  );
};
