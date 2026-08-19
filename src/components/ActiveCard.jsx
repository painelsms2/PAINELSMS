import { useState, useEffect, useRef } from 'react';
import { useToast } from '../contexts/ToastContext';
import { numberProviderService } from '../services/numberProviderService';
import { ServiceIcon } from './ServiceIcon';
import { CountdownRing } from './CountdownRing';
import { Copy, X, CheckCircle2 } from 'lucide-react';
import './ActiveCard.css';

export const ActiveCard = ({ activation, onComplete, onCancel }) => {
  const { addToast } = useToast();
  const maxTime = 20 * 60; 
  
  const calcRemaining = () => {
    const elapsed = Math.floor((Date.now() - activation.createdAt) / 1000);
    return Math.max(0, maxTime - elapsed);
  };

  const [timeLeft, setTimeLeft] = useState(calcRemaining());
  const [status, setStatus] = useState(activation.status);
  const [code, setCode] = useState(activation.code || null);
  
  const timerRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    if (status !== 'waiting') return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [status]);

  useEffect(() => {
    if (status !== 'waiting') return;

    pollRef.current = setInterval(async () => {
      try {
        const res = await numberProviderService.checkForSms(activation);
        if (res.status === 'completed' && res.code) {
          handleSuccess(res.code);
        }
      } catch (error) {
        console.error("Polling error", error);
      }
    }, 5000);

    return () => clearInterval(pollRef.current);
  }, [status]);

  const handleSuccess = (receivedCode) => {
    clearInterval(timerRef.current);
    clearInterval(pollRef.current);
    setStatus('completed');
    setCode(receivedCode);
    addToast('SMS Recebido com sucesso!', 'success');
    onComplete(activation, receivedCode);
  };

  const handleExpire = async () => {
    clearInterval(timerRef.current);
    clearInterval(pollRef.current);
    setStatus('expired');
    addToast('Tempo expirado.', 'error');
    await numberProviderService.cancelNumber(activation.service.id);
    onCancel(activation, 'expired');
  };

  const handleUserCancel = async () => {
    clearInterval(timerRef.current);
    clearInterval(pollRef.current);
    setStatus('cancelled');
    addToast('Número cancelado e devolvido ao estoque.', 'info');
    await numberProviderService.cancelNumber(activation.service.id);
    onCancel(activation, 'cancelled');
  };

  const copyToClipboard = (text, msg) => {
    navigator.clipboard.writeText(text);
    addToast(msg, 'success');
  };

  const isCompleted = status === 'completed';
  const isDead = status === 'cancelled' || status === 'expired';

  // Format nicely e.g. +55 75 92999-8379
  const formatPhone = (phone) => {
    const rawPhone = phone || '';
    return rawPhone.includes('|') ? rawPhone.split('|')[1] : rawPhone;
  };

  return (
    <div className={`active-card ${isCompleted ? 'success-card' : ''} ${isDead ? 'fade-out-card' : ''}`}>
      <div className="active-card-header">
        <div className="ac-service">
          <div className="ac-service-icon">
            <ServiceIcon service={activation.service} />
          </div>
          <span className="ac-service-name">{activation.service.name}</span>
        </div>
        <div className="ac-activation-id">
          #{activation.activationId.substring(4, 10).toUpperCase()}
        </div>
      </div>

      <div className="ac-body">
        <div className="ac-phone-section">
          <div className="ac-phone-number">
            {formatPhone(activation.phoneNumber)}
          </div>
          <button className="btn-copy-large" onClick={() => copyToClipboard(formatPhone(activation.phoneNumber), 'Número copiado!')}>
            <Copy size={20} />
          </button>
        </div>

        <div className="ac-status-section">
          {isCompleted ? (
            <div className="ac-status-pill success fade-in">
              <CheckCircle2 size={16} /> Código Recebido
            </div>
          ) : (
            <div className="ac-status-pill waiting">
              <span className="pulsing-dot-small"></span> Aguardando SMS...
            </div>
          )}
        </div>

        <div className="ac-code-section">
          <div className="ac-code-label">Código SMS</div>
          {code ? (
            <div className="ac-code-display fade-in-scale">
              <span className="code-text">{code}</span>
              <button className="btn-copy-small code-copy" onClick={() => copyToClipboard(code, 'Código copiado!')}>
                <Copy size={16} />
              </button>
            </div>
          ) : (
            <div className="ac-code-placeholder">Aguardando...</div>
          )}
        </div>
      </div>

      <div className="ac-footer">
        <div className="ac-time">
          {isCompleted ? (
            <span className="text-success font-semibold">Finalizado</span>
          ) : (
            <CountdownRing timeLeft={timeLeft} maxTime={maxTime} />
          )}
        </div>

        <div className="ac-actions">
          {!isCompleted && status === 'waiting' && (
            <button className="btn-cancel-card" onClick={handleUserCancel} title="Cancelar Número">
              <X size={18} /> Cancelar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
