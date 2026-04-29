import { NavLink } from 'react-router-dom';
import { CalendarDays, CalendarRange, CalendarCheck, Target, Settings, Cloud, CloudOff, Loader2, AlertTriangle } from 'lucide-react';
import { QuickStats } from '@/components/layout/QuickStats';
import { useAppSyncStatus } from '@/lib/app-sync';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/daily', label: 'Daily', Icon: CalendarDays },
  { to: '/weekly', label: 'Weekly', Icon: CalendarRange },
  { to: '/monthly', label: 'Monthly', Icon: CalendarCheck },
  { to: '/goal', label: 'Goal', Icon: Target },
  { to: '/settings', label: 'Settings', Icon: Settings },
];

function SyncBadge() {
  const syncStatus = useAppSyncStatus();

  const toneClasses = {
    loading: 'border-border-subtle text-text-secondary bg-bg-secondary',
    syncing: 'border-accent-blue/30 text-accent-blue bg-accent-blue/10',
    synced: 'border-accent-green/30 text-accent-green bg-accent-green/10',
    offline: 'border-accent-amber/30 text-accent-amber bg-accent-amber/10',
    error: 'border-accent-red/30 text-accent-red bg-accent-red/10',
  } as const;

  const iconMap = {
    loading: Loader2,
    syncing: Loader2,
    synced: Cloud,
    offline: CloudOff,
    error: AlertTriangle,
  } as const;

  const Icon = iconMap[syncStatus.phase];

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide',
        toneClasses[syncStatus.phase],
      )}
    >
      <Icon size={12} className={syncStatus.phase === 'syncing' ? 'animate-spin' : ''} />
      <span>{syncStatus.phase === 'synced' ? 'Synced' : syncStatus.phase}</span>
    </div>
  );
}

export function Sidebar() {
  const syncStatus = useAppSyncStatus();

  return (
    <aside className="hidden md:flex w-64 min-h-screen bg-bg-primary border-r border-border-subtle flex-col">
      <div className="p-6 pb-5 space-y-3">
        <div>
          <h1 className="font-display font-bold text-xl text-text-primary tracking-tight">
            Rasko Finance
          </h1>
          <p className="text-text-muted text-xs mt-1 font-body">Command Center</p>
        </div>
        <SyncBadge />
        <p className="text-[11px] text-text-muted font-body leading-relaxed">
          {syncStatus.message}
        </p>
      </div>

      <nav className="flex-1 px-3">
        {navItems.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex min-h-11 items-center gap-3 px-4 py-3 rounded-xl text-sm font-body font-medium transition-all duration-200 mb-1 ${
                isActive
                  ? 'bg-bg-tertiary text-text-primary border border-border-active shadow-[0_0_0_1px_rgba(74,74,106,0.35)]'
                  : 'text-text-secondary hover:bg-bg-secondary hover:text-text-primary border border-transparent'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <QuickStats />
    </aside>
  );
}

