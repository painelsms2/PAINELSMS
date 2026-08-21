import { supabase } from '../lib/supabase';

export const historyService = {
  // We don't need addActivation or updateActivation from the client anymore 
  // because the backend (numberProviderService RPCs) handles inserting/updating activations.
  // We keep them as no-ops or simple fallbacks just in case the UI blindly calls them.
  addActivation(userId, activation) {
    // No-op: DB handles it
  },

  updateActivation(activationId, updates) {
    // No-op: DB handles it
  },

  async getUserHistory(userId) {
    const { data, error } = await supabase
      .from('activations')
      .select(`
        *,
        service:services(id, name, icon_file)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching history:", error);
      return [];
    }

    return data.map(act => ({
      activationId: act.id,
      userId: act.user_id,
      service: {
        id: act.service.id,
        name: act.service.name,
        icon: act.service.icon_file,
        price: act.price // use historical price
      },
      phoneNumber: act.phone_number,
      status: act.status,
      code: act.sms_code,
      createdAt: new Date(act.created_at).getTime(),
      completedAt: act.completed_at ? new Date(act.completed_at).getTime() : null,
    }));
  }
};
