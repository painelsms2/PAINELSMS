import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const SMS24H_API_KEY = process.env.SMS24H_API_KEY;
const NUMEROVIRTUAL_API_KEY = process.env.NUMEROVIRTUAL_API_KEY;

// Service role client is still available if strictly needed for admin tasks, 
// but we will primarily use userSupabase to respect auth.uid() in RPCs
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminSupabase = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

/**
 * Adapter Interface:
 * buyNumber(offer) -> { providerActivationId, phone }
 * checkSms(providerActivationId) -> { status: 'waiting'|'completed'|'cancelled'|'expired', code?: string }
 * cancel(providerActivationId) -> { ok: boolean }
 * listServices(country) -> [{ providerServiceCode, price, quantity, name? }]
 * getBalance() -> number | null
 */

// --- ADAPTER A: SMS24H ---
const Sms24hAdapter = {
  baseUrl: 'https://api.sms24h.org/stubs/handler_api',
  
  async request(params) {
    const query = new URLSearchParams({ api_key: SMS24H_API_KEY, ...params }).toString();
    const res = await fetch(`${this.baseUrl}?${query}`);
    return await res.text();
  },

  async buyNumber(offer) {
    const text = await this.request({ action: 'getNumber', service: offer.provider_service_code, country: '73', operator: 'any' });
    if (text.startsWith('ACCESS_NUMBER')) {
      const parts = text.split(':');
      return { providerActivationId: parts[1], phone: '+' + parts[2] };
    }
    throw new Error(`SMS24H Error: ${text}`);
  },

  async checkSms(providerActivationId) {
    const text = await this.request({ action: 'getStatus', id: providerActivationId });
    if (text === 'STATUS_WAIT_CODE' || text === 'STATUS_WAIT_RETRY') return { status: 'waiting' };
    if (text.startsWith('STATUS_OK')) return { status: 'completed', code: text.split(':')[1] };
    if (text === 'STATUS_CANCEL') return { status: 'cancelled' };
    return { status: 'waiting' }; // Fallback
  },

  async cancel(providerActivationId) {
    const text = await this.request({ action: 'setStatus', id: providerActivationId, status: 8 });
    return { ok: text.includes('ACCESS_CANCEL') };
  },

  async listServices(country = '73') {
    const text = await this.request({ action: 'getPrices', country });
    console.log(`[SMS24H_SYNC] Raw response length: ${text.length}, text start: ${text.substring(0, 100)}`);
    try {
      const data = JSON.parse(text);
      const countryData = data[country];
      if (!countryData) {
        console.log(`[SMS24H_SYNC] Country ${country} not found in response keys: ${Object.keys(data)}`);
        throw new Error("Country data not found in response");
      }
      
      const services = [];
      for (const [code, info] of Object.entries(countryData)) {
        // info is like: { price: qty, ... }
        const priceKeys = Object.keys(info);
        if (priceKeys.length > 0) {
          const price = parseFloat(priceKeys[0]);
          const quantity = info[priceKeys[0]];
          services.push({ providerServiceCode: code, price, quantity });
        }
      }
      console.log(`[SMS24H_SYNC] Parsed ${services.length} offers successfully.`);
      return services;
    } catch (e) {
      console.error('[SMS24H_SYNC] Parse Error:', e, 'Raw Response:', text.substring(0, 500));
      throw new Error(`SMS24H Error: ${text}`);
    }
  },

  async getBalance() {
    const text = await this.request({ action: 'getBalance' });
    if (text.startsWith('ACCESS_BALANCE')) {
      return parseFloat(text.split(':')[1]);
    }
    return null;
  }
};

