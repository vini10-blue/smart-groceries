import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

export function useFinishTrip(householdId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      marketId: string | null;
      totalAmount: number;
      notes?: string;
    }) => {
      const { data, error } = await supabase.rpc('finish_trip', {
        p_market_id: input.marketId,
        p_total_amount: input.totalAmount,
        p_currency: 'EUR',
        p_notes: input.notes ?? null,
      });
      if (error) throw error;
      return data as string; // trip id
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['items', householdId] });
      qc.invalidateQueries({ queryKey: ['trips', householdId] });
    },
  });
}
