import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { paymentService } from '../services/paymentService';
import { X, Loader2, Copy, CheckCircle2, QrCode } from 'lucide-react';
import './RechargeModal.css';

export const RechargeModal = ({ isOpen, onClose }) => {
  const { updateBalance, user } = useAuth();
  const { addToast } = useToast();
  
  const [step, setStep] = useState(1); // 1: Amount, 2: Pix QR
  const [amount, setAmount] = useState(50);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeCharge, setActiveCharge] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);

  const pollIntervalRef = useRef(null);
  const timerIntervalRef = useRef(null);

  const presets = [5, 20, 50, 100];

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setAmount(50);
      setIsGenerating(false);
      setActiveCharge(null);
      setTimeLeft(0);
    }
    return () => {
      clearInterval(pollIntervalRef.current);
      clearInterval(timerIntervalRef.current);
    };
  }, [isOpen]);

  // Pix Step polling & timer
  useEffect(() => {
    if (step === 2 && activeCharge && activeCharge.status === 'pending') {
      // Countdown timer
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current);
            clearInterval(pollIntervalRef.current);
            addToast("Tempo do Pix expirado.", "error");
            setActiveCharge(prev => ({ ...prev, status: 'expired' }));
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Polling the backend real API status
      pollIntervalRef.current = setInterval(async () => {
        try {
          const status = await paymentService.checkPaymentStatus(activeCharge.id);
          if (status === 'completed') {
            clearInterval(pollIntervalRef.current);
            clearInterval(timerIntervalRef.current);
            
            updateBalance(activeCharge.amount);
            addToast("Saldo adicionado com sucesso!", "success");
            setActiveCharge(prev => ({ ...prev, status: 'completed' }));
            
            // Auto-close after success
            setTimeout(() => {
              onClose();
            }, 3000);
          } else if (status === 'expired' || status === 'failed') {
            clearInterval(pollIntervalRef.current);
            clearInterval(timerIntervalRef.current);
            setActiveCharge(prev => ({ ...prev, status }));
            addToast("A cobrança falhou ou expirou.", "error");
          }
        } catch (error) {
          console.error("Polling error in modal:", error);
        }
      }, 5000); // Check every 5s
    }

    return () => {
      clearInterval(timerIntervalRef.current);
      clearInterval(pollIntervalRef.current);
    };
  }, [step, activeCharge, updateBalance, addToast, onClose]);

  if (!isOpen) return null;

  const handleCustomChange = (e) => {
    const val = e.target.value;
    setAmount(val ? Number(val) : '');
  };

  const handleConfirmStep1 = async () => {
    if (amount < 5) {
      addToast("O valor mínimo é R$ 5,00", "error");
      return;
    }
    
    setIsGenerating(true);
    try {
      const charge = await paymentService.createPixCharge(amount, user.id);
      setActiveCharge(charge);
      setTimeLeft(10 * 60); // 10 minutes
      setStep(2);
    } catch (error) {
      console.error("Erro real na geração do Pix no modal:", error);
      addToast("Erro ao gerar Pix. Tente novamente.", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyPixCode = () => {
    if (activeCharge?.pixCode) {
      navigator.clipboard.writeText(activeCharge.pixCode);
      addToast("Código Pix Copiado!", "success");
    }
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
                min="5"
                placeholder="Ex: 15.50"
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', marginBottom: '1.5rem', textAlign: 'center' }}>
                Selecione um valor sugerido ou digite um valor personalizado (mínimo R$ 5).
              </p>
            </div>

            <button 
              className="rm-btn-primary" 
              onClick={handleConfirmStep1}
              disabled={isGenerating}
            >
              {isGenerating ? <Loader2 size={20} className="spinner" /> : "Gerar Pix"}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              <CheckCircle2 size={12} /> Pagamento via Pix · confirmação em segundos.
            </div>
          </div>
        )}

        {step === 2 && activeCharge?.status === 'pending' && (
          <div className="rm-step fade-in">
            <h2 className="rm-title text-center">Escaneie o QR Code</h2>
            <p className="rm-subtitle text-center mb-4">Pague via Pix para adicionar R$ {Number(amount || 0).toFixed(2)}</p>
            
            <div className="rm-qr-container" style={{ position: 'relative' }}>
              <QrCode size={180} strokeWidth={1} color="var(--border-color)" />
              {activeCharge.qrCode && (
                <img 
                  src={activeCharge.qrCode} 
                  alt="QR Code Pix" 
                  style={{position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', height: '100%', objectFit: 'cover', borderRadius: '8px', backgroundColor: '#fff'}} 
                />
              )}
            </div>

            <div className="rm-timer-section">
              Válido por: <span className="font-mono text-danger font-semibold">{formatTime(timeLeft)}</span>
            </div>

            <div className="rm-copy-section">
              <label className="rm-label">Pix Copia e Cola</label>
              <div className="rm-copy-box">
                <input type="text" readOnly value={activeCharge.pixCode || ''} />
                <button onClick={copyPixCode} title="Copiar código">
                  <Copy size={16} />
                </button>
              </div>
            </div>

            <div className="rm-polling-status">
              <Loader2 size={18} className="spinner" style={{ marginRight: '8px' }} /> Aguardando pagamento...
            </div>
          </div>
        )}

        {step === 2 && activeCharge?.status === 'expired' && (
          <div className="rm-step fade-in text-center py-4">
             <div className="rm-success-icon-wrapper" style={{ background: 'var(--danger-light)' }}>
               <X size={48} className="text-danger" />
             </div>
             <h2 className="rm-title text-center text-danger mt-4">Pix Expirado</h2>
             <p className="rm-subtitle text-center">O tempo de pagamento foi esgotado.</p>
             <button className="rm-btn-primary mt-4" onClick={() => setStep(1)}>Tentar Novamente</button>
          </div>
        )}

        {step === 2 && activeCharge?.status === 'completed' && (
          <div className="rm-step rm-success-step fade-in-scale">
            <div className="rm-success-icon-wrapper">
              <CheckCircle2 size={48} className="text-success" />
            </div>
            <h2 className="rm-title text-center text-success">Pagamento Confirmado!</h2>
            <p className="rm-subtitle text-center">Seu saldo de R$ {Number(amount || 0).toFixed(2)} foi adicionado.</p>
          </div>
        )}
      </div>
    </div>
  );
};
