import { useState } from 'react';
import { useGetCallerUserProfile, useGetTasksForEmployee } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TaskStatus } from '../backend';
import TaskDetailDialog from '../components/tasks/TaskDetailDialog';
import type { Task } from '../backend';

export default function Tasks() {
  const { data: userProfile } = useGetCallerUserProfile();
  const employeeId = userProfile?.employeeId || null;
  const { data: tasks = [], isLoading } = useGetTasksForEmployee(employeeId);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

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

  const filterTasks = (status?: TaskStatus) => {
    if (!status) return tasks;
    return tasks.filter(task => task.status === status);
  };

  const TaskList = ({ tasks }: { tasks: Task[] }) => {
    if (tasks.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          No tasks found
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {tasks.map((task) => (
          <Card 
            key={task.id} 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setSelectedTask(task)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground mb-1">{task.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {getStatusBadge(task.status)}
                    {task.notes.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {task.notes.length} note{task.notes.length !== 1 ? 's' : ''}
                      </Badge>
                    )}
                    {task.images.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {task.images.length} image{task.images.length !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Tasks</h1>
        <p className="text-muted-foreground mt-1">View and manage your assigned tasks</p>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All ({tasks.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({filterTasks(TaskStatus.pending).length})</TabsTrigger>
          <TabsTrigger value="inProgress">In Progress ({filterTasks(TaskStatus.inProgress).length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({filterTasks(TaskStatus.completed).length})</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-6">
          <TaskList tasks={tasks} />
        </TabsContent>
        <TabsContent value="pending" className="mt-6">
          <TaskList tasks={filterTasks(TaskStatus.pending)} />
        </TabsContent>
        <TabsContent value="inProgress" className="mt-6">
          <TaskList tasks={filterTasks(TaskStatus.inProgress)} />
        </TabsContent>
        <TabsContent value="completed" className="mt-6">
          <TaskList tasks={filterTasks(TaskStatus.completed)} />
        </TabsContent>
      </Tabs>

      {selectedTask && (
        <TaskDetailDialog 
          task={selectedTask} 
          open={!!selectedTask} 
          onOpenChange={(open) => !open && setSelectedTask(null)} 
        />
      )}
    </div>
  );
}
