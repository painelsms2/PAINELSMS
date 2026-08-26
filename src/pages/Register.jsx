import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Turnstile } from '@marsidev/react-turnstile';
import { MessageSquare, ChevronLeft } from 'lucide-react';
import AuthTestimonial from '../components/AuthTestimonial';
import './Auth.css';

// Floating Paths SVG generated and animated purely in CSS
const FloatingPaths = React.memo(function FloatingPaths({ position }) {
  const paths = React.useMemo(() => {
    return Array.from({ length: 36 }, (_, i) => ({
      id: i,
      d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
        380 - i * 5 * position
      } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
        152 - i * 5 * position
      } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
        684 - i * 5 * position
      } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
      color: `rgba(255,107,0,${0.1 + i * 0.03})`,
      width: 0.5 + i * 0.03,
      duration: `${20 + Math.random() * 10}s`
    }));
  }, [position]);

  return (
    <div className="floating-paths-container">
      <svg
        className="w-full h-full"
        style={{ width: '100%', height: '100%', color: 'var(--primary-color)' }}
        viewBox="0 0 696 316"
        fill="none"
        overflow="visible"
      >
        <title>Background Paths</title>
        {paths.map((path) => (
          <path
            key={path.id}
            d={path.d}
            className="floating-path"
            stroke="currentColor"
            strokeWidth={path.width}
            strokeOpacity={0.1 + path.id * 0.03}
            style={{ animationDuration: path.duration }}
          />
        ))}
      </svg>
    </div>
  );
});

const Register = () => {
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Force dark theme on auth pages
  React.useLayoutEffect(() => {
    document.body.classList.add('theme-forced');
    document.documentElement.setAttribute('data-theme', 'light');
    return () => {
      document.body.classList.remove('theme-forced');
      const saved = localStorage.getItem('smsfacil_theme') || 'light';
      document.documentElement.setAttribute('data-theme', saved);
    };
  }, []);
  
  const turnstileKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
  const [captchaToken, setCaptchaToken] = useState(turnstileKey ? null : 'dev-bypass');
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleCaptchaSuccess = React.useCallback((token) => {
    setCaptchaToken((prev) => {
      if (prev) return prev;
      return token;
    });
  }, []);

  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'O nome completo é obrigatório';
    }

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

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem';
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
      await register(formData.name, formData.email, formData.password, captchaToken);
      navigate('/panel');
    } catch (err) {
      setGlobalError(err.message || 'Ocorreu um erro ao criar a conta');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-split-layout">
      {/* Left Panel (Desktop only) */}
      <div className="auth-left-panel">
        <div className="auth-left-overlay" />
        
        <Link to="/" className="auth-brand-logo">
          <MessageSquare size={24} />
          SMSfacil
        </Link>

        <AuthTestimonial />

        <FloatingPaths position={1} />
        <FloatingPaths position={-1} />
      </div>

      {/* Right Panel (Register form) */}
      <div className="auth-right-panel">
        <div className="auth-blobs-container">
          <div className="auth-blob-1" />
          <div className="auth-blob-2" />
        </div>

        <Link to="/" className="auth-back-btn">
          <ChevronLeft size={16} />
          Início
        </Link>

        <div className="auth-content-box">
          <Link to="/" className="auth-mobile-logo">
            <MessageSquare size={24} />
            SMSfacil
          </Link>

          <div>
            <h1 className="auth-title">Crie sua conta</h1>
            <p className="auth-subtitle">
              Preencha os dados abaixo para começar.
            </p>
          </div>

          {globalError && <div className="alert-error" style={{ marginBottom: '1.25rem' }}>{globalError}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label sr-only" htmlFor="name">Nome completo</label>
              <div className="input-with-icon">
                <input
                  type="text"
                  id="name"
                  name="name"
                  className={`form-input ${errors.name ? 'error' : ''}`}
                  placeholder="Nome completo"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
              </div>
              {errors.name && <span className="error-message">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label className="form-label sr-only" htmlFor="email">Email</label>
              <div className="input-with-icon">
                <input
                  type="email"
                  id="email"
                  name="email"
                  className={`form-input ${errors.email ? 'error' : ''}`}
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
              </div>
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label className="form-label sr-only" htmlFor="password">Senha</label>
              <div className="input-with-icon">
                <input
                  type="password"
                  id="password"
                  name="password"
                  className={`form-input ${errors.password ? 'error' : ''}`}
                  placeholder="Senha (mínimo 6 caracteres)"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
              </div>
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>

            <div className="form-group">
              <label className="form-label sr-only" htmlFor="confirmPassword">Confirmar Senha</label>
              <div className="input-with-icon">
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                  placeholder="Confirme a senha"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
              </div>
              {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
            </div>

            <div className="form-group" style={{ display: 'flex', justifyContent: 'center', minHeight: '65px' }}>
              {turnstileKey ? (
                <Turnstile
                  siteKey={turnstileKey}
                  onSuccess={handleCaptchaSuccess}
                />
              ) : null}
            </div>

            <button 
              type="submit" 
              className="btn btn-block btn-primary" 
              style={{ marginTop: '0.5rem', borderRadius: '8px', padding: '0.85rem' }}
              disabled={isSubmitting || !captchaToken}
            >
              {isSubmitting ? 'Criando conta...' : 'Criar Conta'}
            </button>
          </form>

          <p className="auth-terms">
            Já tem uma conta? <Link to="/login" style={{ fontWeight: 600 }}>Fazer login</Link>
          </p>
        </div>
      </div>
    </main>
  );
};

export default Register;
