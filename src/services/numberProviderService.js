import { supabase } from '../lib/supabase';

// Mapeamento dos serviços do nosso banco para os códigos universais (SMS-Activate API)
const SERVICE_CODES = {
  '99app': 'ki',
  'agibank': 'sa',
  'aliexpress': 'hx',
  'amazon': 'am',
  'asaas': 'bqr',
  'autodesk': 'bbl',
  'badoo': 'qv',
  'baidu': 'li',
  'banqi': 'vc',
  'beboo': 'abd',
  'bet365': 'ie',
  'bipa': 'baj',
  'bitso': 'ht',
  'blablacar': 'ua',
  'bradesco': 'ann',
  'brahma': 'sy',
  'bv': 'avy',
  'c6_bank': 'aff',
  'coinbase': 're',
  'corona': 'om',
  'crefisamais': 'ax',
  'cruzeiro': 'ccl',
  'cupidmedia': 'aje',
  'daki': 'ahi',
  'discord': 'ds',
  'dotz': 'xj',
  'efi_bank': 'efi',
  'enjoei': 'arf',
  'ero_me': 'cau',
  'etoro': 'apb',
  'facebook': 'fb',
  'facily': 'alc',
  'familhao': 'asl',
  'fastearn': 'any',
  'firebase': 'aim',
  'gappx': 'arg',
  'getninjas': 'aiu',
  'google': 'go',
  'google_chat': 'ccu',
  'googlemessenger': 'gmsg',
  'googlevoice': 'gf',
  'govbr': 'afe',
  'grindr': 'yw',
  'guiche_web': 'alb',
  'gurubets': 'ik',
  'icq': 'iq',
  'ifood': 'pd',
  'infinitepay': 'anx',
  'instagram': 'ig',
  'itau': 'btn',
  'iti': 'ad',
  'kakaotalk': 'kt',
  'kwai': 'vp',
  'lalamove': 'fh',
  'line_msg': 'me',
  'luup': 'beh',
  'magalu': 'afq',
  'mamba': 'fd',
  'manus': 'bwv',
  'meliuz': 'uy',
  'mercado': 'cq',
  'meseems': 'amv',
  'monzo': 'aom',
  'moonpay': 'bgj',
  'n_me_perturbe': 'axm',
  'natura_avon': 'awg',
  'naver': 'nv',
  'neon': 'aex',
  'netflix': 'nf',
  'next': 'aey',
  'ngcash': 'awh',
  'nubank': 'aaa',
  'okru': 'ok',
  'okx': 'aor',
  'olx': 'sn',
  'openai': 'dr',
  'outlier': 'auz',
  'outros': 'ot',
  'pagbank': 'abg',
  'parimatch': 'abf',
  'paysera': 'aol',
  'pedir_gs': 'bqh',
  'pgbonus': 'fx',
  'picpay': 'ev',
  'pofcom': 'pf',
  'premmia': 'anw',
  'privalia': 'afs',
  'protonmail': 'dp',
  'queroq_pag': 'bxj',
  'radquest': 'ayk',
  'rappi': 'aba',
  'reclameaqui': 'aoz',
  'revolut': 'ij',
  'ripio': 'avp',
  'santander': 'lj',
  'serasa': 'abj',
  'shein': 'aez',
  'shellbox': 'vg',
  'shopee': 'ka',
  'sicredi': 'ana',
  'skrill': 'aqt',
  'snapchat': 'fu',
  'soop': 'bxz',
  'spaten': 'ky',
  'telegram': 'tg',
  'temu': 'ep',
  'tencent_qq': 'qq',
  'tick': 'rb',
  'ticketmaster': 'gp',
  'tiktok': 'lf',
  'tinder': 'oi',
  'totalpass': 'auc',
  'twitch': 'hb',
  'uber': 'ub',
  'ubisoft': 'ahb',
  'ultragaz': 'afr',
  'uol': 'abh',
  'valora': 'bdw',
  'viber': 'vi',
  'vkcom': 'vk',
  'voltz': 'eb',
  'walmart': 'wr',
  'webmotors': 'bfa',
  'wechat': 'wb',
  'weststein': 'th',
  'whatsapp': 'wa',
  'will': 'bsa',
  'winzo': 'vs',
  'wirex': 'baa',
  'wise': 'bo',
  'xbox': 'aml',
  'xiaomi': 'yu',
  'yahoo': 'mb',
  'yalla': 'yl',
  'yandex': 'ya',
  'yowin': 'sm',
  'zedelivery': 'em',
  'zeenow': 'btm',
  'zoho': 'zh'
};

