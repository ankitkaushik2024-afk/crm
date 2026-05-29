import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { getNavigationForRole } from '@/config/navigation';
import { useAppSelector } from '@/store/hooks';
import { ROLE_LABELS, type RoleName } from '@crm/shared';
import { Badge } from '@/components/ui/badge';
import { Zap } from 'lucide-react';

export function Sidebar() {
  const user = useAppSelector((s) => s.auth.user);
  const role = (user?.role || 'EMPLOYEE') as RoleName;
  const navItems = getNavigationForRole(role);

  return (
    <aside className="hidden lg:flex w-64 flex-col border-r bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Zap className="h-4 w-4" />
        </div>
        <div>
          <p className="font-semibold text-sm">Nexus CRM</p>
          <p className="text-xs text-muted-foreground">Enterprise Suite</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-accent hover:text-accent-foreground'
              )
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.title}
          </NavLink>
        ))}
      </nav>

      <div className="border-t p-4">
        <Badge variant="secondary" className="w-full justify-center">
          {ROLE_LABELS[role]}
        </Badge>
      </div>
    </aside>
  );
}
