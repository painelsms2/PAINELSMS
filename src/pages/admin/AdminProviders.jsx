import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import { Network, Plus, Edit2, Check, X, Loader2, Trash2, RefreshCw, HeartPulse } from 'lucide-react';
import './AdminUsers.css'; // Reusing admin tables styling

const AdminProviders = () => {
  const { addToast } = useToast();
  const [providers, setProviders] = useState([]);
  const [balances, setBalances] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [syncingId, setSyncingId] = useState(null);
  
  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  
  // New provider state
  const [isAdding, setIsAdding] = useState(false);
  const [newForm, setNewForm] = useState({ key: '', name: '', logo_key: '', active: true });

  const fetchProviders = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('providers')
      .select('*')
      .order('created_at', { ascending: true });
      
    if (error) {
      addToast('Erro ao carregar fornecedores', 'error');
    } else {
      setProviders(data);
      // Fetch balances in background
      data.forEach(p => {
        if (p.active) fetchBalance(p);
      });
    }
    setIsLoading(false);
  };

  const getAuthToken = async () => {
    const session = await supabase.auth.getSession();
    return session.data.session?.access_token;
  };

  const fetchBalance = async (provider) => {
    try {
      const token = await getAuthToken();
      if (!token) return;
      const endpoint = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3000/api/provider' : '/api/provider';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'getBalance', providerKey: provider.key })
      });
      const data = await res.json();
      if (data.success && data.balance !== null) {
        setBalances(prev => ({ ...prev, [provider.id]: data.balance }));
      }
    } catch (e) {
      console.error("Failed to fetch balance for", provider.key, e);
    }
  };

  const handleSyncServices = async (provider) => {
    if (!window.confirm(`Isso irá importar os serviços e preços de custo do fornecedor ${provider.name}. Continuar?`)) return;
    
    setSyncingId(provider.id);
    try {
      const token = await getAuthToken();
      const endpoint = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3000/api/provider' : '/api/provider';
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'listServices', providerKey: provider.key })
      });
      
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      // We have the remote services. Now we match them against our DB `services`
      // For each matched service, upsert `service_offers`
      const { data: ourServices } = await supabase.from('services').select('id, name, icon_file');
      
      let created = 0;
      let updated = 0;

      // Markup is per-provider and configurable; 100% keeps the historical x2.
      const markupPercent = Number(provider.auto_markup_percent ?? 100);
      const applyMarkup = (cost) =>
        Math.round(Number(cost) * (1 + markupPercent / 100) * 100) / 100;

      for (const svc of data.services) {
        // Try to find matching local service
        let localSvc = ourServices.find(s => {
          if (s.id === svc.providerServiceCode) return true;
          if (svc.name && s.name && s.name.toLowerCase() === svc.name.toLowerCase()) return true;
          
          // Fallback: match by icon prefix (e.g. 'wa0.png' -> 'wa')
          if (s.icon_file) {
            const prefix = s.icon_file.replace(/0\.png$|\.png$/, '');
            if (prefix === svc.providerServiceCode) return true;
          }
          return false;
        });
        
        if (!localSvc) {
          // Create the missing service dynamically for admin review
          const newSvc = {
            id: svc.providerServiceCode,
            name: svc.name || svc.providerServiceCode.toUpperCase(),
            country: 'br',
            icon_file: `${svc.providerServiceCode}0.png`,
            active: false
          };
          
          const { error: insertSvcErr } = await supabase.from('services').insert([newSvc]);
          if (!insertSvcErr) {
            ourServices.push(newSvc);
            localSvc = newSvc;
          }
        }

        if (localSvc) {
          // Check if offer exists
          const { data: existing } = await supabase.from('service_offers').select('*').eq('service_id', localSvc.id).eq('provider_id', provider.id).maybeSingle();
          
          if (existing) {
            // Update cost and stock
            const payload = { cost_price: svc.price, stock: svc.quantity };
            if (!existing.price_locked) {
              payload.sale_price = applyMarkup(svc.price);
            }
            await supabase.from('service_offers').update(payload).eq('id', existing.id);
            updated++;
          } else {
            // Insert
            await supabase.from('service_offers').insert([{
              service_id: localSvc.id,
              provider_id: provider.id,
              provider_service_code: svc.providerServiceCode,
              cost_price: svc.price,
              sale_price: applyMarkup(svc.price),
              stock: svc.quantity,
              active: true, // Auto-activated; admin can still disable individually
              is_default: false,
              price_locked: false
            }]);
            created++;
          }
        }
      }

      addToast(`Sincronizado! ${created} novos, ${updated} atualizados.`, 'success');

    } catch (e) {
      addToast(`Erro na sincronização: ${e.message}`, 'error');
    }
    setSyncingId(null);
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const handleEditClick = (provider) => {
    setEditingId(provider.id);
    setEditForm({ ...provider });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSaveEdit = async () => {
    setIsSaving(true);
    const { error } = await supabase
      .from('providers')
      .update({
        name: editForm.name,
        key: editForm.key,
        logo_key: editForm.logo_key,
        active: editForm.active,
        auto_markup_percent: Number(editForm.auto_markup_percent ?? 100)
      })
      .eq('id', editingId);

    if (error) {
      addToast('Erro ao atualizar fornecedor', 'error');
    } else {
      addToast('Fornecedor atualizado', 'success');
      setEditingId(null);
      fetchProviders();
    }
    setIsSaving(false);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    if (!newForm.key || !newForm.name) {
      addToast('Key e Nome são obrigatórios', 'error');
      setIsSaving(false);
      return;
    }

    const { error } = await supabase
      .from('providers')
      .insert([newForm]);

    if (error) {
      addToast('Erro ao criar fornecedor', 'error');
      console.error(error);
    } else {
      addToast('Fornecedor criado!', 'success');
      setIsAdding(false);
      setNewForm({ key: '', name: '', logo_key: '', active: true });
      fetchProviders();
    }
    setIsSaving(false);
  };

  const handleResetHealth = async (provider) => {
    const { error } = await supabase.rpc('admin_reset_provider_health', { p_provider_id: provider.id });
    if (error) {
      addToast('Erro ao resetar saúde do fornecedor', 'error');
    } else {
      addToast(`${provider.name} marcado como saudável`, 'success');
      fetchProviders();
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza? Isso pode quebrar serviços que dependem deste fornecedor.')) return;
    
    const { error } = await supabase.from('providers').delete().eq('id', id);
    if (error) {
      addToast('Erro ao excluir fornecedor', 'error');
    } else {
      addToast('Fornecedor excluído', 'success');
      fetchProviders();
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h1 className="page-title"><Network size={28} className="text-primary mr-2 inline-block" /> Fornecedores</h1>
          <p className="text-muted">Gerencie os provedores de SMS (APIs).</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsAdding(!isAdding)}>
          <Plus size={18} /> Adicionar
        </button>
      </div>

      {isAdding && (
        <div className="admin-card fade-in mb-4">
          <h3>Novo Fornecedor</h3>
          <form className="admin-form mt-4" onSubmit={handleAddSubmit} style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr 1fr auto auto' }}>
            <div>
              <label>Key (Única)</label>
              <input type="text" className="rm-input" value={newForm.key} onChange={e => setNewForm({...newForm, key: e.target.value})} placeholder="ex: laranjinha" />
            </div>
            <div>
              <label>Nome</label>
              <input type="text" className="rm-input" value={newForm.name} onChange={e => setNewForm({...newForm, name: e.target.value})} placeholder="ex: Laranjinha" />
            </div>
            <div>
              <label>Logo (caminho)</label>
              <input type="text" className="rm-input" value={newForm.logo_key} onChange={e => setNewForm({...newForm, logo_key: e.target.value})} placeholder="ex: logo.png" />
            </div>
            <div>
              <label>Ativo</label>
              <select className="rm-input" value={newForm.active} onChange={e => setNewForm({...newForm, active: e.target.value === 'true'})}>
                <option value="true">Sim</option>
                <option value="false">Não</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '2px' }}>
              <button type="submit" className="btn btn-primary" disabled={isSaving}>
                {isSaving ? <Loader2 size={16} className="spin" /> : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="admin-card">
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Logo</th>
                <th>Nome</th>
                <th>Key</th>
                <th>Saldo API</th>
                <th>Markup</th>
                <th>Saúde</th>
                <th>Status</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="9" className="text-center py-4"><Loader2 className="spin text-muted mx-auto" /></td></tr>
              ) : providers.length === 0 ? (
                <tr><td colSpan="9" className="text-center py-4 text-muted">Nenhum fornecedor cadastrado</td></tr>
              ) : (
                providers.map(provider => (
                  <tr key={provider.id}>
                    <td className="text-muted" style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>
                      {provider.id.split('-')[0]}...
                    </td>
                    
                    {editingId === provider.id ? (
                      <>
                        <td>
                          <input type="text" className="rm-input" value={editForm.logo_key} onChange={e => setEditForm({...editForm, logo_key: e.target.value})} style={{ padding: '0.25rem', height: 'auto' }} />
                        </td>
                        <td>
                          <input type="text" className="rm-input" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} style={{ padding: '0.25rem', height: 'auto' }} />
                        </td>
                        <td>
                          <input type="text" className="rm-input" value={editForm.key} onChange={e => setEditForm({...editForm, key: e.target.value})} style={{ padding: '0.25rem', height: 'auto' }} />
                        </td>
                        <td>-</td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            className="rm-input"
                            value={editForm.auto_markup_percent ?? 100}
                            onChange={e => setEditForm({...editForm, auto_markup_percent: e.target.value})}
                            style={{ padding: '0.25rem', height: 'auto', width: '80px' }}
                            title="Margem aplicada sobre o custo na sincronização (100% = dobro do custo)"
                          />
                        </td>
                        <td>-</td>
                        <td>
                          <select className="rm-input" value={editForm.active} onChange={e => setEditForm({...editForm, active: e.target.value === 'true'})} style={{ padding: '0.25rem', height: 'auto' }}>
                            <option value="true">Ativo</option>
                            <option value="false">Inativo</option>
                          </select>
                        </td>
                        <td className="text-right">
                          <button className="btn-icon text-success" onClick={handleSaveEdit} disabled={isSaving}>
                            {isSaving ? <Loader2 size={16} className="spin" /> : <Check size={16} />}
                          </button>
                          <button className="btn-icon text-muted" onClick={handleCancelEdit} disabled={isSaving}>
                            <X size={16} />
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>
                          {provider.logo_key ? (
                            <img src={`/${provider.logo_key}`} alt="logo" style={{ width: 24, height: 24, objectFit: 'contain' }} />
                          ) : '-'}
                        </td>
                        <td className="font-semibold">{provider.name}</td>
                        <td className="text-muted">{provider.key}</td>
                        <td className="text-muted font-semibold">
                          {provider.key.toLowerCase().includes('numerovirtual') 
                            ? <span title="API não possui endpoint de saldo">N/D (sem endpoint)</span>
                            : balances[provider.id] !== undefined ? `R$ ${balances[provider.id].toFixed(2)}` : 'N/D'}
                        </td>
                        <td className="text-muted">
                          {Number(provider.auto_markup_percent ?? 100)}%
                        </td>
                        <td>
                          {provider.health_status === 'unstable' ? (
                            <span
                              className="status-badge warning"
                              title={`${provider.consecutive_failures || 0} falhas seguidas${provider.last_failure_at ? ` · última em ${new Date(provider.last_failure_at).toLocaleString('pt-BR')}` : ''}`}
                            >
                              Instável
                            </span>
                          ) : (
                            <span className="status-badge success">Saudável</span>
                          )}
                        </td>
                        <td>
                          <span className={`status-badge ${provider.active ? 'success' : 'danger'}`}>
                            {provider.active ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="text-right">
                          {provider.health_status === 'unstable' && (
                            <button
                              className="btn-icon text-success"
                              onClick={() => handleResetHealth(provider)}
                              title="Marcar como saudável novamente (reset manual)"
                            >
                              <HeartPulse size={16} />
                            </button>
                          )}
                          <button
                            className={`btn-icon ${provider.active ? 'text-warning' : 'text-success'}`}
                            onClick={async () => {
                              const newStatus = !provider.active;
                              if (!window.confirm(`Deseja ${newStatus ? 'ativar' : 'pausar'} o fornecedor ${provider.name}? ${!newStatus ? 'Todos os serviços dele sairão do catálogo temporariamente.' : 'Os serviços voltarão ao catálogo com os mesmos preços.'}`)) return;
                              
                              const { error } = await supabase.from('providers').update({ active: newStatus }).eq('id', provider.id);
                              if (!error) {
                                addToast(`Fornecedor ${newStatus ? 'ativado' : 'pausado'}`, 'success');
                                fetchProviders();
                              } else {
                                addToast('Erro ao alterar status', 'error');
                              }
                            }}
                            title={provider.active ? 'Pausar fornecedor (Ocultar do catálogo)' : 'Ativar fornecedor (Mostrar no catálogo)'}
                          >
                            {provider.active ? (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                            ) : (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                            )}
                          </button>
                          <button 
                            className="btn-icon text-primary" 
                            onClick={() => handleSyncServices(provider)} 
                            disabled={syncingId === provider.id || !provider.active}
                            title="Sincronizar serviços/estoque deste fornecedor"
                          >
                            {syncingId === provider.id ? <Loader2 size={16} className="spin" /> : <RefreshCw size={16} />}
                          </button>
                          <button className="btn-icon" onClick={() => handleEditClick(provider)} title="Editar">
                            <Edit2 size={16} />
                          </button>
                          <button className="btn-icon text-danger" onClick={() => handleDelete(provider.id)} title="Excluir">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminProviders;
