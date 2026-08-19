import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import { Search, Loader2, Save } from 'lucide-react';
import './AdminServices.css';
import './AdminUsers.css'; // reaproveitar estilos da tabela

const AdminServices = () => {
  const { addToast } = useToast();
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [edits, setEdits] = useState({});
  const [isSaving, setIsSaving] = useState(null);

  const fetchServices = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setServices(data || []);
    } catch (err) {
      console.error(err);
      addToast("Erro ao carregar serviços", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleEdit = (id, field, value) => {
    setEdits(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));
  };

  const handleSave = async (svc) => {
    const svcEdits = edits[svc.id];
    if (!svcEdits) return;

    try {
      setIsSaving(svc.id);
      
      const newSalePrice = svcEdits.sale_price !== undefined ? parseFloat(svcEdits.sale_price) : svc.sale_price;
      const newStock = svcEdits.stock !== undefined ? parseInt(svcEdits.stock, 10) : svc.stock;
      const newActive = svcEdits.active !== undefined ? svcEdits.active : svc.active;

      const { error } = await supabase.rpc('admin_update_service', {
        p_service_id: svc.id,
        p_sale_price: newSalePrice,
        p_stock: newStock,
        p_active: newActive
      });

      if (error) throw error;

      // Update local state
      setServices(services.map(s => s.id === svc.id ? { 
        ...s, 
        sale_price: newSalePrice, 
        stock: newStock, 
        active: newActive 
      } : s));
      
      // Remove edits
      const newEdits = { ...edits };
      delete newEdits[svc.id];
      setEdits(newEdits);

      addToast("Serviço atualizado", "success");
    } catch (err) {
      console.error(err);
      addToast(err.message || "Erro ao salvar serviço", "error");
    } finally {
      setIsSaving(null);
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
                <th>Serviço</th>
                <th>Custo</th>
                <th>Venda</th>
                <th>Lucro</th>
                <th>Estoque</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="text-center py-8">
                    <Loader2 size={24} className="spin text-muted mx-auto" />
                  </td>
                </tr>
              ) : filteredServices.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-muted">
                    Nenhum serviço encontrado.
                  </td>
                </tr>
              ) : (
                filteredServices.map(svc => {
                  const svcEdits = edits[svc.id] || {};
                  const isEdited = Object.keys(svcEdits).length > 0;
                  
                  const salePrice = svcEdits.sale_price !== undefined ? parseFloat(svcEdits.sale_price) || 0 : parseFloat(svc.sale_price);
                  const costPrice = parseFloat(svc.cost_price);
                  const profit = salePrice - costPrice;
                  const profitPercent = costPrice > 0 ? (profit / costPrice) * 100 : 0;
                  
                  const stockValue = svcEdits.stock !== undefined ? svcEdits.stock : svc.stock;
                  const activeValue = svcEdits.active !== undefined ? svcEdits.active : svc.active;

                  return (
                    <tr key={svc.id}>
                      <td>
                        <div className="user-cell">
                          <img src={`/images/${svc.icon_file}`} alt={svc.name} className="service-icon-small" />
                          <span className="user-name">{svc.name}</span>
                        </div>
                      </td>
                      <td className="text-muted">
                        {formatCurrency(costPrice)}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <span className="text-muted">R$</span>
                          <input 
                            type="number" 
                            step="0.01" 
                            className="edit-input"
                            value={svcEdits.sale_price !== undefined ? svcEdits.sale_price : svc.sale_price}
                            onChange={(e) => handleEdit(svc.id, 'sale_price', e.target.value)}
                          />
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span className={`font-semibold ${profit > 0 ? 'text-success' : 'text-danger'}`}>
                            {formatCurrency(profit)}
                          </span>
                          <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                            {profitPercent.toFixed(0)}% margem
                          </span>
                        </div>
                      </td>
                      <td>
                        <input 
                          type="number" 
                          className="edit-input stock-input"
                          value={stockValue}
                          onChange={(e) => handleEdit(svc.id, 'stock', e.target.value)}
                        />
                      </td>
                      <td>
                        <label className="toggle-switch">
                          <input 
                            type="checkbox" 
                            checked={activeValue}
                            onChange={(e) => handleEdit(svc.id, 'active', e.target.checked)}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </td>
                      <td>
                        <button 
                          className="save-btn" 
                          disabled={!isEdited || isSaving === svc.id}
                          onClick={() => handleSave(svc)}
                        >
                          {isSaving === svc.id ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
                          <span className="hide-mobile">Salvar</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminServices;
