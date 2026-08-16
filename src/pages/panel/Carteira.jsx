import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { paymentService } from '../../services/paymentService';
import Skeleton from '../../components/ui/Skeleton';
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle2, XCircle, Copy, Loader2, QrCode, History } from 'lucide-react';
import './Carteira.css';

const Carteira = () => {
  const { user, updateBalance } = useAuth();
  const { addToast } = useToast();
  
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedAmount, setSelectedAmount] = useState(50);
  const [isGeneratingPix, setIsGeneratingPix] = useState(false);
  const [activeCharge, setActiveCharge] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  
  const timerIntervalRef = useRef(null);
  const pollIntervalRef = useRef(null);

  const predefinedAmounts = [20, 50, 100, 200];

  useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoading(true);
      try {
        const data = await paymentService.getTransactions(user.id);
        setTransactions(data);
      } catch (error) {
        console.error("Erro ao carregar transações", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTransactions();
  }, [user.id]);

  useEffect(() => {
    if (activeCharge && timeLeft > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handlePixExpired();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => clearInterval(timerIntervalRef.current);
  }, [activeCharge, timeLeft]);

  useEffect(() => {
    if (activeCharge && timeLeft > 0) {
      pollIntervalRef.current = setInterval(async () => {
        try {
          const status = await paymentService.checkPaymentStatus(activeCharge.id);
          if (status === 'completed') {
            handlePaymentSuccess();
          }
        } catch (error) {
          console.error("Polling error:", error);
        }
      }, 5000); // Check every 5s
    }
    
    return () => clearInterval(pollIntervalRef.current);
  }, [activeCharge, timeLeft]);

  const handleGeneratePix = async () => {
    if (selectedAmount < 10) {
      addToast("O valor mínimo é R$ 10,00", "error");
      return;
    }
    
    setIsGeneratingPix(true);
    try {
      const charge = await paymentService.createPixCharge(selectedAmount, user.id);
      setActiveCharge(charge);
      setTimeLeft(10 * 60); // 10 minutes
    } catch (error) {
      addToast("Erro ao gerar Pix. Tente novamente.", "error");
    } finally {
      setIsGeneratingPix(false);
    }
  };

  const handlePaymentSuccess = () => {
    clearInterval(pollIntervalRef.current);
    clearInterval(timerIntervalRef.current);
    
    updateBalance(activeCharge.amount);
    
    paymentService.updateTransactionStatus(activeCharge.id, 'completed').then(() => {
      paymentService.getTransactions(user.id).then(setTransactions);
    });

    addToast(`Recarga de R$ ${activeCharge.amount.toFixed(2)} aprovada!`, 'success');
    setActiveCharge({ ...activeCharge, status: 'completed' });
    setTimeLeft(0);
  };

  const handlePixExpired = () => {
    clearInterval(pollIntervalRef.current);
    clearInterval(timerIntervalRef.current);
    
    paymentService.updateTransactionStatus(activeCharge.id, 'expired').then(() => {
      paymentService.getTransactions(user.id).then(setTransactions);
    });

    setActiveCharge({ ...activeCharge, status: 'expired' });
    addToast('O código Pix expirou.', 'error');
  };

  const cancelPix = () => {
    clearInterval(pollIntervalRef.current);
    clearInterval(timerIntervalRef.current);
    setActiveCharge(null);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    addToast("Código Pix copiado!", "success");
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const formatDate = (dateString) => {
    const options = { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('pt-BR', options);
  };

  const getStatusIcon = (status, type) => {
    if (status === 'completed') return <CheckCircle2 size={16} className="text-success" />;
    if (status === 'expired' || status === 'failed') return <XCircle size={16} className="text-danger" />;
    return <Clock size={16} className="text-warning" />;
  };

  const getStatusText = (status) => {
    const map = {
      'completed': 'Concluído',
      'pending': 'Pendente',
      'expired': 'Expirado',
      'failed': 'Falhou'
    };
    return map[status] || status;
  };

  const isExpired = activeCharge?.status === 'expired' || (timeLeft === 0 && activeCharge?.status !== 'completed');

  return (
    <div className="carteira-page">
      <div className="page-header">
        <h1 className="page-title">Carteira</h1>
        <p className="text-muted">Adicione saldo via Pix para comprar números virtuais.</p>
      </div>

      <div className="carteira-grid">
        <div className="carteira-col">
          {/* Balance Card */}
          <div className="balance-card">
            <div className="balance-header">
              <span className="balance-label">Saldo Disponível</span>
              <Wallet className="balance-icon" />
            </div>
            <div className="balance-amount">
              <span className="currency">R$</span>
              {user?.balance?.toFixed(2) || '0.00'}
            </div>
          </div>

          {/* Recharge Card */}
          <div className="recharge-card">
            <h2 className="card-title mb-4">Adicionar Saldo (Pix)</h2>
            
            {activeCharge ? (
              <div className="pix-payment-view">
                {activeCharge.status === 'completed' ? (
                  <div className="payment-success text-center py-4">
                    <CheckCircle2 size={48} color="#10b981" className="mx-auto mb-3" />
                    <h3 className="mb-2">Pagamento Aprovado!</h3>
                    <p className="text-muted mb-4">O saldo já está disponível na sua carteira.</p>
                    <button className="btn btn-outline btn-block" onClick={() => setActiveCharge(null)}>Nova Recarga</button>
                  </div>
                ) : isExpired ? (
                  <div className="payment-expired text-center py-4">
                    <XCircle size={48} color="#ef4444" className="mx-auto mb-3" />
                    <h3 className="mb-2">Pix Expirado</h3>
                    <p className="text-muted mb-4">O tempo para pagamento esgotou.</p>
                    <button className="btn btn-primary btn-block" onClick={() => setActiveCharge(null)}>Tentar Novamente</button>
                  </div>
                ) : (
                  <div className="pix-pending text-center">
                    <div className="pix-timer mb-3">
                      <span className="timer-badge">
                        <Clock size={16} /> Vence em {formatTime(timeLeft)}
                      </span>
                    </div>
                    
                    <div className="qr-code-placeholder mb-4" style={{ position: 'relative' }}>
                      <QrCode size={120} color="var(--border-color)" />
                      {activeCharge.qrCode && (
                        <img 
                          src={activeCharge.qrCode} 
                          alt="QR Code Pix" 
                          style={{position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', height: '100%', objectFit: 'cover', borderRadius: '8px', backgroundColor: '#fff'}} 
                        />
                      )}
                    </div>

                    <div className="pix-code-box mb-4">
                      <p className="text-sm font-semibold mb-2">Código Pix Copia e Cola:</p>
                      <div className="copy-input-group">
                        <input type="text" value={activeCharge.pixCode} readOnly className="form-input" />
                        <button className="btn btn-primary" onClick={() => copyToClipboard(activeCharge.pixCode)} title="Copiar">
                          <Copy size={18} />
                        </button>
                      </div>
                    </div>

                    <div className="polling-indicator mb-4">
                      <Loader2 size={18} className="spinner" />
                      <span>Aguardando pagamento...</span>
                    </div>

                    <button className="btn btn-outline btn-block" onClick={cancelPix}>Cancelar</button>
                  </div>
                )}
              </div>
            ) : (
              <div className="recharge-form">
                <div className="amount-presets">
                  {predefinedAmounts.map(amount => (
                    <button 
                      key={amount}
                      className={`preset-btn ${selectedAmount === amount ? 'active' : ''}`}
                      onClick={() => setSelectedAmount(amount)}
                    >
                      R$ {amount}
                    </button>
                  ))}
                </div>

                <div className="custom-amount">
                  <label className="form-label">Outro valor (R$)</label>
                  <input 
                    type="number" 
                    className="form-input"
                    value={selectedAmount}
                    onChange={(e) => setSelectedAmount(Number(e.target.value))}
                    min="10"
                    step="10"
                  />
                </div>

                <button 
                  className="btn btn-primary btn-block" 
                  onClick={handleGeneratePix}
                  disabled={isGeneratingPix}
                >
                  {isGeneratingPix ? <Loader2 className="spinner" size={20} /> : <><Plus size={20} /> Gerar Pix</>}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="carteira-col">
          {/* Transactions History */}
          <div className="transactions-card">
            <h2 className="card-title mb-4">Histórico de Transações</h2>
            
            <div className="transactions-list">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="transaction-item" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                         <Skeleton width="40px" height="40px" borderRadius="50%" />
                         <div>
                            <Skeleton width="100px" height="16px" />
                            <Skeleton width="140px" height="12px" className="mt-1" />
                         </div>
                       </div>
                       <Skeleton width="80px" height="20px" />
                     </div>
                  </div>
                ))
              ) : transactions.length === 0 ? (
                <div className="empty-state">
                  <History size={48} className="empty-icon" style={{ margin: '0 auto 1rem', color: 'var(--border-color)' }} />
                  <h3>Nenhuma transação</h3>
                  <p className="text-muted">Você ainda não realizou recargas ou gastou saldo.</p>
                </div>
              ) : (
                transactions.map(tx => (
                  <div key={tx.id} className="transaction-item">
                    <div className="tx-icon-col">
                      <div className={`tx-icon ${tx.type}`}>
                        {tx.type === 'deposit' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                      </div>
                    </div>
                    <div className="tx-info-col">
                      <p className="tx-title">{tx.description}</p>
                      <p className="tx-date">{formatDate(tx.timestamp)}</p>
                    </div>
                    <div className="tx-amount-col">
                      <span className={`tx-amount ${tx.type}`}>
                        {tx.type === 'deposit' ? '+' : '-'} R$ {tx.amount.toFixed(2)}
                      </span>
                      <span className={`tx-status status-${tx.status}`}>
                        {getStatusIcon(tx.status)} {getStatusText(tx.status)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Carteira;
