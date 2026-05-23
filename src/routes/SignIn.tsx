import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthProvider';

export default function SignIn() {
  const { t } = useTranslation();
  const { signInWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    try {
      setLoading(true);
      setError(null);
      await signInWithEmail(trimmed);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="centered signin">
        <h1>Smart Groceries</h1>
        <h2>{t('auth.checkEmailTitle')}</h2>
        <p>{t('auth.checkEmailBody', { email: email.trim().toLowerCase() })}</p>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            setSent(false);
            setError(null);
          }}
        >
          {t('auth.useDifferentEmail')}
        </button>
      </div>
    );
  }

  return (
    <div className="centered signin">
      <h1>Smart Groceries</h1>
      <form onSubmit={onSubmit}>
        <label htmlFor="email">{t('auth.emailLabel')}</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
        <button className="btn-primary" type="submit" disabled={loading || !email.trim()}>
          {loading ? t('auth.sending') : t('auth.sendLink')}
        </button>
      </form>
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
