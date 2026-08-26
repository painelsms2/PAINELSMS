import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Search, Ban, CheckCircle, Wallet, Loader2 } from 'lucide-react';
import './AdminUsers.css';

const AdminUsers = () => {
  const { user: currentUser } = useAuth();
  const { addToast } = useToast();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isProcessing, setIsProcessing] = useState(null);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error(err);
      addToast("Erro ao carregar usuários", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (targetUserId, currentStatus) => {
    if (targetUserId === currentUser.id) {
      addToast("Você não pode suspender sua própria conta admin", "error");
      return;
    }

    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    
    // Confirmação para suspender
    if (newStatus === 'suspended') {
      const confirmed = window.confirm("Tem certeza que deseja SUSPENDER este usuário? Ele não conseguirá acessar o painel.");
      if (!confirmed) return;
    }

    try {
      setIsProcessing(targetUserId);
      const { error } = await supabase.rpc('admin_set_user_status', {
        p_user_id: targetUserId,
        p_status: newStatus
      });

      if (error) throw error;

      // Update local state
      setUsers(users.map(u => u.id === targetUserId ? { ...u, status: newStatus } : u));
      addToast(`Usuário ${newStatus === 'suspended' ? 'suspenso' : 'reativado'} com sucesso`, "success");
    } catch (err) {
      console.error(err);
      addToast(err.message || "Erro ao alterar status do usuário", "error");
    } finally {
      setIsProcessing(null);
    }
  };

  const handleCreditBalance = async (targetUser) => {
    const amountStr = window.prompt(`Adicionar saldo (em R$) para ${targetUser.full_name}:\nUse ponto para centavos (ex: 15.50)`);
    if (!amountStr) return;

    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      addToast("Valor inválido", "error");
      return;
    }

    try {
      setIsProcessing(targetUser.id);
      const { error } = await supabase.rpc('admin_credit', {
        p_user_id: targetUser.id,
        p_amount: amount
      });

      if (error) throw error;

      // Update local state
      setUsers(users.map(u => u.id === targetUser.id ? { ...u, balance: parseFloat(u.balance) + amount } : u));
      addToast(`Saldo de R$ ${amount.toFixed(2)} adicionado com sucesso.`, "success");
    } catch (err) {
      console.error(err);
      addToast(err.message || "Erro ao adicionar saldo", "error");
    } finally {
      setIsProcessing(null);
    }
  };

  const formatCurrency = (val) => {
    return Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const filteredUsers = users.filter(u => 
    (u.full_name?.toLowerCase().includes(search.toLowerCase())) ||
    (u.email?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="admin-users fade-in">
      <div className="page-header">
        <h1 className="page-title">Gestão de Usuários</h1>
        <p className="text-muted">Total de {users.length} usuários cadastrados.</p>
      </div>

      <div className="table-container">
        <div className="table-controls">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Buscar por nome ou e-mail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Usuário</th>
                <th>Cargo</th>
                <th>Status</th>
                <th>Saldo</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="text-center py-8">
                    <Loader2 size={24} className="spin text-muted mx-auto" />
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-muted">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(u => (
                  <tr key={u.id}>
                    <td data-label="Usuário">
                      <div className="user-cell">
                        <div className="user-avatar-small">
                          {u.full_name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="user-info-stack">
                          <span className="user-name">{u.full_name || 'Sem nome'}</span>
                          <span className="user-email">{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td data-label="Permissão">
                      <span className={`status-badge ${u.role === 'admin' ? 'admin' : ''}`}>
                        {u.role}
                      </span>
                    </td>
                    <td data-label="Status">
                      <span className={`status-badge ${u.status === 'suspended' ? 'suspended' : 'active'}`}>
                        {u.status === 'suspended' ? 'Suspenso' : 'Ativo'}
                      </span>
                    </td>
                    <td data-label="Saldo" className="font-semibold">
                      {formatCurrency(u.balance)}
                    </td>
                    <td data-label="Ações">
                      <div className="action-buttons">
                        <button 
                          className="btn-icon" 
                          title="Adicionar Saldo"
                          onClick={() => handleCreditBalance(u)}
                          disabled={isProcessing === u.id}
                        >
                          {isProcessing === u.id ? <Loader2 size={16} className="spin" /> : <Wallet size={16} />}
                        </button>

                        {u.id !== currentUser.id && (
                          <button 
                            className={`btn-icon ${u.status === 'suspended' ? 'success' : 'danger'}`}
                            title={u.status === 'suspended' ? "Reativar Conta" : "Suspender Conta"}
                            onClick={() => handleToggleStatus(u.id, u.status)}
                            disabled={isProcessing === u.id}
                          >
                            {isProcessing === u.id ? <Loader2 size={16} className="spin" /> : (
                              u.status === 'suspended' ? <CheckCircle size={16} /> : <Ban size={16} />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
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

export default AdminUsers;
