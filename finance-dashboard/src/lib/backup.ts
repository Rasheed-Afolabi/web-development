import { STORAGE_KEYS } from '@/data/constants';
import { buildSnapshotFromStores, serializeSnapshot } from '@/lib/app-state';
import { SUPABASE_INSTANCE_ID } from '@/lib/supabase';

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function writeBackup() {
  const snapshot = buildSnapshotFromStores(SUPABASE_INSTANCE_ID);
  localStorage.setItem(STORAGE_KEYS.BACKUP, serializeSnapshot(snapshot));
}

export function triggerBackup() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(writeBackup, 500);
}

export function getBackupJson() {
  return serializeSnapshot(buildSnapshotFromStores(SUPABASE_INSTANCE_ID));
}

export function initBackupListener() {
  window.addEventListener('storage', triggerBackup);
}