export const numberProviderService = {
  async getAvailableServices() {
    const { data, error } = await supabase
      .from('services')
      .select(`
        id, name, country, icon_file, active,
        offers:service_offers(
          id, sale_price, stock, provider_service_code, is_default, active,
          provider:providers(id, name, logo_key, active)
        )
      `)
      .eq('active', true)
      .order('name');
    
    if (error) {
      console.error("Error fetching services:", error);
      throw new Error("Erro ao carregar serviços");
    }

    // Filter active offers and providers in JS, format the final array
    const mapped = data.map(s => {
      const activeOffers = (s.offers || []).filter(o => o.active && o.provider && o.provider.active && o.sale_price > 0);
      // Sort offers by default first, then lowest price
      activeOffers.sort((a, b) => {
        if (a.is_default && !b.is_default) return -1;
        if (!a.is_default && b.is_default) return 1;
        return a.sale_price - b.sale_price;
      });

      return {
        id: s.id,
        name: s.name,
        country: s.country,
        icon: s.icon_file,
        offers: activeOffers
      };
    });

    // Only return services that have at least one valid offer (to hide fully unavailable ones)
    return mapped.filter(s => {
      if (s.offers.length === 0) return false;
      
      // Filter out auto-created junk services (e.g. AAB, ABK, WA) from raw provider syncs
      // A raw code is typically 2 to 4 uppercase letters and generally has no custom icon configured
      const isRawCodePattern = /^[A-Z0-9_]{2,5}$/.test(s.name);
      const isMissingIcon = !s.icon || s.icon.trim() === '';
      if (isRawCodePattern && isMissingIcon) {
        return false;
      }
      
      return true;
    });
  },

  async invokeProvider(action, payload = {}) {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    // Auth token is required to hit our secure API
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    
    if (!token) throw new Error("Usuário não autenticado");

    const endpoint = isLocalhost ? 'http://localhost:3000/api/provider' : '/api/provider';
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ action, ...payload })
    });
    
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Erro no servidor do fornecedor");
    }
    
    return data;
  },

  async purchaseNumber(offer, serviceId) {
    try {
      const { activation } = await this.invokeProvider('buyNumber', { offerId: offer.id });
      
      return {
        activationId: activation.id,
        phoneNumber: activation.phone_number,
        service: { id: serviceId },
        status: activation.status,
        createdAt: new Date(activation.created_at).getTime(),
        expiresAt: new Date(activation.expires_at).getTime()
      };
    } catch (e) {
      console.error("Erro ao comprar número:", e);
      throw new Error(e.message || "Erro ao comprar número");
    }
  },

  async checkForSms(activation) {
    try {
      const res = await this.invokeProvider('checkSms', { activationId: activation.activationId });
      return { status: res.status, code: res.code || null };
    } catch (e) {
      console.error("Erro ao verificar SMS:", e);
      return { status: 'waiting', code: null };
    }
  },

  async cancelNumber(activationId) {
    try {
      await this.invokeProvider('cancel', { activationId });
      return { status: 'cancelled' };
    } catch (e) {
      console.error("Cancel error:", e);
      throw new Error("Erro ao cancelar número");
    }
  }
};
