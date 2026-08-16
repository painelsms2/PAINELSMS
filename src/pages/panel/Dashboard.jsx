import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { historyService } from '../../services/historyService';
import { numberProviderService } from '../../services/numberProviderService';
import Skeleton from '../../components/ui/Skeleton';
import { MessageCircle, Send, Camera, Users, Globe, Music, MessageSquare, Car, Hash, Tv, X, Copy, CheckCircle2, History, Smile, Frown, Calendar, ChevronLeft, ChevronRight, Search, PlusCircle, SearchX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const iconMap = {
  MessageCircle: <MessageCircle size={18} />,
  Send: <Send size={18} />,
  Camera: <Camera size={18} />,
  Facebook: <Users size={18} />,
  Chrome: <Globe size={18} />,
  Music: <Music size={18} />,
  MessageSquare: <MessageSquare size={18} />,
  Car: <Car size={18} />,
  Twitter: <Hash size={18} />,
  Tv: <Tv size={18} />
};

import { ActiveCard } from '../../components/ActiveCard';

// ==========================================
// MAIN DASHBOARD COMPONENT
// ==========================================
const Dashboard = () => {
  const { user, updateBalance } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [activeActivations, setActiveActivations] = useState([]);
  const [historyItems, setHistoryItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Tabs logic
  const [activeTab, setActiveTab] = useState('historico');

  // Load Data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const history = await historyService.getUserHistory(user.id);
      
      const active = history.filter(h => h.status === 'waiting_sms');
      const historical = history.filter(h => h.status !== 'waiting_sms').sort((a, b) => {
        const tA = a.timestamp || a.createdAt || 0;
        const tB = b.timestamp || b.createdAt || 0;
        return new Date(tB).getTime() - new Date(tA).getTime();
      });

      setActiveActivations(active);
      setHistoryItems(historical);

      // Auto-switch tabs based on active activations
      if (active.length > 0) {
        setActiveTab('ativacoes');
      } else {
        setActiveTab('historico');
      }

    } catch (error) {
      console.error("Failed to load dashboard data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user.id]);

  // Handle Complete & Cancel
  const handleActivationComplete = (activation, code) => {
    updateBalance(user.balance - activation.service.price);
    historyService.updateActivation(activation.activationId, {
      status: 'completed',
      code: code,
      smsCode: code,
      completedAt: Date.now()
    });
    setTimeout(() => { loadData(); }, 3000);
  };

  const handleActivationCancel = (activation, finalStatus) => {
    historyService.updateActivation(activation.activationId, {
      status: finalStatus,
      cancelledAt: Date.now()
    });
    setTimeout(() => { loadData(); }, 500);
  };

  // ==========================================
  // HISTORY TAB STATE & LOGIC
  // ==========================================
  const [historyTabSelect, setHistoryTabSelect] = useState('recent'); // 'recent' or 'old'
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({ startDate: '', endDate: '', searchQuery: '' });
  const [currentPage, setCurrentPage] = useState(1);

  const handleSearch = () => {
    setAppliedFilters({ startDate, endDate, searchQuery });
    setCurrentPage(1);
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    addToast(`${type} copiado!`, 'success');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const filteredHistory = useMemo(() => {
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    
    let tabData = historyItems.filter(item => {
      const itemTime = new Date(item.timestamp || item.createdAt).getTime();
      if (historyTabSelect === 'recent') return (now - itemTime) <= sevenDaysMs;
      return (now - itemTime) > sevenDaysMs;
    });

    if (appliedFilters.startDate) {
      const start = new Date(appliedFilters.startDate).getTime();
      tabData = tabData.filter(item => new Date(item.timestamp || item.createdAt).getTime() >= start);
    }
    if (appliedFilters.endDate) {
      const end = new Date(appliedFilters.endDate).getTime() + (24 * 60 * 60 * 1000) - 1;
      tabData = tabData.filter(item => new Date(item.timestamp || item.createdAt).getTime() <= end);
    }
    if (appliedFilters.searchQuery) {
      const q = appliedFilters.searchQuery.toLowerCase();
      tabData = tabData.filter(item => 
        (item.serviceName || item.service?.name || '').toLowerCase().includes(q) ||
        (item.phoneNumber || item.number || '').includes(q) ||
        (item.code || item.smsCode || '').includes(q)
      );
    }
    return tabData;
  }, [historyItems, historyTabSelect, appliedFilters]);

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage) || 1;
  const paginatedHistory = filteredHistory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSearchQuery('');
    setAppliedFilters({ startDate: '', endDate: '', searchQuery: '' });
    setCurrentPage(1);
  };

  const getStatusFace = (status) => {
    if (status === 'completed') {
      return (
        <div className="history-status-pill success">
          <CheckCircle2 size={14} /> Recebido
        </div>
      );
    }
    return (
      <div className="history-status-pill danger">
        <X size={14} /> Sem código
      </div>
    );
  };

  const hasActive = activeActivations.length > 0;

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="text-muted">Acompanhe seus números em tempo real e consulte o histórico.</p>
      </div>

      {/* Primary Dashboard Tabs */}
      <div className="dashboard-main-tabs">
        {hasActive && (
          <button 
            className={`main-tab-btn ${activeTab === 'ativacoes' ? 'active' : ''}`}
            onClick={() => setActiveTab('ativacoes')}
          >
            Ativações em andamento <span className="badge-count">{activeActivations.length}</span>
          </button>
        )}
        <button 
          className={`main-tab-btn ${activeTab === 'historico' ? 'active' : ''}`}
          onClick={() => setActiveTab('historico')}
        >
          Histórico
        </button>
      </div>

      <div className="dashboard-content">
        
        {/* TAB: ATIVAÇÕES */}
        {activeTab === 'ativacoes' && hasActive && (
          <div className="active-cards-grid">
            {activeActivations.map(act => (
              <ActiveCard 
                key={act.activationId} 
                activation={act} 
                onComplete={handleActivationComplete}
                onCancel={handleActivationCancel}
              />
            ))}
          </div>
        )}

        {/* TAB: HISTÓRICO */}
        {activeTab === 'historico' && (
          <div className="historico-section fade-in-up">
            <div className="filter-bar card">
              <div className="filter-group">
                <label>Paginação</label>
                <select className="form-input" value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
                  <option value={10}>10 por página</option>
                  <option value={25}>25 por página</option>
                  <option value={50}>50 por página</option>
                </select>
              </div>

              <div className="filter-group date-group">
                <label>Data de Início</label>
                <div className="input-with-icon">
                  <Calendar size={16} className="input-icon" />
                  <input type="date" className="form-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
              </div>

              <div className="filter-group date-group">
                <label>Data do Fim</label>
                <div className="input-with-icon">
                  <Calendar size={16} className="input-icon" />
                  <input type="date" className="form-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>
              
              <div className="filter-group" style={{ flex: 1.5 }}>
                <label>Pesquisar</label>
                <div className="input-with-icon">
                  <Search size={16} className="input-icon" />
                  <input type="text" className="form-input" placeholder="Serviço ou número..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
              </div>

              <div className="filter-actions">
                <button className="btn btn-ghost" onClick={handleClearFilters}>
                  Limpar filtros
                </button>
                <button className="btn btn-primary btn-search" onClick={handleSearch}>
                  <Search size={18} /> BUSCAR
                </button>
              </div>
            </div>

            <div className="card">
              <div className="history-tabs">
                <button className={`tab-btn ${historyTabSelect === 'recent' ? 'active' : ''}`} onClick={() => { setHistoryTabSelect('recent'); setCurrentPage(1); }}>Histórico Recente</button>
                <button className={`tab-btn ${historyTabSelect === 'old' ? 'active' : ''}`} onClick={() => { setHistoryTabSelect('old'); setCurrentPage(1); }}>Histórico Antigos</button>
              </div>

              <div className="table-responsive history-table-container">
                <table className="data-table history-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Dia da compra</th>
                      <th>Serviço</th>
                      <th>Número alugado</th>
                      <th>SMS</th>
                      <th>Valor</th>
                      <th className="text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={`skel-${i}`}>
                          <td colSpan="7" className="py-4"><Skeleton width="100%" height="20px" /></td>
                        </tr>
                      ))
                    ) : paginatedHistory.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center py-6">
                          <div className="empty-state-mini">
                            <SearchX size={32} className="text-muted mb-2" />
                            <p className="text-muted">Nenhum registro encontrado com estes filtros.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedHistory.map(item => {
                        const idHash = (item.activationId || item.id || 'xxxx').substring(0, 6).toUpperCase();
                        const date = formatDate(item.timestamp || item.createdAt);
                        const sName = item.serviceName || item.service?.name;
                        const sId = item.serviceId || item.service?.id;
                        const price = item.price || item.service?.price || 0;
                        const phone = item.phoneNumber || item.number;
                        const code = item.code || item.smsCode;
                        
                        return (
                          <tr key={item.activationId || item.id}>
                            <td className="text-muted font-mono">{idHash}</td>
                            <td className="text-muted">{date}</td>
                            <td className="font-semibold">{sName}</td>
                            <td>
                              <div className="flex-row-center" style={{ gap: '0.5rem' }}>
                                <span className="monospace-text">{phone}</span>
                                <button className="btn-copy-small" onClick={() => copyToClipboard(phone, 'Número')}><Copy size={14} /></button>
                              </div>
                            </td>
                            <td>
                              {code ? (
                                <div className="flex-row-center" style={{ gap: '0.5rem' }}>
                                  <span className="font-semibold text-main">{code}</span>
                                  <button className="btn-copy-small" onClick={() => copyToClipboard(code, 'Código')}><Copy size={14} /></button>
                                </div>
                              ) : <span className="text-muted">-</span>}
                            </td>
                            <td>R$ {price.toFixed(2)}</td>
                            <td className="text-center">{getStatusFace(item.status)}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {!isLoading && filteredHistory.length > 0 && (
                <div className="pagination-bar">
                  <div className="pagination-info">Mostrando <strong>{(currentPage - 1) * itemsPerPage + 1}</strong> a <strong>{Math.min(currentPage * itemsPerPage, filteredHistory.length)}</strong> de <strong>{filteredHistory.length}</strong> resultados</div>
                  <div className="pagination-controls">
                    <button className="page-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}><ChevronLeft size={18} /></button>
                    <span className="page-current">{currentPage}</span>
                    <button className="page-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}><ChevronRight size={18} /></button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
