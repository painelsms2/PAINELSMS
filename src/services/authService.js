// mock API delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const USERS_KEY = 'painelsms_mock_users';
const SESSION_KEY = 'painelsms_mock_session';

// Helper to get users from localStorage
const getUsers = () => {
  const users = localStorage.getItem(USERS_KEY);
  return users ? JSON.parse(users) : [];
};

// Helper to save users
const saveUsers = (users) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const authService = {
  async login(email, password) {
    await delay(600); // simulate network delay

    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password); // simple mock validation

    if (!user) {
      throw new Error('E-mail ou senha inválidos');
    }

    const session = {
      token: `mock-token-${Date.now()}`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        balance: !user.balance ? 50.00 : user.balance
      },
      expiresAt: Date.now() + 1000 * 60 * 60 * 24 // 24 hours
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  },

  async register(name, email, password) {
    await delay(800); // simulate network delay

    const users = getUsers();
    const userExists = users.some(u => u.email === email);

    if (userExists) {
      throw new Error('Este e-mail já está em uso');
    }

    const newUser = {
      id: `usr_${Date.now()}`,
      name,
      email,
      password, // storing plaintext just for the mock, NEVER do this in prod
      balance: 50.00 // initial mock balance
    };

    saveUsers([...users, newUser]);

    // auto login after register
    return await this.login(email, password);
  },

  async logout() {
    await delay(300);
    localStorage.removeItem(SESSION_KEY);
  },

  getSession() {
    const sessionStr = localStorage.getItem(SESSION_KEY);
    if (!sessionStr) return null;

    const session = JSON.parse(sessionStr);
    
    // Check if expired
    if (session.expiresAt < Date.now()) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    
    if (session.user && !session.user.balance) {
      session.user.balance = 50.00;
    }

    return session;
  },

  updateSessionUser(updatedUser) {
    const sessionStr = localStorage.getItem(SESSION_KEY);
    if (!sessionStr) return;

    const session = JSON.parse(sessionStr);
    session.user = updatedUser;
    
    // Also update in the mock DB so it persists across logins
    const users = getUsers();
    const userIndex = users.findIndex(u => u.id === updatedUser.id);
    if (userIndex !== -1) {
      users[userIndex] = { ...users[userIndex], ...updatedUser };
      saveUsers(users);
    }

    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  },

  async changePassword(userId, currentPassword, newPassword) {
    await delay(1000); // Simulate network delay

    const users = getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      throw new Error("Usuário não encontrado.");
    }

    // Verify current password
    if (users[userIndex].password !== currentPassword) {
      throw new Error("Senha atual incorreta");
    }

    // Update password
    users[userIndex].password = newPassword;
    saveUsers(users);
    
    return true;
  }
};
