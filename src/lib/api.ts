import type {
  ApiConnectionStatus,
  AuditEvent,
  AutomationEvent,
  Contact,
  CrmNotification,
  CustomerHistoryEvent,
  SalesEvent,
  Interaction,
  Operation,
  Partner,
  PartnerRole,
  PartnerStatus,
  PipelineStage,
  SalesPipeline,
  Quote,
  QuoteStatus,
  SalesTask,
  TaskPriority,
  TaskStatus,
  User,
} from "./types";

const API_BASE =
  (import.meta.env.VITE_CRM_API_URL as string | undefined)?.replace(/\/$/, "") ??
  (typeof window !== "undefined" ? window.location.origin : "");
const DEFAULT_TENANT_KEY =
  (import.meta.env.VITE_CRM_TENANT_KEY as string | undefined)?.trim() || "uy-main";

type RawRecord = Record<string, unknown>;
export type ApiResource =
  | "partners"
  | "contacts"
  | "tasks"
  | "quotes"
  | "notifications"
  | "operations"
  | "interactions"
  | "history"
  | "sales_events"
  | "automations"
  | "pipeline"
  | "users"
  | "integration";

export interface BootstrapData {
  partners: Partner[];
  contacts: Contact[];
  tasks: SalesTask[];
  quotes: Quote[];
  operations: Operation[];
  interactions: Interaction[];
  notifications: CrmNotification[];
  history: CustomerHistoryEvent[];
  salesEvents: SalesEvent[];
  automations: AutomationEvent[];
  pipeline: SalesPipeline[];
  apiConnections: ApiConnectionStatus[];
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface SignupPayload {
  name: string;
  email: string;
  password: string;
  tenantKey: string;
  companyName?: string;
}

export interface AutomationRunResult {
  created_tasks: number;
  created_notifications: number;
  created_history: number;
  ran_at: string;
}

export interface IntegrationSyncResult {
  connection_id: string;
  system_name: string;
  status: string;
  last_sync_at: string;
  imported_partners: number;
  imported_operations: number;
  mode: string;
}

export interface OperationsAnalytics {
  operation_count: number;
  active_operations: number;
  completed_operations: number;
  total_revenue: number;
  last_operation: Operation | null;
  operations_by_traffic: Array<{ traffic_mode: string; count: number }>;
  quote_operation_ratio: number;
  operational_history_count: number;
  recent_history: CustomerHistoryEvent[];
}

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function number(value: unknown, fallback = 0): number {
  return typeof value === "number" ? value : fallback;
}

function list<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function get(raw: RawRecord, camel: string, snake = camel): unknown {
  return raw[camel] ?? raw[snake];
}

function snakeCase(value: string): string {
  return value.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function tenantKey(): string {
  if (typeof window === "undefined") return DEFAULT_TENANT_KEY;
  return window.localStorage.getItem("crm.tenantKey")?.trim() || DEFAULT_TENANT_KEY;
}

function requestHeaders(token?: string, extra: Record<string, string> = {}): HeadersInit {
  return {
    "X-Tenant-Key": tenantKey(),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

function toApiPayload(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(toApiPayload);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as RawRecord)
        .filter(([, item]) => item !== undefined)
        .map(([key, item]) => [snakeCase(key), toApiPayload(item)]),
    );
  }
  return value;
}

function normalizePartner(raw: RawRecord): Partner {
  return {
    id: text(raw.id),
    companyName: text(get(raw, "companyName", "company_name")),
    tradeName: text(get(raw, "tradeName", "trade_name"), undefined as unknown as string),
    taxId: text(get(raw, "taxId", "tax_id"), undefined as unknown as string),
    country: text(raw.country, undefined as unknown as string),
    city: text(raw.city, undefined as unknown as string),
    state: text(raw.state, undefined as unknown as string),
    address: text(raw.address, undefined as unknown as string),
    postalCode: text(get(raw, "postalCode", "postal_code"), undefined as unknown as string),
    phones: list<string>(raw.phones),
    emails: list<string>(raw.emails),
    website: text(raw.website, undefined as unknown as string),
    language: text(raw.language, "en"),
    status: text(raw.status, "prospect") as PartnerStatus,
    salesperson: text(raw.salesperson, undefined as unknown as string),
    manager: text(raw.manager, undefined as unknown as string),
    notes: text(raw.notes, undefined as unknown as string),
    customText: text(get(raw, "customText", "custom_text"), undefined as unknown as string),
    roles: list<PartnerRole>(raw.roles),
    bankDetails: list(raw.bankDetails ?? raw.bank_details),
    branches: list(raw.branches),
    createdAt: text(get(raw, "createdAt", "created_at"), new Date().toISOString().slice(0, 10)),
  };
}

function normalizeContact(raw: RawRecord): Contact {
  return {
    id: text(raw.id),
    partnerId: text(get(raw, "partnerId", "partner_id")),
    firstName: text(get(raw, "firstName", "first_name")),
    lastName: text(get(raw, "lastName", "last_name")),
    position: text(raw.position, undefined as unknown as string),
    email: text(raw.email, undefined as unknown as string),
    phone: text(raw.phone, undefined as unknown as string),
    whatsapp: text(raw.whatsapp, undefined as unknown as string),
    notes: text(raw.notes, undefined as unknown as string),
  };
}

function normalizeTask(raw: RawRecord): SalesTask {
  return {
    id: text(raw.id),
    partnerId: text(get(raw, "partnerId", "partner_id"), undefined as unknown as string),
    contactId: text(get(raw, "contactId", "contact_id"), undefined as unknown as string),
    email: text(raw.email, undefined as unknown as string),
    phone: text(raw.phone, undefined as unknown as string),
    subject: text(raw.subject),
    comment: text(raw.comment, undefined as unknown as string),
    responsibleUser: text(get(raw, "responsibleUser", "responsible_user"), "Sales User"),
    salesperson: text(raw.salesperson, "Sales User"),
    createdAt: text(get(raw, "createdAt", "created_at"), new Date().toISOString()),
    dueDate: text(get(raw, "dueDate", "due_date"), new Date().toISOString().slice(0, 10)),
    dueTime: text(get(raw, "dueTime", "due_time"), undefined as unknown as string),
    priority: text(raw.priority, "medium") as TaskPriority,
    status: text(raw.status, "pending") as TaskStatus,
    contactMethod: text(
      get(raw, "contactMethod", "contact_method"),
      "call",
    ) as SalesTask["contactMethod"],
    quoteId: text(get(raw, "quoteId", "quote_id"), undefined as unknown as string),
    transactionId: text(
      get(raw, "transactionId", "transaction_id"),
      undefined as unknown as string,
    ),
    autoGenerated: Boolean(get(raw, "autoGenerated", "auto_generated")),
  };
}

function normalizeQuote(raw: RawRecord): Quote {
  return {
    id: text(raw.id),
    number: text(raw.number),
    partnerId: text(get(raw, "partnerId", "partner_id")),
    contactId: text(get(raw, "contactId", "contact_id"), undefined as unknown as string),
    subject: text(raw.subject),
    status: text(raw.status, "draft") as QuoteStatus,
    currency: text(raw.currency, "USD"),
    amount: number(raw.amount),
    issueDate: text(get(raw, "issueDate", "issue_date")),
    validUntil: text(get(raw, "validUntil", "valid_until")),
    salesperson: text(raw.salesperson, "Sales User"),
    notes: text(raw.notes, undefined as unknown as string),
    lines: list(raw.lines),
    createdAt: text(get(raw, "createdAt", "created_at"), text(get(raw, "issueDate", "issue_date"))),
    reminderRules: list(raw.reminderRules ?? raw.reminder_rules),
  };
}

function normalizeOperation(raw: RawRecord): Operation {
  return {
    id: text(raw.id),
    number: text(raw.number),
    partnerId: text(get(raw, "partnerId", "partner_id")),
    quoteId: text(get(raw, "quoteId", "quote_id"), undefined as unknown as string),
    trafficMode: text(get(raw, "trafficMode", "traffic_mode"), "ocean") as Operation["trafficMode"],
    origin: text(raw.origin),
    destination: text(raw.destination),
    status: text(raw.status, "active") as Operation["status"],
    openedAt: text(get(raw, "openedAt", "opened_at")),
    closedAt: text(get(raw, "closedAt", "closed_at"), undefined as unknown as string),
    revenue: number(raw.revenue),
    currency: text(raw.currency, "USD"),
    assignedTo: text(get(raw, "assignedTo", "assigned_to"), "Sales User"),
  };
}

function normalizeInteraction(raw: RawRecord): Interaction {
  return {
    id: text(raw.id),
    partnerId: text(get(raw, "partnerId", "partner_id")),
    contactId: text(get(raw, "contactId", "contact_id"), undefined as unknown as string),
    quoteId: text(get(raw, "quoteId", "quote_id"), undefined as unknown as string),
    taskId: text(get(raw, "taskId", "task_id"), undefined as unknown as string),
    channel: text(raw.channel, "note") as Interaction["channel"],
    direction: text(raw.direction, "internal") as Interaction["direction"],
    subject: text(raw.subject),
    body: text(raw.body),
    occurredAt: text(get(raw, "occurredAt", "occurred_at")),
    createdBy: text(get(raw, "createdBy", "created_by"), "Sales User"),
  };
}

function normalizeNotification(raw: RawRecord): CrmNotification {
  return {
    id: text(raw.id),
    title: text(raw.title),
    message: text(raw.message),
    type: text(raw.type, "system") as CrmNotification["type"],
    severity: text(raw.severity, "info") as CrmNotification["severity"],
    createdAt: text(get(raw, "createdAt", "created_at")),
    readAt: text(get(raw, "readAt", "read_at"), undefined as unknown as string),
    partnerId: text(get(raw, "partnerId", "partner_id"), undefined as unknown as string),
    taskId: text(get(raw, "taskId", "task_id"), undefined as unknown as string),
    quoteId: text(get(raw, "quoteId", "quote_id"), undefined as unknown as string),
    assignedTo: text(get(raw, "assignedTo", "assigned_to"), undefined as unknown as string),
  };
}

function normalizeHistoryEvent(raw: RawRecord): CustomerHistoryEvent {
  return {
    id: text(raw.id),
    partnerId: text(get(raw, "partnerId", "partner_id")),
    type: text(raw.type, "interaction") as CustomerHistoryEvent["type"],
    title: text(raw.title),
    description: text(raw.description),
    occurredAt: text(get(raw, "occurredAt", "occurred_at")),
    actor: text(raw.actor, "CRM API"),
    quoteId: text(get(raw, "quoteId", "quote_id"), undefined as unknown as string),
    taskId: text(get(raw, "taskId", "task_id"), undefined as unknown as string),
    operationId: text(get(raw, "operationId", "operation_id"), undefined as unknown as string),
  };
}

function normalizeSalesEvent(raw: RawRecord): SalesEvent {
  return {
    id: text(raw.id),
    partnerId: text(get(raw, "partnerId", "partner_id")),
    taskId: text(get(raw, "taskId", "task_id"), undefined as unknown as string),
    quoteId: text(get(raw, "quoteId", "quote_id"), undefined as unknown as string),
    contactId: text(get(raw, "contactId", "contact_id"), undefined as unknown as string),
    kind: text(raw.kind, "follow_up"),
    action: text(raw.action),
    note: text(raw.note, undefined as unknown as string),
    nextContactDate: text(
      get(raw, "nextContactDate", "next_contact_date"),
      undefined as unknown as string,
    ),
    status: text(raw.status, undefined as unknown as string),
    occurredAt: text(get(raw, "occurredAt", "occurred_at")),
    actor: text(raw.actor, "CRM API"),
  };
}

function normalizeAutomation(raw: RawRecord): AutomationEvent {
  return {
    id: text(raw.id),
    name: text(raw.name),
    trigger: text(raw.trigger),
    action: text(raw.action),
    status: text(raw.status, "enabled") as AutomationEvent["status"],
    lastRunAt: text(get(raw, "lastRunAt", "last_run_at")),
    nextRunAt: text(get(raw, "nextRunAt", "next_run_at"), undefined as unknown as string),
    generatedTaskId: text(
      get(raw, "generatedTaskId", "generated_task_id"),
      undefined as unknown as string,
    ),
    generatedNotificationId: text(
      get(raw, "generatedNotificationId", "generated_notification_id"),
      undefined as unknown as string,
    ),
  };
}

function normalizePipelineStage(raw: RawRecord): PipelineStage {
  return {
    id: text(raw.id),
    name: text(raw.name),
    status: text(raw.status, "draft") as PipelineStage["status"],
    order: number(raw.order, 0),
  };
}

function normalizePipeline(raw: RawRecord): SalesPipeline {
  return {
    id: text(raw.id),
    name: text(raw.name),
    description: text(raw.description, undefined as unknown as string),
    stages: list<RawRecord>(raw.stages).map(normalizePipelineStage),
  };
}

function normalizeApiConnection(raw: RawRecord): ApiConnectionStatus {
  return {
    id: text(raw.id),
    systemName: text(get(raw, "systemName", "system_name")),
    baseUrl: text(get(raw, "baseUrl", "base_url")),
    status: text(raw.status, "connected") as ApiConnectionStatus["status"],
    lastSyncAt: text(get(raw, "lastSyncAt", "last_sync_at")),
    permissionsSource: text(get(raw, "permissionsSource", "permissions_source")),
    tenantKey: text(get(raw, "tenantKey", "tenant_key")),
    syncMode: text(get(raw, "syncMode", "sync_mode"), "simulation"),
    apiKeyConfigured: Boolean(get(raw, "apiKeyConfigured", "api_key_configured")),
  };
}

export async function fetchBootstrap(token?: string): Promise<BootstrapData> {
  const response = await fetch(`${API_BASE}/api/bootstrap`, {
    headers: requestHeaders(token),
  });
  if (!response.ok) throw new Error(`CRM API returned ${response.status}`);
  const raw = (await response.json()) as Record<string, RawRecord[] | undefined>;
  return {
    partners: list<RawRecord>(raw.partners).map(normalizePartner),
    contacts: list<RawRecord>(raw.contacts).map(normalizeContact),
    tasks: list<RawRecord>(raw.tasks).map(normalizeTask),
    quotes: list<RawRecord>(raw.quotes).map(normalizeQuote),
    operations: list<RawRecord>(raw.operations).map(normalizeOperation),
    interactions: list<RawRecord>(raw.interactions).map(normalizeInteraction),
    notifications: list<RawRecord>(raw.notifications).map(normalizeNotification),
    history: list<RawRecord>(raw.history).map(normalizeHistoryEvent),
    salesEvents: list<RawRecord>(raw.sales_events ?? raw.salesEvents).map(normalizeSalesEvent),
    automations: list<RawRecord>(raw.automations).map(normalizeAutomation),
    pipeline: list<RawRecord>(raw.pipeline).map(normalizePipeline),
    apiConnections: list<RawRecord>(raw.apiConnections ?? raw.api_connections).map(
      normalizeApiConnection,
    ),
  };
}

export async function loginWithApi(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: requestHeaders(undefined, { "Content-Type": "application/json" }),
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    throw new Error(response.status === 401 ? "Invalid email or password" : "Login failed");
  }
  const raw = (await response.json()) as { token: string; user: RawRecord };
  return {
    token: raw.token,
    user: {
      id: text(raw.user.id),
      name: text(raw.user.name),
      email: text(raw.user.email),
      role: text(raw.user.role, undefined as unknown as string),
      tenantKey: text(get(raw.user, "tenantKey", "tenant_key"), DEFAULT_TENANT_KEY),
      permissions: list<string>(raw.user.permissions),
      token: raw.token,
    },
  };
}

