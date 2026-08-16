const HISTORY_KEY = 'painelsms_history';

// Helper to get history
const getHistory = () => {
  const historyStr = localStorage.getItem(HISTORY_KEY);
  return historyStr ? JSON.parse(historyStr) : [];
};

const saveHistory = (history) => {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
};

// Seed initial fake data for demonstration if empty
const seedInitialData = (userId) => {
  const history = getHistory();
  if (history.length > 0) return; // already seeded or has data

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  const fakeData = [
    {
      activationId: 'act_mock_1',
      userId,
      service: { id: 'whatsapp', name: 'WhatsApp', price: 2.50, icon: 'MessageCircle' },
      phoneNumber: '55 11 98765-4321',
      status: 'completed',
      code: '821-492',
      createdAt: now - (2 * dayMs), // 2 days ago
      completedAt: now - (2 * dayMs) + 45000,
    },
    {
      activationId: 'act_mock_2',
      userId,
      service: { id: 'instagram', name: 'Instagram', price: 1.80, icon: 'Camera' },
      phoneNumber: '55 21 91234-5678',
      status: 'expired',
      createdAt: now - (5 * dayMs),
    },
    {
      activationId: 'act_mock_3',
      userId,
      service: { id: 'telegram', name: 'Telegram', price: 1.50, icon: 'Send' },
      phoneNumber: '55 31 99887-7665',
      status: 'completed',
      code: '45911',
      createdAt: now - (8 * dayMs), // Old tab
      completedAt: now - (8 * dayMs) + 120000,
    },
    {
      activationId: 'act_mock_4',
      userId,
      service: { id: 'facebook', name: 'Facebook', price: 2.00, icon: 'Facebook' },
      phoneNumber: '55 41 98888-1111',
      status: 'cancelled',
      createdAt: now - (15 * dayMs), // Old tab
    },
    {
      activationId: 'act_mock_5',
      userId,
      service: { id: 'google', name: 'Google', price: 3.50, icon: 'Chrome' },
      phoneNumber: '55 51 97777-2222',
      status: 'completed',
      code: 'G-123456',
      createdAt: now - (1 * dayMs),
      completedAt: now - (1 * dayMs) + 15000,
    },
  ];

  saveHistory(fakeData);
};

export const historyService = {
  addActivation(userId, activation) {
    const history = getHistory();
    const entry = { ...activation, userId };
    history.push(entry);
    saveHistory(history);
  },

  updateActivation(activationId, updates) {
    const history = getHistory();
    const index = history.findIndex(h => h.activationId === activationId);
    if (index !== -1) {
      history[index] = { ...history[index], ...updates };
      saveHistory(history);
    }
  },

  getUserHistory(userId) {
    seedInitialData(userId); // ensure seeded for this user if empty
    const history = getHistory();
    return history
      .filter(h => h.userId === userId)
      .sort((a, b) => (b.createdAt || b.timestamp) - (a.createdAt || a.timestamp));
  }
};
