import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { authService } from '../../services/authService';
import { Eye, EyeOff, Loader2, ShieldCheck, KeyRound } from 'lucide-react';
import './Configuracoes.css';

const Configuracoes = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorField, setErrorField] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Password strength logic
  const getStrength = (pass) => {
    if (!pass) return { score: 0, label: '', color: 'var(--text-muted)' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    
    if (score <= 2) return { score: 1, label: 'Fraca', color: 'var(--danger-color)' };
    if (score <= 3) return { score: 2, label: 'Média', color: 'var(--warning-color)' };
    return { score: 3, label: 'Forte', color: 'var(--success-color)' };
  };

  const strength = getStrength(newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorField(null);
    setErrorMessage('');

    if (!currentPassword) {
      setErrorField('current');
      setErrorMessage('A senha atual é obrigatória.');
      return;
    }
    
    if (!newPassword || newPassword.length < 6) {
      setErrorField('new');
      setErrorMessage('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setErrorField('confirm');
      setErrorMessage('As senhas não coincidem.');
      return;
    }

    setIsLoading(true);
    
    try {
      await authService.changePassword(user.id, currentPassword, newPassword);
      addToast('Senha alterada com sucesso!', 'success');
      handleReset();
    } catch (err) {
      if (err.message === "Senha atual incorreta") {
        setErrorField('current');
        setErrorMessage(err.message);
      } else {
        addToast(err.message || 'Erro ao alterar senha', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setErrorField(null);
    setErrorMessage('');
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
  };

  return (
    <div className="configuracoes-page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Configurações</h1>
          <p className="text-muted">Gerencie sua conta e segurança.</p>
        </div>
      </div>

      <div className="config-grid">
        {/* Segurança Section */}
        <div className="config-card">
          <div className="config-card-header">
            <div className="config-icon-wrapper">
              <ShieldCheck size={24} color="var(--primary-color)" />
            </div>
            <div>
              <h2 className="config-card-title">Segurança</h2>
              <p className="config-card-subtitle">Atualize sua senha de acesso.</p>
            </div>
          </div>

          <form className="config-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Senha atual</label>
              <div className="password-input-wrapper">
                <KeyRound size={18} className="input-icon-left" />
                <input 
                  type={showCurrent ? "text" : "password"} 
                  className={`form-input has-icon ${errorField === 'current' ? 'input-error' : ''}`}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Sua senha atual"
                />
                <button type="button" className="btn-toggle-password" onClick={() => setShowCurrent(!showCurrent)}>
                  {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errorField === 'current' && <p className="error-text">{errorMessage}</p>}
            </div>

            <div className="form-divider"></div>

            <div className="form-group">
              <label className="form-label">Nova senha</label>
              <div className="password-input-wrapper">
                <KeyRound size={18} className="input-icon-left" />
                <input 
                  type={showNew ? "text" : "password"} 
                  className={`form-input has-icon ${errorField === 'new' ? 'input-error' : ''}`}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="No mínimo 6 caracteres"
                />
                <button type="button" className="btn-toggle-password" onClick={() => setShowNew(!showNew)}>
                  {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {newPassword.length > 0 && (
                <div className="password-strength-container">
                  <div className="strength-bars">
                    <div className={`strength-bar ${strength.score >= 1 ? 'active' : ''}`} style={{ backgroundColor: strength.score >= 1 ? strength.color : '' }}></div>
                    <div className={`strength-bar ${strength.score >= 2 ? 'active' : ''}`} style={{ backgroundColor: strength.score >= 2 ? strength.color : '' }}></div>
                    <div className={`strength-bar ${strength.score >= 3 ? 'active' : ''}`} style={{ backgroundColor: strength.score >= 3 ? strength.color : '' }}></div>
                  </div>
                  <span className="strength-label" style={{ color: strength.color }}>{strength.label}</span>
                </div>
              )}
              {errorField === 'new' && <p className="error-text">{errorMessage}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">Confirmar nova senha</label>
              <div className="password-input-wrapper">
                <KeyRound size={18} className="input-icon-left" />
                <input 
                  type={showConfirm ? "text" : "password"} 
                  className={`form-input has-icon ${errorField === 'confirm' ? 'input-error' : ''}`}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                />
                <button type="button" className="btn-toggle-password" onClick={() => setShowConfirm(!showConfirm)}>
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errorField === 'confirm' && <p className="error-text">{errorMessage}</p>}
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                className="btn btn-ghost" 
                onClick={handleReset}
                disabled={isLoading || (!currentPassword && !newPassword && !confirmPassword)}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="btn btn-primary btn-save-password" 
                disabled={isLoading}
              >
                {isLoading ? <Loader2 size={18} className="spin" /> : 'Alterar senha'}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};

export default Configuracoes;
