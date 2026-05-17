import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function ItemEditor() {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <div className="page">
      <header className="page-header">
        <h2>{t('addItem.title')}</h2>
        <button className="btn-link" onClick={() => navigate(-1)}>
          {t('common.cancel')}
        </button>
      </header>
      {/* TODO build step 7: react-hook-form + zod — name, quantity, unit (default "Un"), category, notes */}
      <p className="muted">{id ? `Editing ${id}` : 'New item'}</p>
    </div>
  );
}
