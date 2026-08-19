import { supabase } from '../lib/supabase';

export const paymentService = {
  async createPixCharge(baseAmount, totalAmount, userId) {
    const user = (await supabase.auth.getUser()).data.user;

    // 1. Chamar a API da Laranjinha
    const response = await fetch('https://mqvdjjbkjglaimbnpcer.supabase.co/functions/v1/api-proxy/charges', {
      method: 'POST',
      headers: {
        'X-API-Key': import.meta.env.VITE_LARANJINHA_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount_cents: Math.round(totalAmount * 100),
        description: `Recarga Painel SMS`,
        payer: {
          name: user?.user_metadata?.full_name || "Cliente Painel SMS",
          email: user?.email || "cliente@painelsms.com",
          document: "00000000000" // CPF Genérico aceito em teste
        },
        metadata: {
          user_id: userId
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Erro na API Laranjinha:", errText);
      throw new Error("Falha ao gerar cobrança com o banco (Gateway Error)");
    }

    const result = await response.json();
    const charge = result.charge;

    // 2. Inserir a transação 'pending' no Supabase usando o mesmo ID do gateway
    // NOTE: We save `baseAmount` in the database so that when it succeeds, 
    // the user gets exactly `baseAmount` in their balance, effectively paying the fee.
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        id: charge.id, 
        user_id: userId,
        type: 'recharge',
        amount: baseAmount,
        status: 'pending',
        method: 'pix'
      })
      .select()
      .single();

    if (error) {
      console.error("Error inserting Pix charge in DB:", error);
      throw new Error("Erro ao salvar cobrança no banco de dados");
    }

    // 3. Retornar os dados para o frontend desenhar o QR Code
    return {
      id: charge.id,
      qrCode: charge.qr_code_image,
      pixCode: charge.qr_code,
      amount: baseAmount,
      totalAmount: totalAmount,
      status: 'pending',
      expiresAt: new Date(charge.expires_at).getTime()
    };
  },

  async checkPaymentStatus(chargeId) {
    try {
      // Consultar status direto no gateway Laranjinha
      const response = await fetch(`https://mqvdjjbkjglaimbnpcer.supabase.co/functions/v1/api-proxy/charges/${chargeId}`, {
        method: 'GET',
        headers: {
          'X-API-Key': import.meta.env.VITE_LARANJINHA_API_KEY
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        const charge = result.charge || result; // Dependendo do formato do GET
        
        if (charge.status === 'paid') {
          // Quando pago, validamos usando a função atômica (RPC) do Supabase
          const { error } = await supabase.rpc('add_balance', {
            p_transaction_id: chargeId
          });

          if (error) {
             // O erro comum aqui é tentar adicionar de uma transação já concluída, o que é seguro.
             console.error("Erro ao rodar RPC add_balance:", error);
             return 'pending'; 
          }
          return 'completed';
        }
        
        if (charge.status === 'expired' || charge.status === 'failed') {
          await this.updateTransactionStatus(chargeId, charge.status);
          return charge.status;
        }
      }
    } catch (err) {
      console.error("Error polling payment status:", err);
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