// --- ADAPTER B: Numero Virtual ---
const NumeroVirtualAdapter = {
  baseUrl: 'https://v3.numero-virtual.app/api',

  async request(endpoint, method = 'GET', body = null) {
    const key = (NUMEROVIRTUAL_API_KEY || '').trim();
    
    // Mask key for logging
    let maskedKey = "UNDEFINED";
    if (key.length > 8) {
      maskedKey = `${key.slice(0, 4)}...${key.slice(-4)}`;
    } else if (key.length > 0) {
      maskedKey = "TOO_SHORT";
    }

    console.log("NV_KEY_LEN", key.length);
    console.log("NV_KEY_MASK", maskedKey);
    
    // Safely append api-key using URL object
    const fullUrl = new URL(`${this.baseUrl}${endpoint}`);
    fullUrl.searchParams.append('api-key', key);
    const urlStr = fullUrl.toString();

    // Mask URL for logging
    const maskedUrl = urlStr.replace(key, maskedKey);
    console.log("NV_URL", maskedUrl);

    const opts = {
      method,
      headers: { 
        'api-key': key, 
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json'
      }
    };
    if (body) opts.body = JSON.stringify(body);
    
    const res = await fetch(urlStr, opts);
    const rawText = await res.text();
    console.log("NV_STATUS", res.status);
    console.log("NV_BODY", rawText.substring(0, 200));
    
    try {
      return JSON.parse(rawText);
    } catch (e) {
      throw new Error(`Invalid JSON response: ${rawText}`);
    }
  },

  async buyNumber(offer) {
    const data = await this.request('/sms/buy-number', 'POST', {
      country: '73',
      service: offer.provider_service_code,
      operator: 'any',
      quantity: 1
    });
    if (data.results && data.results.length > 0) {
      const res = data.results[0];
      return { providerActivationId: res.activationId, phone: res.phone };
    }
    throw new Error(`NumeroVirtual Error: ${data.message || 'Unknown Error'}`);
  },

  async checkSms(providerActivationId) {
    try {
      const data = await this.request(`/sms/activation/${providerActivationId}`);
      const res = data.result;
      if (!res) return { status: 'waiting' };

      let mappedStatus = 'waiting';
      if (res.status === 'FINISHED') mappedStatus = 'completed';
      if (res.status === 'CANCELLED') mappedStatus = 'cancelled';
      if (res.status === 'EXPIRED') mappedStatus = 'expired';

      let code = undefined;
      if (mappedStatus === 'completed' && res.smsReceiveds && res.smsReceiveds.length > 0) {
        code = res.smsReceiveds[res.smsReceiveds.length - 1].code;
      }

      return { status: mappedStatus, code };
    } catch (e) {
      return { status: 'waiting' };
    }
  },

  async cancel(providerActivationId) {
    try {
      await this.request(`/sms/cancel-number/${providerActivationId}`);
      return { ok: true };
    } catch (e) {
      return { ok: false };
    }
  },

  async listServices(country = 'br') {
    try {
      const data = await this.request(`/sms/service?page=1&limit=1000`);
      if (data.results) {
        return data.results.map(s => ({
          providerServiceCode: s.serviceCode,
          name: s.serviceName,
          price: parseFloat(s.price),
          quantity: parseInt(s.quantity, 10)
        }));
      }
      throw new Error(`NumeroVirtual Error: Missing results array. Response: ${JSON.stringify(data)}`);
    } catch (e) {
      console.error('NumeroVirtual Error:', e);
      throw new Error(`NumeroVirtual Error: ${e.message}`);
    }
  },

  async getBalance() {
    return null; // Not supported by standard spec, or requires billing endpoint
  }
};

// --- ROUTER ---
const ADAPTERS = {
  'sms24h': Sms24hAdapter,
  'laranjinha': Sms24hAdapter, // Map legacy name to SMS24H adapter
  'numerovirtual': NumeroVirtualAdapter,
  'numero_virtual': NumeroVirtualAdapter
};

