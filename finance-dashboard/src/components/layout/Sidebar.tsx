import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Target, Settings, Cloud, CloudOff, Loader2, AlertTriangle } from 'lucide-react';
import { QuickStats } from '@/components/layout/QuickStats';
import { useAppSyncStatus } from '@/lib/app-sync';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { to: '/goals', label: 'Goals', Icon: Target },
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
    <aside className="hidden md:flex w-64 min-h-screen bg-[#05192D] border-r border-[#1A3A5C] flex-col">
      <div className="p-6 pb-5 space-y-3">
        <div>
          <h1 className="font-display font-bold text-xl text-white tracking-tight">
            Rasko Finance
          </h1>
          <p className="text-[#8BA4BE] text-xs mt-1 font-body">Command Center</p>
        </div>
        <SyncBadge />
        <p className="text-[11px] text-[#8BA4BE] font-body leading-relaxed">
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
                  ? 'bg-[#0D2847] text-white border border-[#1A3A5C]'
                  : 'text-[#8BA4BE] hover:bg-[#0D2847] hover:text-white border border-transparent'
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
