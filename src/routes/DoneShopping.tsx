import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthProvider';
import { useItems } from '../features/items/useItems';
import { useMarkets } from '../features/markets/useMarkets';
import { useFinishTrip } from '../features/trips/useFinishTrip';

const SELECTED_MARKET_KEY = 'sg-selected-market';

export default function DoneShopping() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { householdId } = useAuth();
  const hid = householdId ?? '';

  const { data: items } = useItems(householdId);
  const { data: markets } = useMarkets(householdId);
  const finish = useFinishTrip(hid);

  const marketId = localStorage.getItem(SELECTED_MARKET_KEY);
  const market = markets?.find((m) => m.id === marketId);
  const checked = (items ?? []).filter((i) => i.status === 'checked');

  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onSave = async () => {
    setError(null);
    const val = Number(amount.replace(',', '.'));
    if (!amount.trim() || Number.isNaN(val) || val < 0) {
      setError(t('doneShopping.totalAmountRequired'));
      return;
    }
    try {
      await finish.mutateAsync({
        marketId: market?.id ?? null,
        totalAmount: val,
      });
      navigate('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save trip');
    }
  };

  return (
    <div className="page">
      <header className="page-header">
        <h2>{t('doneShopping.title')}</h2>
        <button className="btn-link" onClick={() => navigate(-1)}>
          {t('common.cancel')}
        </button>
      </header>

      <p className="muted">
        {t('doneShopping.summary', {
          count: checked.length,
          market: market?.name ?? '—',
        })}
      </p>

      {checked.length === 0 && (
        <p className="muted">No checked items — nothing to finish.</p>
      )}

      <ul className="row-list">
        {checked.map((i) => (
          <li key={i.id} className="row">
            <span className="row-title">
              {i.quantity ? `${i.quantity} ${i.unit ?? 'Un'} · ` : ''}
              {i.name}
            </span>
          </li>
        ))}
      </ul>

      <label className="field">
        <span>{t('doneShopping.totalAmount')}</span>
        <input
          className="text-input"
          type="number"
          inputMode="decimal"
          step="any"
          min="0"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </label>

      {error && <p className="error-text">{error}</p>}

      <button
        className="btn-primary"
        onClick={onSave}
        disabled={finish.isPending || checked.length === 0}
      >
        {finish.isPending ? t('common.loading') : t('doneShopping.save')}
      </button>
    </div>
  );
}
