import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './auth/AuthProvider';
import { Layout } from './components/Layout';
import SignIn from './routes/SignIn';
import ClosedBeta from './routes/ClosedBeta';
import List from './routes/List';
import Markets from './routes/Markets';
import MarketLayout from './routes/MarketLayout';
import Categories from './routes/Categories';
import ItemEditor from './routes/ItemEditor';
import DoneShopping from './routes/DoneShopping';

function FullScreen({ children }: { children: React.ReactNode }) {
  return <div className="centered">{children}</div>;
}

export default function App() {
  const { session, loading, inHousehold } = useAuth();

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

  // Signed in, but allowlist check still pending
  if (inHousehold === null) {
    return (
      <FullScreen>
        <div className="spinner" />
      </FullScreen>
    );
  }

  if (inHousehold === false) {
    return (
      <Routes>
        <Route path="*" element={<ClosedBeta />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<List />} />
        <Route path="/markets" element={<Markets />} />
        <Route path="/markets/:id" element={<MarketLayout />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/item" element={<ItemEditor />} />
        <Route path="/item/:id" element={<ItemEditor />} />
        <Route path="/done-shopping" element={<DoneShopping />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
