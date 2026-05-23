import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthProvider';

export default function SignIn() {
  const { t } = useTranslation();
  const { signInWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@')) {
      setError(t('auth.emailInvalid'));
      return;
    }
    try {
      setSending(true);
      setError(null);
      await signInWithEmail(trimmed);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed');
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="centered signin">
        <h1>Smart Groceries</h1>
        <h2>{t('auth.linkSentTitle')}</h2>
        <p className="muted">{t('auth.linkSentBody', { email })}</p>
        <button
          className="btn-link"
          onClick={() => {
            setSent(false);
            setEmail('');
          }}
        >
          {t('auth.useAnotherEmail')}
        </button>
      </div>
    );
  }

  return (
    <form className="centered signin" onSubmit={onSubmit}>
      <h1>Smart Groceries</h1>
      <p className="muted">{t('auth.signInBody')}</p>
      <input
        className="text-input"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder={t('auth.emailPlaceholder')}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoFocus
      />
      <button className="btn-primary" type="submit" disabled={sending}>
        {sending ? t('auth.sending') : t('auth.sendLink')}
      </button>
      {error && <p className="error-text">{error}</p>}
    </form>
  );
}
