import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import { DollarSign, TrendingUp, Users, Smartphone, Loader2, AlertCircle } from 'lucide-react';
import Skeleton from '../../components/ui/Skeleton';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { addToast } = useToast();
  const [metrics, setMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const { data, error } = await supabase.rpc('admin_metrics');
        if (error) throw error;
        setMetrics(data);
      } catch (error) {
        console.error("Erro ao carregar métricas", error);
        addToast("Falha ao carregar métricas administrativas.", "error");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMetrics();
  }, [addToast]);

  const formatCurrency = (val) => {
    return Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const calculateSuccessRate = () => {
    if (!metrics) return 0;
    const { completed, cancelled, expired } = metrics.activations;
    const total = completed + cancelled + expired;
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  };

  return (
    <div className="admin-dashboard fade-in">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="text-muted">Visão geral do desempenho e métricas do sistema.</p>
      </div>

      {isLoading ? (
        <div className="metrics-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="metric-card">
              <Skeleton width="100%" height="20px" className="mb-4" />
              <Skeleton width="60%" height="40px" className="mb-2" />
              <Skeleton width="80%" height="16px" />
            </div>
          ))}
        </div>
      ) : !metrics ? (
        <div className="empty-state">
          <AlertCircle size={48} className="text-muted mb-4" />
          <h3>Erro ao carregar dados</h3>
          <p className="text-muted">Não foi possível carregar as métricas do servidor.</p>
        </div>
      ) : (
        <>
          <div className="metrics-grid">
            {/* 1. Faturamento e Lucro */}
            <div className="metric-card">
              <div className="metric-header">
                <span className="metric-title">Lucro Líquido (Mês)</span>
                <div className="metric-icon"><TrendingUp size={20} /></div>
              </div>
              <div className="metric-value">{formatCurrency(metrics.profit.month)}</div>
              <div className="metric-sub">
                Hoje: <span className="text-success">{formatCurrency(metrics.profit.today)}</span> | 
                Receita: {formatCurrency(metrics.revenue.month)}
              </div>
            </div>

            {/* 2. Ativações */}
            <div className="metric-card">
              <div className="metric-header">
                <span className="metric-title">Ativações Concluídas</span>
                <div className="metric-icon"><Smartphone size={20} /></div>
              </div>
              <div className="metric-value">{metrics.activations.completed}</div>
              <div className="metric-sub">
                Taxa de sucesso: <span className="text-success">{calculateSuccessRate()}%</span>
              </div>
            </div>

            {/* 3. Usuários */}
            <div className="metric-card">
              <div className="metric-header">
                <span className="metric-title">Usuários Ativos</span>
                <div className="metric-icon"><Users size={20} /></div>
              </div>
              <div className="metric-value">{metrics.users.active}</div>
              <div className="metric-sub">
                Novos hoje: <span className="text-success">+{metrics.users.newToday}</span> | 
                Saldo retido: {formatCurrency(metrics.users.totalWalletBalance)}
              </div>
            </div>

            {/* 4. Recargas PIX */}
            <div className="metric-card">
              <div className="metric-header">
                <span className="metric-title">Volume Pix (Mês)</span>
                <div className="metric-icon"><DollarSign size={20} /></div>
              </div>
              <div className="metric-value">{formatCurrency(metrics.pix.volumeMonth)}</div>
              <div className="metric-sub">
                Hoje: <span className="text-success">{formatCurrency(metrics.pix.volumeToday)}</span> | 
                {metrics.pix.pending} pendentes
              </div>
            </div>
          </div>

          <div className="dashboard-charts">
            <div className="chart-card">
              <h3 className="chart-title">Status das Ativações (Geral)</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span className="text-sm font-semibold">Concluídas</span>
                    <span className="text-sm text-success">{metrics.activations.completed}</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${calculateSuccessRate()}%`, height: '100%', background: '#10b981' }}></div>
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span className="text-sm font-semibold">Canceladas / Expiradas</span>
                    <span className="text-sm text-danger">{metrics.activations.cancelled + metrics.activations.expired}</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${100 - calculateSuccessRate()}%`, height: '100%', background: '#ef4444' }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="chart-card">
              <h3 className="chart-title">Aviso de Simulação</h3>
              <p className="text-muted" style={{ lineHeight: 1.6 }}>
                Os gráficos complexos de linhas para o período dos últimos 30 dias requerem bibliotecas adicionais 
                como Chart.js ou Recharts, além de uma consulta agregada por dia no banco de dados. 
                <br/><br/>
                Para focar na estabilidade do projeto, os dados em tempo real acima trazem os totais precisos. 
                A evolução gráfica detalhada será acoplada em uma atualização posterior.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
