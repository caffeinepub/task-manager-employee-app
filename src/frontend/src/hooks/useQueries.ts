import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type { Task, TaskStatus, Message, Notification, OnboardingData, OnboardingStatus, Employee, WorkLogEntry, UserProfile } from '../backend';
import { ExternalBlob } from '../backend';

export function useGetEmployeeId() {
  const { data: userProfile } = useGetCallerUserProfile();
  return userProfile?.employeeId || null;
}

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useGetTasksForEmployee(employeeId: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Task[]>({
    queryKey: ['tasks', employeeId],
    queryFn: async () => {
      if (!actor || !employeeId) return [];
      return actor.getTasksForEmployee(employeeId);
    },
    enabled: !!actor && !isFetching && !!employeeId,
  });
}

export function useGetTask(taskId: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Task | null>({
    queryKey: ['task', taskId],
    queryFn: async () => {
      if (!actor || !taskId) return null;
      return actor.getTask(taskId);
    },
    enabled: !!actor && !isFetching && !!taskId,
  });
}

export function useUpdateTaskStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: TaskStatus }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateTaskStatus(taskId, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task'] });
      queryClient.invalidateQueries({ queryKey: ['taskCounts'] });
    },
  });
}

export function useAddTaskNote() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, note }: { taskId: string; note: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addTaskNote(taskId, note);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task', variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useAddTaskImage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, image }: { taskId: string; image: ExternalBlob }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addTaskImage(taskId, image);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task', variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useGetTaskCounts(employeeId: string | null) {
  const { actor, isFetching } = useActor();

  const inProgressQuery = useQuery<bigint>({
    queryKey: ['taskCounts', employeeId, 'inProgress'],
    queryFn: async () => {
      if (!actor || !employeeId) return BigInt(0);
      return actor.getCountInProgressTasks(employeeId);
    },
    enabled: !!actor && !isFetching && !!employeeId,
  });

  const completedQuery = useQuery<bigint>({
    queryKey: ['taskCounts', employeeId, 'completed'],
    queryFn: async () => {
      if (!actor || !employeeId) return BigInt(0);
      return actor.getCountCompletedTasks(employeeId);
    },
    enabled: !!actor && !isFetching && !!employeeId,
  });

  return {
    inProgress: inProgressQuery.data || BigInt(0),
    completed: completedQuery.data || BigInt(0),
    isLoading: inProgressQuery.isLoading || completedQuery.isLoading,
  };
}

export function useClockIn() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (employeeId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.clockIn(employeeId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workLogs'] });
    },
  });
}

export function useClockOut() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (employeeId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.clockOut(employeeId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workLogs'] });
    },
  });
}

export function useGetWorkLogs(employeeId: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<WorkLogEntry[]>({
    queryKey: ['workLogs', employeeId],
    queryFn: async () => {
      if (!actor || !employeeId) return [];
      return actor.getWorkLogs(employeeId);
    },
    enabled: !!actor && !isFetching && !!employeeId,
  });
}

export function useGetMessagesForEmployee(employeeId: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Message[]>({
    queryKey: ['messages', employeeId],
    queryFn: async () => {
      if (!actor || !employeeId) return [];
      return actor.getMessagesForEmployee(employeeId);
    },
    enabled: !!actor && !isFetching && !!employeeId,
  });
}

export function useGetMessage(messageId: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Message | null>({
    queryKey: ['message', messageId],
    queryFn: async () => {
      if (!actor || !messageId) return null;
      return actor.getMessage(messageId);
    },
    enabled: !!actor && !isFetching && !!messageId,
  });
}

export function useSendMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (message: Message) => {
      if (!actor) throw new Error('Actor not available');
      return actor.sendMessage(message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
}

export function useGetNotificationsForEmployee(employeeId: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Notification[]>({
    queryKey: ['notifications', employeeId],
    queryFn: async () => {
      if (!actor || !employeeId) return [];
      return actor.getNotificationsForEmployee(employeeId);
    },
    enabled: !!actor && !isFetching && !!employeeId,
  });
}

export function useGetOnboardingData(employeeId: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<OnboardingData | null>({
    queryKey: ['onboarding', employeeId],
    queryFn: async () => {
      if (!actor || !employeeId) return null;
      try {
        return await actor.getOnboardingData(employeeId);
      } catch (error) {
        return null;
      }
    },
    enabled: !!actor && !isFetching && !!employeeId,
    retry: false,
  });
}

export function useSubmitOnboardingData() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: OnboardingData) => {
      if (!actor) throw new Error('Actor not available');
      return actor.submitOnboardingData(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding'] });
      queryClient.invalidateQueries({ queryKey: ['employee'] });
    },
  });
}

export function useUpdateOnboardingStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ employeeId, status }: { employeeId: string; status: OnboardingStatus }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateOnboardingStatus(employeeId, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding'] });
      queryClient.invalidateQueries({ queryKey: ['employee'] });
    },
  });
}

export function useGetEmployee(employeeId: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Employee | null>({
    queryKey: ['employee', employeeId],
    queryFn: async () => {
      if (!actor || !employeeId) return null;
      try {
        return await actor.getEmployee(employeeId);
      } catch (error) {
        return null;
      }
    },
    enabled: !!actor && !isFetching && !!employeeId,
    retry: false,
  });
}
