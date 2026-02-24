import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface OnboardingData {
    forms: Forms;
    status: OnboardingStatus;
    referenceTaskId?: string;
    employeeId: string;
    timestamp: Time;
    personalInfo: PersonalInfo;
    employmentDetails: EmploymentDetails;
}
export interface Forms {
    i9: ExternalBlob;
    w4: ExternalBlob;
    onboarding: ExternalBlob;
    identification: ExternalBlob;
}
export type Time = bigint;
export interface WorkLogEntry {
    date: Time;
    hoursWorked: number;
    taskStatus: TaskStatus;
}
export interface Task {
    id: string;
    status: TaskStatus;
    title: string;
    assignedTo: string;
    description: string;
    notes: Array<string>;
    timestamp: Time;
    images: Array<ExternalBlob>;
}
export interface PersonalInfo {
    address: string;
    lastName: string;
    contactDetails: string;
    firstName: string;
}
export interface EmploymentDetails {
    referenceTaskId?: string;
    jobTitle: string;
    department: string;
    startDate: Time;
}
export interface Notification {
    id: string;
    referenceTaskId?: string;
    content: string;
    taskId?: string;
    timestamp: Time;
    priority: NotificationPriority;
    recipientId: string;
    relatedTask?: Task;
}
export interface Message {
    content: string;
    messageId: string;
    relatedTaskId?: string;
    messageType: MessageType;
    taskId?: string;
    timestamp: Time;
    recipientId: string;
    senderId: string;
}
export interface Employee {
    id: string;
    name: string;
    role: EmployeeRole;
    companyAssignment?: string;
    email: string;
    jobTitle: string;
    address: string;
    onboardingStatus: OnboardingStatus;
    contactNumber: string;
}
export interface UserProfile {
    name: string;
    email: string;
    employeeId?: string;
}
export enum EmployeeRole {
    manager = "manager",
    worker = "worker"
}
export enum MessageType {
    taskRelated = "taskRelated",
    general = "general"
}
export enum NotificationPriority {
    taskRelated = "taskRelated",
    urgent = "urgent",
    general = "general"
}
export enum OnboardingStatus {
    completed = "completed",
    workInProgress = "workInProgress"
}
export enum TaskStatus {
    pending = "pending",
    completed = "completed",
    inProgress = "inProgress"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addTaskImage(taskId: string, image: ExternalBlob): Promise<void>;
    addTaskNote(taskId: string, note: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    clockIn(employeeId: string): Promise<void>;
    clockOut(employeeId: string): Promise<void>;
    createEmployee(employee: Employee): Promise<void>;
    createNotification(notification: Notification): Promise<void>;
    createTask(task: Task): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCountCompletedTasks(employeeId: string): Promise<bigint>;
    getCountInProgressTasks(employeeId: string): Promise<bigint>;
    getEmployee(employeeId: string): Promise<Employee>;
    getMessage(messageId: string): Promise<Message>;
    getMessagesForEmployee(employeeId: string): Promise<Array<Message>>;
    getNotification(notificationId: string): Promise<Notification>;
    getNotificationsForEmployee(employeeId: string): Promise<Array<Notification>>;
    getOnboardingData(employeeId: string): Promise<OnboardingData>;
    getTask(taskId: string): Promise<Task>;
    getTasksForEmployee(employeeId: string): Promise<Array<Task>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getWorkLogs(employeeId: string): Promise<Array<WorkLogEntry>>;
    isCallerAdmin(): Promise<boolean>;
    listImages(): Promise<Array<ExternalBlob>>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    sendMessage(message: Message): Promise<void>;
    submitOnboardingData(data: OnboardingData): Promise<void>;
    updateEmployee(employeeId: string, employee: Employee): Promise<void>;
    updateOnboardingStatus(employeeId: string, status: OnboardingStatus): Promise<void>;
    updateTaskStatus(taskId: string, newStatus: TaskStatus): Promise<void>;
}
