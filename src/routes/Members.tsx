import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthProvider';
import {
  useMembers,
  useApproveMember,
  useRejectMember,
  type Member,
} from '../features/members/useMembers';

export default function Members() {
  const { t } = useTranslation();
  const { householdId } = useAuth();
  const hid = householdId ?? '';
  const { data: members, isLoading, error } = useMembers(householdId);
  const approve = useApproveMember(hid);
  const reject = useRejectMember(hid);

  const pending = members?.filter((m) => m.status === 'pending') ?? [];
  const approved = members?.filter((m) => m.status === 'approved') ?? [];

  const label = (m: Member) => m.display_name || m.email || m.user_id.slice(0, 8);

  return (
    <div className="page">
      <header className="page-header">
        <h2>{t('members.title')}</h2>
      </header>

      {isLoading && <div className="spinner" />}
      {error && <p className="error-text">{(error as Error).message}</p>}

      <section>
        <h3 className="section-title">{t('members.pending')}</h3>
        {pending.length === 0 && <p className="muted">{t('members.noPending')}</p>}
        <ul className="row-list">
          {pending.map((m) => (
            <li key={m.user_id} className="row">
              <div className="row-main">
                <span className="row-title">{label(m)}</span>
                {m.email && <span className="muted">{m.email}</span>}
              </div>
              <div className="row-actions">
                <button
                  className="btn-link"
                  onClick={() => approve.mutate(m.user_id)}
                  disabled={approve.isPending}
                >
                  {t('members.approve')}
                </button>
                <button
                  className="btn-link danger"
                  onClick={() => {
                    if (window.confirm(t('members.confirmReject', { name: label(m) }))) {
                      reject.mutate(m.user_id);
                    }
                  }}
                >
                  {t('members.reject')}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="section-title">{t('members.approved')}</h3>
        {approved.length === 0 && <p className="muted">{t('members.none')}</p>}
        <ul className="row-list">
          {approved.map((m) => (
            <li key={m.user_id} className="row">
              <div className="row-main">
                <span className="row-title">
                  {label(m)}
                  {m.role === 'owner' && <span className="badge">{t('members.owner')}</span>}
                </span>
                {m.email && <span className="muted">{m.email}</span>}
              </div>
              {m.role !== 'owner' && (
                <div className="row-actions">
                  <button
                    className="btn-link danger"
                    onClick={() => {
                      if (window.confirm(t('members.confirmReject', { name: label(m) }))) {
                        reject.mutate(m.user_id);
                      }
                    }}
                  >
                    {t('members.reject')}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
