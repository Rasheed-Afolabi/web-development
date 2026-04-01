import { STORAGE_KEYS } from '@/data/constants';

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export function triggerBackup() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    const backup: Record<string, unknown> = {};
    for (const key of Object.values(STORAGE_KEYS)) {
      if (key === STORAGE_KEYS.BACKUP) continue;
      const data = localStorage.getItem(key);
      if (data) {
        backup[key] = JSON.parse(data);
      }
    }
    localStorage.setItem(STORAGE_KEYS.BACKUP, JSON.stringify({
      ...backup,
      timestamp: new Date().toISOString(),
    }));
  }, 500);
}

export function initBackupListener() {
  window.addEventListener('storage', triggerBackup);
  // Also listen to any store changes via a periodic check approach
  // The stores will call triggerBackup directly via subscribe
}
