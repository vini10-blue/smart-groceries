import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import type { Market } from '../../lib/types';

const key = (householdId: string) => ['markets', householdId];

export function useMarkets(householdId: string | null) {
  return useQuery({
    queryKey: key(householdId ?? 'none'),
    enabled: !!householdId,
    queryFn: async (): Promise<Market[]> => {
      const { data, error } = await supabase
        .from('markets')
        .select('*')
        .eq('household_id', householdId!)
        .is('deleted_at', null)
        .order('is_default', { ascending: false })
        .order('name', { ascending: true });
      if (error) throw error;
      return data as Market[];
    },
  });
}

export function useCreateMarket(householdId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, address }: { name: string; address?: string }) => {
      const { error } = await supabase.from('markets').insert({
        household_id: householdId,
        name: name.trim(),
        address: address?.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key(householdId) }),
  });
}

export function useUpdateMarket(householdId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      name,
      address,
    }: {
      id: string;
      name: string;
      address?: string;
    }) => {
      const { error } = await supabase
        .from('markets')
        .update({ name: name.trim(), address: address?.trim() || null })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key(householdId) }),
  });
}

export function useSetDefaultMarket(householdId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // Clear existing default, then set the new one.
      const { error: clearErr } = await supabase
        .from('markets')
        .update({ is_default: false })
        .eq('household_id', householdId)
        .eq('is_default', true);
      if (clearErr) throw clearErr;
      const { error } = await supabase
        .from('markets')
        .update({ is_default: true })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key(householdId) }),
  });
}

export function useDeleteMarket(householdId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('markets')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key(householdId) }),
  });
}
