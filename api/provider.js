import { createClient } from '@supabase/supabase-js';

const SMS24H_API_KEY = process.env.SMS24H_API_KEY;
const NUMEROVIRTUAL_API_KEY = process.env.NUMEROVIRTUAL_API_KEY;

// We will initialize the admin client lazily inside the handler to prevent top-level crashes
// if environment variables are missing during cold start on Vercel.
let adminSupabase = null;

// Rate Limit Store (In-Memory per Vercel Lambda Instance)
const rateLimits = new Map();

function checkRateLimit(key, limit, windowMs) {
  const now = Date.now();
  const record = rateLimits.get(key) || { count: 0, resetTime: now + windowMs };
  
  if (now > record.resetTime) {
    record.count = 0;
    record.resetTime = now + windowMs;
  }
  
  record.count++;
  rateLimits.set(key, record);
  return record.count <= limit;
}

function checkPollRateLimit(activationId, windowMs = 2000) {
  const now = Date.now();
  const key = `poll:${activationId}`;
  const lastPoll = rateLimits.get(key) || 0;
  
  if (now - lastPoll < windowMs) return false;
  rateLimits.set(key, now);
  return true;
}


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

  async buyNumber(offer, ddd) {
    const params = { action: 'getNumber', service: offer.provider_service_code, country: '73', operator: 'any' };
    if (ddd && ddd !== 'Qualquer') {
      params.ddd = ddd;
    }
    const text = await this.request(params);
    if (text.startsWith('ACCESS_NUMBER')) {
      const parts = text.split(':');
      return { providerActivationId: parts[1], phone: '+' + parts[2] };
    }
    if (text === 'NO_NUMBERS') {
      throw new Error('NO_NUMBERS');
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
        // SMS24H format is: { cost: 0.50, count: 1000 }
        // SMS-Activate format is: { "0.50": 1000 }
        let price = 0;
        let quantity = 0;

        if (info.cost !== undefined && info.count !== undefined) {
          price = parseFloat(info.cost);
          quantity = parseInt(info.count, 10);
        } else {
          // Fallback to SMS-Activate standard if needed
          const priceKeys = Object.keys(info);
          if (priceKeys.length > 0) {
            price = parseFloat(priceKeys[0]);
            quantity = parseInt(info[priceKeys[0]], 10);
          }
        }

        if (price > 0 || quantity > 0) {
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
  // CORS for local dev and production
  res.setHeader('Access-Control-Allow-Credentials', true);
  const origin = req.headers.origin;
  const allowedOrigins = ['http://localhost:5173', 'https://painelsms2.vercel.app']; // Adjust production URL as needed
  if (allowedOrigins.includes(origin) || !origin) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Basic Auth Check via Headers
    const authHeader = req.headers.authorization;
    if (!authHeader) throw new Error("Missing Authorization header");
    
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!adminSupabase && supabaseServiceKey && supabaseUrl) {
      adminSupabase = createClient(supabaseUrl, supabaseServiceKey);
    }

    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw new Error("Unauthorized");
    
    // Create a client acting on behalf of the user to preserve auth.uid() in RPCs
    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
    
    const { data: { user }, error: authError } = await userSupabase.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { action } = body;

    const validActions = ['buyNumber', 'probeDdd', 'checkSms', 'cancel', 'listServices', 'getBalance', 'verifyPayment', 'createPixCharge'];
    if (!validActions.includes(action)) {
      return res.status(400).json({ success: false, error: "Invalid action" });
    }

    // IP for rate limiting
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';

    if (action === 'buyNumber') {
      if (!checkRateLimit(`${ip}:buyNumber`, 10, 60000)) {
        return res.status(429).json({ success: false, error: "Too many requests. Please wait a minute." });
      }

      const { offerId, ddd } = body;
      
      // 1. Get offer details
      const { data: offer } = await userSupabase
        .from('service_offers')
        .select('*, provider:providers(*)')
        .eq('id', offerId)
        .single();
        
      if (!offer || !offer.active || !offer.provider?.active) throw new Error("Offer not available");

      // Dynamic pricing for DDD
      let finalSalePrice = offer.sale_price;
      let finalCostPrice = offer.cost_price;
      const isSms24h = offer.provider.key.toLowerCase() === 'sms24h' || offer.provider.key.toLowerCase() === 'laranjinha';

      if (isSms24h && ddd && ddd !== 'Qualquer') {
        finalCostPrice = finalCostPrice * 1.30;
        finalSalePrice = finalSalePrice * 1.30; // 1.25 margin is already in the base, so * 1.30 applies to both
      }

      const { data: profile } = await userSupabase.from('profiles').select('balance').eq('id', user.id).single();
      if (!profile || profile.balance < finalSalePrice) throw new Error("Insufficient balance");
      if (offer.stock <= 0) throw new Error("Out of stock");

      const adapterKey = offer.provider.key.toLowerCase();
      const adapter = ADAPTERS[adapterKey];
      if (!adapter) throw new Error(`Provider adapter for ${offer.provider.key} not found`);

      // Call Provider
      let providerRes;
      try {
        providerRes = await adapter.buyNumber(offer, ddd);
      } catch (err) {
        if (err.message === 'NO_NUMBERS') {
          throw new Error("DDD não disponível para este serviço, tente outro ou 'Qualquer'");
        }
        throw err;
      }
      
      // Store in DB via RPC using userSupabase so auth.uid() works
      const { data: actData, error: actError } = await userSupabase.rpc('purchase_number', {
        p_service_offer_id: offer.id,
        p_phone_number: providerRes.phone,
        p_provider_activation_id: providerRes.providerActivationId,
        p_sale_price: finalSalePrice,
        p_cost_price: finalCostPrice
      });

      if (actError) {
        // Rollback provider side
        await adapter.cancel(providerRes.providerActivationId).catch(console.error);
        throw actError;
      }

      // Organic Learn: Mark DDD as available if it succeeded
      if (isSms24h && ddd && ddd !== 'Qualquer') {
        const dbClient = adminSupabase || userSupabase;
        await dbClient.rpc('upsert_ddd_availability', {
          p_service_id: offer.service_id,
          p_provider_id: offer.provider_id,
          p_ddd: ddd,
          p_status: 'available',
          p_source: 'purchase'
        }).catch(e => console.error("Error organic learning DDD:", e));
      }

      return res.status(200).json({ success: true, activation: actData });
    }

    if (action === 'probeDdd') {
      if (!checkRateLimit('global:probeDdd', 1, 1000)) {
        return res.status(429).json({ success: false, error: "Global probe limit reached. Try again later." });
      }

      const { data: profile } = await userSupabase.from('profiles').select('role').eq('id', user.id).single();
      if (profile?.role !== 'admin') throw new Error("Unauthorized");

      const { offerId, ddd } = body;
      
      const { data: offer } = await userSupabase
        .from('service_offers')
        .select('*, provider:providers(*)')
        .eq('id', offerId)
        .single();
        
      if (!offer || !offer.provider) throw new Error("Offer not available");

      const adapterKey = offer.provider.key.toLowerCase();
      const adapter = ADAPTERS[adapterKey];
      if (!adapter) throw new Error(`Provider adapter not found`);

      try {
        const providerRes = await adapter.buyNumber(offer, ddd);
        // It worked! Cancel immediately so there is no cost.
        await adapter.cancel(providerRes.providerActivationId).catch(console.error);
        
        const dbClient = adminSupabase || userSupabase;
        await dbClient.rpc('upsert_ddd_availability', {
          p_service_id: offer.service_id,
          p_provider_id: offer.provider_id,
          p_ddd: ddd,
          p_status: 'available',
          p_source: 'probe'
        });
        
        return res.status(200).json({ success: true, status: 'available' });
      } catch (err) {
        if (err.message === 'NO_NUMBERS') {
          const dbClient = adminSupabase || userSupabase;
          await dbClient.rpc('upsert_ddd_availability', {
            p_service_id: offer.service_id,
            p_provider_id: offer.provider_id,
            p_ddd: ddd,
            p_status: 'unavailable',
            p_source: 'probe'
          });
          return res.status(200).json({ success: true, status: 'unavailable' });
        }
        throw err;
      }
    }

    if (action === 'checkSms') {
      const { activationId } = body;
      
      if (!checkPollRateLimit(activationId, 2000)) {
        return res.status(200).json({ success: true, status: 'waiting' }); // Ignore too fast polls
      }
      
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

    if (action === 'verifyPayment') {
      const { chargeId } = body;
      if (!chargeId) throw new Error("Missing chargeId");

      const laranjinhaKey = process.env.LARANJINHA_API_KEY || process.env.VITE_LARANJINHA_API_KEY;
      if (!laranjinhaKey) throw new Error("Payment gateway key missing");

      // Rate limit to prevent spamming
      if (!checkRateLimit(`${ip}:verifyPayment`, 10, 60000)) {
        return res.status(429).json({ success: false, error: "Too many requests" });
      }

      const response = await fetch(`https://mqvdjjbkjglaimbnpcer.supabase.co/functions/v1/api-proxy/charges/${chargeId}`, {
        method: 'GET',
        headers: { 'X-API-Key': laranjinhaKey }
      });
      
      if (!response.ok) throw new Error("Failed to verify payment status");
      const result = await response.json();
      const charge = result.charge || result;
      
      if (charge.status === 'paid') {
         // Securely add balance bypassing RLS since we verified server-side
         if (!adminSupabase) throw new Error("Admin Supabase client not initialized (missing keys)");
         
         const { error } = await adminSupabase.rpc('add_balance', { p_transaction_id: chargeId });
         if (error) {
           console.error("verifyPayment add_balance error:", error);
           return res.status(200).json({ success: true, status: 'completed' }); 
         }
         return res.status(200).json({ success: true, status: 'completed' });
      }
      
      return res.status(200).json({ success: true, status: charge.status });
    }

    if (action === 'createPixCharge') {
      const { baseAmount, totalAmount } = body;
      if (!baseAmount || !totalAmount) throw new Error("Missing amount");

      const laranjinhaKey = process.env.LARANJINHA_API_KEY || process.env.VITE_LARANJINHA_API_KEY;
      if (!laranjinhaKey) throw new Error("Payment gateway key missing");

      if (!checkRateLimit(`${ip}:createPixCharge`, 5, 60000)) {
        return res.status(429).json({ success: false, error: "Too many Pix creation requests" });
      }

      // Ensure no more than 3 pending transactions (Double check server-side in addition to the DB trigger)
      const { count } = await userSupabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('type', 'recharge')
        .eq('status', 'pending');
        
      if (count >= 3) {
        throw new Error("Você já possui 3 recargas Pix pendentes. Conclua ou aguarde expirarem antes de gerar novas.");
      }

      const laranjinhaRes = await fetch('https://mqvdjjbkjglaimbnpcer.supabase.co/functions/v1/api-proxy/charges', {
        method: 'POST',
        headers: {
          'X-API-Key': laranjinhaKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount_cents: Math.round(totalAmount * 100),
          description: `Recarga Painel SMS`,
          payer: {
            name: user?.user_metadata?.full_name || "Cliente Painel SMS",
            email: user?.email || "cliente@painelsms.com",
            document: "00000000000" // CPF genérico aceito em teste
          },
          metadata: {
            user_id: user.id
          }
        })
      });

      if (!laranjinhaRes.ok) throw new Error("Falha ao gerar cobrança com o banco (Gateway Error)");
      
      const result = await laranjinhaRes.json();
      const charge = result.charge;

      // Insert pending transaction using adminSupabase to bypass RLS limitations, though userSupabase works too
      const dbClient = adminSupabase || userSupabase;
      const { error } = await dbClient
        .from('transactions')
        .insert({
          id: charge.id, 
          user_id: user.id,
          type: 'recharge',
          amount: baseAmount,
          status: 'pending',
          method: 'pix'
        });

      if (error) {
        console.error("Error inserting Pix charge in DB:", error);
        throw new Error("Erro ao salvar cobrança no banco de dados");
      }

      return res.status(200).json({
        success: true,
        charge: {
          id: charge.id,
          qrCode: charge.qr_code_image,
          pixCode: charge.qr_code,
          expiresAt: new Date(charge.expires_at).getTime(),
          amount: baseAmount,
          totalAmount: totalAmount,
          status: 'pending'
        }
      });
    }

    throw new Error("Unknown action");

  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ success: false, error: error.message || error.toString() });
  }
}
