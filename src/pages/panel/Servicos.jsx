import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { numberProviderService } from '../../services/numberProviderService';
import { historyService } from '../../services/historyService';
import Skeleton from '../../components/ui/Skeleton';
import { Search, Loader2, Signal, AlertCircle, PlusCircle, LayoutGrid, Users, ShoppingCart, Landmark, Bike, Car, Dices, MessageSquare, ChevronDown, LayoutDashboard, Star, Package } from 'lucide-react';
import { ServiceIcon } from '../../components/ServiceIcon';
import './Servicos.css';

const ServiceCardItem = React.memo(({ 
  service, index, userBalance, favorites, handleToggleFavorite, selectedDDD, handleDDDChange, handlePurchase, isPurchasing, purchasingId 
}) => {
  const hasAnyOffer = service.offers && service.offers.length > 0;
  
  return (
    <div className={`service-card ${!hasAnyOffer ? 'disabled' : ''}`} style={{ '--anim-order': index }}>
      <div className="service-card-left">
        <div className="service-icon-wrapper">
          <ServiceIcon service={service} />
        </div>
        
        <div className="service-details">
          <h3 className="service-title" title={service.name}>{service.name}</h3>
        </div>
        <button 
          className={`favorite-toggle ${favorites.has(service.id) ? 'active' : ''}`}
          onClick={(e) => handleToggleFavorite(e, service.id)}
          title={favorites.has(service.id) ? "Remover dos favoritos" : "Adicionar aos favoritos"}
        >
          <Star 
            size={20} 
            fill={favorites.has(service.id) ? 'var(--primary-color)' : 'none'} 
            color={favorites.has(service.id) ? 'var(--primary-color)' : 'var(--text-muted)'} 
          />
        </button>
      </div>
      
      <div className="service-action">
        {!hasAnyOffer ? (
          <div className="service-hint error">Serviço temporariamente indisponível</div>
        ) : (() => {
          // Offers arrive pre-sorted (healthy first, then cheapest). The panel
          // shows only the auto-selected one — provider choice is automatic, so
          // the customer never sees two prices for the same service.
          const offer = service.offers[0];
          const isSms24h = offer.provider.name.toLowerCase().includes('sms24h') || offer.provider.key?.toLowerCase() === 'sms24h' || offer.provider.name.toLowerCase() === 'laranjinha';
          const currentDDD = selectedDDD || 'Qualquer';

          let displayPrice = Number(offer.sale_price);
          if (isSms24h && currentDDD !== 'Qualquer') {
            displayPrice = displayPrice * 1.30;
          }

          const canAfford = userBalance >= displayPrice;
          const hasStock = offer.stock > 0;
          const isThisLoading = isPurchasing && purchasingId === `${service.id}-${offer.id}`;

          const availableDDDs = (service.ddd_availability || [])
            .filter(d => d.provider_id === offer.provider_id && d.status === 'available')
            .map(d => parseInt(d.ddd, 10))
            .sort((a, b) => a - b);
          const hasKnownDDDs = availableDDDs.length > 0;

          return (
            <div className="provider-offer-row-wrapper" style={{ opacity: (!hasStock || !canAfford) ? 0.6 : 1 }}>
              <div className="provider-offer-row">
                <div className="provider-action-col">
                  <span className="offer-price">R$ {displayPrice.toFixed(2)}</span>
                  <button
                    className="btn btn-buy-gradient"
                    disabled={!canAfford || !hasStock || isPurchasing}
                    onClick={() => handlePurchase(service, offer)}
                    title={!canAfford ? "Saldo insuficiente" : !hasStock ? "Esgotado" : "Comprar número"}
                  >
                    {isThisLoading ? <Loader2 size={16} className="spin" /> : <ShoppingCart size={16} />}
                  </button>
                </div>
              </div>
              {hasStock ? (
                <div className="offer-stock badge-available">
                  <Package size={12} />
                  <span>{offer.stock.toLocaleString('pt-BR')} disponíveis</span>
                </div>
              ) : (
                <div className="offer-stock badge-unavailable">
                  <AlertCircle size={12} />
                  <span>Indisponível</span>
                </div>
              )}

              {isSms24h && hasStock && hasKnownDDDs && (
                <div className="ddd-selector-row">
                  <span className="ddd-selector-label">DDD</span>
                  <select
                    className="ddd-selector-input"
                    value={currentDDD}
                    onChange={(e) => handleDDDChange(service.id, e.target.value)}
                  >
                    <option value="Qualquer">Qualquer</option>
                    {availableDDDs.map(d => (
                      <option key={d} value={d}>{d} · +30%</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
});

const Servicos = () => {
  const { user, updateBalance } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const { openRechargeModal } = useOutletContext();
  
  const [services, setServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [favorites, setFavorites] = useState(new Set());
  
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchasingId, setPurchasingId] = useState(null);
  
  // DDD Selection: { [serviceId]: dddString }
  const [selectedDDDs, setSelectedDDDs] = useState({});

  const handleDDDChange = (serviceId, ddd) => {
    setSelectedDDDs(prev => ({ ...prev, [serviceId]: ddd }));
  };

  const categories = [
    { id: 'Todos', label: 'Todos', icon: LayoutGrid },
    { id: 'Favoritos', label: 'Favoritos', icon: Star },
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
        const [servicesData, favData] = await Promise.all([
          numberProviderService.getAvailableServices(),
          user ? numberProviderService.getFavorites(user.id) : Promise.resolve(new Set())
        ]);
        setServices(servicesData);
        setFavorites(favData);
      } catch (error) {
        addToast('Falha ao carregar serviços.', 'error');
      } finally {
        setIsLoadingServices(false);
      }
    };
    fetchServices();
  }, [addToast, user]);

  const handlePurchase = async (service, offer) => {
    const userBalance = user?.balance || 0;
    if (userBalance < offer.sale_price) {
      addToast("Saldo insuficiente para este serviço.", 'error');
      openRechargeModal();
      return;
    }

    if (offer.stock <= 0) {
      addToast("Este fornecedor está sem estoque no momento.", 'error');
      return;
    }

    setIsPurchasing(true);
    setPurchasingId(`${service.id}-${offer.id}`);

    try {
      const isSms24h = offer.provider.name.toLowerCase().includes('sms24h') || offer.provider.key?.toLowerCase() === 'sms24h' || offer.provider.name.toLowerCase() === 'laranjinha';
      const selectedDDD = isSms24h ? (selectedDDDs[service.id] || 'Qualquer') : 'Qualquer';

      const res = await numberProviderService.purchaseNumber(offer, service.id, selectedDDD);
      
      // Deduct balance from user context immediately
      let finalPrice = Number(offer.sale_price);
      if (isSms24h && selectedDDD !== 'Qualquer') finalPrice *= 1.30;
      updateBalance(user.balance - finalPrice);

      historyService.addActivation(user.id, {
        serviceId: service.id,
        status: 'waiting',
        phoneNumber: res.phoneNumber,
        activationId: res.activationId
      });
      
      addToast('Número gerado! Redirecionando...', 'success');
      
      setTimeout(() => {
        navigate('/panel/dashboard');
      }, 500);

    } catch (error) {
      addToast("Erro ao gerar número: " + error.message, 'error');
      setIsPurchasing(false);
      setPurchasingId(null);
    }
  };

  const handleToggleFavorite = useCallback(async (e, serviceId) => {
    e.stopPropagation();
    try {
      const isCurrentlyFavorited = favorites.has(serviceId);
      const isNowFavorited = await numberProviderService.toggleFavorite(user.id, serviceId, isCurrentlyFavorited);
      
      setFavorites(prev => {
        const next = new Set(prev);
        if (isNowFavorited) {
          next.add(serviceId);
        } else {
          next.delete(serviceId);
        }
        return next;
      });
    } catch (err) {
      console.error(err);
      addToast("Erro ao atualizar favoritos", "error");
    }
  }, [user, favorites, addToast]);

  const filteredServices = useMemo(() => {
    return services
      .filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = activeCategory === 'Todos' || 
                                (activeCategory === 'Favoritos' ? favorites.has(s.id) : categorizeService(s.name) === activeCategory);
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        // Sort favorites first
        const aFav = favorites.has(a.id);
        const bFav = favorites.has(b.id);
        if (aFav && !bFav) return -1;
        if (!aFav && bFav) return 1;
        return 0;
      });
  }, [services, searchTerm, activeCategory, favorites]);

  return (
    <div className="servicos-page page-transition">
      <div className="servicos-header-wrapper fade-in">
        
        {/* Row 2: Search */}
        <div className="sh-row-2">
          <div className="search-box full-width">
            <Search size={20} className="search-icon" />
            <input 
              type="text" 
              placeholder="Busque por nome do app, site ou serviço..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="sh-row-3-wrapper">
        <div className="category-filters-container">
          <div className="category-filters">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <button 
                  key={cat.id} 
                  className={`category-pill ${activeCategory === cat.id ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat.id)}
                >
                  <Icon size={16} /> {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>   {/* Row 4: Count */}
        <div className="sh-row-4">
          <div className="service-count">
            <Signal size={14} className="text-muted" />
            <span>{filteredServices.length} de {services.length} serviços</span>
          </div>
        </div>
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
          filteredServices.map((service, index) => (
            <ServiceCardItem 
              key={service.id}
              service={service}
              index={index}
              userBalance={user?.balance || 0}
              favorites={favorites}
              handleToggleFavorite={handleToggleFavorite}
              selectedDDD={selectedDDDs[service.id]}
              handleDDDChange={handleDDDChange}
              handlePurchase={handlePurchase}
              isPurchasing={isPurchasing}
              purchasingId={purchasingId}
            />
          ))
        ) : activeCategory === 'Favoritos' && searchTerm === '' ? (
          <div className="empty-state full-width">
            <Star size={48} className="empty-icon text-muted mb-4" />
            <h3>Você ainda não favoritou nenhum serviço</h3>
            <p className="text-muted">Toque na estrela ao lado do nome do serviço para adicioná-lo aos seus favoritos.</p>
            <button className="btn btn-outline mt-4" onClick={() => setActiveCategory('Todos')}>Ver todos os serviços</button>
          </div>
        ) : (
          <div className="empty-state full-width">
            <Search size={48} className="empty-icon text-muted mb-4" />
            <h3>Nenhum serviço encontrado</h3>
            <p className="text-muted">Não encontramos resultados para a sua busca.</p>
            <button className="btn btn-outline mt-4" onClick={() => { setSearchTerm(''); setActiveCategory('Todos'); }}>Limpar filtros</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Servicos;
