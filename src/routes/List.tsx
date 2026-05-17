import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthProvider';
import { useCategories } from '../features/categories/useCategories';
import { useMarkets } from '../features/markets/useMarkets';
import { useMarketLayout } from '../features/marketLayout/useMarketLayout';
import {
  useItems,
  useRealtimeItems,
  useToggleItem,
  useDeleteItem,
} from '../features/items/useItems';
import type { Item } from '../lib/types';

const SELECTED_MARKET_KEY = 'sg-selected-market';

export default function List() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { householdId } = useAuth();

  const { data: markets } = useMarkets(householdId);
  const { data: categories } = useCategories(householdId);
  const { data: items } = useItems(householdId);
  useRealtimeItems(householdId);
  const toggle = useToggleItem(householdId ?? '');
  const del = useDeleteItem(householdId ?? '');

  const [marketId, setMarketId] = useState<string | null>(
    () => localStorage.getItem(SELECTED_MARKET_KEY)
  );

  // Default to the household's default market if none selected.
  useEffect(() => {
    if (!marketId && markets && markets.length > 0) {
      const def = markets.find((m) => m.is_default) ?? markets[0];
      setMarketId(def.id);
    }
  }, [markets, marketId]);

  useEffect(() => {
    if (marketId) localStorage.setItem(SELECTED_MARKET_KEY, marketId);
  }, [marketId]);

  const { data: layout } = useMarketLayout(marketId);

  // Category display order for the selected market.
  const categoryOrder = useMemo(() => {
    if (!categories) return [];
    const byId = new Map(categories.map((c) => [c.id, c]));
    const saved = (layout ?? [])
      .map((l) => l.category_id)
      .filter((cid) => byId.has(cid));
    const rest = categories
      .filter((c) => !saved.includes(c.id))
      .sort(
        (a, b) =>
          (a.default_position ?? 999) - (b.default_position ?? 999) ||
          a.name.localeCompare(b.name)
      )
      .map((c) => c.id);
    return [...saved, ...rest];
  }, [categories, layout]);

  // Group items into category buckets, in market order, "Other" last.
  const groups = useMemo(() => {
    const catName = new Map((categories ?? []).map((c) => [c.id, c.name]));
    const buckets = new Map<string, Item[]>();
    for (const it of items ?? []) {
      const k = it.category_id ?? '__none__';
      if (!buckets.has(k)) buckets.set(k, []);
      buckets.get(k)!.push(it);
    }
    const ordered: { id: string; name: string; items: Item[] }[] = [];
    for (const cid of categoryOrder) {
      const arr = buckets.get(cid);
      if (arr && arr.length) {
        ordered.push({ id: cid, name: catName.get(cid) ?? cid, items: sortItems(arr) });
      }
    }
    const none = buckets.get('__none__');
    if (none && none.length) {
      ordered.push({ id: '__none__', name: t('addItem.uncategorized'), items: sortItems(none) });
    }
    return ordered;
  }, [items, categories, categoryOrder, t]);

  const totalPending = (items ?? []).filter((i) => i.status === 'pending').length;

  return (
    <div className="page">
      <header className="page-header">
        <h2>{t('list.title')}</h2>
      </header>

      {markets && markets.length > 0 && (
        <select
          className="text-input"
          value={marketId ?? ''}
          onChange={(e) => setMarketId(e.target.value)}
        >
          {markets.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      )}

      {(!items || items.length === 0) && (
        <p className="muted">{t('list.empty')}</p>
      )}

      {groups.map((g) => (
        <section key={g.id}>
          <h3 className="section-title">{g.name}</h3>
          <ul className="row-list">
            {g.items.map((it) => (
              <li
                key={it.id}
                className={`row item-row ${it.status === 'checked' ? 'checked' : ''}`}
                onClick={() => toggle.mutate(it)}
              >
                <span className="check-dot" />
                <div className="row-main">
                  <span className="row-title">
                    {it.quantity ? `${it.quantity} ${it.unit ?? 'Un'} · ` : ''}
                    {it.name}
                  </span>
                  {it.notes && <span className="muted">{it.notes}</span>}
                </div>
                <button
                  className="btn-link danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    del.mutate(it.id);
                  }}
                >
                  {t('common.delete')}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <div className="fab-row">
        <button className="btn-primary" onClick={() => navigate('/item')}>
          + {t('list.addItem')}
        </button>
        <button
          className="btn-secondary"
          onClick={() => navigate('/done-shopping')}
          disabled={totalPending === (items?.length ?? 0) && (items?.length ?? 0) > 0}
        >
          {t('list.doneShopping')}
        </button>
      </div>
    </div>
  );
}

// Pending first, checked sink to the bottom of their category.
function sortItems(arr: Item[]): Item[] {
  return [...arr].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'pending' ? -1 : 1;
    return a.created_at.localeCompare(b.created_at);
  });
}
