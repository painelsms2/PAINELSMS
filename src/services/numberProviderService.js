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
      .select('*')
      .eq('active', true)
      .order('name');
    
    if (error) {
      console.error("Error fetching services:", error);
      throw new Error("Erro ao carregar serviços");
    }

    return data.map(s => ({
      id: s.id,
      name: s.name,
      price: s.sale_price || s.price, // Fallback if sale_price is empty in DB
      country: s.country,
      icon: s.icon_file,
      stock: s.stock
    }));
  },

  async callProvider(params) {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (isLocalhost) {
      let API_URL = import.meta.env.VITE_SMS_API_URL;
      const API_KEY = import.meta.env.VITE_SMS_API_KEY;
      if (!API_URL.startsWith('http')) API_URL = 'https://' + API_URL;

      const queryParams = new URLSearchParams({ api_key: API_KEY, ...params }).toString();
      const response = await fetch(`${API_URL}?${queryParams}`);
      return await response.text();
    } else {
      const queryParams = new URLSearchParams(params).toString();
      const response = await fetch(`/api/proxy?${queryParams}`);
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error("Erro no proxy: " + data.error);
      }

      console.log("[PROXY DEBUG] Status HTTP Fornecedor:", data.providerStatus);
      console.log("[PROXY DEBUG] Resposta Bruta:", data.text);
      console.log("[PROXY DEBUG] URL Chamada:", data.maskedUrl);

      if (data.providerStatus === 403) {
        throw new Error("Fornecedor bloqueou a chamada da Vercel (403 Forbidden).");
      }

      return data.text;
    }
  },

  async purchaseNumber(serviceId) {
    const serviceCode = SERVICE_CODES[serviceId] || serviceId;
    const countryCode = '73'; // Brazil

    // 1. Solicita o número no fornecedor (SMS24h / SMS-Activate protocol)
    let externalId, realPhoneNumber, text;
    try {
      text = await this.callProvider({ action: 'getNumber', service: serviceCode, country: countryCode });
    } catch (e) {
      console.error("Erro de rede ao chamar API do fornecedor:", e);
      throw new Error("Falha ao comunicar com o fornecedor.");
    }
    
    // Resposta esperada de sucesso: ACCESS_NUMBER:$ID:$NUMBER
    if (text.startsWith('ACCESS_NUMBER')) {
      const parts = text.split(':');
      externalId = parts[1];
      realPhoneNumber = '+' + parts[2];
    } else {
      console.error("Fornecedor não tem números ou retornou erro:", text);
      throw new Error("Sem números disponíveis no momento no fornecedor.");
    }

    // 2. Tenta descontar o saldo e criar a ativação no Supabase via RPC
    const { data, error } = await supabase.rpc('purchase_number', {
      p_service_id: serviceId
    });

    if (error) {
      console.error("Erro interno ao processar compra:", error);
      
      // Como falhou no nosso banco (saldo insuficiente, etc), devolvemos o número pro fornecedor pra não cobrar
      await this.callProvider({ action: 'setStatus', status: 8, id: externalId }).catch(console.error);
      
      if (error.message.includes('Out of stock')) throw new Error("Sem estoque disponível");
      if (error.message.includes('Insufficient balance')) throw new Error("Saldo insuficiente");
      throw new Error("Erro ao comprar número no banco de dados.");
    }

    // 3. O RPC gera um número falso (porque não conseguimos passar pelo RPC ainda). 
    // Precisamos atualizar com o número real + ID do fornecedor embutido (ID|Numero)
    const combinedPhoneStr = `${externalId}|${realPhoneNumber}`;
    
    await supabase
      .from('activations')
      .update({ phone_number: combinedPhoneStr })
      .eq('id', data.id);

    return {
      activationId: data.id,
      phoneNumber: combinedPhoneStr,
      service: { id: serviceId },
      status: data.status,
      createdAt: new Date(data.created_at).getTime(),
      expiresAt: new Date(data.expires_at).getTime()
    };
  },

  async checkForSms(activation) {
    // 1. Extrair o ID do fornecedor a partir do formato "ID|Numero"
    const parts = (activation.phoneNumber || '').split('|');
    if (parts.length < 2) {
      return { status: 'waiting_sms', code: null }; // número falso antigo
    }
    
    const externalId = parts[0];

    // 2. Consulta o status do SMS no fornecedor
    try {
      const text = await this.callProvider({ action: 'getStatus', id: externalId });

      // STATUS_WAIT_CODE: aguardando
      if (text === 'STATUS_WAIT_CODE') {
        return { status: 'waiting_sms', code: null };
      }

      // STATUS_OK:$CODE: recebido!
      if (text.startsWith('STATUS_OK')) {
        const code = text.split(':')[1];

        // Atualiza nosso banco
        const { error: updateError } = await supabase
          .from('activations')
          .update({ 
            sms_code: code, 
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', activation.activationId)
          .eq('status', 'waiting');

        if (updateError) {
          console.error("Erro ao atualizar código no banco:", updateError);
          return { status: 'waiting_sms', code: null };
        }

        // Cobra a ativação do saldo (função atômica)
        await supabase.rpc('charge_activation', {
          p_activation_id: activation.activationId
        });

        return { status: 'completed', code };
      }

      // STATUS_CANCEL: Fornecedor cancelou o número (timeout ou erro deles)
      if (text === 'STATUS_CANCEL') {
        await this.cancelNumber(activation.activationId);
        return { status: 'cancelled', code: null };
      }
    } catch (e) {
      console.error("Erro ao verificar SMS:", e);
    }

    return { status: 'waiting_sms', code: null };
  },

  async cancelNumber(activationId) {
    // 1. Primeiro precisamos pegar o external_id para cancelar no fornecedor
    const { data: act } = await supabase
      .from('activations')
      .select('phone_number')
      .eq('id', activationId)
      .single();

    if (act && act.phone_number) {
      const parts = act.phone_number.split('|');
      if (parts.length >= 2) {
        const externalId = parts[0];
        try {
          await this.callProvider({ action: 'setStatus', status: 8, id: externalId });
        } catch (e) {
          console.error("Falha ao avisar fornecedor do cancelamento:", e);
        }
      }
    }

    // 2. Cancela no nosso banco de dados (devolve o saldo/estoque)
    const { error } = await supabase.rpc('cancel_activation', {
      p_activation_id: activationId
    });

    if (error) {
      console.error("Cancel error:", error);
      throw new Error("Erro ao cancelar número");
    }

    return { status: 'cancelled' };
  }
};
