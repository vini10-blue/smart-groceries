import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type MembershipStatus = 'pending' | 'approved' | 'none';
export type MemberRole = 'owner' | 'member' | null;

type AuthState = {
  session: Session | null;
  loading: boolean;
  membershipLoading: boolean;
  status: MembershipStatus;
  role: MemberRole;
  householdId: string | null;
  refreshMembership: () => Promise<void>;
  signInWithEmail: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [membershipLoading, setMembershipLoading] = useState(false);
  const [status, setStatus] = useState<MembershipStatus>('none');
  const [role, setRole] = useState<MemberRole>(null);
  const [householdId, setHouseholdId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const refreshMembership = useCallback(async () => {
    const uid = (await supabase.auth.getUser()).data.user?.id;
    if (!uid) {
      setStatus('none');
      setRole(null);
      setHouseholdId(null);
      return;
    }
    setMembershipLoading(true);
    const { data, error } = await supabase
      .from('household_members')
      .select('household_id, role, status')
      .eq('user_id', uid)
      .limit(1);
    setMembershipLoading(false);
    if (error || !data || data.length === 0) {
      setStatus('none');
      setRole(null);
      setHouseholdId(null);
      return;
    }
    const row = data[0] as { household_id: string; role: MemberRole; status: string };
    setHouseholdId(row.household_id);
    setRole(row.role);
    setStatus(row.status === 'approved' ? 'approved' : 'pending');
  }, []);

  useEffect(() => {
    if (session?.user) {
      void refreshMembership();
    } else {
      setStatus('none');
      setRole(null);
      setHouseholdId(null);
    }
  }, [session?.user?.id, refreshMembership]);

  const signInWithEmail = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        membershipLoading,
        status,
        role,
        householdId,
        refreshMembership,
        signInWithEmail,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
