import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { onlineManager } from '@tanstack/react-query';
import './lib/i18n';
import './index.css';
import { queryClient, idbPersister } from './lib/queryClient';
import { AuthProvider } from './auth/AuthProvider';
import App from './App';

// Resume paused (offline) mutations as soon as we're back online.
onlineManager.subscribe(() => {
  if (onlineManager.isOnline()) {
    queryClient.resumePausedMutations().then(() => queryClient.invalidateQueries());
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: idbPersister, maxAge: 1000 * 60 * 60 * 24 * 7 }}
    >
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    </PersistQueryClientProvider>
  </React.StrictMode>
);
