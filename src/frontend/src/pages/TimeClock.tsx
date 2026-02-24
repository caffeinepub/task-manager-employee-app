import { useState, useEffect } from 'react';
import { useGetCallerUserProfile, useGetWorkLogs, useClockIn, useClockOut } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, LogIn, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

export default function TimeClock() {
  const { data: userProfile } = useGetCallerUserProfile();
  const employeeId = userProfile?.employeeId || null;
  const { data: workLogs = [], isLoading } = useGetWorkLogs(employeeId);
  const clockIn = useClockIn();
  const clockOut = useClockOut();
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isClockedIn, setIsClockedIn] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleClockIn = async () => {
    if (!employeeId) return;
    try {
      await clockIn.mutateAsync(employeeId);
      setIsClockedIn(true);
      toast.success('Clocked in successfully');
    } catch (error) {
      toast.error('Failed to clock in');
    }
  };

  const handleClockOut = async () => {
    if (!employeeId) return;
    try {
      await clockOut.mutateAsync(employeeId);
      setIsClockedIn(false);
      toast.success('Clocked out successfully');
    } catch (error) {
      toast.error('Failed to clock out');
    }
  };

  const getTodayHours = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayLogs = workLogs.filter(log => {
      const logDate = new Date(Number(log.date) / 1000000);
      logDate.setHours(0, 0, 0, 0);
      return logDate.getTime() === today.getTime();
    });
    return todayLogs.reduce((sum, log) => sum + log.hoursWorked, 0);
  };

  const getWeekHours = () => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    const weekLogs = workLogs.filter(log => {
      const logDate = new Date(Number(log.date) / 1000000);
      return logDate >= weekStart;
    });
    return weekLogs.reduce((sum, log) => sum + log.hoursWorked, 0);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const todayHours = getTodayHours();
  const weekHours = getWeekHours();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Time Clock</h1>
        <p className="text-muted-foreground mt-1">Track your work hours</p>
      </div>

      <Card className="bg-gradient-to-br from-primary/5 to-secondary/5">
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            <Clock className="h-16 w-16 mx-auto text-primary" />
            <div>
              <div className="text-5xl font-bold text-foreground mb-2">
                {currentTime.toLocaleTimeString()}
              </div>
              <div className="text-lg text-muted-foreground">
                {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
            <div className="flex gap-4 justify-center">
              <Button
                size="lg"
                onClick={handleClockIn}
                disabled={isClockedIn || clockIn.isPending}
                className="w-40"
              >
                <LogIn className="h-5 w-5 mr-2" />
                Clock In
              </Button>
              <Button
                size="lg"
                variant="destructive"
                onClick={handleClockOut}
                disabled={!isClockedIn || clockOut.isPending}
                className="w-40"
              >
                <LogOut className="h-5 w-5 mr-2" />
                Clock Out
              </Button>
            </div>
            {isClockedIn && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300">
                <div className="w-2 h-2 rounded-full bg-green-600 animate-pulse" />
                Currently clocked in
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Today's Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">
              {todayHours.toFixed(2)} hrs
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">
              {weekHours.toFixed(2)} hrs
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Work Logs</CardTitle>
        </CardHeader>
        <CardContent>
          {workLogs.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No work logs yet</p>
          ) : (
            <div className="space-y-3">
              {workLogs.slice(-7).reverse().map((log, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <div>
                    <div className="font-medium text-foreground">
                      {new Date(Number(log.date) / 1000000).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(Number(log.date) / 1000000).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-primary">
                      {log.hoursWorked.toFixed(2)} hrs
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
