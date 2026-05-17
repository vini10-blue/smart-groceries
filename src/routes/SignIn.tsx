import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthProvider';

export default function SignIn() {
  const { t } = useTranslation();
  const { signInWithMicrosoft } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onClick = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithMicrosoft();
      // Redirects away to Microsoft; on return, AuthProvider picks up the session.
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign-in failed');
      setLoading(false);
    }
  };

  return (
    <div className="centered signin">
      <h1>Smart Groceries</h1>
      <button className="btn-primary" onClick={onClick} disabled={loading}>
        {loading ? t('auth.signingIn') : t('auth.signIn')}
      </button>
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
