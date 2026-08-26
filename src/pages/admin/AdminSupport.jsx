import React, { useState, useEffect, useRef } from 'react';
import { supportService } from '../../services/supportService';
import { MessageCircle, CheckCircle, Clock, Search, Send, User } from 'lucide-react';
import './AdminSupport.css';

const AdminSupport = () => {
  const [tickets, setTickets] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'open', 'answered', 'closed'
  const [activeTicket, setActiveTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyMessage, setReplyMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Broadcast State
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const messagesEndRef = useRef(null);

  const loadTickets = async () => {
    setIsLoading(true);
    try {
      const data = await supportService.getAdminTickets(statusFilter);
      setTickets(data);
    } catch (err) {
      console.error("Error loading admin tickets:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [statusFilter]);

  const handleSelectTicket = async (ticket) => {
    setActiveTicket(ticket);
    try {
      const msgs = await supportService.getMessages(ticket.id);
      setMessages(msgs);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err) {
      console.error("Error loading ticket messages:", err);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim() || !activeTicket) return;

    try {
      await supportService.sendMessage(activeTicket.id, replyMessage, 'admin');
      setReplyMessage('');
      
      // Reload messages
      const msgs = await supportService.getMessages(activeTicket.id);
      setMessages(msgs);
      
      // Update ticket locally
      setActiveTicket(prev => ({ ...prev, status: 'answered' }));
      
      // Refresh list to update status badge
      loadTickets();
    } catch (err) {
      console.error("Error sending reply:", err);
      alert("Erro ao enviar resposta.");
    }
  };

  const handleCloseTicket = async () => {
    if (!activeTicket) return;
    try {
      await supportService.updateTicketStatus(activeTicket.id, 'closed');
      setActiveTicket(prev => ({ ...prev, status: 'closed' }));
      loadTickets();
    } catch (err) {
      console.error("Error closing ticket:", err);
      alert("Erro ao fechar ticket.");
    }
  };

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;
    
    setIsBroadcasting(true);
    try {
      const { notificationService } = await import('../../services/notificationService');
      await notificationService.broadcastNotification(broadcastTitle, broadcastMessage);
      alert('Transmissão enviada para todos os usuários com sucesso!');
      setIsBroadcastModalOpen(false);
      setBroadcastTitle('');
      setBroadcastMessage('');
    } catch (err) {
      console.error("Error sending broadcast:", err);
      alert('Erro ao enviar transmissão.');
    } finally {
      setIsBroadcasting(false);
    }
  };

  return (
    <div className="admin-support-page fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <MessageCircle size={28} className="text-primary" />
            Inbox de Suporte
          </h1>
          <p className="text-muted">Gerencie as dúvidas e tickets de suporte abertos pelos usuários.</p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={() => setIsBroadcastModalOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Send size={16} /> Enviar Transmissão (Todos)
        </button>
      </div>

      <div className="support-split-view">
        {/* LEFT PANE: TICKET LIST */}
        <div className="ticket-list-pane card">
          <div className="pane-header">
            <div className="filter-tabs">
              <button className={statusFilter === 'all' ? 'active' : ''} onClick={() => setStatusFilter('all')}>Todos</button>
              <button className={statusFilter === 'open' ? 'active' : ''} onClick={() => setStatusFilter('open')}>Abertos</button>
              <button className={statusFilter === 'answered' ? 'active' : ''} onClick={() => setStatusFilter('answered')}>Respondidos</button>
              <button className={statusFilter === 'closed' ? 'active' : ''} onClick={() => setStatusFilter('closed')}>Fechados</button>
            </div>
          </div>
          
          <div className="ticket-list">
            {isLoading ? (
              <p className="p-4 text-center text-muted">Carregando tickets...</p>
            ) : tickets.length === 0 ? (
              <p className="p-4 text-center text-muted">Nenhum ticket encontrado.</p>
            ) : (
              tickets.map(ticket => (
                <div 
                  key={ticket.id} 
                  className={`ticket-item ${activeTicket?.id === ticket.id ? 'active' : ''}`}
                  onClick={() => handleSelectTicket(ticket)}
                >
                  <div className="ticket-item-header">
                    <strong>{ticket.user?.full_name || ticket.user?.email || 'Usuário Desconhecido'}</strong>
                    <span className={`status-badge ${ticket.status}`}>
                      {ticket.status === 'open' ? 'Aberto' : ticket.status === 'answered' ? 'Respondido' : 'Fechado'}
                    </span>
                  </div>
                  <div className="ticket-subject" title={ticket.subject}>{ticket.subject}</div>
                  <div className="ticket-date">
                    <Clock size={12} />
                    {new Date(ticket.updated_at).toLocaleString('pt-BR')}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT PANE: THREAD VIEW */}
        <div className="ticket-thread-pane card">
          {activeTicket ? (
            <div className="thread-container">
              <div className="thread-header">
                <div>
                  <h3>{activeTicket.subject}</h3>
                  <p className="text-sm text-muted">
                    Usuário: {activeTicket.user?.full_name || activeTicket.user?.email}
                  </p>
                </div>
                {activeTicket.status !== 'closed' && (
                  <button className="btn btn-outline" onClick={handleCloseTicket}>
                    <CheckCircle size={16} /> Fechar Ticket
                  </button>
                )}
              </div>

              <div className="thread-messages">
                {messages.map(msg => (
                  <div key={msg.id} className={`thread-msg ${msg.sender === 'admin' ? 'admin' : 'user'}`}>
                    <div className="msg-bubble">
                      <p>{msg.message}</p>
                    </div>
                    <span className="msg-meta">
                      {msg.sender === 'admin' ? 'Suporte' : 'Usuário'} • {new Date(msg.created_at).toLocaleString('pt-BR')}
                    </span>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {activeTicket.status !== 'closed' ? (
                <form className="thread-input" onSubmit={handleReply}>
                  <textarea 
                    placeholder="Digite sua resposta..."
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    required
                  />
                  <button type="submit" className="btn btn-primary">
                    <Send size={16} /> Responder
                  </button>
                </form>
              ) : (
                <div className="p-4 text-center text-muted bg-gray-50 border-t">
                  Este ticket foi encerrado. O usuário não pode mais responder aqui.
                </div>
              )}
            </div>
          ) : (
            <div className="empty-state">
              <MessageCircle size={48} className="text-muted" />
              <h3>Selecione um ticket</h3>
              <p className="text-muted">Clique em um ticket na lista ao lado para ver a conversa.</p>
            </div>
          )}
        </div>
      </div>

      {/* Broadcast Modal */}
      {isBroadcastModalOpen && (
        <div className="modal-overlay" onClick={() => setIsBroadcastModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>Nova Transmissão</h2>
              <button className="btn-icon" onClick={() => setIsBroadcastModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <p className="text-muted mb-4">Esta mensagem será enviada como notificação para <strong>todos</strong> os usuários da plataforma.</p>
              
              <form onSubmit={handleSendBroadcast}>
                <div className="form-group">
                  <label>Título da Notificação</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="Ex: Atualização do Sistema"
                    value={broadcastTitle}
                    onChange={e => setBroadcastTitle(e.target.value)}
                    required
                  />
                </div>
                
                <div className="form-group mt-4">
                  <label>Mensagem</label>
                  <textarea 
                    className="input-field" 
                    placeholder="Descreva o comunicado..."
                    rows={4}
                    value={broadcastMessage}
                    onChange={e => setBroadcastMessage(e.target.value)}
                    required
                  />
                </div>
                
                <div className="modal-actions mt-6" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setIsBroadcastModalOpen(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={isBroadcasting}>
                    {isBroadcasting ? 'Enviando...' : 'Enviar para Todos'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSupport;
