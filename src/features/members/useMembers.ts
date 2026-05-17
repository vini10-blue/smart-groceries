import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

export interface Member {
  household_id: string;
  user_id: string;
  role: 'owner' | 'member';
  status: 'pending' | 'approved';
  email: string | null;
  display_name: string | null;
  joined_at: string;
}

const key = (householdId: string) => ['members', householdId];

export function useMembers(householdId: string | null) {
  return useQuery({
    queryKey: key(householdId ?? 'none'),
    enabled: !!householdId,
    queryFn: async (): Promise<Member[]> => {
      const { data, error } = await supabase
        .from('household_members')
        .select('household_id, user_id, role, status, email, display_name, joined_at')
        .eq('household_id', householdId!)
        .order('status', { ascending: true })
        .order('joined_at', { ascending: true });
      if (error) throw error;
      return data as Member[];
    },
  });
}

export function useApproveMember(householdId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('household_members')
        .update({ status: 'approved' })
        .eq('household_id', householdId)
        .eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key(householdId) }),
  });
}

export function useRejectMember(householdId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('household_members')
        .delete()
        .eq('household_id', householdId)
        .eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key(householdId) }),
  });
}
