import { supabase } from '../lib/supabase';

export const paymentService = {
  async createPixCharge(baseAmount, totalAmount, userId) {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
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
      body: JSON.stringify({ 
        action: 'createPixCharge', 
        baseAmount, 
        totalAmount 
      })
    });
    
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || "Falha ao gerar cobrança");
    }

    // 3. Retornar os dados para o frontend desenhar o QR Code
    return data.charge;
  },

  async checkPaymentStatus(chargeId) {
    try {
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      
      if (!token) return 'pending';

      const endpoint = isLocalhost ? 'http://localhost:3000/api/provider' : '/api/provider';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'verifyPayment', chargeId })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          if (data.status === 'expired' || data.status === 'failed') {
            await this.updateTransactionStatus(chargeId, data.status);
          }
          return data.status; // 'completed', 'pending', 'expired', etc.
        }
      }
    } catch (err) {
      console.error("Error polling payment status via secure backend:", err);
    }

    // Fallback: se o gateway não responder, consulta o banco local
    const { data } = await supabase.from('transactions').select('status').eq('id', chargeId).single();
    if (data && (data.status === 'completed' || data.status === 'expired')) {
      return data.status;
    }

    return 'pending';
  },

  async updateTransactionStatus(chargeId, status) {
    const { error } = await supabase
      .from('transactions')
      .update({ status })
      .eq('id', chargeId);
    
    if (error) console.error("Error updating transaction status:", error);
  },

  async getTransactions(userId) {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error getting transactions:", error);
      return [];
    }
    
    return data.map(t => ({
      id: t.id,
      userId: t.user_id,
      amount: t.amount,
      type: t.type === 'recharge' || t.type === 'admin_credit' ? 'deposit' : 'withdrawal',
      description: t.type === 'recharge' ? 'Recarga via Pix' : 
                   t.type === 'activation_charge' ? 'Ativação de serviço' : 
                   t.type === 'admin_credit' ? 'Crédito Administrativo' : t.type,
      status: t.status === 'paid' ? 'completed' : t.status, // normaliza o "paid"
      timestamp: new Date(t.created_at).getTime(),
      completedAt: t.completed_at ? new Date(t.completed_at).getTime() : null
    }));
  }
};
