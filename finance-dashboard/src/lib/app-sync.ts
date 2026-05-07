import { useSyncExternalStore } from 'react';
import { applySnapshotToStores, buildSnapshotFromStores, readLegacySnapshot, serializeSnapshot, type AppSnapshot } from '@/lib/app-state';
import { isSupabaseConfigured, supabase, SUPABASE_INSTANCE_ID, SUPABASE_TABLE } from '@/lib/supabase';
import { useCategoryStore } from '@/stores/useCategoryStore';
import { useGoalStore } from '@/stores/useGoalStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useRecurringStore } from '@/stores/useRecurringStore';
import { useNetWorthStore } from '@/stores/useNetWorthStore';
import { useDebtStore } from '@/stores/useDebtStore';
import { useEnvelopeStore } from '@/stores/useEnvelopeStore';

type SyncPhase = 'loading' | 'syncing' | 'synced' | 'offline' | 'error';

export interface AppSyncStatus {
  phase: SyncPhase;
  message: string;
  lastSyncedAt?: string;
  error?: string;
}

const defaultStatus: AppSyncStatus = {
  phase: 'loading',
  message: 'Connecting to Supabase...',
};

let status = defaultStatus;
const listeners = new Set<() => void>();
let initialized = false;
let hydrating = false;
let saveTimer: ReturnType<typeof setTimeout> | null = null;
let unsubscribeStores: Array<() => void> = [];

function emitStatus(next: AppSyncStatus) {
  status = next;
  listeners.forEach((listener) => listener());
}

function updateStatus(patch: Partial<AppSyncStatus>) {
  emitStatus({ ...status, ...patch });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useAppSyncStatus() {
  return useSyncExternalStore(subscribe, () => status, () => status);
}

function persistBackup(snapshot: AppSnapshot) {
  localStorage.setItem('rasko-finance-backup', serializeSnapshot(snapshot));
}

async function fetchRemoteSnapshot(): Promise<AppSnapshot | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(SUPABASE_TABLE)
    .select('instance_id, snapshot, updated_at')
    .eq('instance_id', SUPABASE_INSTANCE_ID)
    .maybeSingle();

  if (error) throw error;
  if (!data?.snapshot) return null;

  return {
    ...(data.snapshot as AppSnapshot),
    instanceId: SUPABASE_INSTANCE_ID,
    updatedAt: data.updated_at ?? new Date().toISOString(),
  };
}

async function saveRemoteSnapshot(snapshot: AppSnapshot) {
  if (!supabase) return;

  const { error } = await supabase.from(SUPABASE_TABLE).upsert(
    {
      instance_id: SUPABASE_INSTANCE_ID,
      snapshot,
      updated_at: snapshot.updatedAt,
    },
    { onConflict: 'instance_id' },
  );

  if (error) throw error;
}

function scheduleRemoteSave() {
  if (!initialized || hydrating) return;

  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    const snapshot = buildSnapshotFromStores(SUPABASE_INSTANCE_ID);
    persistBackup(snapshot);

    if (!isSupabaseConfigured) {
      updateStatus({ phase: 'offline', message: 'Supabase is not configured locally.' });
      return;
    }

    updateStatus({ phase: 'syncing', message: 'Saving to Supabase...' });

    try {
      await saveRemoteSnapshot(snapshot);
      updateStatus({
        phase: 'synced',
        message: 'Synced to Supabase',
        lastSyncedAt: snapshot.updatedAt,
        error: undefined,
      });
    } catch (error) {
      updateStatus({
        phase: 'error',
        message: 'Supabase sync failed. Working from local memory.',
        error: error instanceof Error ? error.message : 'Unknown sync error',
      });
    }
  }, 600);
}

async function hydrateState() {
  hydrating = true;

  try {
    if (!isSupabaseConfigured) {
      const legacySnapshot = readLegacySnapshot(SUPABASE_INSTANCE_ID);
      if (legacySnapshot) {
        applySnapshotToStores(legacySnapshot);
        persistBackup(legacySnapshot);
      }
      updateStatus({
        phase: 'offline',
        message: 'Supabase env vars are missing. Using local memory only.',
      });
      return;
    }

    const remoteSnapshot = await fetchRemoteSnapshot();
    if (remoteSnapshot) {
      applySnapshotToStores(remoteSnapshot);
      persistBackup(remoteSnapshot);
      updateStatus({
        phase: 'synced',
        message: 'Loaded from Supabase',
        lastSyncedAt: remoteSnapshot.updatedAt,
      });
      return;
    }

    const legacySnapshot = readLegacySnapshot(SUPABASE_INSTANCE_ID);
    const snapshot = legacySnapshot ?? buildSnapshotFromStores(SUPABASE_INSTANCE_ID);

    applySnapshotToStores(snapshot);
    persistBackup(snapshot);
    await saveRemoteSnapshot(snapshot);
    updateStatus({
      phase: 'synced',
      message: legacySnapshot ? 'Migrated existing local data to Supabase' : 'Created Supabase snapshot',
      lastSyncedAt: snapshot.updatedAt,
    });
  } catch (error) {
    const legacySnapshot = readLegacySnapshot(SUPABASE_INSTANCE_ID);
    if (legacySnapshot) {
      applySnapshotToStores(legacySnapshot);
      persistBackup(legacySnapshot);
    }

    updateStatus({
      phase: 'error',
      message: 'Could not load Supabase data. Falling back to local state.',
      error: error instanceof Error ? error.message : 'Unknown sync error',
    });
  } finally {
    hydrating = false;
  }
}

export function initializeAppSync() {
  if (initialized) {
    return () => undefined;
  }

  initialized = true;
  unsubscribeStores = [
    useTransactionStore.subscribe(scheduleRemoteSave),
    useGoalStore.subscribe(scheduleRemoteSave),
    useSettingsStore.subscribe(scheduleRemoteSave),
    useCategoryStore.subscribe(scheduleRemoteSave),
    useRecurringStore.subscribe(scheduleRemoteSave),
    useNetWorthStore.subscribe(scheduleRemoteSave),
    useDebtStore.subscribe(scheduleRemoteSave),
    useEnvelopeStore.subscribe(scheduleRemoteSave),
  ];

  void hydrateState();

  return () => {
    if (saveTimer) clearTimeout(saveTimer);
    unsubscribeStores.forEach((unsubscribe) => unsubscribe());
    unsubscribeStores = [];
    initialized = false;
  };
}