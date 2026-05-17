import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import {
  useMarkets,
  useCreateMarket,
  useCreateMarketWithLayout,
  useUpdateMarket,
  useSetDefaultMarket,
  useDeleteMarket,
} from '../features/markets/useMarkets';
import { COUNTRIES } from '../data/supermarkets';

export default function Markets() {
  const { t } = useTranslation();
  const { householdId } = useAuth();
  const hid = householdId ?? '';
  const { data: markets, isLoading, error } = useMarkets(householdId);
  const create = useCreateMarket(hid);
  const createWithLayout = useCreateMarketWithLayout(hid);
  const update = useUpdateMarket(hid);
  const setDefault = useSetDefaultMarket(hid);
  const remove = useDeleteMarket(hid);

  const [countryCode, setCountryCode] = useState(COUNTRIES[0].code);
  const [showManual, setShowManual] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const country = COUNTRIES.find((c) => c.code === countryCode) ?? COUNTRIES[0];

  const addManual = (e: React.FormEvent) => {
    e.preventDefault();
    const v = name.trim();
    if (!v) return;
    create.mutate(
      { name: v, address },
      {
        onSuccess: () => {
          setName('');
          setAddress('');
          setShowManual(false);
        },
      }
    );
  };

  const addKnown = (chainName: string, layout: string[]) => {
    createWithLayout.mutate(
      { name: chainName, layoutNames: layout },
      { onSuccess: () => setNotice(t('markets.added', { name: chainName })) }
    );
  };

  return (
    <div className="page">
      <header className="page-header">
        <h2>{t('markets.title')}</h2>
      </header>

      <section>
        <h3 className="section-title">{t('markets.quickAddTitle')}</h3>
        <p className="muted">{t('markets.quickAddHint')}</p>
        <label className="field">
          <span>{t('markets.country')}</span>
          <select
            className="text-input"
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <div className="chip-row">
          {country.chains.map((ch) => (
            <button
              key={ch.name}
              className="chip"
              disabled={createWithLayout.isPending}
              onClick={() => addKnown(ch.name, ch.layout)}
            >
              {ch.name}
            </button>
          ))}
          <button className="chip chip-alt" onClick={() => setShowManual((s) => !s)}>
            {t('markets.otherManual')}
          </button>
        </div>
        {notice && <p className="muted success-text">{notice}</p>}
      </section>

      {showManual && (
        <section>
          <h3 className="section-title">{t('markets.manualAddTitle')}</h3>
          <form className="stack-form" onSubmit={addManual}>
            <input
              className="text-input"
              placeholder={t('markets.name')}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="text-input"
              placeholder={t('markets.address')}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            <button className="btn-primary" type="submit" disabled={create.isPending}>
              {t('markets.addMarket')}
            </button>
          </form>
        </section>
      )}

      {isLoading && <div className="spinner" />}
      {error && <p className="error-text">{(error as Error).message}</p>}

      <section>
        <h3 className="section-title">{t('markets.title')}</h3>
        <ul className="row-list">
          {markets?.map((m) => (
            <li key={m.id} className="row column">
              <div className="row-main">
                <span className="row-title">
                  {m.name}
                  {m.is_default && (
                    <span className="badge">{t('markets.setDefault')}</span>
                  )}
                </span>
                {m.address && <span className="muted">{m.address}</span>}
              </div>
              <div className="row-actions wrap">
                {!m.is_default && (
                  <button className="btn-link" onClick={() => setDefault.mutate(m.id)}>
                    {t('markets.setDefault')}
                  </button>
                )}
                <Link className="btn-link" to={`/markets/${m.id}`}>
                  {t('markets.layout')}
                </Link>
                <button
                  className="btn-link"
                  onClick={() => {
                    const next = window.prompt(t('markets.name'), m.name);
                    if (next && next.trim() && next.trim() !== m.name) {
                      update.mutate({
                        id: m.id,
                        name: next,
                        address: m.address ?? undefined,
                      });
                    }
                  }}
                >
                  {t('common.edit')}
                </button>
                <button
                  className="btn-link danger"
                  onClick={() => {
                    if (window.confirm(`${t('common.delete')} "${m.name}"?`)) {
                      remove.mutate(m.id);
                    }
                  }}
                >
                  {t('common.delete')}
                </button>
              </div>
            </li>
          ))}
          {markets?.length === 0 && <p className="muted">No markets yet.</p>}
        </ul>
      </section>
    </div>
  );
}
