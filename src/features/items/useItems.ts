import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import type { Item } from '../../lib/types';

const key = (householdId: string) => ['items', householdId];

export function useItems(householdId: string | null) {
  return useQuery({
    queryKey: key(householdId ?? 'none'),
    enabled: !!householdId,
    queryFn: async (): Promise<Item[]> => {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('household_id', householdId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as Item[];
    },
  });
}

/** Live-refresh the list when any household member changes items. */
export function useRealtimeItems(householdId: string | null) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!householdId) return;
    const channel = supabase
      .channel(`items-${householdId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'items',
          filter: `household_id=eq.${householdId}`,
        },
        () => qc.invalidateQueries({ queryKey: key(householdId) })
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [householdId, qc]);
}

export function useCreateItem(householdId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      name: string;
      quantity: number | null;
      unit: string | null;
      category_id: string | null;
      notes: string | null;
    }) => {
      const uid = (await supabase.auth.getUser()).data.user?.id ?? null;
      const { error } = await supabase.from('items').insert({
        household_id: householdId,
        name: input.name.trim(),
        quantity: input.quantity,
        unit: input.unit?.trim() || 'Un',
        category_id: input.category_id,
        notes: input.notes?.trim() || null,
        status: 'pending',
        created_by: uid,
        added_via: 'text',
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key(householdId) }),
  });
}

export function useUpdateItem(householdId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      name: string;
      quantity: number | null;
      unit: string | null;
      category_id: string | null;
      notes: string | null;
    }) => {
      const { error } = await supabase
        .from('items')
        .update({
          name: input.name.trim(),
          quantity: input.quantity,
          unit: input.unit?.trim() || 'Un',
          category_id: input.category_id,
          notes: input.notes?.trim() || null,
        })
        .eq('id', input.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key(householdId) }),
  });
}

export function useToggleItem(householdId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: Item) => {
      const next = item.status === 'pending' ? 'checked' : 'pending';
      const uid = (await supabase.auth.getUser()).data.user?.id ?? null;
      const { error } = await supabase
        .from('items')
        .update({
          status: next,
          checked_at: next === 'checked' ? new Date().toISOString() : null,
          checked_by: next === 'checked' ? uid : null,
        })
        .eq('id', item.id);
      if (error) throw error;
    },
    // Optimistic toggle for instant feedback (works offline too).
    onMutate: async (item) => {
      await qc.cancelQueries({ queryKey: key(householdId) });
      const prev = qc.getQueryData<Item[]>(key(householdId));
      qc.setQueryData<Item[]>(key(householdId), (old) =>
        (old ?? []).map((i) =>
          i.id === item.id
            ? { ...i, status: i.status === 'pending' ? 'checked' : 'pending' }
            : i
        )
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(key(householdId), ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key(householdId) }),
  });
}

export function useDeleteItem(householdId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key(householdId) }),
  });
}
