import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import { Search, Loader2, Save, Plus, ChevronDown, ChevronUp, Network, Trash2, Star } from 'lucide-react';
import './AdminServices.css';
import './AdminUsers.css'; // reaproveitar estilos da tabela

const AdminServices = () => {
  const { addToast } = useToast();
  const [services, setServices] = useState([]);
  const [providers, setProviders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  
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

  const filteredServices = services.filter(s => 
    s.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="admin-services fade-in">
      <div className="page-header">
        <h1 className="page-title">Gestão de Serviços</h1>
        <p className="text-muted">{services.length} serviços no catálogo.</p>
      </div>

      <div className="table-container">
        <div className="table-controls">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Buscar serviço por nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}></th>
                <th>Serviço</th>
                <th>Fornecedores Ativos</th>
                <th>Status (Global)</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="4" className="text-center py-8">
                    <Loader2 size={24} className="spin text-muted mx-auto" />
                  </td>
                </tr>
              ) : filteredServices.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-8 text-muted">
                    Nenhum serviço encontrado.
                  </td>
                </tr>
              ) : (
                filteredServices.map(svc => (
                  <React.Fragment key={svc.id}>
                    <tr className="cursor-pointer hover:bg-black/20" onClick={() => toggleExpand(svc.id)}>
                      <td className="text-center">
                        {expandedSvcId === svc.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </td>
                      <td>
                        <div className="user-cell">
                          <img src={`/images/${svc.icon_file}`} alt={svc.name} className="service-icon-small" onError={e=>e.target.style.display='none'} />
                          <span className="user-name">{svc.name}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          <Network size={14} className="text-muted" />
                          <span>{svc.offers?.filter(o => o.active).length || 0} fornecedores</span>
                        </div>
                      </td>
                      <td>
                        <label className="toggle-switch" onClick={e => e.stopPropagation()}>
                          <input 
                            type="checkbox" 
                            checked={svc.active}
                            onChange={(e) => handleUpdateServiceActive(svc.id, e.target.checked)}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </td>
                    </tr>
                    
                    {expandedSvcId === svc.id && (
                      <tr className="expanded-row">
                        <td colSpan="4" style={{ padding: 0 }}>
                          <div style={{ padding: '1rem', background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
                            <ServiceOffersManager 
                              service={svc} 
                              providers={providers} 
                              onRefresh={fetchAll} 
                              addToast={addToast} 
                            />
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Subcomponent to manage offers for a specific service
const ServiceOffersManager = ({ service, providers, onRefresh, addToast }) => {
  const [offers, setOffers] = useState(service.offers || []);
  const [isAdding, setIsAdding] = useState(false);
  const [newOffer, setNewOffer] = useState({ provider_id: '', provider_service_code: '', cost_price: 0, sale_price: 0, stock: 100, active: true });
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
    }
    setSavingId(null);
  };

  const handleSetDefault = async (offerId) => {
    setSavingId('default');
    // First remove default from all
    await supabase.from('service_offers').update({ is_default: false }).eq('service_id', service.id);
    // Set new default
    const { error } = await supabase.from('service_offers').update({ is_default: true }).eq('id', offerId);
    
    if (error) {
      addToast("Erro ao definir padrão", "error");
    } else {
      addToast("Fornecedor padrão atualizado", "success");
      setOffers(offers.map(o => ({ ...o, is_default: o.id === offerId })));
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
      onRefresh(); // Refresh everything to get nested provider relation
    }
    setSavingId(null);
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Remover fornecedor deste serviço?")) return;
    const { error } = await supabase.from('service_offers').delete().eq('id', id);
    if (!error) {
      setOffers(offers.filter(o => o.id !== id));
      addToast("Fornecedor removido", "success");
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Fornecedores configurados para <strong>{service.name}</strong></h4>
        <button className="btn btn-primary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }} onClick={() => setIsAdding(!isAdding)}>
          <Plus size={14} /> Adicionar
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr auto', gap: '0.5rem', marginBottom: '1rem', background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '8px' }}>
          <div>
            <label style={{ fontSize: '0.7rem' }}>Fornecedor</label>
            <select className="rm-input" value={newOffer.provider_id} onChange={e => setNewOffer({...newOffer, provider_id: e.target.value})} required style={{ padding: '0.25rem', height: '30px', fontSize: '0.8rem' }}>
              <option value="">Selecione...</option>
              {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.7rem' }}>Código API (opcional)</label>
            <input type="text" className="rm-input" value={newOffer.provider_service_code} onChange={e => setNewOffer({...newOffer, provider_service_code: e.target.value})} placeholder="ex: wa" style={{ padding: '0.25rem', height: '30px', fontSize: '0.8rem' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.7rem' }}>Custo (R$)</label>
            <input type="number" step="0.01" className="rm-input" value={newOffer.cost_price} onChange={e => setNewOffer({...newOffer, cost_price: e.target.value})} required style={{ padding: '0.25rem', height: '30px', fontSize: '0.8rem' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.7rem' }}>Venda (R$)</label>
            <input type="number" step="0.01" className="rm-input" value={newOffer.sale_price} onChange={e => setNewOffer({...newOffer, sale_price: e.target.value})} required style={{ padding: '0.25rem', height: '30px', fontSize: '0.8rem' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.7rem' }}>Estoque</label>
            <input type="number" className="rm-input" value={newOffer.stock} onChange={e => setNewOffer({...newOffer, stock: e.target.value})} required style={{ padding: '0.25rem', height: '30px', fontSize: '0.8rem' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={savingId === 'new'} style={{ height: '30px', padding: '0 1rem' }}>
              {savingId === 'new' ? <Loader2 size={14} className="spin" /> : 'Salvar'}
            </button>
          </div>
        </form>
      )}

      {offers.length === 0 && !isAdding ? (
        <div className="text-center text-muted" style={{ fontSize: '0.8rem', padding: '1rem' }}>
          Este serviço está indisponível para os usuários (nenhum fornecedor ativo).
        </div>
      ) : (
        <table className="admin-table" style={{ fontSize: '0.85rem' }}>
          <thead>
            <tr>
              <th>Padrão</th>
              <th>Fornecedor</th>
              <th>Cód. API</th>
              <th>Custo</th>
              <th>Venda</th>
              <th>Lucro</th>
              <th>Estoque</th>
              <th>Ativo</th>
              <th className="text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {offers.map(offer => {
              const oEdits = edits[offer.id] || {};
              const isEdited = Object.keys(oEdits).length > 0;
              const costPrice = parseFloat(oEdits.cost_price !== undefined ? oEdits.cost_price : offer.cost_price);
              const salePrice = parseFloat(oEdits.sale_price !== undefined ? oEdits.sale_price : offer.sale_price);
              const profit = salePrice - costPrice;
              const profitPercent = costPrice > 0 ? (profit / costPrice) * 100 : 0;
              const isActive = oEdits.active !== undefined ? oEdits.active : offer.active;

              return (
                <tr key={offer.id}>
                  <td className="text-center">
                    <button 
                      className="btn-icon" 
                      onClick={() => handleSetDefault(offer.id)}
                      title={offer.is_default ? "Fornecedor Padrão" : "Tornar Padrão"}
                      style={{ color: offer.is_default ? 'var(--warning-color)' : 'var(--text-muted)' }}
                    >
                      <Star size={18} fill={offer.is_default ? 'currentColor' : 'none'} />
                    </button>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {offer.provider?.logo_key && <img src={`/${offer.provider.logo_key}`} style={{ width: 16, height: 16 }} onError={e=>e.target.style.display='none'} />}
                      <span className="font-semibold">{offer.provider?.name || 'Desconhecido'}</span>
                    </div>
                  </td>
                  <td>
                    <input type="text" className="rm-input" style={{ width: 80, padding: '0.15rem' }} value={oEdits.provider_service_code !== undefined ? oEdits.provider_service_code : (offer.provider_service_code || '')} onChange={e => handleEdit(offer.id, 'provider_service_code', e.target.value)} />
                  </td>
                  <td>
                    <input type="number" step="0.01" className="rm-input" style={{ width: 70, padding: '0.15rem' }} value={costPrice} onChange={e => handleEdit(offer.id, 'cost_price', e.target.value)} />
                  </td>
                  <td>
                    <input type="number" step="0.01" className="rm-input" style={{ width: 70, padding: '0.15rem' }} value={salePrice} onChange={e => handleEdit(offer.id, 'sale_price', e.target.value)} />
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span className={profit > 0 ? 'text-success' : 'text-danger'}>{formatCurrency(profit)}</span>
                      <span className="text-muted" style={{ fontSize: '0.65rem' }}>{profitPercent.toFixed(0)}%</span>
                    </div>
                  </td>
                  <td>
                    <input type="number" className="rm-input" style={{ width: 60, padding: '0.15rem' }} value={oEdits.stock !== undefined ? oEdits.stock : offer.stock} onChange={e => handleEdit(offer.id, 'stock', e.target.value)} />
                  </td>
                  <td>
                    <label className="toggle-switch" style={{ transform: 'scale(0.8)' }}>
                      <input type="checkbox" checked={isActive} onChange={e => handleEdit(offer.id, 'active', e.target.checked)} />
                      <span className="toggle-slider"></span>
                    </label>
                  </td>
                  <td className="text-right">
                    <button className="btn-icon text-success" disabled={!isEdited || savingId === offer.id} onClick={() => handleSaveEdit(offer)}>
                      {savingId === offer.id ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
                    </button>
                    <button className="btn-icon text-danger" onClick={() => handleDelete(offer.id)} disabled={savingId === offer.id}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminServices;
