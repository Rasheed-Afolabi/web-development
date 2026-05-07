import { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Layout } from '@/components/layout/Layout';
import { DashboardView } from '@/views/DashboardView';
import { GoalView } from '@/views/GoalView';
import { SettingsView } from '@/views/SettingsView';
import { initializeAppSync } from '@/lib/app-sync';
import { triggerBackup } from '@/lib/backup';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useGoalStore } from '@/stores/useGoalStore';
import { useSettingsStore } from '@/stores/useSettingsStore';

export function App() {
  // Subscribe to store changes for backup
  useEffect(() => {
    const stopSync = initializeAppSync();
    const unsubs = [
      useTransactionStore.subscribe(triggerBackup),
      useGoalStore.subscribe(triggerBackup),
      useSettingsStore.subscribe(triggerBackup),
    ];
    return () => {
      stopSync();
      unsubs.forEach((u) => u());
    };
  }, []);

  return (
    <HashRouter>
      <TooltipProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardView />} />
            <Route path="/goals" element={<GoalView />} />
            <Route path="/settings" element={<SettingsView />} />
            {/* Legacy redirects */}
            <Route path="/daily" element={<Navigate to="/dashboard" replace />} />
            <Route path="/weekly" element={<Navigate to="/dashboard" replace />} />
            <Route path="/monthly" element={<Navigate to="/dashboard" replace />} />
            <Route path="/goal" element={<Navigate to="/goals" replace />} />
          </Route>
        </Routes>
      </TooltipProvider>
    </HashRouter>
  );
}
