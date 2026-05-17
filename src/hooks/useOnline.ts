import { useSyncExternalStore } from 'react';
import { onlineManager } from '@tanstack/react-query';

export function useOnline() {
  return useSyncExternalStore(
    (cb) => onlineManager.subscribe(cb),
    () => onlineManager.isOnline(),
    () => true
  );
}
