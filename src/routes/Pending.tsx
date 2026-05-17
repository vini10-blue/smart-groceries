import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthProvider';

export default function Pending() {
  const { t } = useTranslation();
  const { session, signOut, refreshMembership, membershipLoading } = useAuth();

  return (
    <div className="centered signin">
      <h1>{t('auth.pendingTitle')}</h1>
      <p className="muted">{t('auth.pendingBody')}</p>
      {session?.user?.email && (
        <p className="muted">{t('auth.yourEmail', { email: session.user.email })}</p>
      )}
      <button
        className="btn-primary"
        onClick={() => refreshMembership()}
        disabled={membershipLoading}
      >
        {membershipLoading ? t('common.loading') : t('auth.refresh')}
      </button>
      <button className="btn-secondary" onClick={() => signOut()}>
        {t('auth.signOut')}
      </button>
    </div>
  );
}
