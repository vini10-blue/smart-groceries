import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './auth/AuthProvider';
import { Layout } from './components/Layout';
import SignIn from './routes/SignIn';
import Pending from './routes/Pending';
import List from './routes/List';
import Markets from './routes/Markets';
import MarketLayout from './routes/MarketLayout';
import Categories from './routes/Categories';
import ItemEditor from './routes/ItemEditor';
import DoneShopping from './routes/DoneShopping';
import Members from './routes/Members';

function FullScreen({ children }: { children: React.ReactNode }) {
  return <div className="centered">{children}</div>;
}

export default function App() {
  const { session, loading, membershipLoading, status, role } = useAuth();

  if (loading) {
    return (
      <FullScreen>
        <div className="spinner" />
      </FullScreen>
    );
  }

  if (!session) {
    return (
      <Routes>
        <Route path="*" element={<SignIn />} />
      </Routes>
    );
  }

  // Signed in — membership still resolving
  if (membershipLoading && status === 'none') {
    return (
      <FullScreen>
        <div className="spinner" />
      </FullScreen>
    );
  }

  if (status !== 'approved') {
    return (
      <Routes>
        <Route path="*" element={<Pending />} />
      </Routes>
    );
  }

  const isOwner = role === 'owner';

  return (
    <Routes>
      <Route element={<Layout isOwner={isOwner} />}>
        <Route path="/" element={<List />} />
        <Route path="/markets" element={<Markets />} />
        <Route path="/markets/:id" element={<MarketLayout />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/item" element={<ItemEditor />} />
        <Route path="/item/:id" element={<ItemEditor />} />
        <Route path="/done-shopping" element={<DoneShopping />} />
        {isOwner && <Route path="/members" element={<Members />} />}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
