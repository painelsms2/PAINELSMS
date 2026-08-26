import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import { DollarSign, TrendingUp, Users, Smartphone, AlertCircle } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import Skeleton from '../../components/ui/Skeleton';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { addToast } = useToast();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState('mes');

  useEffect(() => {
    const fetchMetrics = async () => {
      setIsLoading(true);
      try {
        const { data: result, error } = await supabase.rpc('admin_metrics', { p_period: period });
        if (error) throw error;
        setData(result);
      } catch (error) {
        console.error("Erro ao carregar métricas", error);
        addToast("Falha ao carregar métricas administrativas.", "error");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMetrics();
  }, [addToast, period]);

  const formatCurrency = (val) => {
    return Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDateShort = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoString;
    }
  };

  const calculateDelta = (current, previous) => {
    // Como nossa RPC não traz do mês passado, vamos simular que o "today" * 30 vs month seria um delta,
    // ou apenas mostrar se o mês está bom. Para simplificar e ser honesto, como não temos mês anterior na RPC,
    // vamos calcular a projeção do mês (se today * 30 > month). Mas como é só visual, vamos calcular algo simples:
    // Se hoje > média diária do mês, é positivo.
    const daysPassed = new Date().getDate();
    const dailyAvg = previous / daysPassed;
    if (current > dailyAvg) return { type: 'positive', label: `+${Math.round(((current/dailyAvg)-1)*100)}% vs média` };
    if (current < dailyAvg) return { type: 'negative', label: `${Math.round(((current/dailyAvg)-1)*100)}% vs média` };
    return { type: 'neutral', label: 'Na média' };
  };

  if (isLoading) {
    return (
      <div className="admin-dashboard fade-in">
        <div className="page-header"><h1 className="page-title">Dashboard</h1></div>
        <div className="metrics-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="metric-card">
              <Skeleton width="100%" height="20px" className="mb-4" />
              <Skeleton width="60%" height="40px" className="mb-2" />
              <Skeleton width="80%" height="16px" />
            </div>
          ))}
        </div>
        <div className="secondary-kpi-row">
          {Array.from({ length: 6 }).map((_, i) => (
             <div key={i} className="sec-kpi-card"><Skeleton width="100%" height="40px" /></div>
          ))}
        </div>
        <div className="charts-grid">
          <div className="chart-card"><Skeleton width="100%" height="300px" /></div>
          <div className="chart-card"><Skeleton width="100%" height="300px" /></div>
        </div>
      </div>
    );
  }

  if (!data || !data.kpis) {
    return (
      <div className="admin-dashboard fade-in">
        <div className="empty-state">
          <AlertCircle size={48} className="text-muted mb-4" />
          <h3>Erro ao carregar dados</h3>
          <p className="text-muted">Não foi possível processar a resposta do servidor.</p>
        </div>
      </div>
    );
  }

  const { kpis, daily, topServices, recentActivity } = data;

  const CustomTooltip = ({ active, payload, label, isCurrency = false }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="label">{label}</p>
          {payload.map((p, i) => (
            <p key={i} style={{ color: p.color }}>
              {p.name}: {isCurrency ? formatCurrency(p.value) : p.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const donutData = [
    { name: 'Concluídas', value: kpis.activations.completed, color: '#10b981' },
    { name: 'Falhas', value: kpis.activations.cancelled + kpis.activations.expired, color: '#ef4444' }
  ];

  const periodLabel = period === 'semana' ? '(7 dias)' : period === 'mes' ? '(Mês)' : '(Total)';
  const chartDaysLabel = period === 'semana' ? 'Últimos 7 dias' : period === 'mes' ? 'Últimos 30 dias' : 'Todo Período (Últimos 90 dias)';

  return (
    <div className="admin-dashboard fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Dashboard Analítico</h1>
          <p className="text-muted">Desempenho financeiro e operacional filtrado.</p>
        </div>
        <div className="period-selector">
          <button className={`period-btn ${period === 'semana' ? 'active' : ''}`} onClick={() => setPeriod('semana')}>Semana</button>
          <button className={`period-btn ${period === 'mes' ? 'active' : ''}`} onClick={() => setPeriod('mes')}>Mês</button>
          <button className={`period-btn ${period === 'total' ? 'active' : ''}`} onClick={() => setPeriod('total')}>Total</button>
        </div>
      </div>

      {/* 1. HERO KPIs */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Lucro Líquido {periodLabel}</span>
            <div className="metric-icon"><TrendingUp size={20} /></div>
          </div>
          <div className="metric-value">
            {formatCurrency(kpis.profit.month)}
          </div>
          <div className="metric-sub">
            Hoje: <span className="text-success">{formatCurrency(kpis.profit.today)}</span>
          </div>
          <div className="metric-sparkline">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={daily}>
                <Line type="monotone" dataKey="profit" stroke="#f97316" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Ativações Concluídas</span>
            <div className="metric-icon"><Smartphone size={20} /></div>
          </div>
          <div className="metric-value">
            {kpis.activations.completed}
          </div>
          <div className="metric-sub">
            Sucesso Geral: <span className="text-success">{Number(kpis.secondary.successRate).toFixed(1)}%</span>
          </div>
          <div className="metric-sparkline">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={daily}>
                <Line type="monotone" dataKey="completed" stroke="#f97316" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Usuários Ativos</span>
            <div className="metric-icon"><Users size={20} /></div>
          </div>
          <div className="metric-value">
            {kpis.users.active}
          </div>
          <div className="metric-sub">
            Novos Hoje: <span className="text-success">+{kpis.users.newToday}</span>
          </div>
          <div className="metric-sparkline">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={daily}>
                <Area type="monotone" dataKey="revenue" stroke="none" fill="#f97316" fillOpacity={0.1} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Volume Pix {periodLabel}</span>
            <div className="metric-icon"><DollarSign size={20} /></div>
          </div>
          <div className="metric-value">
            {formatCurrency(kpis.pix.volumeMonth)}
          </div>
          <div className="metric-sub">
            Hoje: <span className="text-success">{formatCurrency(kpis.pix.volumeToday)}</span>
          </div>
          <div className="metric-sparkline">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={daily}>
                <Bar dataKey="pix_volume" fill="#f97316" opacity={0.3} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 2. SECONDARY KPIs */}
      <div className="secondary-kpi-row">
        <div className="sec-kpi-card">
          <span className="sec-kpi-title">Ticket Médio</span>
          <span className="sec-kpi-val">{formatCurrency(kpis.secondary.ticketMedio)}</span>
        </div>
        <div className="sec-kpi-card">
          <span className="sec-kpi-title">Margem Média</span>
          <span className="sec-kpi-val">{Number(kpis.secondary.margemMedia).toFixed(1)}%</span>
        </div>
        <div className="sec-kpi-card">
          <span className="sec-kpi-title">Saldo Retido (Total)</span>
          <span className="sec-kpi-val">{formatCurrency(kpis.users.totalWalletBalance)}</span>
        </div>
        <div className="sec-kpi-card" style={kpis.pix.pending > 0 ? { borderColor: '#ef4444' } : {}}>
          <span className="sec-kpi-title">PIX Pendentes</span>
          <span className={`sec-kpi-val ${kpis.pix.pending > 0 ? 'text-danger' : ''}`}>{kpis.pix.pending}</span>
        </div>
        <div className="sec-kpi-card">
          <span className="sec-kpi-title">Serviços Ativos</span>
          <span className="sec-kpi-val">{kpis.secondary.activeServices}</span>
        </div>
        {kpis.secondary.dddProbes !== undefined && (
          <div className="sec-kpi-card" style={{ opacity: 0.7 }}>
            <span className="sec-kpi-title" title="Sondas de disponibilidade interna. Não afetam métricas de negócio.">Sondas DDD (Ocultas)</span>
            <span className="sec-kpi-val">{kpis.secondary.dddProbes}</span>
          </div>
        )}
      </div>

      {/* 3. HERO CHARTS */}
      <div className="charts-grid">
        <div className="chart-card">
          <h3 className="chart-title">Receita vs Lucro ({chartDaysLabel})</h3>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer>
              <AreaChart data={daily} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProf" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} tickFormatter={(val) => `R$${val}`} />
                <Tooltip content={<CustomTooltip isCurrency={true} />} />
                <Legend iconType="circle" />
                <Area type="monotone" dataKey="revenue" name="Receita" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="profit" name="Lucro" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorProf)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <h3 className="chart-title">Taxa de Sucesso</h3>
          <div style={{ width: '100%', height: '240px' }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} iconType="circle"/>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center mt-2">
            <span className="text-2xl font-bold text-success">{Number(kpis.secondary.successRate).toFixed(1)}%</span>
            <p className="text-sm text-muted">de ativações concluídas</p>
          </div>
        </div>

        <div className="chart-card">
          <h3 className="chart-title">Ativações por Dia</h3>
          <div style={{ width: '100%', height: '250px' }}>
            <ResponsiveContainer>
              <BarChart data={daily} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" />
                <Bar dataKey="completed" name="Concluídas" stackId="a" fill="#10b981" />
                <Bar dataKey="expired" name="Expiradas" stackId="a" fill="#f59e0b" />
                <Bar dataKey="cancelled" name="Canceladas" stackId="a" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <h3 className="chart-title">Volume Pix Recebido</h3>
          <div style={{ width: '100%', height: '250px' }}>
            <ResponsiveContainer>
              <BarChart data={daily} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} tickFormatter={(val) => `R$${val}`} />
                <Tooltip content={<CustomTooltip isCurrency={true} />} />
                <Bar dataKey="pix_volume" name="Volume Pix" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4. BOTTOM PANELS */}
      <div className="panels-grid">
        <div className="panel-card">
          <h3 className="panel-title">Top Serviços (Mês)</h3>
          <div className="top-services-list">
            {topServices.length === 0 ? (
              <p className="text-muted text-center py-4">Nenhum serviço ativado no mês.</p>
            ) : (
              topServices.map((ts, idx) => (
                <div key={idx} className="ts-item">
                  <div className="ts-left">
                    <img src={`/images/${ts.icon}`} alt={ts.name} className="ts-icon" />
                    <div>
                      <div className="ts-name">{ts.name}</div>
                      <div className="ts-count">{ts.activations} ativações</div>
                    </div>
                  </div>
                  <div className="ts-right">
                    <div className="ts-profit">{formatCurrency(ts.profit)} lucro</div>
                    <div className="ts-rev">{formatCurrency(ts.revenue)} rec.</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="panel-card">
          <h3 className="panel-title">Últimas Atividades</h3>
          <div className="activity-list">
            {recentActivity.length === 0 ? (
              <p className="text-muted text-center py-4">Nenhuma atividade recente.</p>
            ) : (
              recentActivity.map((act) => (
                <div key={act.id} className="activity-item">
                  <div className="activity-info">
                    <h4>{act.type}</h4>
                    <p>{act.user_name} • {act.status === 'completed' ? 'Concluído' : act.status === 'cancelled' ? 'Cancelado' : act.status}</p>
                  </div>
                  <div className="activity-val">
                    <div className={`amt ${act.type.includes('Pix') ? 'text-success' : ''}`}>
                      {formatCurrency(act.amount)}
                    </div>
                    <div className="time">{formatDateShort(act.created_at)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
