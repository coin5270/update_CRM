import * as React from "react";
import type {
  Partner,
  Contact,
  SalesTask,
  User,
  Quote,
  ReminderRule,
  CrmNotification,
  Operation,
  Interaction,
  CustomerHistoryEvent,
  SalesEvent,
  AutomationEvent,
  ApiConnectionStatus,
  AuditEvent,
  SalesPipeline,
} from "./types";
import {
  seedPartners,
  seedContacts,
  seedTasks,
  seedQuotes,
  seedNotifications,
  seedOperations,
  seedInteractions,
  seedHistoryEvents,
  seedSalesEvents,
  seedAutomationEvents,
  seedPipelines,
  seedApiConnections,
} from "./mock-data";
import { DEFAULT_REMINDER_PLAN } from "./quote-utils-defaults";
import {
  deleteResource,
  exportCrmData,
  fetchAuditEvents,
  fetchBootstrap,
  fetchOperationsAnalytics,
  fetchUsers,
  importCrmData,
  loginWithApi,
  runAutomationEngine,
  runIntegrationSync,
  upsertResource,
  type BootstrapData,
  type OperationsAnalytics,
} from "./api";

const KEYS = {
  partners: "crm.partners",
  contacts: "crm.contacts",
  tasks: "crm.tasks",
  quotes: "crm.quotes",
  notifications: "crm.notifications",
  operations: "crm.operations",
  interactions: "crm.interactions",
  history: "crm.history",
  salesEvents: "crm.salesEvents",
  automations: "crm.automations",
  pipeline: "crm.pipeline",
  apiConnections: "crm.apiConnections",
  user: "crm.user",
  reminderRules: "crm.reminderRules",
  apiSync: "crm.apiSync",
  users: "crm.users",
  audit: "crm.audit",
  operationsAnalytics: "crm.operationsAnalytics",
  locale: "crm.locale",
};

const DEMO_PERMISSIONS = [
  "partners:read",
  "partners:write",
  "contacts:read",
  "contacts:write",
  "tasks:read",
  "tasks:write",
  "quotes:read",
  "quotes:write",
  "operations:read",
  "operations:write",
  "interactions:read",
  "interactions:write",
  "notifications:read",
  "notifications:write",
  "history:read",
  "history:write",
  "automations:read",
  "automations:write",
  "integration:read",
  "integration:write",
  "pipeline:read",
  "pipeline:write",
  "audit:read",
  "users:read",
  "users:write",
];

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("crm:store-change", { detail: key }));
}

function shouldUseSeedFallback(): boolean {
  if (typeof window === "undefined") return true;
  const sync = read<{ status?: string } | null>(KEYS.apiSync, null);
  return sync?.status !== "connected";
}

function persist<T extends { id: string }>(
  resource: Parameters<typeof upsertResource<T>>[0],
  item: T,
) {
  void upsertResource(resource, item, store.getUser()?.token).catch(() => undefined);
}

function removeRemote(resource: Parameters<typeof deleteResource>[0], id: string) {
  void deleteResource(resource, id, store.getUser()?.token).catch(() => undefined);
}

function computeOperationsAnalytics(
  operations: Operation[],
  quotes: Quote[],
  history: CustomerHistoryEvent[],
): OperationsAnalytics {
  const activeOperations = operations.filter((operation) => operation.status === "active");
  const completedOperations = operations.filter((operation) => operation.status === "completed");
  const trafficMap = new Map<string, number>();
  operations.forEach((operation) => {
    trafficMap.set(operation.trafficMode, (trafficMap.get(operation.trafficMode) ?? 0) + 1);
  });
  const sortedOperations = operations
    .slice()
    .sort((a, b) => b.openedAt.localeCompare(a.openedAt) || b.id.localeCompare(a.id));
  const lastOperation = sortedOperations[0] ?? null;
  const operationalHistory = history.filter(
    (event) =>
      event.type === "operation" || event.type === "automation" || Boolean(event.operationId),
  );

  return {
    operation_count: operations.length,
    active_operations: activeOperations.length,
    completed_operations: completedOperations.length,
    total_revenue: operations.reduce((sum, operation) => sum + operation.revenue, 0),
    last_operation: lastOperation,
    operations_by_traffic: Array.from(trafficMap.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([traffic_mode, count]) => ({ traffic_mode, count })),
    quote_operation_ratio: quotes.length
      ? Number(
          (operations.filter((operation) => operation.quoteId).length / quotes.length).toFixed(2),
        )
      : 0,
    operational_history_count: operationalHistory.length,
    recent_history: operationalHistory
      .slice()
      .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt) || b.id.localeCompare(a.id))
      .slice(0, 5),
  };
}

