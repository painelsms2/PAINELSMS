import { supabase } from '../lib/supabase';

export const notificationService = {
  async getNotifications() {
    const session = await supabase.auth.getSession();
    if (!session.data.session) return [];

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
      
    if (error) {
      console.error("Error getting notifications:", error);
      return [];
    }
    return data;
  },

  async markAsRead(notificationId) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);
      
    if (error) console.error("Error marking notification as read:", error);
  },

  async markAllAsRead() {
    const session = await supabase.auth.getSession();
    if (!session.data.session) return;
    
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', session.data.session.user.id)
      .eq('read', false);
      
    if (error) console.error("Error marking all notifications as read:", error);
  },

  subscribeToNotifications(userId, callback) {
    if (!userId) return null;
    
    const subscription = supabase
      .channel(`public:notifications:user_id=eq.${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          callback(payload.new);
        }
      )
      .subscribe();
      
    return subscription;
  },
  
  async broadcastNotification(title, message) {
    const { error } = await supabase.rpc('admin_broadcast_notification', {
      p_title: title,
      p_message: message
    });
    
    if (error) throw error;
  }
};
