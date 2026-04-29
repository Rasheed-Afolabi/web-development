import { useMemo } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { CalendarDays, CalendarRange, CalendarCheck, Target, Settings } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { useAppSyncStatus } from '@/lib/app-sync';
import { cn } from '@/lib/utils';

const mobileNavItems = [
  { to: '/daily', label: 'Daily', Icon: CalendarDays },
  { to: '/weekly', label: 'Weekly', Icon: CalendarRange },
  { to: '/monthly', label: 'Monthly', Icon: CalendarCheck },
  { to: '/goal', label: 'Goal', Icon: Target },
  { to: '/settings', label: 'Settings', Icon: Settings },
];

export function Layout() {
  const syncStatus = useAppSyncStatus();
  const location = useLocation();

  const titleMap = useMemo(
    () => ({
      '/daily': 'Daily Snapshot',
      '/weekly': 'Weekly Review',
      '/monthly': 'Monthly Overview',
      '/goal': 'Goal Tracker',
      '/settings': 'Settings',
    }),
    [],
  );

  const currentTitle = titleMap[location.pathname as keyof typeof titleMap] ?? 'Rasko Finance';

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Mobile top header */}
      <div className="md:hidden sticky top-0 z-40 border-b border-border-subtle bg-bg-primary/95 backdrop-blur supports-[backdrop-filter]:bg-bg-primary/80 pt-[env(safe-area-inset-top)]">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="min-w-0">
            <p className="truncate font-heading text-base font-semibold text-text-primary">
              {currentTitle}
            </p>
          </div>
          <p className="shrink-0 text-[11px] text-text-muted">{syncStatus.message}</p>
        </div>
      </div>

      <div className="flex min-h-screen bg-bg-primary">
        <Sidebar />
        <main className="flex-1 overflow-x-hidden overflow-y-auto pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-4">
          <div className="animate-fade-in-up">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border-subtle bg-bg-primary/95 backdrop-blur supports-[backdrop-filter]:bg-bg-primary/80 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-stretch justify-around">
          {mobileNavItems.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex flex-1 flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] text-[10px] font-body font-medium transition-colors duration-200',
                  isActive
                    ? 'text-accent-blue'
                    : 'text-text-muted hover:text-text-secondary',
                )
              }
            >
              <Icon size={22} />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
