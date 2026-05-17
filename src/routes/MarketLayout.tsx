import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAuth } from '../auth/AuthProvider';
import { useCategories } from '../features/categories/useCategories';
import {
  useMarketLayout,
  useSaveMarketLayout,
} from '../features/marketLayout/useMarketLayout';

function Row({ id, label }: { id: string; label: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });
  return (
    <li
      ref={setNodeRef}
      className="row drag-row"
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
      }}
      {...attributes}
      {...listeners}
    >
      <span className="drag-handle">≡</span>
      <span className="row-title">{label}</span>
    </li>
  );
}

export default function MarketLayout() {
  const { id: marketId } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { householdId } = useAuth();

  const { data: categories } = useCategories(householdId);
  const { data: layout } = useMarketLayout(marketId ?? null);
  const save = useSaveMarketLayout(marketId ?? '');

  const [order, setOrder] = useState<string[]>([]);

  // Build initial order: saved layout first (in order), then any
  // categories without a saved position appended by default_position.
  const computedInitial = useMemo(() => {
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

  useEffect(() => {
    setOrder(computedInitial);
  }, [computedInitial]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } })
  );

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setOrder((prev) => {
      const oldIndex = prev.indexOf(String(active.id));
      const newIndex = prev.indexOf(String(over.id));
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const nameOf = (cid: string) =>
    categories?.find((c) => c.id === cid)?.name ?? cid;

  return (
    <div className="page">
      <header className="page-header">
        <h2>{t('markets.layout')}</h2>
        <button className="btn-link" onClick={() => navigate(-1)}>
          {t('common.back')}
        </button>
      </header>
      <p className="muted">{t('markets.layoutHint')}</p>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          <ul className="row-list">
            {order.map((cid) => (
              <Row key={cid} id={cid} label={nameOf(cid)} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      <button
        className="btn-primary"
        disabled={save.isPending}
        onClick={() =>
          save.mutate(order, { onSuccess: () => navigate(-1) })
        }
      >
        {save.isPending ? t('common.loading') : t('common.save')}
      </button>
    </div>
  );
}
