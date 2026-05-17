import { useTranslation } from 'react-i18next';

export default function Categories() {
  const { t } = useTranslation();
  return (
    <div className="page">
      <header className="page-header">
        <h2>{t('categories.title')}</h2>
      </header>
      {/* TODO build step 4: list/add/edit/soft-delete categories (seeded with 11 defaults) */}
      <p className="muted">Default categories load from Supabase.</p>
    </div>
  );
}
