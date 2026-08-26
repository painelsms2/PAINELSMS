import { supabase } from '../lib/supabase'

export const authService = {
  async login(email, password, captchaToken = null) {
    const options = {};
    if (captchaToken) options.captchaToken = captchaToken;
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
      options
    });

    if (error) {
      throw new Error(error.message === 'Invalid login credentials' 
        ? 'E-mail ou senha inválidos' 
        : error.message);
    }

    return this.getSession();
  },

  async register(name, email, password, captchaToken = null) {
    const options = {
      data: {
        full_name: name,
      }
    };
    if (captchaToken) options.captchaToken = captchaToken;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options
    });

    if (error) {
      throw new Error(error.message === 'User already registered'
        ? 'Este e-mail já está em uso'
        : error.message);
    }

    // Auto login on successful register if email confirmations are disabled
    // If confirmations are enabled, the user might not have a session yet.
    if (data.session) {
      return this.getSession();
    } else {
      // Se não retornou sessão, tentar login
      return this.login(email, password);
    }
  },

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) return null;

    // Fetch the profile for balance and role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('balance, role, full_name, email, status')
      .eq('id', session.user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return null;
    }

    if (profile.status === 'suspended') {
      await supabase.auth.signOut();
      throw new Error("Sua conta foi suspensa. Entre em contato com o suporte.");
    }

    return {
      token: session.access_token,
      user: {
        id: session.user.id,
        name: profile.full_name,
        email: profile.email || session.user.email,
        balance: profile.balance,
        role: profile.role,
        status: profile.status
      },
      expiresAt: session.expires_at ? session.expires_at * 1000 : null
    };
  },

  // Listen to auth changes
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        const sessionData = await this.getSession();
        callback(sessionData);
      } else if (event === 'SIGNED_OUT') {
        callback(null);
      }
    });
  },

  async updateSessionUser(updatedUser) {
    // This method might not be needed as much since balance is fetched from DB
    // But we keep it to not break the signature if used for local optimistic updates
    return true; 
  },

  async changePassword(userId, currentPassword, newPassword) {
    // Supabase updateUser only requires the new password. Re-authentication of current
    // password requires either calling signInWithPassword first or a backend function.
    // Let's do a quick re-auth to verify current password safely
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) throw new Error("Usuário não encontrado.");

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (signInError) {
      throw new Error("Senha atual incorreta");
    }

    // Now update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (updateError) {
      throw new Error(updateError.message);
    }
    
    return true;
  }
};
