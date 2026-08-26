import { supabase } from '../lib/supabase';

export const supportService = {
  // Get active ticket for the current user
  async getActiveUserTicket() {
    // Auto-close tickets older than 24h
    await supabase.rpc('auto_close_expired_tickets');

    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .neq('status', 'closed')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = zero rows
    return data || null;
  },

  // Create a new ticket and first message
  async createTicket(subject, initialMessage) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .insert({
        user_id: user.id,
        subject: subject,
        status: 'open'
      })
      .select()
      .single();

    if (ticketError) throw ticketError;

    const { error: msgError } = await supabase
      .from('support_messages')
      .insert({
        ticket_id: ticket.id,
        sender: 'user',
        message: initialMessage
      });

    if (msgError) throw msgError;

    return ticket;
  },

  // Send a message (user or admin)
  async sendMessage(ticketId, message, sender = 'user') {
    const { data, error } = await supabase
      .from('support_messages')
      .insert({
        ticket_id: ticketId,
        sender,
        message
      })
      .select()
      .single();

    if (error) throw error;

    // Update ticket updated_at and status
    const newStatus = sender === 'admin' ? 'answered' : 'open';
    await supabase
      .from('support_tickets')
      .update({ 
        updated_at: new Date().toISOString(),
        status: newStatus 
      })
      .eq('id', ticketId);

    return data;
  },

  // Get messages for a ticket
  async getMessages(ticketId) {
    const { data, error } = await supabase
      .from('support_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  },

  // --- ADMIN FUNCTIONS ---

  // Get all tickets for admin
  async getAdminTickets(statusFilter = 'all') {
    let query = supabase
      .from('support_tickets')
      .select(`
        *,
        user:profiles!user_id(full_name, email)
      `)
      .order('updated_at', { ascending: false });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Update ticket status (admin)
  async updateTicketStatus(ticketId, status) {
    const { error } = await supabase
      .from('support_tickets')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', ticketId);

    if (error) throw error;
  }
};
