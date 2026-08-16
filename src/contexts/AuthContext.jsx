import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // for initial load session check

  useEffect(() => {
    // Check session on mount
    const checkSession = async () => {
      try {
        const session = await authService.getSession();
        if (session) {
          setUser(session.user);
        }
      } catch (err) {
        console.error("Failed to load session", err);
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();

    // Listen to Auth changes globally
    const { data: authListener } = authService.onAuthStateChange((session) => {
      setUser(session ? session.user : null);
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    const session = await authService.login(email, password);
    setUser(session.user);
    return session.user;
  };

  const register = async (name, email, password) => {
    const session = await authService.register(name, email, password);
    setUser(session.user);
    return session.user;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const updateBalance = (newBalance) => {
    if (!user) return;
    const updatedUser = { ...user, balance: newBalance };
    setUser(updatedUser);
    authService.updateSessionUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateBalance
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
