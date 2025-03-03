import { SupabaseClient } from '@supabase/supabase-js';

export class AuthService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  async register(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    return data.user;
  }

  async login(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    return data.session;
  }

  async validateSession(token: string) {
    const { data: { user }, error } = await this.supabase.auth.getUser(token);

    if (error) {
      return false;
    }

    return !!user;
  }

  async refreshToken() {
    const { data, error } = await this.supabase.auth.refreshSession();

    if (error) {
      throw error;
    }

    return data.session;
  }
}