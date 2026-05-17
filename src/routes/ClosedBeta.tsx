import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthProvider';

export default function ClosedBeta() {
  const { t } = useTranslation();
  const { session, signOut } = useAuth();

  return (
    <div className="centered signin">
      <h1>{t('auth.closedBetaTitle')}</h1>
      <p className="muted">{t('auth.closedBetaBody')}</p>
      {session?.user?.email && (
        <p className="muted">{t('auth.yourEmail', { email: session.user.email })}</p>
      )}
      <button className="btn-secondary" onClick={() => signOut()}>
        {t('auth.signOut')}
      </button>
    </div>
  );
}