export default async function handler(req, res) {
  // CORS for local dev
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Basic Auth Check via Headers
    const authHeader = req.headers.authorization;
    if (!authHeader) throw new Error("Missing Authorization header");
    
    const token = authHeader.replace('Bearer ', '');
    
    // Create a client acting on behalf of the user to preserve auth.uid() in RPCs
    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
    
    const { data: { user }, error: authError } = await userSupabase.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { action } = body;

    if (action === 'buyNumber') {
      const { offerId } = body;
      
      // 1. Get offer details
      const { data: offer } = await userSupabase
        .from('service_offers')
        .select('*, provider:providers(*)')
        .eq('id', offerId)
        .single();
        
      if (!offer || !offer.active || !offer.provider?.active) throw new Error("Offer not available");

      // 2. We use RPC to decrement stock and insert activation, returning the new row
      // We do this BEFORE calling provider to reserve balance/stock safely?
      // Wait, PRD: "calls adapter.buyNumber, stores the activation"
      // If we buy first, and it fails to insert into DB, we lose money on provider.
      // If we insert into DB first (reserve), and provider fails, we must rollback.
      
      // Using the RPC `purchase_number` that checks balance and stock!
      // But we need the provider_activation_id and phone_number.
      // So we call provider first. If user balance is 0, we shouldn't call provider.
      
      const { data: profile } = await userSupabase.from('profiles').select('balance').eq('id', user.id).single();
      if (!profile || profile.balance < offer.sale_price) throw new Error("Insufficient balance");
      if (offer.stock <= 0) throw new Error("Out of stock");

      const adapterKey = offer.provider.key.toLowerCase();
      const adapter = ADAPTERS[adapterKey];
      if (!adapter) throw new Error(`Provider adapter for ${offer.provider.key} not found`);

      // Call Provider
      const providerRes = await adapter.buyNumber(offer);
      
      // Store in DB via RPC using userSupabase so auth.uid() works
      const { data: actData, error: actError } = await userSupabase.rpc('purchase_number', {
        p_service_offer_id: offer.id,
        p_phone_number: providerRes.phone,
        p_provider_activation_id: providerRes.providerActivationId
      });

      if (actError) {
        // Rollback provider side
        await adapter.cancel(providerRes.providerActivationId).catch(console.error);
        throw actError;
      }

      return res.status(200).json({ success: true, activation: actData });
    }

    if (action === 'checkSms') {
      const { activationId } = body;
      
      // Get activation
      const { data: activation } = await userSupabase
        .from('activations')
        .select('*, provider:providers(*)')
        .eq('id', activationId)
        .eq('user_id', user.id)
        .single();
        
      if (!activation || activation.status !== 'waiting') return res.status(200).json({ success: true, activation });

      const adapterKey = activation.provider.key.toLowerCase();
      const adapter = ADAPTERS[adapterKey];
      if (!adapter) throw new Error(`Provider adapter not found`);

      const providerStatus = await adapter.checkSms(activation.provider_activation_id);

      if (providerStatus.status === 'completed') {
        // Complete in DB. Using adminSupabase if available to prevent users from bypassing payment
        // by manually updating status via frontend.
        const dbClient = adminSupabase || userSupabase;
        
        await dbClient.from('activations').update({ 
          status: 'completed', 
          sms_code: providerStatus.code,
          completed_at: new Date().toISOString()
        }).eq('id', activationId);

        // Deduct balance
        await userSupabase.rpc('charge_activation', { p_activation_id: activationId });

        return res.status(200).json({ success: true, status: 'completed', code: providerStatus.code });
      } else if (providerStatus.status === 'cancelled' || providerStatus.status === 'expired') {
        // Cancel in DB
        await userSupabase.rpc('cancel_activation', { p_activation_id: activationId });
        return res.status(200).json({ success: true, status: 'cancelled' });
      }

      return res.status(200).json({ success: true, status: 'waiting' });
    }

    if (action === 'cancel') {
      const { activationId } = body;
      
      const { data: activation } = await userSupabase
        .from('activations')
        .select('*, provider:providers(*)')
        .eq('id', activationId)
        .eq('user_id', user.id)
        .single();

      if (!activation || activation.status !== 'waiting') throw new Error("Cannot cancel");

      const adapterKey = activation.provider.key.toLowerCase();
      const adapter = ADAPTERS[adapterKey];
      if (adapter) {
        await adapter.cancel(activation.provider_activation_id).catch(console.error);
      }

      const { error: cancelErr } = await userSupabase.rpc('cancel_activation', { p_activation_id: activationId });
      if (cancelErr) throw cancelErr;

      return res.status(200).json({ success: true });
    }

    // Admin endpoints
    if (action === 'listServices') {
      const { data: profile } = await userSupabase.from('profiles').select('role').eq('id', user.id).single();
      if (profile?.role !== 'admin') throw new Error("Unauthorized");

      const { providerKey } = body;
      const adapter = ADAPTERS[providerKey.toLowerCase()];
      if (!adapter) throw new Error(`Provider adapter not found`);

      const services = await adapter.listServices();
      return res.status(200).json({ success: true, services });
    }

    if (action === 'getBalance') {
      const { data: profile } = await userSupabase.from('profiles').select('role').eq('id', user.id).single();
      if (profile?.role !== 'admin') throw new Error("Unauthorized");

      const { providerKey } = body;
      const adapter = ADAPTERS[providerKey.toLowerCase()];
      if (!adapter) throw new Error(`Provider adapter not found`);

      const balance = await adapter.getBalance();
      return res.status(200).json({ success: true, balance });
    }

    throw new Error("Unknown action");

  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ success: false, error: error.message || error.toString() });
  }
}