function recordQuoteOutcome(previous: Quote | undefined, next: Quote, actor: string): void {
  if (previous?.status === next.status || !["won", "lost", "expired"].includes(next.status)) {
    return;
  }

  store.upsertHistoryEvent({
    id: `quote-result-${next.id}`,
    partnerId: next.partnerId,
    type: "quote",
    title:
      next.status === "won"
        ? "Quote marked won"
        : next.status === "lost"
          ? "Quote marked lost"
          : "Quote expired",
    description: `Quote status changed from ${previous?.status ?? "draft"} to ${next.status}.`,
    occurredAt: new Date().toISOString().slice(0, 10),
    actor,
    quoteId: next.id,
  });

  if (next.status !== "won") {
    return;
  }

  const existingOperation = store.operations().find((operation) => operation.quoteId === next.id);
  store.upsertOperation({
    id: existingOperation?.id ?? `quote-operation-${next.id}`,
    number: existingOperation?.number ?? `OP-${next.number}`,
    partnerId: next.partnerId,
    quoteId: next.id,
    status: existingOperation?.status ?? "active",
    trafficMode: existingOperation?.trafficMode ?? "ocean",
    origin: existingOperation?.origin ?? "TBD",
    destination: existingOperation?.destination ?? "TBD",
    openedAt: existingOperation?.openedAt ?? new Date().toISOString().slice(0, 10),
    revenue: next.amount,
    currency: next.currency,
    assignedTo: next.salesperson,
  });
}

function recordOperationHistory(
  previous: Operation | undefined,
  next: Operation,
  actor: string,
): void {
  const tracked = [
    "partnerId",
    "quoteId",
    "status",
    "trafficMode",
    "origin",
    "destination",
    "revenue",
  ] as const;
  const changed = !previous || tracked.some((key) => previous[key] !== next[key]);
  if (!changed) {
    return;
  }

  const title = previous ? "Operation updated" : "Operation created";
  const changes = previous
    ? tracked
        .filter((key) => previous[key] !== next[key])
        .map((key) => key.replace(/[A-Z]/g, " $&").toLowerCase())
    : [];

  store.upsertHistoryEvent({
    id: `operation-history-${next.id}`,
    partnerId: next.partnerId,
    type: "operation",
    title,
    description: previous
      ? `Updated ${changes.length ? changes.join(", ") : "operation details"}.`
      : `Created operation ${next.number}.`,
    occurredAt: new Date().toISOString().slice(0, 10),
    actor,
    quoteId: next.quoteId,
    operationId: next.id,
  });
}

function recordTaskCompletion(
  previous: SalesTask | undefined,
  next: SalesTask,
  actor: string,
): void {
  if (previous?.status === next.status || next.status !== "completed") {
    return;
  }

  store.upsertHistoryEvent({
    id: `task-completed-${next.id}`,
    partnerId: next.partnerId ?? previous?.partnerId ?? "",
    type: "task",
    title: "Task completed",
    description: `Completed task ${next.subject}.`,
    occurredAt: new Date().toISOString().slice(0, 10),
    actor,
    quoteId: next.quoteId,
    taskId: next.id,
  });
}

