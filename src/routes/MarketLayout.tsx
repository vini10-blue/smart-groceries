import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function MarketLayout() {
  const { id } = useParams();
  const { t } = useTranslation();
  return (
    <div className="page">
      <header className="page-header">
        <h2>{t('markets.layout')}</h2>
      </header>
      <p className="muted">{t('markets.layoutHint')}</p>
      <p className="muted">Market: {id}</p>
      {/* TODO build step 5: @dnd-kit sortable list of categories -> market_category_orders */}
    </div>
  );
}
