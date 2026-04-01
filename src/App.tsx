import { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Layout } from '@/components/layout/Layout';
import { DailyView } from '@/views/DailyView';
import { WeeklyView } from '@/views/WeeklyView';
import { MonthlyView } from '@/views/MonthlyView';
import { GoalView } from '@/views/GoalView';
import { SettingsView } from '@/views/SettingsView';
import { triggerBackup } from '@/lib/backup';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useGoalStore } from '@/stores/useGoalStore';
import { useSettingsStore } from '@/stores/useSettingsStore';

export function App() {
  // Subscribe to store changes for backup
  useEffect(() => {
    const unsubs = [
      useTransactionStore.subscribe(triggerBackup),
      useGoalStore.subscribe(triggerBackup),
      useSettingsStore.subscribe(triggerBackup),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  return (
    <HashRouter>
      <TooltipProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/weekly" replace />} />
            <Route path="/daily" element={<DailyView />} />
            <Route path="/weekly" element={<WeeklyView />} />
            <Route path="/monthly" element={<MonthlyView />} />
            <Route path="/goal" element={<GoalView />} />
            <Route path="/settings" element={<SettingsView />} />
          </Route>
        </Routes>
      </TooltipProvider>
    </HashRouter>
  );
}
