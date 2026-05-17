import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useOnline } from '../hooks/useOnline';

export function Layout({ isOwner }: { isOwner: boolean }) {
  const { t } = useTranslation();
  const online = useOnline();

  return (
    <div className="app-shell">
      {!online && (
        <div className="offline-banner">
          Offline — changes will sync when you reconnect
        </div>
      )}
      <main className="app-main">
        <Outlet />
      </main>
      <nav className="tab-bar">
        <NavLink to="/" end className="tab">
          {t('list.title')}
        </NavLink>
        <NavLink to="/markets" className="tab">
          {t('markets.title')}
        </NavLink>
        <NavLink to="/categories" className="tab">
          {t('categories.title')}
        </NavLink>
        {isOwner && (
          <NavLink to="/members" className="tab">
            {t('members.title')}
          </NavLink>
        )}
      </nav>
    </div>
  );
}
