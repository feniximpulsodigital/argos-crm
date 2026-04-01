import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'atendente';
  agent_tag: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

async function buildUserProfile(supabaseUser: SupabaseUser): Promise<User | null> {
  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, email, agent_tag')
    .eq('id', supabaseUser.id)
    .single();

  // Fetch role
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', supabaseUser.id)
    .single();

  if (!profile) return null;

  return {
    id: supabaseUser.id,
    name: profile.name,
    email: profile.email,
    role: (roleData?.role as 'admin' | 'atendente') ?? 'atendente',
    agent_tag: profile.agent_tag,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadUserProfile = async (supabaseUser: SupabaseUser | null) => {
      if (!mounted) return;

      if (!supabaseUser) {
        setUser(null);
        return;
      }

      try {
        const profile = await buildUserProfile(supabaseUser);
        if (mounted) setUser(profile);
      } catch (e) {
        console.error('Auth profile load error:', e);
        if (mounted) setUser(null);
      }
    };

    // Listen for auth changes (non-blocking: do not await here)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        return;
      }

      if (session?.user) {
        // Don't reload profile if login() already set it
        void loadUserProfile(session.user);
      }
    });

    // Check existing session — await profile before clearing loading
    supabase.auth.getSession()
      .then(async ({ data: { session }, error }) => {
        if (error) {
          console.error('Auth init error:', error);
          if (mounted) setUser(null);
          return;
        }

        if (session?.user) {
          await loadUserProfile(session.user);
        } else {
          if (mounted) setUser(null);
        }
      })
      .catch((e) => {
        console.error('Auth init error:', e);
        if (mounted) setUser(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) return false;
    const profile = await buildUserProfile(data.user);
    setUser(profile);
    return !!profile;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
