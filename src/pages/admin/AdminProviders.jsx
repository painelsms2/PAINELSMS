import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import { Network, Plus, Edit2, Check, X, Loader2, Trash2, RefreshCw, Wallet } from 'lucide-react';
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

      let matchCount = 0;
      let newCount = 0;

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
          
          if (newCount < 5) console.log(`[SYNC_MATCH] No match for ${svc.providerServiceCode}. Created new service with ID: ${newSvc.id}`);
          newCount++;

          const { error: insertSvcErr } = await supabase.from('services').insert([newSvc]);
          if (!insertSvcErr) {
            ourServices.push(newSvc);
            localSvc = newSvc;
          } else {
            console.error("Failed to create new service for", svc.providerServiceCode, insertSvcErr);
          }
        } else {
          if (matchCount < 5) console.log(`[SYNC_MATCH] Matched ${svc.providerServiceCode} to existing service ID: ${localSvc.id}`);
          matchCount++;
        }

        if (localSvc) {
          // Check if offer exists
          const { data: existing } = await supabase.from('service_offers').select('*').eq('service_id', localSvc.id).eq('provider_id', provider.id).single();
          
          if (existing) {
            // Update cost and stock
            const payload = { cost_price: svc.price, stock: svc.quantity };
            if (!existing.price_locked) {
              payload.sale_price = svc.price * 2;
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
              sale_price: svc.price * 2, // Auto markup x2 initially
              stock: svc.quantity,
              active: false, // Inactive by default for admin review
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
        active: editForm.active
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
                <th>Status</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="7" className="text-center py-4"><Loader2 className="spin text-muted mx-auto" /></td></tr>
              ) : providers.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-4 text-muted">Nenhum fornecedor cadastrado</td></tr>
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
                        <td>
                          <span className={`status-badge ${provider.active ? 'success' : 'danger'}`}>
                            {provider.active ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="text-right">
                          <button 
                            className="btn-icon text-primary" 
                            onClick={() => handleSyncServices(provider)} 
                            disabled={syncingId === provider.id || !provider.active}
                            title="Sincronizar serviços/estoque deste fornecedor"
                          >
                            {syncingId === provider.id ? <Loader2 size={16} className="spin" /> : <RefreshCw size={16} />}
                          </button>
                          <button className="btn-icon" onClick={() => handleEditClick(provider)}>
                            <Edit2 size={16} />
                          </button>
                          <button className="btn-icon text-danger" onClick={() => handleDelete(provider.id)}>
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
