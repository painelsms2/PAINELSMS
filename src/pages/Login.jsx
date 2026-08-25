import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Key, Eye, EyeOff, MessageSquare, Activity } from 'lucide-react';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({ email: 'admin@2026gmail.com', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = 'O e-mail é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'E-mail inválido';
    }
    
    if (!formData.password) {
      newErrors.password = 'A senha é obrigatória';
    } else if (formData.password.length < 6) {
      newErrors.password = 'A senha deve ter pelo menos 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) {
      setErrors(prev => ({ ...prev, [e.target.name]: undefined }));
    }
    if (globalError) setGlobalError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setGlobalError('');

    try {
      await login(formData.email, formData.password);
      navigate('/panel');
    } catch (err) {
      setGlobalError(err.message || 'Ocorreu um erro ao fazer login');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page glass-bg">
      <div className="network-bg"></div>

      <div className="auth-card glass-card">
        <MessageSquare className="decor-icon decor-1" size={24} />
        <Activity className="decor-icon decor-2" size={32} />
        <MessageSquare className="decor-icon decor-3" size={20} />

        <div className="auth-header">
          <Link to="/" className="auth-logo gradient-text">SMSfacil</Link>
          <h1 className="auth-title">Bem-vindo de volta</h1>
          <p className="auth-subtitle">Faça login para acessar o painel</p>
        </div>

        {globalError && <div className="alert-error">{globalError}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label sr-only" htmlFor="email">Email</label>
            <div className="input-with-icon">
              <Mail className="input-icon" size={20} />
              <input
                type="email"
                id="email"
                name="email"
                className={`form-input has-icon ${errors.email ? 'error' : ''}`}
                placeholder="seu@email.com"
                value={formData.email}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label className="form-label sr-only" htmlFor="password">Password</label>
            <div className="input-with-icon">
              <Key className="input-icon" size={20} />
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                className={`form-input has-icon has-action ${errors.password ? 'error' : ''}`}
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                disabled={isSubmitting}
              />
              <button 
                type="button"
                className="input-action"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          <button 
            type="submit" 
            className="btn btn-block btn-glass" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Entrando...' : 'Entrar no painel'}
          </button>
        </form>

        <div className="auth-footer">
          Não tem uma conta?
          <Link to="/register" className="auth-link text-orange">Cadastre-se</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