export async function signupWithApi(payload: SignupPayload): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE}/api/auth/signup`, {
    method: "POST",
    headers: requestHeaders(undefined, { "Content-Type": "application/json" }),
    body: JSON.stringify(toApiPayload(payload)),
  });
  if (!response.ok) {
    const detail = await response
      .json()
      .then((body) => text((body as RawRecord).detail, "Sign up failed"))
      .catch(() => "Sign up failed");
    throw new Error(detail);
  }
  const raw = (await response.json()) as { token: string; user: RawRecord };
  return {
    token: raw.token,
    user: {
      id: text(raw.user.id),
      name: text(raw.user.name),
      email: text(raw.user.email),
      role: text(raw.user.role, undefined as unknown as string),
      tenantKey: text(get(raw.user, "tenantKey", "tenant_key"), DEFAULT_TENANT_KEY),
      permissions: list<string>(raw.user.permissions),
      token: raw.token,
    },
  };
}

function normalizeUser(raw: RawRecord): User {
  return {
    id: text(raw.id),
    name: text(raw.name),
    email: text(raw.email),
    role: text(raw.role, "sales"),
    tenantKey: text(get(raw, "tenantKey", "tenant_key"), DEFAULT_TENANT_KEY),
    permissions: list<string>(raw.permissions),
  };
}

export async function fetchUsers(token?: string): Promise<User[]> {
  const response = await fetch(`${API_BASE}/api/users`, {
    headers: requestHeaders(token),
  });
  if (!response.ok) throw new Error(`CRM API users returned ${response.status}`);
  return list<RawRecord>(await response.json()).map(normalizeUser);
}

function normalizeAuditEvent(raw: RawRecord): AuditEvent {
  return {
    id: text(raw.id),
    actorId: text(get(raw, "actorId", "actor_id"), undefined as unknown as string),
    actorEmail: text(get(raw, "actorEmail", "actor_email"), undefined as unknown as string),
    action: text(raw.action),
    resource: text(raw.resource),
    resourceId: text(get(raw, "resourceId", "resource_id"), undefined as unknown as string),
    occurredAt: text(get(raw, "occurredAt", "occurred_at")),
    details: (raw.details as Record<string, unknown>) ?? {},
  };
}

export async function fetchAuditEvents(token?: string): Promise<AuditEvent[]> {
  const response = await fetch(`${API_BASE}/api/audit`, {
    headers: requestHeaders(token),
  });
  if (!response.ok) throw new Error(`CRM API audit returned ${response.status}`);
  return list<RawRecord>(await response.json()).map(normalizeAuditEvent);
}

export async function runAutomationEngine(token?: string): Promise<AutomationRunResult> {
  const response = await fetch(`${API_BASE}/api/automations/run`, {
    method: "POST",
    headers: requestHeaders(token),
  });
  if (!response.ok) throw new Error(`CRM API automation run returned ${response.status}`);
  return (await response.json()) as AutomationRunResult;
}

export async function runIntegrationSync(
  connectionId: string,
  token?: string,
): Promise<IntegrationSyncResult> {
  const response = await fetch(
    `${API_BASE}/api/integration/${encodeURIComponent(connectionId)}/sync`,
    {
      method: "POST",
      headers: requestHeaders(token),
    },
  );
  if (!response.ok) throw new Error(`CRM API integration sync returned ${response.status}`);
  return (await response.json()) as IntegrationSyncResult;
}

export async function fetchOperationsAnalytics(token?: string): Promise<OperationsAnalytics> {
  const response = await fetch(`${API_BASE}/api/analytics/operations`, {
    headers: requestHeaders(token),
  });
  if (!response.ok) throw new Error(`CRM API operations analytics returned ${response.status}`);
  return (await response.json()) as OperationsAnalytics;
}

export async function exportCrmData(token?: string): Promise<Record<string, unknown>> {
  const response = await fetch(`${API_BASE}/api/admin/export`, {
    headers: requestHeaders(token),
  });
  if (!response.ok) throw new Error(`CRM API export returned ${response.status}`);
  return (await response.json()) as Record<string, unknown>;
}

export async function importCrmData(
  data: Record<string, unknown>,
  token?: string,
): Promise<BootstrapData> {
  const response = await fetch(`${API_BASE}/api/admin/import`, {
    method: "POST",
    headers: requestHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error(`CRM API import returned ${response.status}`);
  const raw = (await response.json()) as Record<string, RawRecord[] | undefined>;
  return {
    partners: list<RawRecord>(raw.partners).map(normalizePartner),
    contacts: list<RawRecord>(raw.contacts).map(normalizeContact),
    tasks: list<RawRecord>(raw.tasks).map(normalizeTask),
    quotes: list<RawRecord>(raw.quotes).map(normalizeQuote),
    operations: list<RawRecord>(raw.operations).map(normalizeOperation),
    interactions: list<RawRecord>(raw.interactions).map(normalizeInteraction),
    notifications: list<RawRecord>(raw.notifications).map(normalizeNotification),
    history: list<RawRecord>(raw.history).map(normalizeHistoryEvent),
    salesEvents: list<RawRecord>(raw.sales_events ?? raw.salesEvents).map(normalizeSalesEvent),
    automations: list<RawRecord>(raw.automations).map(normalizeAutomation),
    pipeline: list<RawRecord>(raw.pipeline).map(normalizePipeline),
    apiConnections: list<RawRecord>(raw.apiConnections ?? raw.api_connections).map(
      normalizeApiConnection,
    ),
  };
}

export async function upsertResource<T extends { id: string }>(
  resource: ApiResource,
  item: T,
  token?: string,
): Promise<void> {
  const response = await fetch(`${API_BASE}/api/${resource}/${encodeURIComponent(item.id)}`, {
    method: "PUT",
    headers: requestHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify(toApiPayload(item)),
  });
  if (!response.ok) throw new Error(`CRM API ${resource} save returned ${response.status}`);
}

export async function deleteResource(
  resource: ApiResource,
  id: string,
  token?: string,
): Promise<void> {
  const response = await fetch(`${API_BASE}/api/${resource}/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: requestHeaders(token),
  });
  if (!response.ok && response.status !== 404) {
    throw new Error(`CRM API ${resource} delete returned ${response.status}`);
  }
}

export async function fetchPipeline(token?: string): Promise<SalesPipeline[]> {
  const response = await fetch(`${API_BASE}/api/pipeline`, {
    headers: requestHeaders(token),
  });
  if (!response.ok) throw new Error(`CRM API pipeline returned ${response.status}`);
  return list<RawRecord>(await response.json()).map(normalizePipeline);
}
