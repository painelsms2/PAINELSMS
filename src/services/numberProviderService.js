import { supabase } from '../lib/supabase';

// Mapeamento dos serviços do nosso banco para os códigos universais (SMS-Activate API)
const SERVICE_CODES = {
  'whatsapp': 'wa',
  'telegram': 'tg',
  'instagram': 'ig',
  'facebook': 'fb',
  'google': 'go',
  'tiktok': 'lf',
  'discord': 'ds',
  'uber': 'ub',
  'twitter': 'tw',
  'netflix': 'nf'
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
      price: s.price,
      country: s.country,
      icon: s.icon_key,
      stock: s.stock
    }));
  },

  async purchaseNumber(serviceId) {
    const API_URL = import.meta.env.VITE_SMS_API_URL;
    const API_KEY = import.meta.env.VITE_SMS_API_KEY;
    const serviceCode = SERVICE_CODES[serviceId] || serviceId;
    const countryCode = '73'; // Brazil

    // 1. Solicita o número no fornecedor (SMS24h / SMS-Activate protocol)
    const url = `${API_URL}?api_key=${API_KEY}&action=getNumber&service=${serviceCode}&country=${countryCode}`;
    
    let externalId, realPhoneNumber;
    try {
      const response = await fetch(url);
      const text = await response.text();
      
      // Resposta esperada de sucesso: ACCESS_NUMBER:$ID:$NUMBER
      if (text.startsWith('ACCESS_NUMBER')) {
        const parts = text.split(':');
        externalId = parts[1];
        realPhoneNumber = '+' + parts[2];
      } else {
        console.error("Fornecedor não tem números:", text);
        throw new Error("Sem números disponíveis no momento no fornecedor.");
      }
    } catch (e) {
      console.error("Erro ao chamar API do fornecedor:", e);
      throw new Error("Falha ao comunicar com o fornecedor.");
    }

    // 2. Tenta descontar o saldo e criar a ativação no Supabase via RPC
    const { data, error } = await supabase.rpc('purchase_number', {
      p_service_id: serviceId
    });

    if (error) {
      console.error("Erro interno ao processar compra:", error);
      
      // Como falhou no nosso banco (saldo insuficiente, etc), devolvemos o número pro fornecedor pra não cobrar
      await fetch(`${API_URL}?api_key=${API_KEY}&action=setStatus&status=8&id=${externalId}`).catch(console.error);
      
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
    const API_URL = import.meta.env.VITE_SMS_API_URL;
    const API_KEY = import.meta.env.VITE_SMS_API_KEY;

    // 2. Consulta o status do SMS no fornecedor
    try {
      const response = await fetch(`${API_URL}?api_key=${API_KEY}&action=getStatus&id=${externalId}`);
      const text = await response.text();

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

    if (act && act.phone_number && act.phone_number.includes('|')) {
      const externalId = act.phone_number.split('|')[0];
      const API_URL = import.meta.env.VITE_SMS_API_URL;
      const API_KEY = import.meta.env.VITE_SMS_API_KEY;
      
      // Cancela no fornecedor
      await fetch(`${API_URL}?api_key=${API_KEY}&action=setStatus&status=8&id=${externalId}`).catch(console.error);
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
