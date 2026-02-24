import { useGetCallerUserProfile, useGetTasksForEmployee, useGetTaskCounts, useGetNotificationsForEmployee } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckSquare, Clock, Calendar, MessageSquare, User, AlertCircle } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TaskStatus } from '../backend';

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: userProfile } = useGetCallerUserProfile();
  const employeeId = userProfile?.employeeId || null;
  
  const { data: tasks = [], isLoading: tasksLoading } = useGetTasksForEmployee(employeeId);
  const { inProgress, completed, isLoading: countsLoading } = useGetTaskCounts(employeeId);
  const { data: notifications = [], isLoading: notificationsLoading } = useGetNotificationsForEmployee(employeeId);

  const pendingTasks = tasks.filter(t => t.status === TaskStatus.pending).length;
  const totalTasks = tasks.length;

  const quickNavItems = [
    { icon: CheckSquare, label: 'Tasks', path: '/tasks', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950' },
    { icon: Clock, label: 'Time Clock', path: '/time-clock', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950' },
    { icon: Calendar, label: 'Schedule', path: '/schedule', color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950' },
    { icon: MessageSquare, label: 'Messages', path: '/messages', color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950' },
    { icon: User, label: 'Profile', path: '/profile', color: 'text-gray-600', bg: 'bg-gray-50 dark:bg-gray-950' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Welcome back, {userProfile?.name || 'Employee'}!</h1>
        <p className="text-muted-foreground mt-1">Here's your work overview for today</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {tasksLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold">{totalTasks}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            {tasksLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold text-orange-600">{pendingTasks}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {countsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold text-blue-600">{Number(inProgress)}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          {notificationsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : notifications.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No notifications</p>
          ) : (
            <div className="space-y-3">
              {notifications.slice(0, 3).map((notification) => (
                <div key={notification.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <AlertCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{notification.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(Number(notification.timestamp) / 1000000).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant={notification.priority === 'urgent' ? 'destructive' : 'secondary'}>
                    {notification.priority}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Access</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {quickNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <Card 
                key={item.path}
                className="cursor-pointer hover:shadow-lg transition-shadow active:scale-95"
                onClick={() => navigate({ to: item.path })}
              >
                <CardContent className="flex flex-col items-center justify-center p-6 gap-3">
                  <div className={`w-12 h-12 rounded-full ${item.bg} flex items-center justify-center`}>
                    <Icon className={`h-6 w-6 ${item.color}`} />
                  </div>
                  <span className="text-sm font-medium text-center">{item.label}</span>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
