import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { numberProviderService } from '../../services/numberProviderService';
import { historyService } from '../../services/historyService';
import Skeleton from '../../components/ui/Skeleton';
import { Search, Loader2, Signal, AlertCircle, PlusCircle, LayoutGrid, Users, ShoppingCart, Landmark, Bike, Car, Dices } from 'lucide-react';
import { ServiceIcon } from '../../components/ServiceIcon';
import './Servicos.css';

const Servicos = () => {
  const { user, updateBalance } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const { openRechargeModal } = useOutletContext();
  
  const [services, setServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchasingId, setPurchasingId] = useState(null);

  const categories = [
    { id: 'Todos', label: 'Todos', icon: LayoutGrid },
    { id: 'Rede Social', label: 'Rede Social', icon: Users },
    { id: 'E-commerce', label: 'E-commerce', icon: ShoppingCart },
    { id: 'Banco', label: 'Banco', icon: Landmark },
    { id: 'Delivery', label: 'Delivery', icon: Bike },
    { id: 'Transporte', label: 'Transporte', icon: Car },
    { id: 'Bet', label: 'Bet', icon: Dices }
  ];

  const categorizeService = (name) => {
    const n = name.toLowerCase();
    
    if (n.includes('facebook') || n.includes('instagram') || n.includes('whatsapp') || n.includes('telegram') || n.includes('tiktok') || n.includes('twitter') || n.includes('tinder') || n.includes('viber') || n.includes('discord')) return 'Rede Social';
    if (n.includes('mercado') || n.includes('shopee') || n.includes('amazon') || n.includes('olx') || n.includes('privalia') || n.includes('aliexpress') || n.includes('enjoei')) return 'E-commerce';
    if (n.includes('govbr') || n.includes('picpay') || n.includes('nubank') || n.includes('santander') || n.includes('c6 bank') || n.includes('bitso') || n.includes('pagbank') || n.includes('paypal') || n.includes('agibank') || n.includes('neon') || n.includes('coinbase') || n.includes('asaas') || n.includes('bradesco') || n.includes('next') || n.includes('caixa') || n.includes('binance') || n.includes('getnet') || n.includes('bipa') || n.includes('infinitepay') || n.includes('pay') || n.includes('bank') || n.includes('banco') || n.includes('crypto')) return 'Banco';
    if (n.includes('ifood') || n.includes('ze') || n.includes('delivery') || n.includes('ultragaz') || n.includes('doordash') || n.includes('burger') || n.includes('glovo') || n.includes('food') || n.includes('mcdonalds') || n.includes('brahma')) return 'Delivery';
    if (n.includes('99') || n.includes('uber') || n.includes('blabla') || n.includes('didi') || n.includes('guiche') || n.includes('dott') || n.includes('taxi') || n.includes('drive') || n.includes('car')) return 'Transporte';
    if (n.includes('bet') || n.includes('cassino') || n.includes('aposta') || n.includes('cruzeiro') || n.includes('beboo') || n.includes('winzo') || n.includes('arena') || n.includes('cash')) return 'Bet';

    return 'Outros'; 
  };

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const data = await numberProviderService.getAvailableServices();
        setServices(data);
      } catch (error) {
        addToast('Falha ao carregar serviços.', 'error');
      } finally {
        setIsLoadingServices(false);
      }
    };
    fetchServices();
  }, [addToast]);

  const handlePurchase = async (service) => {
    const userBalance = user?.balance || 0;
    // In this new model, we just ensure they have balance, but we only deduct later
    if (userBalance < service.price) {
      addToast("Saldo insuficiente para este serviço.", 'error');
      openRechargeModal();
      return;
    }

    if (service.stock <= 0) {
      addToast("Serviço sem estoque no momento.", 'error');
      return;
    }

    setIsPurchasing(true);
    setPurchasingId(service.id);

    try {
      const res = await numberProviderService.purchaseNumber(service.id);
      
      // Deduct balance from user context immediately
      updateBalance(user.balance - service.price);

      // Salva o registro inicial no histórico como waiting
      historyService.addActivation(user.id, {
        serviceId: service.id,
        status: 'waiting',
        phoneNumber: res.phoneNumber,
        activationId: res.activationId
      });
      
      addToast('Número gerado! Redirecionando...', 'success');
      
      // Redirect to dashboard where the active activation is managed
      setTimeout(() => {
        navigate('/panel/dashboard');
      }, 500);

    } catch (error) {
      addToast("Erro ao gerar número: " + error.message, 'error');
      setIsPurchasing(false);
      setPurchasingId(null);
    }
  };

  const filteredServices = services.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'Todos' || categorizeService(s.name) === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="servicos-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Serviços</h1>
          <p className="text-muted">Selecione o serviço para o qual deseja receber o SMS.</p>
        </div>
        
        <div className="search-box">
          <Search size={20} className="search-icon" />
          <input 
            type="text" 
            placeholder="Buscar aplicativo..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="category-filters fade-in">
        {categories.map(cat => {
          const Icon = cat.icon;
          return (
            <button 
              key={cat.id} 
              className={`category-pill ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              <Icon size={16} />
              {cat.label}
            </button>
          );
        })}
      </div>

      {(user?.balance || 0) < 1.50 && (
        <div className="no-balance-banner fade-in">
          <div className="nbb-content">
            <AlertCircle size={24} className="nbb-icon" />
            <div className="nbb-text">
              <h4>Você não tem saldo</h4>
              <p>Adicione saldo para conseguir ativar novos números.</p>
            </div>
          </div>
          <button className="btn btn-primary" onClick={openRechargeModal}>
            <PlusCircle size={18} />
            Adicionar Saldo
          </button>
        </div>
      )}

      <div className="services-grid">
        {isLoadingServices ? (
          Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="service-card skeleton-wrapper">
              <Skeleton width="48px" height="48px" borderRadius="12px" />
              <div className="service-skeleton-info">
                <Skeleton width="60%" height="1.25rem" />
                <Skeleton width="40%" height="0.875rem" className="mt-2" />
              </div>
              <Skeleton width="100%" height="2.5rem" borderRadius="8px" />
            </div>
          ))
        ) : filteredServices.length > 0 ? (
          filteredServices.map(service => {
            const userBalance = user?.balance || 0;
            const canAfford = userBalance >= service.price;
            const hasStock = service.stock > 0;
            const isThisLoading = isPurchasing && purchasingId === service.id;
            
            return (
              <div key={service.id} className={`service-card ${(!canAfford || !hasStock) ? 'disabled' : ''}`}>
                <div className="service-card-header">
                  <div className="service-icon-wrapper">
                    <ServiceIcon service={service} />
                  </div>
                  <div className="service-price">
                    R$ {Number(service.price || 0).toFixed(2)}
                  </div>
                </div>
                
                <div className="service-details">
                  <h3 className="service-title">{service.name}</h3>
                  <div className="service-meta">
                    <span className="service-country">{service.country}</span>
                    <span className={`service-stock ${hasStock ? 'in-stock' : 'out-of-stock'}`}>
                      <Signal size={12} /> {hasStock ? `${service.stock} unid.` : 'Sem estoque'}
                    </span>
                  </div>
                </div>
                
                <div className="service-action">
                  <button 
                    className="btn btn-primary btn-block buy-btn" 
                    disabled={!canAfford || !hasStock || isPurchasing}
                    onClick={() => handlePurchase(service)}
                  >
                    {isThisLoading ? <Loader2 size={18} className="spin mx-auto" /> : 'Ativar Número'}
                  </button>
                  
                  {!canAfford && hasStock && (
                    <div className="service-hint error">Saldo insuficiente</div>
                  )}
                  {!hasStock && (
                    <div className="service-hint error">Estoque esgotado</div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty-state full-width">
            <Search size={48} className="empty-icon text-muted mb-4" />
            <h3>Nenhum serviço encontrado</h3>
            <p className="text-muted">Não encontramos resultados para "{searchTerm}".</p>
            <button className="btn btn-outline mt-4" onClick={() => setSearchTerm('')}>Limpar busca</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Servicos;
