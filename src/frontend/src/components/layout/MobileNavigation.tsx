import { useNavigate, useRouterState } from '@tanstack/react-router';
import { Home, CheckSquare, Clock, Calendar, MessageSquare, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/tasks', label: 'Tasks', icon: CheckSquare },
  { path: '/time-clock', label: 'Clock', icon: Clock },
  { path: '/schedule', label: 'Schedule', icon: Calendar },
  { path: '/messages', label: 'Messages', icon: MessageSquare },
  { path: '/profile', label: 'Profile', icon: User },
];

export default function MobileNavigation() {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-lg z-40">
      <div className="grid grid-cols-6 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path;
          
          return (
            <button
              key={item.path}
              onClick={() => navigate({ to: item.path })}
              className={cn(
                'flex flex-col items-center justify-center gap-1 transition-colors',
                'active:bg-accent',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className={cn('h-5 w-5', isActive && 'stroke-[2.5]')} />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
