import { NavLink } from 'react-router-dom';
import { CalendarDays, CalendarRange, CalendarCheck, Target, Settings } from 'lucide-react';
import { QuickStats } from '@/components/layout/QuickStats';

const navItems = [
  { to: '/daily', label: 'Daily', Icon: CalendarDays },
  { to: '/weekly', label: 'Weekly', Icon: CalendarRange },
  { to: '/monthly', label: 'Monthly', Icon: CalendarCheck },
  { to: '/goal', label: 'Goal', Icon: Target },
  { to: '/settings', label: 'Settings', Icon: Settings },
];

export function Sidebar() {
  return (
    <aside className="w-64 min-h-screen bg-bg-primary border-r border-border-subtle flex flex-col">
      <div className="p-6">
        <h1 className="font-display font-bold text-xl text-text-primary tracking-tight">
          Rasko Finance
        </h1>
        <p className="text-text-muted text-xs mt-1 font-body">Command Center</p>
      </div>

      <nav className="flex-1 px-3">
        {navItems.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-body font-medium transition-all duration-200 mb-1 ${
                isActive
                  ? 'bg-bg-tertiary text-text-primary border border-border-active'
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
