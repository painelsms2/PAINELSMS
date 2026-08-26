import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, ChevronRight, Send, ArrowLeft } from 'lucide-react';
import { allFaqs } from '../constants/faqs';
import { supportService } from '../services/supportService';
import { useAuth } from '../contexts/AuthContext';
import './FloatingSupport.css';

const FloatingSupport = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState('triage'); // 'triage', 'answer', 'ticket_form', 'chat'
  const [selectedFaq, setSelectedFaq] = useState(null);
  const [ticketMessage, setTicketMessage] = useState('');
  const [activeTicket, setActiveTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [isUnavailable, setIsUnavailable] = useState(false);
  
  // Circuit breaker ref to track continuous failures across mounts
  const checkFailuresRef = useRef(0);

  const messagesEndRef = useRef(null);
  const pollInterval = useRef(null);

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (step === 'chat' || step === 'answer') {
      scrollToBottom();
    }
  }, [messages, step, selectedFaq]);

  // Check for active ticket on mount
  useEffect(() => {
    if (!user?.id || isUnavailable) return;
    
    const checkTicket = async () => {
      try {
        const ticket = await supportService.getActiveUserTicket();
        if (ticket) {
          setActiveTicket(ticket);
          setStep('chat');
          loadMessages(ticket.id);
        }
        checkFailuresRef.current = 0; // reset on success
      } catch (err) {
        console.error("Error checking ticket:", err);
        checkFailuresRef.current += 1;
        if (checkFailuresRef.current >= 3) {
          setIsUnavailable(true);
        }
      }
    };
    checkTicket();
  }, [user?.id, isUnavailable]);

  const loadMessagesRef = useRef();

  useEffect(() => {
    loadMessagesRef.current = loadMessages;
  });

  // Polling for new messages if chat is active AND widget is open
  useEffect(() => {
    if (!activeTicket || !isOpen) return;
    
    pollInterval.current = setInterval(() => {
      if (loadMessagesRef.current) {
        loadMessagesRef.current(activeTicket.id, true);
      }
    }, 15000); // Poll every 15s

    return () => clearInterval(pollInterval.current);
  }, [activeTicket, isOpen]);

  const loadMessages = async (ticketId, isPolling = false) => {
    if (!isPolling) setIsLoading(true);
    try {
      const msgs = await supportService.getMessages(ticketId);
      if (isPolling && msgs.length > messages.length) {
        if (!isOpen) {
          // If a new message arrived and widget is closed, it's likely an admin reply
          const lastMsg = msgs[msgs.length - 1];
          if (lastMsg.sender === 'admin') {
            setHasUnread(true);
          }
        }
        setMessages(msgs);
      } else if (!isPolling) {
        setMessages(msgs);
      }
    } catch (err) {
      console.error("Error loading messages:", err);
    } finally {
      if (!isPolling) setIsLoading(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    setHasUnread(false);
    if (activeTicket) {
      setStep('chat');
      loadMessages(activeTicket.id); // single fetch-on-open
    }
  };

  const handleFaqSelect = (faq) => {
    setSelectedFaq(faq);
    setStep('answer');
  };

  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    if (!ticketMessage.trim()) return;

    setIsSubmitting(true);
    try {
      const subject = selectedFaq ? selectedFaq.question : 'Outro';
      const ticket = await supportService.createTicket(subject, ticketMessage);
      setActiveTicket(ticket);
      await loadMessages(ticket.id);
      setTicketMessage('');
      setStep('chat');
    } catch (err) {
      console.error("Error creating ticket:", err);
      alert("Ocorreu um erro ao enviar sua mensagem. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!ticketMessage.trim() || !activeTicket) return;

    const msg = ticketMessage;
    setTicketMessage(''); // Optimistic clear

    try {
      await supportService.sendMessage(activeTicket.id, msg);
      await loadMessages(activeTicket.id);
    } catch (err) {
      console.error("Error sending message:", err);
      setTicketMessage(msg); // Revert on error
    }
  };

  return (
    <>
      <button 
        className={`floating-support-btn ${isOpen ? 'hidden' : ''} ${isUnavailable ? 'unavailable' : ''}`}
        onClick={handleOpen}
        disabled={isUnavailable}
        title={isUnavailable ? "Suporte temporariamente indisponível" : "Ajuda e Suporte"}
      >
        <MessageCircle size={24} />
        {hasUnread && !isUnavailable && <span className="unread-badge"></span>}
      </button>

      <div className={`support-widget ${isOpen ? 'open' : ''}`}>
        <div className="support-header">
          <div className="support-header-info">
            <MessageCircle size={20} />
            <span>Suporte SMSfacil</span>
          </div>
          <button className="close-btn" onClick={() => setIsOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="support-body">
          {/* STEP 1: TRIAGE */}
          {step === 'triage' && (
            <div className="triage-step fade-in">
              <p className="support-greeting">Olá, {user?.name?.split(' ')[0] || 'Usuário'}! Como podemos ajudar hoje?</p>
              <div className="faq-options">
                {allFaqs.slice(0, 5).map((faq, i) => (
                  <button key={i} className="faq-option-btn" onClick={() => handleFaqSelect(faq)}>
                    {faq.question}
                    <ChevronRight size={16} />
                  </button>
                ))}
                <button className="faq-option-btn other" onClick={() => setStep('ticket_form')}>
                  Outro assunto...
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: ANSWER & RESOLUTION CHECK */}
          {step === 'answer' && selectedFaq && (
            <div className="answer-step fade-in">
              <button className="back-btn" onClick={() => setStep('triage')}>
                <ArrowLeft size={16} /> Voltar
              </button>
              
              <div className="chat-message admin-msg">
                <p><strong>{selectedFaq.question}</strong></p>
                <p>{selectedFaq.answer}</p>
              </div>

              <div className="resolution-check">
                <p>Isso resolveu sua dúvida?</p>
                <div className="res-buttons">
                  <button className="btn btn-outline" onClick={() => {
                    alert("Que bom! Qualquer coisa, estamos por aqui.");
                    setStep('triage');
                    setIsOpen(false);
                  }}>Sim</button>
                  <button className="btn btn-primary" onClick={() => setStep('ticket_form')}>Não, falar com suporte</button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: TICKET FORM */}
          {step === 'ticket_form' && (
            <div className="ticket-form-step fade-in">
              <button className="back-btn" onClick={() => setStep('triage')}>
                <ArrowLeft size={16} /> Voltar
              </button>
              <p className="support-greeting">Descreva melhor o que você precisa. Nossa equipe vai te responder por aqui mesmo.</p>
              
              <form onSubmit={handleSubmitTicket} className="ticket-form">
                <textarea
                  placeholder="Digite sua mensagem..."
                  value={ticketMessage}
                  onChange={(e) => setTicketMessage(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Enviando...' : 'Enviar Mensagem'}
                </button>
              </form>
            </div>
          )}

          {/* ONGOING TICKET CHAT */}
          {step === 'chat' && (
            <div className="chat-step fade-in">
              {activeTicket?.status === 'closed' && (
                <div className="ticket-closed-banner">
                  Este ticket foi encerrado.
                  <button className="btn-text" onClick={() => {
                    setActiveTicket(null);
                    setStep('triage');
                  }}>Nova dúvida</button>
                </div>
              )}
              
              <div className="chat-messages">
                <div className="chat-message admin-msg">
                  <p>Ticket aberto! Nossa equipe responderá em breve.</p>
                  <span className="msg-time">Sistema</span>
                </div>
                
                {isLoading ? (
                  <div className="chat-message admin-msg skeleton-msg">
                    <div className="skeleton-line" style={{ width: '80%' }}></div>
                    <div className="skeleton-line" style={{ width: '60%' }}></div>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className={`chat-message ${msg.sender === 'user' ? 'user-msg' : 'admin-msg'}`}>
                      <p>{msg.message}</p>
                      <span className="msg-time">
                        {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {activeTicket?.status !== 'closed' && (
                <form onSubmit={handleSendMessage} className="chat-input-area">
                  <input
                    type="text"
                    placeholder="Digite sua mensagem..."
                    value={ticketMessage}
                    onChange={(e) => setTicketMessage(e.target.value)}
                    required
                  />
                  <button type="submit" className="send-btn" disabled={!ticketMessage.trim()}>
                    <Send size={18} />
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default FloatingSupport;
