import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { get, set, del } from 'idb-keyval';

/**
 * Offline-first config:
 * - networkMode 'offlineFirst': queries return cached data immediately; mutations
 *   are paused while offline and auto-resume on reconnect.
 * - Query cache persisted to IndexedDB so the list opens with no signal.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      networkMode: 'offlineFirst',
      staleTime: 1000 * 30,
      gcTime: 1000 * 60 * 60 * 24 * 7,
      retry: 2,
      refetchOnReconnect: true,
    },
    mutations: {
      networkMode: 'offlineFirst',
      retry: 3,
    },
  },
});

export const idbPersister = createAsyncStoragePersister({
  storage: {
    getItem: (k) => get(k),
    setItem: (k, v) => set(k, v),
    removeItem: (k) => del(k),
  },
  key: 'sg-query-cache',
  throttleTime: 1000,
});
