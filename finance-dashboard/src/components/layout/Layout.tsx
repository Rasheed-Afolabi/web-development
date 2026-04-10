import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function Layout() {
  return (
    <div className="flex min-h-screen bg-bg-primary">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="animate-fade-in-up">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
