import { useGetCallerUserProfile, useGetTasksForEmployee } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { TaskStatus } from '../backend';

export default function Schedule() {
  const { data: userProfile } = useGetCallerUserProfile();
  const employeeId = userProfile?.employeeId || null;
  const { data: tasks = [], isLoading } = useGetTasksForEmployee(employeeId);

  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      const taskDate = new Date(Number(task.timestamp) / 1000000);
      return taskDate.toDateString() === date.toDateString();
    });
  };

  const getWeekDates = (): Date[] => {
    const today = new Date();
    const week: Date[] = [];
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      week.push(date);
    }
    return week;
  };

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.pending:
        return <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300">Pending</Badge>;
      case TaskStatus.inProgress:
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">In Progress</Badge>;
      case TaskStatus.completed:
        return <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300">Completed</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const today = new Date();
  const todayTasks = getTasksForDate(today);
  const weekDates = getWeekDates();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Schedule</h1>
        <p className="text-muted-foreground mt-1">View your daily and weekly schedule</p>
      </div>

      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="daily">Daily View</TabsTrigger>
          <TabsTrigger value="weekly">Weekly View</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todayTasks.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No tasks scheduled for today</p>
              ) : (
                <div className="space-y-3">
                  {todayTasks.map((task) => (
                    <div key={task.id} className="p-4 rounded-lg border bg-card">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="font-semibold text-foreground">{task.title}</h3>
                        {getStatusBadge(task.status)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>Office Location</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weekly" className="mt-6 space-y-4">
          {weekDates.map((date) => {
            const dayTasks = getTasksForDate(date);
            const isToday = date.toDateString() === today.toDateString();
            
            return (
              <Card key={date.toISOString()} className={isToday ? 'border-primary' : ''}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      {date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </span>
                    {isToday && <Badge>Today</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dayTasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No tasks scheduled</p>
                  ) : (
                    <div className="space-y-2">
                      {dayTasks.map((task) => (
                        <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                          <div className="flex-1">
                            <div className="font-medium text-foreground">{task.title}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                              <MapPin className="h-3 w-3" />
                              Office Location
                            </div>
                          </div>
                          {getStatusBadge(task.status)}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}
