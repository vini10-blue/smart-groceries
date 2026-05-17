import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function DoneShopping() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <div className="page">
      <header className="page-header">
        <h2>{t('doneShopping.title')}</h2>
        <button className="btn-link" onClick={() => navigate(-1)}>
          {t('common.cancel')}
        </button>
      </header>
      {/* TODO build step 12: REQUIRED total amount -> archive trip + trip_items snapshot */}
      <p className="muted">{t('doneShopping.totalAmountRequired')}</p>
    </div>
  );
}
