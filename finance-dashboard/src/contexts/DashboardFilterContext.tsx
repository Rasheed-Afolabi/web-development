import { createContext, useContext, type ReactNode } from 'react';
import { useDashboardFilter, type DashboardFilterReturn } from '@/hooks/useDashboardFilter';

const DashboardFilterContext = createContext<DashboardFilterReturn | null>(null);

export function DashboardFilterProvider({ children }: { children: ReactNode }) {
  const filter = useDashboardFilter();
  return (
    <DashboardFilterContext.Provider value={filter}>
      {children}
    </DashboardFilterContext.Provider>
  );
}

export function useDashboardFilterContext(): DashboardFilterReturn {
  const ctx = useContext(DashboardFilterContext);
  if (!ctx) throw new Error('useDashboardFilterContext must be used within DashboardFilterProvider');
  return ctx;
}
