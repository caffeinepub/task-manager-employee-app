import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Map "mo:core/Map";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Queue "mo:core/Queue";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Storage "blob-storage/Storage";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";
import Float "mo:core/Float";

actor {
  let taskMap = Map.empty<Text, Task>();
  let employeeTaskMap = Map.empty<Text, [Text]>();
  let messageMap = Map.empty<Text, Message>();
  let employeeMessageQueue = Map.empty<Text, Queue.Queue<Text>>();
  let notificationMap = Map.empty<Text, Notification>();
  let employeeNotificationQueue = Map.empty<Text, Queue.Queue<Text>>();
  let onboardingMap = Map.empty<Text, OnboardingData>();
  let employeeMap = Map.empty<Text, Employee>();
  let clockInMap = Map.empty<Text, Time.Time>();
  let workLogMap = Map.empty<Text, [WorkLogEntry]>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let principalToEmployeeId = Map.empty<Principal, Text>();

  include MixinStorage();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type UserProfile = {
    name : Text;
    email : Text;
    employeeId : ?Text;
  };

  public type TaskStatus = {
    #pending;
    #inProgress;
    #completed;
  };

  module TaskStatus {
    public func compareByString(s1 : TaskStatus, s2 : TaskStatus) : Order.Order {
      func statusToString(status : TaskStatus) : Text {
        switch (status) {
          case (#pending) { "pending" };
          case (#inProgress) { "in_progress" };
          case (#completed) { "completed" };
        };
      };
      Text.compare(statusToString(s1), statusToString(s2));
    };
  };

  public type Task = {
    id : Text;
    title : Text;
    description : Text;
    assignedTo : Text;
    status : TaskStatus;
    notes : [Text];
    images : [Storage.ExternalBlob];
    timestamp : Time.Time;
  };

  module Task {
    public func compareByStatus(t1 : Task, t2 : Task) : Order.Order {
      TaskStatus.compareByString(t1.status, t2.status);
    };
  };

  public type WorkLogEntry = {
    date : Time.Time;
    hoursWorked : Float;
    taskStatus : TaskStatus;
  };

  public type TimeTrackingEntry = {
    employeeId : Text;
    clockInTime : ?Time.Time;
    workLogs : [WorkLogEntry];
  };

  public type DailySchedule = {
    employeeId : Text;
    tasks : [Task];
    location : Text;
    scheduleDate : Time.Time;
  };

  public type WorkLogHistory = {
    date : Time.Time;
    hoursWorked : Float;
    taskStatus : TaskStatus;
  };

  public type ScheduleView = {
    dailySchedule : ?DailySchedule;
    weeklySchedule : [DailySchedule];
    upcomingTasks : [Task];
  };

  public type Message = {
    messageId : Text;
    senderId : Text;
    recipientId : Text;
    content : Text;
    timestamp : Time.Time;
    taskId : ?Text;
    messageType : MessageType;
    relatedTaskId : ?Text;
  };

  public type MessageType = {
    #general;
    #taskRelated;
  };

  public type Notification = {
    id : Text;
    content : Text;
    recipientId : Text;
    timestamp : Time.Time;
    priority : NotificationPriority;
    taskId : ?Text;
    referenceTaskId : ?Text;
    relatedTask : ?Task;
  };

  module Notification {
    public func compareByPriority(n1 : Notification, n2 : Notification) : Order.Order {
      NotificationPriority.compare(n1.priority, n2.priority);
    };
  };

  public type NotificationPriority = {
    #general;
    #urgent;
    #taskRelated;
  };

  module NotificationPriority {
    public func compare(a : NotificationPriority, b : NotificationPriority) : Order.Order {
      var aScore = 0;
      switch (a) {
        case (#urgent) { aScore := 2 };
        case (#taskRelated) { aScore := 1 };
        case (#general) { aScore := 0 };
      };
      var bScore = 0;
      switch (b) {
        case (#urgent) { bScore := 2 };
        case (#taskRelated) { bScore := 1 };
        case (#general) { bScore := 0 };
      };
      if (aScore < bScore) { return #less };
      if (aScore == bScore) { return #equal };
      #greater;
    };
  };

  public type FormType = {
    #w4;
    #i9;
    #identification;
    #onboarding;
  };

  public type Forms = {
    w4 : Storage.ExternalBlob;
    i9 : Storage.ExternalBlob;
    identification : Storage.ExternalBlob;
    onboarding : Storage.ExternalBlob;
  };

  public type OnboardingData = {
    employeeId : Text;
    personalInfo : PersonalInfo;
    employmentDetails : EmploymentDetails;
    forms : Forms;
    status : OnboardingStatus;
    timestamp : Time.Time;
    referenceTaskId : ?Text;
  };

  public type PersonalInfo = {
    firstName : Text;
    lastName : Text;
    address : Text;
    contactDetails : Text;
  };

  public type EmploymentDetails = {
    jobTitle : Text;
    department : Text;
    startDate : Time.Time;
    referenceTaskId : ?Text;
  };

  public type OnboardingStatus = {
    #workInProgress;
    #completed;
  };

  public type DocumentType = {
    #w4;
    #identification;
    #onboardingDocuments;
  };

  public type Employee = {
    id : Text;
    email : Text;
    name : Text;
    address : Text;
    contactNumber : Text;
    jobTitle : Text;
    companyAssignment : ?Text;
    role : EmployeeRole;
    onboardingStatus : OnboardingStatus;
  };

  public type EmployeeRole = {
    #manager;
    #worker;
  };

  private func getEmployeeIdForCaller(caller : Principal) : ?Text {
    principalToEmployeeId.get(caller);
  };

  private func verifyEmployeeAccess(caller : Principal, employeeId : Text) : Bool {
    if (AccessControl.isAdmin(accessControlState, caller)) {
      return true;
    };
    switch (getEmployeeIdForCaller(caller)) {
      case (null) { false };
      case (?callerEmployeeId) { callerEmployeeId == employeeId };
    };
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
    switch (profile.employeeId) {
      case (null) {};
      case (?empId) {
        principalToEmployeeId.add(caller, empId);
      };
    };
  };

  public shared ({ caller }) func getTask(taskId : Text) : async Task {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access tasks");
    };
    switch (taskMap.get(taskId)) {
      case (null) { Runtime.trap("Task not found") };
      case (?task) {
        if (not verifyEmployeeAccess(caller, task.assignedTo)) {
          Runtime.trap("Unauthorized: Can only access your own tasks");
        };
        task;
      };
    };
  };

  public query ({ caller }) func getTasksForEmployee(employeeId : Text) : async [Task] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access tasks");
    };
    if (not verifyEmployeeAccess(caller, employeeId)) {
      Runtime.trap("Unauthorized: Can only access your own tasks");
    };
    switch (employeeTaskMap.get(employeeId)) {
      case (null) { [] };
      case (?taskIds) {
        taskIds.map(
          func(taskId) {
            switch (taskMap.get(taskId)) {
              case (null) { Runtime.trap("Task not found") };
              case (?task) { task };
            };
          }
        );
      };
    };
  };

  public shared ({ caller }) func updateTaskStatus(taskId : Text, newStatus : TaskStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update tasks");
    };
    switch (taskMap.get(taskId)) {
      case (null) { Runtime.trap("Task not found") };
      case (?task) {
        if (not verifyEmployeeAccess(caller, task.assignedTo)) {
          Runtime.trap("Unauthorized: Can only update your own tasks");
        };
        let updatedTask = {
          task with status = newStatus;
        };
        taskMap.add(taskId, updatedTask);
      };
    };
  };

  public shared ({ caller }) func addTaskNote(taskId : Text, note : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add task notes");
    };
    switch (taskMap.get(taskId)) {
      case (null) { Runtime.trap("Task not found") };
      case (?task) {
        if (not verifyEmployeeAccess(caller, task.assignedTo)) {
          Runtime.trap("Unauthorized: Can only add notes to your own tasks");
        };
        let updatedNotes = task.notes.concat([note]);
        let updatedTask = {
          task with notes = updatedNotes;
        };
        taskMap.add(taskId, updatedTask);
      };
    };
  };

  public shared ({ caller }) func addTaskImage(taskId : Text, image : Storage.ExternalBlob) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add task images");
    };
    switch (taskMap.get(taskId)) {
      case (null) { Runtime.trap("Task not found") };
      case (?task) {
        if (not verifyEmployeeAccess(caller, task.assignedTo)) {
          Runtime.trap("Unauthorized: Can only add images to your own tasks");
        };
        let updatedImages = task.images.concat([image]);
        let updatedTask = {
          task with images = updatedImages;
        };
        taskMap.add(taskId, updatedTask);
      };
    };
  };

  public query ({ caller }) func getCountInProgressTasks(employeeId : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access task counts");
    };
    if (not verifyEmployeeAccess(caller, employeeId)) {
      Runtime.trap("Unauthorized: Can only access your own task counts");
    };
    switch (employeeTaskMap.get(employeeId)) {
      case (null) { 0 };
      case (?taskIds) {
        var count = 0;
        for (taskId in taskIds.values()) {
          switch (taskMap.get(taskId)) {
            case (null) {};
            case (?task) {
              switch (task.status) {
                case (#inProgress) { count += 1 };
                case (_) {};
              };
            };
          };
        };
        count;
      };
    };
  };

  public query ({ caller }) func getCountCompletedTasks(employeeId : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access task counts");
    };
    if (not verifyEmployeeAccess(caller, employeeId)) {
      Runtime.trap("Unauthorized: Can only access your own task counts");
    };
    switch (employeeTaskMap.get(employeeId)) {
      case (null) { 0 };
      case (?taskIds) {
        var count = 0;
        for (taskId in taskIds.values()) {
          switch (taskMap.get(taskId)) {
            case (null) {};
            case (?task) {
              switch (task.status) {
                case (#completed) { count += 1 };
                case (_) {};
              };
            };
          };
        };
        count;
      };
    };
  };

  public shared ({ caller }) func createTask(task : Task) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can create tasks");
    };
    taskMap.add(task.id, task);
    switch (employeeTaskMap.get(task.assignedTo)) {
      case (null) {
        employeeTaskMap.add(task.assignedTo, [task.id]);
      };
      case (?existingTasks) {
        let updatedTasks = existingTasks.concat([task.id]);
        employeeTaskMap.add(task.assignedTo, updatedTasks);
      };
    };
  };

  public shared ({ caller }) func clockIn(employeeId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can clock in");
    };
    if (not verifyEmployeeAccess(caller, employeeId)) {
      Runtime.trap("Unauthorized: Can only clock in for yourself");
    };
    clockInMap.add(employeeId, Time.now());
  };

  public shared ({ caller }) func clockOut(employeeId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can clock out");
    };
    if (not verifyEmployeeAccess(caller, employeeId)) {
      Runtime.trap("Unauthorized: Can only clock out for yourself");
    };
    switch (clockInMap.get(employeeId)) {
      case (null) { Runtime.trap("No clock-in record found") };
      case (?clockInTime) {
        let clockOutTime = Time.now();
        let hoursWorked = (clockOutTime - clockInTime).toFloat() / 3_600_000_000_000.0;
        let workLog : WorkLogEntry = {
          date = clockOutTime;
          hoursWorked = hoursWorked;
          taskStatus = #completed;
        };
        switch (workLogMap.get(employeeId)) {
          case (null) {
            workLogMap.add(employeeId, [workLog]);
          };
          case (?existingLogs) {
            let updatedLogs = existingLogs.concat([workLog]);
            workLogMap.add(employeeId, updatedLogs);
          };
        };
        clockInMap.remove(employeeId);
      };
    };
  };

  public query ({ caller }) func getWorkLogs(employeeId : Text) : async [WorkLogEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access work logs");
    };
    if (not verifyEmployeeAccess(caller, employeeId)) {
      Runtime.trap("Unauthorized: Can only access your own work logs");
    };
    switch (workLogMap.get(employeeId)) {
      case (null) { [] };
      case (?logs) { logs };
    };
  };

  public shared ({ caller }) func getMessage(messageId : Text) : async Message {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access messages");
    };
    switch (messageMap.get(messageId)) {
      case (null) { Runtime.trap("Message not found") };
      case (?message) {
        let callerEmployeeId = switch (getEmployeeIdForCaller(caller)) {
          case (null) { Runtime.trap("Employee ID not found for caller") };
          case (?id) { id };
        };
        if (message.recipientId != callerEmployeeId and message.senderId != callerEmployeeId and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only access your own messages");
        };
        message;
      };
    };
  };

  public query ({ caller }) func getMessagesForEmployee(employeeId : Text) : async [Message] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access messages");
    };
    if (not verifyEmployeeAccess(caller, employeeId)) {
      Runtime.trap("Unauthorized: Can only access your own messages");
    };
    let messages = Queue.empty<Text>();
    switch (employeeMessageQueue.get(employeeId)) {
      case (null) { [] };
      case (_) {
        messages.values().toArray().map(
          func(messageId) {
            switch (messageMap.get(messageId)) {
              case (null) { Runtime.trap("Message not found") };
              case (?message) { message };
            };
          }
        );
      };
    };
  };

  public shared ({ caller }) func sendMessage(message : Message) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can send messages");
    };
    let callerEmployeeId = switch (getEmployeeIdForCaller(caller)) {
      case (null) { Runtime.trap("Employee ID not found for caller") };
      case (?id) { id };
    };
    if (message.senderId != callerEmployeeId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only send messages as yourself");
    };
    messageMap.add(message.messageId, message);
    switch (employeeMessageQueue.get(message.recipientId)) {
      case (null) {
        let newQueue = Queue.empty<Text>();
        newQueue.pushBack(message.messageId);
        employeeMessageQueue.add(message.recipientId, newQueue);
      };
      case (?queue) {
        queue.pushBack(message.messageId);
      };
    };
  };

  public shared ({ caller }) func getNotification(notificationId : Text) : async Notification {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access notifications");
    };
    switch (notificationMap.get(notificationId)) {
      case (null) { Runtime.trap("Notification not found") };
      case (?notification) {
        if (not verifyEmployeeAccess(caller, notification.recipientId)) {
          Runtime.trap("Unauthorized: Can only access your own notifications");
        };
        notification;
      };
    };
  };

  public query ({ caller }) func getNotificationsForEmployee(employeeId : Text) : async [Notification] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access notifications");
    };
    if (not verifyEmployeeAccess(caller, employeeId)) {
      Runtime.trap("Unauthorized: Can only access your own notifications");
    };
    let notifications = Queue.empty<Text>();
    switch (employeeNotificationQueue.get(employeeId)) {
      case (null) { [] };
      case (_) {
        notifications.values().toArray().map(
          func(notificationId) {
            switch (notificationMap.get(notificationId)) {
              case (null) { Runtime.trap("Notification not found") };
              case (?notification) { notification };
            };
          }
        );
      };
    };
  };

  public shared ({ caller }) func createNotification(notification : Notification) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can create notifications");
    };
    notificationMap.add(notification.id, notification);
    switch (employeeNotificationQueue.get(notification.recipientId)) {
      case (null) {
        let newQueue = Queue.empty<Text>();
        newQueue.pushBack(notification.id);
        employeeNotificationQueue.add(notification.recipientId, newQueue);
      };
      case (?queue) {
        queue.pushBack(notification.id);
      };
    };
  };

  public shared ({ caller }) func getOnboardingData(employeeId : Text) : async OnboardingData {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access onboarding data");
    };
    if (not verifyEmployeeAccess(caller, employeeId)) {
      Runtime.trap("Unauthorized: Can only access your own onboarding data");
    };
    switch (onboardingMap.get(employeeId)) {
      case (null) { Runtime.trap("Onboarding data not found") };
      case (?data) { data };
    };
  };

  public shared ({ caller }) func submitOnboardingData(data : OnboardingData) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can submit onboarding data");
    };
    if (not verifyEmployeeAccess(caller, data.employeeId)) {
      Runtime.trap("Unauthorized: Can only submit your own onboarding data");
    };
    onboardingMap.add(data.employeeId, data);
  };

  public shared ({ caller }) func updateOnboardingStatus(employeeId : Text, status : OnboardingStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update onboarding status");
    };
    if (not verifyEmployeeAccess(caller, employeeId)) {
      Runtime.trap("Unauthorized: Can only update your own onboarding status");
    };
    switch (onboardingMap.get(employeeId)) {
      case (null) { Runtime.trap("Onboarding data not found") };
      case (?data) {
        let updatedData = {
          data with status = status;
        };
        onboardingMap.add(employeeId, updatedData);
      };
    };
  };

  public shared ({ caller }) func getEmployee(employeeId : Text) : async Employee {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access employee profiles");
    };
    if (not verifyEmployeeAccess(caller, employeeId)) {
      Runtime.trap("Unauthorized: Can only access your own employee profile");
    };
    switch (employeeMap.get(employeeId)) {
      case (null) { Runtime.trap("Employee not found") };
      case (?employee) { employee };
    };
  };

  public shared ({ caller }) func createEmployee(employee : Employee) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can create employees");
    };
    employeeMap.add(employee.id, employee);
  };

  public shared ({ caller }) func updateEmployee(employeeId : Text, employee : Employee) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update employees");
    };
    employeeMap.add(employeeId, employee);
  };

  public query ({ caller }) func listImages() : async [Storage.ExternalBlob] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can list images");
    };
    [];
  };
};
