import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import { Search, Loader2, Save, Plus, ChevronDown, ChevronUp, Network, Trash2, Star, Lock, Unlock, Filter, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import './AdminServices.css';
import './AdminUsers.css'; // reaproveitar estilos da tabela

const AdminServices = () => {
  const { addToast } = useToast();
  const [services, setServices] = useState([]);
  const [providers, setProviders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [providerFilter, setProviderFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [expandedSvcId, setExpandedSvcId] = useState(null);

  const fetchAll = async () => {
    try {
      setIsLoading(true);
      const [svcRes, provRes] = await Promise.all([
        supabase.from('services').select(`
          id, name, country, icon_file, active,
          offers:service_offers(*, provider:providers(id, name, logo_key))
        `).order('name'),
        supabase.from('providers').select('*').eq('active', true).order('name')
      ]);
      
      if (svcRes.error) throw svcRes.error;
      if (provRes.error) throw provRes.error;
      
      setServices(svcRes.data || []);
      setProviders(provRes.data || []);
    } catch (err) {
      console.error(err);
      addToast("Erro ao carregar dados", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const toggleExpand = (svcId) => {
    setExpandedSvcId(prev => prev === svcId ? null : svcId);
  };

  const handleUpdateServiceActive = async (svcId, active) => {
    const { error } = await supabase.from('services').update({ active }).eq('id', svcId);
    if (error) {
      addToast("Erro ao atualizar serviço", "error");
    } else {
      setServices(services.map(s => s.id === svcId ? { ...s, active } : s));
    }
  };

  const formatCurrency = (val) => {
    return Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Compute Top Metrics
  const metrics = useMemo(() => {
    let multiProvider = 0;
    let missingPrice = 0;
    let totalMargin = 0;
    let marginCount = 0;

    services.forEach(s => {
      if (s.offers && s.offers.length > 1) multiProvider++;
      s.offers?.forEach(o => {
        if (o.sale_price <= 0) missingPrice++;
        if (o.cost_price > 0 && o.sale_price > o.cost_price) {
          totalMargin += ((o.sale_price - o.cost_price) / o.cost_price) * 100;
          marginCount++;
        }
      });
    });

    return {
      multiProvider,
      missingPrice,
      avgMargin: marginCount > 0 ? (totalMargin / marginCount).toFixed(0) : 0
    };
  }, [services]);

  // Filter Logic
  const filteredServices = useMemo(() => {
    return services.filter(s => {
      // Name Search
      if (search && !s.name?.toLowerCase().includes(search.toLowerCase())) return false;
      
      // Provider Filter
      if (providerFilter) {
        const hasProvider = s.offers?.some(o => o.provider_id === providerFilter);
        if (!hasProvider) return false;
      }
      
      // Status Filter
      if (statusFilter) {
        if (statusFilter === 'ativo' && !s.active) return false;
        if (statusFilter === 'inativo' && s.active) return false;
        if (statusFilter === 'estoque') {
          const hasStock = s.offers?.some(o => o.stock > 0 && o.active);
          if (!hasStock) return false;
        }
        if (statusFilter === 'sem_preco') {
          const hasMissingPrice = s.offers?.some(o => o.sale_price <= 0);
          if (!hasMissingPrice) return false;
        }
      }
      
      return true;
    });
  }, [services, search, providerFilter, statusFilter]);

  // Helper to find best deal per service (used in rows)
  const getServiceBestDeal = (offers) => {
    if (!offers || offers.length === 0) return null;
    const valid = offers.filter(o => o.active && o.stock > 0 && o.sale_price > 0);
    if (valid.length === 0) return null;
    return valid.reduce((min, curr) => curr.cost_price < min.cost_price ? curr : min, valid[0]);
  };

  return (
    <div className="admin-services fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Gestão de Serviços</h1>
          <p className="text-muted">{services.length} serviços no catálogo.</p>
        </div>
        
        {/* Top Summary Banners */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div className="admin-card" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: '150px' }}>
            <div style={{ background: 'var(--primary-color-dim)', padding: '0.5rem', borderRadius: '8px', color: 'var(--primary-color)' }}>
              <Network size={20} />
            </div>
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{metrics.multiProvider}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Multi-Fornecedor</div>
            </div>
          </div>
          <div className="admin-card" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: '150px' }}>
            <div style={{ background: 'var(--success-color-dim)', padding: '0.5rem', borderRadius: '8px', color: 'var(--success-color)' }}>
              <TrendingUp size={20} />
            </div>
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{metrics.avgMargin}%</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Margem Média</div>
            </div>
          </div>
          <div className="admin-card" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: '150px', border: metrics.missingPrice > 0 ? '1px solid var(--danger-color)' : '' }}>
            <div style={{ background: 'var(--danger-color-dim)', padding: '0.5rem', borderRadius: '8px', color: 'var(--danger-color)' }}>
              <AlertCircle size={20} />
            </div>
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{metrics.missingPrice}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sem Preço Definido</div>
            </div>
          </div>
        </div>
      </div>

      <div className="table-container">
        <div className="table-controls" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', padding: '1rem' }}>
          <div className="search-box" style={{ flex: '1 1 300px' }}>
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Buscar serviço por nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Filter size={16} className="text-muted" />
            <select className="rm-input" style={{ width: '180px' }} value={providerFilter} onChange={e => setProviderFilter(e.target.value)}>
              <option value="">Todos os fornecedores</option>
              {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <select className="rm-input" style={{ width: '180px' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">Todos os status</option>
              <option value="ativo">Global: Ativos</option>
              <option value="inativo">Global: Inativos</option>
              <option value="estoque">Com Estoque</option>
              <option value="sem_preco">Sem Preço Definido</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem', marginTop: '1rem', padding: '0 1rem 1rem 1rem' }}>
          {isLoading ? (
            <div className="text-center py-8" style={{ gridColumn: '1 / -1' }}>
              <Loader2 size={24} className="spin text-muted mx-auto" />
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-8 text-muted" style={{ gridColumn: '1 / -1' }}>
              Nenhum serviço encontrado.
            </div>
          ) : (
            filteredServices.map(svc => {
              const bestDeal = getServiceBestDeal(svc.offers);
              const providerCount = svc.offers?.length || 0;
              const isExpanded = expandedSvcId === svc.id;
              
              return (
                <div key={svc.id} className="admin-card fade-in" style={{ 
                  display: 'flex', flexDirection: 'column', 
                  border: isExpanded ? '1px solid var(--primary-color)' : '1px solid var(--border-color)',
                  boxShadow: isExpanded ? '0 0 10px rgba(var(--primary-color-rgb), 0.1)' : 'none',
                  transition: 'all 0.2s',
                  gridColumn: isExpanded ? '1 / -1' : 'auto'
                }}>
                  {/* Card Header (always visible) */}
                  <div 
                    className="cursor-pointer" 
                    onClick={() => toggleExpand(svc.id)}
                    style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}
                  >
                    {/* Left: Icon and Name */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: '1 1 200px' }}>
                      <img src={`/images/${svc.icon_file}`} alt={svc.name} className="service-icon-small" style={{ width: 44, height: 44, padding: '6px' }} onError={e=>e.target.style.display='none'} />
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{svc.name}</div>
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          <Network size={12} />
                          <span>{providerCount} config.</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Middle: Best Deal Summary */}
                    <div style={{ flex: '1 1 150px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                      {bestDeal ? (
                        <>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Melhor Custo</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success-color)' }}></div>
                            <span className="font-bold text-success">{formatCurrency(bestDeal.cost_price)}</span>
                            <span className="text-muted" style={{ fontSize: '0.75rem' }}>({(((bestDeal.sale_price - bestDeal.cost_price) / bestDeal.cost_price) * 100).toFixed(0)}% margem)</span>
                          </div>
                        </>
                      ) : providerCount > 0 ? (
                        <>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Alerta</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--danger-color)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <AlertCircle size={14} /> Ofertas Inválidas
                          </div>
                        </>
                      ) : (
                         <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>-</div>
                      )}
                    </div>
                    
                    {/* Right: Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flex: '0 0 auto' }}>
                      <label className="toggle-switch" onClick={e => e.stopPropagation()} title={svc.active ? "Ativo" : "Inativo"}>
                        <input 
                          type="checkbox" 
                          checked={svc.active}
                          onChange={(e) => handleUpdateServiceActive(svc.id, e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                      <div style={{ color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '0.25rem', borderRadius: '50%' }}>
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div style={{ 
                      padding: '1.5rem', 
                      background: 'var(--bg-tertiary)', 
                      borderTop: '1px solid var(--border-color)',
                      borderBottomLeftRadius: '12px',
                      borderBottomRightRadius: '12px'
                    }}>
                      <ServiceOffersManager 
                        service={svc} 
                        providers={providers} 
                        onRefresh={fetchAll} 
                        addToast={addToast} 
                        bestDealId={bestDeal?.id}
                      />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

// Subcomponent to manage offers for a specific service using Card/Grid view
const ServiceOffersManager = ({ service, providers, onRefresh, addToast, bestDealId }) => {
  const [offers, setOffers] = useState(service.offers || []);
  const [isAdding, setIsAdding] = useState(false);
  const [newOffer, setNewOffer] = useState({ provider_id: '', provider_service_code: '', cost_price: 0, sale_price: 0, stock: 100, active: true, price_locked: false });
  const [edits, setEdits] = useState({});
  const [savingId, setSavingId] = useState(null);

  const formatCurrency = (val) => Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const handleEdit = (offerId, field, value) => {
    setEdits(prev => ({ ...prev, [offerId]: { ...prev[offerId], [field]: value } }));
  };

  const handleSaveEdit = async (offer) => {
    const oEdits = edits[offer.id];
    if (!oEdits) return;
    
    setSavingId(offer.id);
    const { error } = await supabase.from('service_offers').update(oEdits).eq('id', offer.id);
    
    if (error) {
      addToast("Erro ao atualizar oferta", "error");
    } else {
      addToast("Oferta salva", "success");
      setEdits(prev => { const n = {...prev}; delete n[offer.id]; return n; });
      setOffers(offers.map(o => o.id === offer.id ? { ...o, ...oEdits } : o));
      onRefresh(); // trigger refresh to recalculate best deal at the parent
    }
    setSavingId(null);
  };

  const handleSetDefault = async (offerId) => {
    setSavingId('default');
    await supabase.from('service_offers').update({ is_default: false }).eq('service_id', service.id);
    const { error } = await supabase.from('service_offers').update({ is_default: true }).eq('id', offerId);
    
    if (error) {
      addToast("Erro ao definir padrão", "error");
    } else {
      addToast("Fornecedor padrão atualizado", "success");
      setOffers(offers.map(o => ({ ...o, is_default: o.id === offerId })));
      onRefresh();
    }
    setSavingId(null);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!newOffer.provider_id) {
      addToast("Selecione um fornecedor", "error");
      return;
    }
    setSavingId('new');
    const isFirst = offers.length === 0;
    const payload = {
      service_id: service.id,
      ...newOffer,
      is_default: isFirst
    };
    
    const { error } = await supabase.from('service_offers').insert([payload]);
    if (error) {
      if (error.code === '23505') addToast("Este fornecedor já está adicionado neste serviço.", "error");
      else addToast("Erro ao adicionar fornecedor", "error");
    } else {
      addToast("Fornecedor adicionado", "success");
      setIsAdding(false);
      onRefresh(); 
    }
    setSavingId(null);
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Remover fornecedor deste serviço?")) return;
    const { error } = await supabase.from('service_offers').delete().eq('id', id);
    if (!error) {
      setOffers(offers.filter(o => o.id !== id));
      addToast("Fornecedor removido", "success");
      onRefresh();
    }
  };

  // Find the actual best cost_price for the delta metric
  const bestOfferCost = offers.find(o => o.id === bestDealId)?.cost_price || 0;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Configuração de fornecedores ({offers.length})</h4>
        <button className="btn btn-primary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }} onClick={() => setIsAdding(!isAdding)}>
          <Plus size={14} /> Adicionar Manual
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem', marginBottom: '1.5rem', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px' }}>
          <div>
            <label style={{ fontSize: '0.7rem' }}>Fornecedor</label>
            <select className="rm-input" value={newOffer.provider_id} onChange={e => setNewOffer({...newOffer, provider_id: e.target.value})} required style={{ padding: '0.4rem', fontSize: '0.8rem' }}>
              <option value="">Selecione...</option>
              {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.7rem' }}>Código API</label>
            <input type="text" className="rm-input" value={newOffer.provider_service_code} onChange={e => setNewOffer({...newOffer, provider_service_code: e.target.value})} placeholder="ex: wa" style={{ padding: '0.4rem', fontSize: '0.8rem' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.7rem' }}>Custo (R$)</label>
            <input type="number" step="0.01" className="rm-input" value={newOffer.cost_price} onChange={e => setNewOffer({...newOffer, cost_price: e.target.value})} required style={{ padding: '0.4rem', fontSize: '0.8rem' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.7rem' }}>Venda (R$)</label>
            <input type="number" step="0.01" className="rm-input" value={newOffer.sale_price} onChange={e => setNewOffer({...newOffer, sale_price: e.target.value})} required style={{ padding: '0.4rem', fontSize: '0.8rem' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.7rem' }}>Estoque</label>
            <input type="number" className="rm-input" value={newOffer.stock} onChange={e => setNewOffer({...newOffer, stock: e.target.value})} required style={{ padding: '0.4rem', fontSize: '0.8rem' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={savingId === 'new'} style={{ width: '100%', padding: '0.4rem' }}>
              {savingId === 'new' ? <Loader2 size={14} className="spin mx-auto" /> : 'Salvar'}
            </button>
          </div>
        </form>
      )}

      {offers.length === 0 && !isAdding ? (
        <div className="text-center text-muted" style={{ fontSize: '0.85rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
          Este serviço está indisponível. Clique em "Adicionar Manual" ou sincronize os provedores.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {offers.map(offer => {
            const oEdits = edits[offer.id] || {};
            const isEdited = Object.keys(oEdits).length > 0;
            const costPrice = parseFloat(oEdits.cost_price !== undefined ? oEdits.cost_price : offer.cost_price);
            const salePrice = parseFloat(oEdits.sale_price !== undefined ? oEdits.sale_price : offer.sale_price);
            const profit = salePrice - costPrice;
            const profitPercent = costPrice > 0 ? (profit / costPrice) * 100 : 0;
            const isActive = oEdits.active !== undefined ? oEdits.active : offer.active;
            const isLocked = oEdits.price_locked !== undefined ? oEdits.price_locked : offer.price_locked;
            const stock = oEdits.stock !== undefined ? oEdits.stock : offer.stock;
            const code = oEdits.provider_service_code !== undefined ? oEdits.provider_service_code : offer.provider_service_code;

            // Heatmap logic
            let cardStyle = { borderColor: 'var(--border-color)' };
            let badge = null;
            let statusDot = 'gray';

            if (!isActive || stock <= 0 || salePrice <= 0) {
              cardStyle.opacity = 0.6;
              statusDot = 'var(--danger-color)';
            } else if (offer.id === bestDealId) {
              cardStyle.borderColor = 'var(--success-color)';
              cardStyle.boxShadow = '0 0 10px rgba(16, 185, 129, 0.1)';
              statusDot = 'var(--success-color)';
              badge = <div style={{ position: 'absolute', top: -10, right: 10, background: 'var(--success-color)', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '0.65rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={10} /> Melhor Custo</div>;
            } else {
              cardStyle.borderColor = 'var(--warning-color)';
              statusDot = 'var(--warning-color)';
            }

            const deltaCost = costPrice - bestOfferCost;

            return (
              <div key={offer.id} className="admin-card" style={{ position: 'relative', padding: '1rem', border: `1px solid ${cardStyle.borderColor}`, boxShadow: cardStyle.boxShadow || 'none', opacity: cardStyle.opacity || 1, transition: 'all 0.2s', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {badge}
                
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusDot }}></div>
                    {offer.provider?.logo_key ? (
                      <img src={`/${offer.provider.logo_key}`} style={{ height: 20, objectFit: 'contain' }} onError={e=>e.target.style.display='none'} />
                    ) : (
                      <Network size={18} className="text-muted" />
                    )}
                    <span className="font-bold">{offer.provider?.name || 'Desconhecido'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button className="btn-icon" onClick={() => handleSetDefault(offer.id)} title={offer.is_default ? "Padrão" : "Tornar Padrão"} style={{ color: offer.is_default ? 'var(--warning-color)' : 'var(--text-muted)' }}>
                      <Star size={18} fill={offer.is_default ? 'currentColor' : 'none'} />
                    </button>
                    <button className="btn-icon text-danger" onClick={() => handleDelete(offer.id)} title="Excluir" disabled={savingId === offer.id}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Grid of inputs */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Cód. API</label>
                    <input type="text" className="rm-input" style={{ width: '100%', padding: '0.25rem', fontSize: '0.8rem' }} value={code || ''} onChange={e => handleEdit(offer.id, 'provider_service_code', e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Estoque</label>
                    <input type="number" className="rm-input" style={{ width: '100%', padding: '0.25rem', fontSize: '0.8rem', borderColor: stock <= 0 ? 'var(--danger-color)' : '' }} value={stock} onChange={e => handleEdit(offer.id, 'stock', e.target.value)} />
                  </div>
                  
                  <div>
                    <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Custo (R$)</label>
                    <input type="number" step="0.01" className="rm-input" style={{ width: '100%', padding: '0.25rem', fontSize: '0.8rem' }} value={costPrice} onChange={e => handleEdit(offer.id, 'cost_price', e.target.value)} />
                    {deltaCost > 0 && offer.id !== bestDealId && <div style={{ fontSize: '0.6rem', color: 'var(--warning-color)', marginTop: '2px' }}>+{formatCurrency(deltaCost)}</div>}
                  </div>
                  
                  <div style={{ position: 'relative' }}>
                    <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                      <span>Venda (R$)</span>
                      <button 
                        type="button"
                        onClick={() => handleEdit(offer.id, 'price_locked', !isLocked)} 
                        title="Travar preço contra sync automático"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: isLocked ? 'var(--primary-color)' : 'var(--text-muted)' }}
                      >
                        {isLocked ? <Lock size={12} /> : <Unlock size={12} />}
                      </button>
                    </label>
                    <input 
                      type="number" step="0.01" 
                      className="rm-input" 
                      style={{ width: '100%', padding: '0.25rem', fontSize: '0.8rem', borderColor: salePrice <= 0 ? 'var(--danger-color)' : (isLocked ? 'var(--primary-color)' : '') }} 
                      value={salePrice} 
                      onChange={e => handleEdit(offer.id, 'sale_price', e.target.value)} 
                    />
                    {salePrice <= 0 && <div style={{ fontSize: '0.6rem', color: 'var(--danger-color)', marginTop: '2px' }}>Preço indefinido</div>}
                  </div>
                </div>

                {/* Metrics */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-tertiary)', padding: '0.5rem', borderRadius: '6px' }}>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Lucro L.</div>
                    <div className={profit > 0 ? 'text-success' : 'text-danger'} style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{formatCurrency(profit)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Margem</div>
                    <div className={profit > 0 ? 'text-success' : 'text-danger'} style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{profitPercent.toFixed(1)}%</div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
                  <label className="toggle-switch" style={{ transform: 'scale(0.85)', transformOrigin: 'left center' }}>
                    <input type="checkbox" checked={isActive} onChange={e => handleEdit(offer.id, 'active', e.target.checked)} />
                    <span className="toggle-slider"></span>
                  </label>
                  
                  <button className="btn btn-primary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', opacity: isEdited ? 1 : 0.5 }} disabled={!isEdited || savingId === offer.id} onClick={() => handleSaveEdit(offer)}>
                    {savingId === offer.id ? <Loader2 size={14} className="spin" /> : (isEdited ? 'Salvar' : 'Salvo')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminServices;