function recordLeadWorkflow(previous: Partner | undefined, next: Partner, actor: string): void {
  if (previous?.status === next.status || next.status !== "lead") {
    return;
  }

  const taskId = `lead-qualification-${next.id}`;
  const historyId = `lead-workflow-${next.id}`;
  const today = new Date().toISOString().slice(0, 10);
  const responsibleUser = next.salesperson ?? actor;

  if (store.tasks().some((task) => task.id === taskId)) {
    return;
  }

  store.upsertTask({
    id: taskId,
    subject: `Qualify lead — ${next.companyName}`,
    partnerId: next.id,
    quoteId: undefined,
    transactionId: undefined,
    responsibleUser,
    salesperson: responsibleUser,
    dueDate: today,
    dueTime: undefined,
    priority: "high",
    status: "pending",
    contactId: undefined,
    email: next.emails[0],
    phone: next.phones[0],
    comment: "Auto-generated from lead qualification workflow.",
    createdAt: today,
    contactMethod: "call",
    autoGenerated: true,
  });

  store.upsertHistoryEvent({
    id: historyId,
    partnerId: next.id,
    type: "automation",
    title: "Lead workflow qualification created",
    description: `Created a qualification task for ${next.companyName}.`,
    occurredAt: today,
    actor,
    taskId,
  });
}

function runAutomationSweep(): void {
  if (typeof window === "undefined") return;

  const today = new Date().toISOString().slice(0, 10);
  const actor = store.getUser()?.name ?? "Automation engine";

  for (const task of store.tasks()) {
    if (task.status === "completed" || task.status === "cancelled") continue;
    if (task.dueDate >= today) continue;
    store.upsertNotification(
      {
        id: `auto-overdue-task-${task.id}`,
        title: `Overdue task: ${task.subject}`,
        message: `Task ${task.subject} is overdue since ${task.dueDate}.`,
        type: "alert",
        severity: "critical",
        createdAt: today,
        partnerId: task.partnerId,
        taskId: task.id,
        quoteId: task.quoteId,
        assignedTo: task.responsibleUser,
      },
      {
        localOnly: true,
      },
    );
  }

  for (const quote of store.quotes()) {
    if (quote.status === "won" || quote.status === "lost" || quote.status === "expired") continue;
    const daysLeft = Math.ceil(
      (new Date(`${quote.validUntil}T23:59:59`).getTime() - Date.now()) / 86400000,
    );
    if (daysLeft > 3) continue;
    store.upsertNotification(
      {
        id: `auto-quote-reminder-${quote.id}`,
        title: `Quote reminder: ${quote.number}`,
        message: `Quote ${quote.subject} expires soon on ${quote.validUntil}.`,
        type: "reminder",
        severity: daysLeft < 0 ? "warning" : "info",
        createdAt: today,
        partnerId: quote.partnerId,
        quoteId: quote.id,
        assignedTo: quote.salesperson,
      },
      {
        localOnly: true,
      },
    );
  }

  for (const lead of store.partners().filter((partner) => partner.status === "lead")) {
    recordLeadWorkflow(undefined, lead, actor);
  }
}

// initialize seeds once
function ensureSeed() {
  if (typeof window === "undefined") return;
  if (!window.localStorage.getItem(KEYS.partners)) write(KEYS.partners, seedPartners);
  if (!window.localStorage.getItem(KEYS.contacts)) write(KEYS.contacts, seedContacts);
  if (!window.localStorage.getItem(KEYS.tasks)) write(KEYS.tasks, seedTasks);
  if (!window.localStorage.getItem(KEYS.quotes)) write(KEYS.quotes, seedQuotes);
  if (!window.localStorage.getItem(KEYS.notifications))
    write(KEYS.notifications, seedNotifications);
  if (!window.localStorage.getItem(KEYS.operations)) write(KEYS.operations, seedOperations);
  if (!window.localStorage.getItem(KEYS.interactions)) write(KEYS.interactions, seedInteractions);
  if (!window.localStorage.getItem(KEYS.history)) write(KEYS.history, seedHistoryEvents);
  if (!window.localStorage.getItem(KEYS.salesEvents)) write(KEYS.salesEvents, seedSalesEvents);
  if (!window.localStorage.getItem(KEYS.automations)) write(KEYS.automations, seedAutomationEvents);
  if (!window.localStorage.getItem(KEYS.pipeline)) write(KEYS.pipeline, seedPipelines);
  if (!window.localStorage.getItem(KEYS.apiConnections))
    write(KEYS.apiConnections, seedApiConnections);
}

