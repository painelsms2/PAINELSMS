import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { X, Loader2, Copy, CheckCircle2, QrCode } from 'lucide-react';
import './RechargeModal.css';

export const RechargeModal = ({ isOpen, onClose }) => {
  const { updateBalance, user } = useAuth();
  const { addToast } = useToast();
  
  const [step, setStep] = useState(1); // 1: Amount, 2: Pix QR
  const [amount, setAmount] = useState(50);
  const [isProcessing, setIsProcessing] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 mins for Pix

  const presets = [20, 50, 100, 200];
  const mockPixCode = "00020101021126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-426655440000520400005303986540550.005802BR5913Painel SMS LTDA6009Sao Paulo62070503***6304E1B3";

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setAmount(50);
      setIsProcessing(false);
      setTimeLeft(15 * 60);
    }
  }, [isOpen]);

  // Pix Step polling & timer
  useEffect(() => {
    let timer;
    let pollTimer;
    
    if (step === 2 && !isProcessing) {
      // Countdown timer
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            addToast("Tempo do Pix expirado.", "error");
            onClose();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Simulate payment confirmation (after 4 to 8 seconds randomly)
      const randomDelay = Math.floor(Math.random() * 4000) + 4000;
      pollTimer = setTimeout(() => {
        setIsProcessing(true); // Switch to success state
        updateBalance((user?.balance || 0) + amount);
        addToast("Saldo adicionado com sucesso!", "success");
        
        // Auto-close after success
        setTimeout(() => {
          onClose();
        }, 3000);
      }, randomDelay);
    }

    return () => {
      clearInterval(timer);
      clearTimeout(pollTimer);
    };
  }, [step, isProcessing, amount, user, updateBalance, addToast, onClose]);

  if (!isOpen) return null;

  const handleCustomChange = (e) => {
    const val = e.target.value;
    setAmount(val ? Number(val) : '');
  };

  const handleConfirmStep1 = () => {
    if (amount < 10) {
      addToast("O valor mínimo é R$ 10,00", "error");
      return;
    }
    setStep(2);
  };

  const copyPixCode = () => {
    navigator.clipboard.writeText(mockPixCode);
    addToast("Código Pix Copiado!", "success");
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 100 }}>
      <div className="recharge-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="btn-modal-close" onClick={onClose}><X size={20} /></button>
        
        {step === 1 && (
          <div className="rm-step fade-in">
            <h2 className="rm-title">Adicionar Saldo</h2>
            <p className="rm-subtitle">Escolha um valor e recarregue via Pix. O saldo é adicionado automaticamente após a confirmação do pagamento.</p>
            
            <div className="rm-preset-grid">
              {presets.map(val => (
                <button 
                  key={val} 
                  className={`rm-preset-btn ${amount === val ? 'active' : ''}`}
                  onClick={() => setAmount(val)}
                >
                  R$ {val}
                </button>
              ))}
            </div>

            <div className="rm-custom-amount">
              <label className="rm-label">Outro valor (R$)</label>
              <input 
                type="number" 
                className="rm-input" 
                value={amount}
                onChange={handleCustomChange}
                min="10"
                placeholder="Ex: 15.50"
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', marginBottom: '1.5rem', textAlign: 'center' }}>
                Selecione um valor sugerido ou digite um valor personalizado (mínimo R$ 10).
              </p>
            </div>

            <button 
              className="rm-btn-primary" 
              onClick={handleConfirmStep1}
            >
              Continuar
            </button>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              <CheckCircle2 size={12} /> Pagamento via Pix · confirmação em segundos.
            </div>
          </div>
        )}

        {step === 2 && !isProcessing && (
          <div className="rm-step fade-in">
            <h2 className="rm-title text-center">Escaneie o QR Code</h2>
            <p className="rm-subtitle text-center mb-4">Pague via Pix para adicionar R$ {Number(amount).toFixed(2)}</p>
            
            <div className="rm-qr-container">
              <QrCode size={180} strokeWidth={1} color="var(--primary-color)" />
            </div>

            <div className="rm-timer-section">
              Válido por: <span className="font-mono text-danger font-semibold">{formatTime(timeLeft)}</span>
            </div>

            <div className="rm-copy-section">
              <label className="rm-label">Pix Copia e Cola</label>
              <div className="rm-copy-box">
                <input type="text" readOnly value={mockPixCode} />
                <button onClick={copyPixCode} title="Copiar código">
                  <Copy size={16} />
                </button>
              </div>
            </div>

            <div className="rm-polling-status">
              <span className="pulsing-dot-small"></span> Aguardando pagamento...
            </div>
          </div>
        )}

        {step === 2 && isProcessing && (
          <div className="rm-step rm-success-step fade-in-scale">
            <div className="rm-success-icon-wrapper">
              <CheckCircle2 size={48} className="text-success" />
            </div>
            <h2 className="rm-title text-center text-success">Pagamento Confirmado!</h2>
            <p className="rm-subtitle text-center">Seu saldo de R$ {Number(amount).toFixed(2)} foi adicionado.</p>
          </div>
        )}
      </div>
    </div>
  );
};
