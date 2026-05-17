import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../auth/AuthProvider';
import { useCategories } from '../features/categories/useCategories';
import { useItems, useCreateItem, useUpdateItem } from '../features/items/useItems';

const schema = z.object({
  name: z.string().min(1, 'Required'),
  quantity: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() !== '' ? Number(v) : null)),
  unit: z.string().optional(),
  category_id: z.string().optional(),
  notes: z.string().optional(),
});
type FormValues = z.input<typeof schema>;

export default function ItemEditor() {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { householdId } = useAuth();
  const hid = householdId ?? '';

  const { data: categories } = useCategories(householdId);
  const { data: items } = useItems(householdId);
  const create = useCreateItem(hid);
  const update = useUpdateItem(hid);
  const editing = id ? items?.find((i) => i.id === id) : undefined;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', quantity: '', unit: 'Un', category_id: '', notes: '' },
  });

  useEffect(() => {
    if (editing) {
      reset({
        name: editing.name,
        quantity: editing.quantity != null ? String(editing.quantity) : '',
        unit: editing.unit ?? 'Un',
        category_id: editing.category_id ?? '',
        notes: editing.notes ?? '',
      });
    }
  }, [editing, reset]);

  const onSubmit = handleSubmit(async (raw) => {
    const v = schema.parse(raw);
    const payload = {
      name: v.name,
      quantity: v.quantity,
      unit: v.unit || 'Un',
      category_id: v.category_id || null,
      notes: v.notes || null,
    };
    if (id && editing) {
      await update.mutateAsync({ id, ...payload });
    } else {
      await create.mutateAsync(payload);
    }
    navigate('/');
  });

  return (
    <div className="page">
      <header className="page-header">
        <h2>{t('addItem.title')}</h2>
        <button className="btn-link" onClick={() => navigate(-1)}>
          {t('common.cancel')}
        </button>
      </header>

      <form className="stack-form" onSubmit={onSubmit}>
        <label className="field">
          <span>{t('addItem.name')}</span>
          <input className="text-input" {...register('name')} autoFocus />
          {errors.name && <span className="error-text">{errors.name.message}</span>}
        </label>

        <div className="field-row">
          <label className="field">
            <span>{t('addItem.quantity')}</span>
            <input
              className="text-input"
              type="number"
              inputMode="decimal"
              step="any"
              {...register('quantity')}
            />
          </label>
          <label className="field">
            <span>{t('addItem.unit')}</span>
            <input
              className="text-input"
              placeholder={t('addItem.unitDefault')}
              {...register('unit')}
            />
          </label>
        </div>

        <label className="field">
          <span>{t('addItem.category')}</span>
          <select className="text-input" {...register('category_id')}>
            <option value="">{t('addItem.uncategorized')}</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>{t('addItem.notes')}</span>
          <input className="text-input" {...register('notes')} />
        </label>

        <button className="btn-primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? t('common.loading') : t('common.save')}
        </button>
      </form>
    </div>
  );
}