export const store = {
  getLocale(): "en" | "es" {
    return read<"en" | "es">(KEYS.locale, "en");
  },
  setLocale(locale: "en" | "es") {
    write(KEYS.locale, locale);
  },
  // Auth
  getUser(): User | null {
    return read<User | null>(KEYS.user, null);
  },
  login(email: string): User {
    const user: User = {
      id: "u1",
      name: email.split("@")[0].replace(/\b\w/g, (m) => m.toUpperCase()),
      email,
      role: "sales_manager",
      tenantKey: "uy-main",
      permissions: DEMO_PERMISSIONS,
    };
    write(KEYS.user, user);
    if (typeof window !== "undefined") window.localStorage.setItem("crm.tenantKey", user.tenantKey);
    ensureSeed();
    return user;
  },
  async loginWithPassword(email: string, password: string): Promise<User> {
    try {
      const response = await loginWithApi(email, password);
      write(KEYS.user, { ...response.user, token: response.token });
      if (response.user.tenantKey) {
        window.localStorage.setItem("crm.tenantKey", response.user.tenantKey);
      }
      ensureSeed();
      return response.user;
    } catch (error) {
      const normalized = email.trim().toLowerCase();
      const isDemoUser = normalized === "maria@salescrm.app" || normalized === "juan@salescrm.app";
      if (password === "demo" && isDemoUser) {
        const user = this.login(email);
        const apiError = error instanceof Error ? error.message : "Login failed";
        write(KEYS.apiSync, {
          status: "offline",
          lastSyncAt: new Date().toISOString(),
          message: `${apiError}. Using local demo login.`,
        });
        return user;
      }
      if (
        typeof window !== "undefined" &&
        (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
      ) {
        const user = this.login(email);
        const apiError = error instanceof Error ? error.message : "Login failed";
        write(KEYS.apiSync, {
          status: "offline",
          lastSyncAt: new Date().toISOString(),
          message: `${apiError}. Using local demo login.`,
        });
        return user;
      }
      throw error;
    }
  },
  async bootstrapFromApi(): Promise<boolean> {
    if (typeof window === "undefined") return false;
    try {
      const data = await fetchBootstrap();
      this.hydrate(data);
      write(KEYS.apiSync, {
        status: "connected",
        lastSyncAt: new Date().toISOString(),
      });
      runAutomationSweep();
      return true;
    } catch (error) {
      write(KEYS.apiSync, {
        status: "offline",
        lastSyncAt: new Date().toISOString(),
        message: error instanceof Error ? error.message : "Unable to reach CRM API",
      });
      ensureSeed();
      return false;
    }
  },
  hydrate(data: BootstrapData) {
    const localSalesEvents = this.salesEvents();
    const mergedSalesEvents = [...localSalesEvents];
    for (const event of data.salesEvents ?? []) {
      const index = mergedSalesEvents.findIndex((item) => item.id === event.id);
      if (index >= 0) mergedSalesEvents[index] = event;
      else mergedSalesEvents.unshift(event);
    }
    write(KEYS.partners, data.partners);
    write(KEYS.contacts, data.contacts);
    write(KEYS.tasks, data.tasks);
    write(KEYS.quotes, data.quotes);
    write(KEYS.notifications, data.notifications);
    write(KEYS.operations, data.operations);
    write(KEYS.interactions, data.interactions);
    write(KEYS.history, data.history);
    write(KEYS.salesEvents, mergedSalesEvents);
    write(KEYS.automations, data.automations);
    write(KEYS.pipeline, data.pipeline);
    write(KEYS.apiConnections, data.apiConnections);
    runAutomationSweep();
  },
  apiSyncStatus(): {
    status: "connected" | "offline";
    lastSyncAt: string;
    message?: string;
  } | null {
    return read(KEYS.apiSync, null);
  },
  async users(): Promise<User[]> {
    const user = this.getUser();
    if (!user?.token) return read<User[]>(KEYS.users, user ? [user] : []);
    try {
      const users = await fetchUsers(user?.token);
      write(KEYS.users, users);
      return users;
    } catch {
      return read<User[]>(KEYS.users, user ? [user] : []);
    }
  },
  salespeople(): string[] {
    const user = this.getUser();
    const storedUsers = read<User[]>(KEYS.users, user ? [user] : []);
    const names = [
      ...storedUsers
        .filter((item) => item.role === "sales" || item.role === "sales_manager")
        .map((item) => item.name),
      ...seedTasks.map((task) => task.salesperson),
    ];
    if (user?.name) {
      names.unshift(user.name);
    }
    return Array.from(new Set(names.filter(Boolean)));
  },
  upsertUser(user: User) {
    const all = read<User[]>(KEYS.users, []);
    const i = all.findIndex((x) => x.id === user.id);
    if (i >= 0) all[i] = user;
    else all.unshift(user);
    write(KEYS.users, all);
    persist("users", user);
  },
  async auditEvents(): Promise<AuditEvent[]> {
    const token = this.getUser()?.token;
    if (!token) return read<AuditEvent[]>(KEYS.audit, []);
    try {
      const events = await fetchAuditEvents(token);
      write(KEYS.audit, events);
      return events;
    } catch {
      return read<AuditEvent[]>(KEYS.audit, []);
    }
  },
  logout() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(KEYS.user);
    window.localStorage.removeItem("crm.tenantKey");
    window.dispatchEvent(new CustomEvent("crm:store-change", { detail: KEYS.user }));
  },

  // Partners
  partners(): Partner[] {
    ensureSeed();
    return read<Partner[]>(KEYS.partners, shouldUseSeedFallback() ? seedPartners : []);
  },
  partner(id: string): Partner | undefined {
    return this.partners().find((p) => p.id === id);
  },
  upsertPartner(p: Partner) {
    const previous = this.partner(p.id);
    const all = this.partners();
    const i = all.findIndex((x) => x.id === p.id);
    if (i >= 0) all[i] = p;
    else all.unshift(p);
    write(KEYS.partners, all);
    recordLeadWorkflow(previous, p, this.getUser()?.name ?? p.salesperson ?? p.companyName);
    persist("partners", p);
    runAutomationSweep();
  },
  deletePartner(id: string) {
    write(
      KEYS.partners,
      this.partners().filter((p) => p.id !== id),
    );
    removeRemote("partners", id);
  },

  // Contacts
  contacts(): Contact[] {
    ensureSeed();
    return read<Contact[]>(KEYS.contacts, shouldUseSeedFallback() ? seedContacts : []);
  },
  contactsByPartner(partnerId: string): Contact[] {
    return this.contacts().filter((c) => c.partnerId === partnerId);
  },
  upsertContact(c: Contact) {
    const all = this.contacts();
    const i = all.findIndex((x) => x.id === c.id);
    if (i >= 0) all[i] = c;
    else all.unshift(c);
    write(KEYS.contacts, all);
    persist("contacts", c);
  },
  deleteContact(id: string) {
    write(
      KEYS.contacts,
      this.contacts().filter((c) => c.id !== id),
    );
    removeRemote("contacts", id);
  },

  // Tasks
  tasks(): SalesTask[] {
    ensureSeed();
    return read<SalesTask[]>(KEYS.tasks, shouldUseSeedFallback() ? seedTasks : []);
  },
  tasksByPartner(partnerId: string): SalesTask[] {
    return this.tasks().filter((t) => t.partnerId === partnerId);
  },
  upsertTask(t: SalesTask) {
    const previous = this.tasks().find((item) => item.id === t.id);
    const all = this.tasks();
    const i = all.findIndex((x) => x.id === t.id);
    if (i >= 0) all[i] = t;
    else all.unshift(t);
    write(KEYS.tasks, all);
    recordTaskCompletion(previous, t, this.getUser()?.name ?? t.responsibleUser);
    persist("tasks", t);
    runAutomationSweep();
  },
  sendTaskEmail(taskId: string): Interaction | null {
    const task = this.tasks().find((item) => item.id === taskId);
    if (!task) return null;

    const partner = task.partnerId ? this.partner(task.partnerId) : undefined;
    const contact = task.contactId
      ? this.contacts().find((item) => item.id === task.contactId)
      : undefined;
    const partnerId = task.partnerId ?? contact?.partnerId;
    if (!partnerId) return null;

    const recipient = task.email ?? contact?.email ?? partner?.emails?.[0] ?? "";
    const actor = this.getUser()?.name ?? task.salesperson;
    const interaction: Interaction = {
      id: newId("i"),
      partnerId,
      contactId: task.contactId ?? contact?.id,
      quoteId: task.quoteId,
      taskId: task.id,
      channel: "email",
      direction: "outbound",
      subject: `Re: ${task.subject}`,
      body: [
        `To: ${recipient || "unassigned recipient"}`,
        `Task: ${task.subject}`,
        task.comment ? `Notes: ${task.comment}` : "Notes: none",
        `Follow-up due: ${task.dueDate}${task.dueTime ? ` ${task.dueTime}` : ""}`,
      ].join("\n"),
      occurredAt: new Date().toISOString().slice(0, 10),
      createdBy: actor,
    };

    this.upsertInteraction(interaction);
    this.upsertHistoryEvent({
      id: newId("h"),
      partnerId,
      type: "interaction",
      title: "Outbound email sent",
      description: `Sent a follow-up email for "${task.subject}".`,
      occurredAt: interaction.occurredAt,
      actor,
      quoteId: task.quoteId,
      taskId: task.id,
    });

    if (task.status === "pending") {
      this.upsertTask({ ...task, status: "in_progress" });
    }

    return interaction;
  },
  deleteTask(id: string) {
    write(
      KEYS.tasks,
      this.tasks().filter((t) => t.id !== id),
    );
    removeRemote("tasks", id);
  },

  // Quotes
  quotes(): Quote[] {
    ensureSeed();
    return read<Quote[]>(KEYS.quotes, shouldUseSeedFallback() ? seedQuotes : []);
  },
  quote(id: string): Quote | undefined {
    return this.quotes().find((q) => q.id === id);
  },
  quotesByPartner(partnerId: string): Quote[] {
    return this.quotes().filter((q) => q.partnerId === partnerId);
  },
  upsertQuote(q: Quote) {
    const previous = this.quote(q.id);
    const all = this.quotes();
    const i = all.findIndex((x) => x.id === q.id);
    if (i >= 0) all[i] = q;
    else all.unshift(q);
    write(KEYS.quotes, all);
    persist("quotes", q);
    recordQuoteOutcome(previous, q, this.getUser()?.name ?? q.salesperson);
    runAutomationSweep();
  },
  deleteQuote(id: string) {
    write(
      KEYS.quotes,
      this.quotes().filter((q) => q.id !== id),
    );
    removeRemote("quotes", id);
  },

  // Notifications
  notifications(): CrmNotification[] {
    ensureSeed();
    return read<CrmNotification[]>(
      KEYS.notifications,
      shouldUseSeedFallback() ? seedNotifications : [],
    );
  },
  unreadNotifications(): CrmNotification[] {
    return this.notifications().filter((n) => !n.readAt);
  },
  upsertNotification(n: CrmNotification, options?: { localOnly?: boolean }) {
    const all = this.notifications();
    const i = all.findIndex((x) => x.id === n.id);
    if (i >= 0) all[i] = n;
    else all.unshift(n);
    write(KEYS.notifications, all);
    if (!options?.localOnly) persist("notifications", n);
  },
  markNotificationRead(id: string) {
    const all = this.notifications().map((n) =>
      n.id === id && !n.readAt ? { ...n, readAt: new Date().toISOString().slice(0, 10) } : n,
    );
    write(KEYS.notifications, all);
    const notification = all.find((n) => n.id === id);
    if (notification) persist("notifications", notification);
  },
  markAllNotificationsRead() {
    const today = new Date().toISOString().slice(0, 10);
    const all = this.notifications().map((n) => (n.readAt ? n : { ...n, readAt: today }));
    write(KEYS.notifications, all);
    all.forEach((notification) => persist("notifications", notification));
  },
  deleteNotification(id: string) {
    write(
      KEYS.notifications,
      this.notifications().filter((notification) => notification.id !== id),
    );
    removeRemote("notifications", id);
  },

  // Operations
  operations(): Operation[] {
    ensureSeed();
    return read<Operation[]>(KEYS.operations, shouldUseSeedFallback() ? seedOperations : []);
  },
  operationsByPartner(partnerId: string): Operation[] {
    return this.operations().filter((o) => o.partnerId === partnerId);
  },
  upsertOperation(operation: Operation) {
    const previous = this.operations().find((item) => item.id === operation.id);
    const all = this.operations();
    const i = all.findIndex((x) => x.id === operation.id);
    if (i >= 0) all[i] = operation;
    else all.unshift(operation);
    write(KEYS.operations, all);
    recordOperationHistory(previous, operation, this.getUser()?.name ?? operation.assignedTo);
    persist("operations", operation);
  },
  deleteOperation(id: string) {
    write(
      KEYS.operations,
      this.operations().filter((operation) => operation.id !== id),
    );
    removeRemote("operations", id);
  },

  // Interactions and messaging
  interactions(): Interaction[] {
    ensureSeed();
    return read<Interaction[]>(KEYS.interactions, shouldUseSeedFallback() ? seedInteractions : []);
  },
  interactionsByPartner(partnerId: string): Interaction[] {
    return this.interactions().filter((i) => i.partnerId === partnerId);
  },
  upsertInteraction(interaction: Interaction) {
    const all = this.interactions();
    const i = all.findIndex((x) => x.id === interaction.id);
    if (i >= 0) all[i] = interaction;
    else all.unshift(interaction);
    write(KEYS.interactions, all);
    persist("interactions", interaction);
  },
  deleteInteraction(id: string) {
    write(
      KEYS.interactions,
      this.interactions().filter((interaction) => interaction.id !== id),
    );
    removeRemote("interactions", id);
  },

  // Customer history
  historyEvents(): CustomerHistoryEvent[] {
    ensureSeed();
    return read<CustomerHistoryEvent[]>(
      KEYS.history,
      shouldUseSeedFallback() ? seedHistoryEvents : [],
    );
  },
  salesEvents(): SalesEvent[] {
    ensureSeed();
    return read<SalesEvent[]>(KEYS.salesEvents, []);
  },
  upsertSalesEvent(event: SalesEvent) {
    const all = this.salesEvents();
    const i = all.findIndex((x) => x.id === event.id);
    if (i >= 0) all[i] = event;
    else all.unshift(event);
    write(KEYS.salesEvents, all);
    persist("sales_events" as never, event as never);
  },
  historyByPartner(partnerId: string): CustomerHistoryEvent[] {
    return this.historyEvents().filter((event) => event.partnerId === partnerId);
  },
  upsertHistoryEvent(event: CustomerHistoryEvent) {
    const all = this.historyEvents();
    const i = all.findIndex((x) => x.id === event.id);
    if (i >= 0) all[i] = event;
    else all.unshift(event);
    write(KEYS.history, all);
    persist("history", event);
  },

  // Automation and API integration status
  automations(): AutomationEvent[] {
    ensureSeed();
    return read<AutomationEvent[]>(
      KEYS.automations,
      shouldUseSeedFallback() ? seedAutomationEvents : [],
    );
  },
  upsertAutomation(automation: AutomationEvent) {
    const all = this.automations();
    const i = all.findIndex((item) => item.id === automation.id);
    if (i >= 0) all[i] = automation;
    else all.unshift(automation);
    write(KEYS.automations, all);
    persist("automations", automation);
  },
  deleteAutomation(id: string) {
    write(
      KEYS.automations,
      this.automations().filter((automation) => automation.id !== id),
    );
    removeRemote("automations", id);
  },
  pipeline(): SalesPipeline[] {
    ensureSeed();
    return read<SalesPipeline[]>(KEYS.pipeline, shouldUseSeedFallback() ? seedPipelines : []);
  },
  upsertPipeline(pipeline: SalesPipeline) {
    const all = this.pipeline();
    const i = all.findIndex((item) => item.id === pipeline.id);
    if (i >= 0) all[i] = pipeline;
    else all.unshift(pipeline);
    write(KEYS.pipeline, all);
    persist("pipeline", pipeline);
  },
  apiConnections(): ApiConnectionStatus[] {
    ensureSeed();
    return read<ApiConnectionStatus[]>(
      KEYS.apiConnections,
      shouldUseSeedFallback() ? seedApiConnections : [],
    );
  },
  upsertApiConnection(connection: ApiConnectionStatus) {
    const all = this.apiConnections();
    const i = all.findIndex((item) => item.id === connection.id);
    if (i >= 0) all[i] = connection;
    else all.unshift(connection);
    write(KEYS.apiConnections, all);
    persist("integration", connection);
  },
  async syncApiConnection(connectionId: string): Promise<{
    connection_id: string;
    system_name: string;
    status: string;
    last_sync_at: string;
    imported_partners: number;
    imported_operations: number;
    mode: string;
  }> {
    const result = await runIntegrationSync(connectionId, this.getUser()?.token);
    await this.bootstrapFromApi();
    return result;
  },
  exportData(): Promise<Record<string, unknown>> {
    return exportCrmData(this.getUser()?.token);
  },
  async importData(data: Record<string, unknown>): Promise<void> {
    const next = await importCrmData(data, this.getUser()?.token);
    this.hydrate(next);
  },
  async runAutomations(): Promise<{
    created_tasks: number;
    created_notifications: number;
    created_history: number;
    ran_at: string;
  }> {
    const result = await runAutomationEngine(this.getUser()?.token);
    await this.bootstrapFromApi();
    return result;
  },
  async operationsAnalytics(): Promise<OperationsAnalytics> {
    const token = this.getUser()?.token;
    if (!token) {
      return computeOperationsAnalytics(this.operations(), this.quotes(), this.historyEvents());
    }
    try {
      return await fetchOperationsAnalytics(token);
    } catch {
      return computeOperationsAnalytics(this.operations(), this.quotes(), this.historyEvents());
    }
  },

  // Global reminder rules
  reminderRules(): ReminderRule[] {
    return read<ReminderRule[]>(KEYS.reminderRules, DEFAULT_REMINDER_PLAN);
  },
  setReminderRules(rules: ReminderRule[]) {
    write(KEYS.reminderRules, rules);
  },
  resetReminderRules() {
    write(KEYS.reminderRules, DEFAULT_REMINDER_PLAN);
  },
};

export function useStoreVersion(): number {
  const [v, setV] = React.useState(0);
  React.useEffect(() => {
    const onChange = () => setV((x) => x + 1);
    window.addEventListener("crm:store-change", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("crm:store-change", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);
  return v;
}

export function newId(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}
