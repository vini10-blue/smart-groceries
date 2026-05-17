import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthProvider';
import {
  useCategories,
  useCreateCategory,
  useRenameCategory,
  useDeleteCategory,
} from '../features/categories/useCategories';

export default function Categories() {
  const { t } = useTranslation();
  const { householdId } = useAuth();
  const hid = householdId ?? '';
  const { data: categories, isLoading, error } = useCategories(householdId);
  const create = useCreateCategory(hid);
  const rename = useRenameCategory(hid);
  const remove = useDeleteCategory(hid);
  const [name, setName] = useState('');

  const onAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const v = name.trim();
    if (!v) return;
    create.mutate(v, { onSuccess: () => setName('') });
  };

  return (
    <div className="page">
      <header className="page-header">
        <h2>{t('categories.title')}</h2>
      </header>

      <form className="inline-form" onSubmit={onAdd}>
        <input
          className="text-input"
          placeholder={t('categories.name')}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button className="btn-primary" type="submit" disabled={create.isPending}>
          {t('common.add')}
        </button>
      </form>

      {isLoading && <div className="spinner" />}
      {error && <p className="error-text">{(error as Error).message}</p>}

      <ul className="row-list">
        {categories?.map((c) => (
          <li key={c.id} className="row">
            <span className="row-title">{c.name}</span>
            <span className="row-actions">
              <button
                className="btn-link"
                onClick={() => {
                  const next = window.prompt(t('categories.name'), c.name);
                  if (next && next.trim() && next.trim() !== c.name) {
                    rename.mutate({ id: c.id, name: next });
                  }
                }}
              >
                {t('common.edit')}
              </button>
              <button
                className="btn-link danger"
                onClick={() => {
                  if (window.confirm(`${t('common.delete')} "${c.name}"?`)) {
                    remove.mutate(c.id);
                  }
                }}
              >
                {t('common.delete')}
              </button>
            </span>
          </li>
        ))}
        {categories?.length === 0 && <p className="muted">No categories yet.</p>}
      </ul>
    </div>
  );
}
