import React, { useState, useEffect, useRef } from 'react';
import { Bell, CreditCard, MessageSquare, AlertTriangle, Megaphone, CheckCircle2 } from 'lucide-react';
import { notificationService } from '../services/notificationService';
import { useAuth } from '../contexts/AuthContext';
import './NotificationBell.css';

const NotificationBell = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    // Load initial notifications
    const loadNotifications = async () => {
      const data = await notificationService.getNotifications();
      setNotifications(data);
    };

    loadNotifications();

    // Subscribe to real-time notifications
    const subscription = notificationService.subscribeToNotifications(user.id, (newNotification) => {
      setNotifications(prev => [newNotification, ...prev]);
    });

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, [user]);

  useEffect(() => {
    const unread = notifications.filter(n => !n.read).length;
    setUnreadCount(unread);
  }, [notifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    await notificationService.markAsRead(id);
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const handleMarkAllAsRead = async () => {
    await notificationService.markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'payment_completed': return <CreditCard size={18} className="icon-success" />;
      case 'payment_expired': return <CreditCard size={18} className="icon-muted" />;
      case 'payment_failed': return <AlertTriangle size={18} className="icon-danger" />;
      case 'sms_generated': return <MessageSquare size={18} className="icon-primary" />;
      case 'sms_received': return <CheckCircle2 size={18} className="icon-success" />;
      case 'sms_expired': return <AlertTriangle size={18} className="icon-warning" />;
      case 'admin_broadcast': return <Megaphone size={18} className="icon-broadcast" />;
      default: return <Bell size={18} />;
    }
  };

  const getRelativeTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHrs / 24);

    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `há ${diffMins} min`;
    if (diffHrs < 24) return `há ${diffHrs} h`;
    if (diffDays === 1) return 'há 1 dia';
    return `há ${diffDays} dias`;
  };

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      <button 
        className={`bell-trigger ${unreadCount > 0 ? 'has-unread' : ''}`} 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notificações"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="unread-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="dropdown-header">
            <h3>Notificações</h3>
            {unreadCount > 0 && (
              <button className="mark-all-btn" onClick={handleMarkAllAsRead}>
                Marcar todas como lidas
              </button>
            )}
          </div>
          
          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="empty-state">
                <Bell size={24} className="empty-icon" />
                <p>Nenhuma notificação por enquanto.</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`notification-item ${!notification.read ? 'unread' : 'read'}`}
                  onClick={(e) => !notification.read && handleMarkAsRead(notification.id, e)}
                >
                  <div className="notification-icon">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="notification-content">
                    <div className="notification-title">
                      {notification.title}
                      {!notification.read && <span className="unread-dot"></span>}
                    </div>
                    <div className="notification-message">{notification.message}</div>
                    <div className="notification-time">{getRelativeTime(notification.created_at)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
