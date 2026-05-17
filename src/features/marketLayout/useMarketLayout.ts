import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import type { MarketCategoryOrder } from '../../lib/types';

const key = (marketId: string) => ['market-layout', marketId];

export function useMarketLayout(marketId: string | null) {
  return useQuery({
    queryKey: key(marketId ?? 'none'),
    enabled: !!marketId,
    queryFn: async (): Promise<MarketCategoryOrder[]> => {
      const { data, error } = await supabase
        .from('market_category_orders')
        .select('market_id, category_id, position')
        .eq('market_id', marketId!)
        .order('position', { ascending: true });
      if (error) throw error;
      return data as MarketCategoryOrder[];
    },
  });
}

/** Replace the full ordering for a market with the given category id list. */
export function useSaveMarketLayout(marketId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orderedCategoryIds: string[]) => {
      const { error: delErr } = await supabase
        .from('market_category_orders')
        .delete()
        .eq('market_id', marketId);
      if (delErr) throw delErr;
      if (orderedCategoryIds.length === 0) return;
      const rows = orderedCategoryIds.map((category_id, position) => ({
        market_id: marketId,
        category_id,
        position,
      }));
      const { error } = await supabase.from('market_category_orders').insert(rows);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key(marketId) }),
  });
}
