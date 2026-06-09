from enum import Enum

from pydantic import BaseModel, Field


class StrEnum(str, Enum):
    pass


class PartnerStatus(StrEnum):
    active = "active"
    prospect = "prospect"
    inactive = "inactive"
    lead = "lead"


class PartnerRole(StrEnum):
    customer = "customer"
    supplier = "supplier"
    mixed = "mixed"
    other = "other"


class TaskStatus(StrEnum):
    pending = "pending"
    in_progress = "in_progress"
    on_hold = "on_hold"
    completed = "completed"
    cancelled = "cancelled"


class TaskPriority(StrEnum):
    low = "low"
    medium = "medium"
    high = "high"
    urgent = "urgent"


class QuoteStatus(StrEnum):
    draft = "draft"
    sent = "sent"
    negotiation = "negotiation"
    won = "won"
    lost = "lost"
    expired = "expired"


class PipelineStage(BaseModel):
    id: str
    name: str
    status: QuoteStatus
    order: int


class SalesPipeline(BaseModel):
    id: str
    name: str
    description: str | None = None
    stages: list[PipelineStage] = Field(default_factory=list)


class OperationStatus(StrEnum):
    active = "active"
    completed = "completed"
    cancelled = "cancelled"
    on_hold = "on_hold"


class Partner(BaseModel):
    id: str
    company_name: str
    roles: list[PartnerRole] = Field(default_factory=list)
    status: PartnerStatus
    salesperson: str | None = None
    country: str | None = None
    tax_id: str | None = None
    trade_name: str | None = None
    city: str | None = None
    state: str | None = None
    address: str | None = None
    postal_code: str | None = None
    phones: list[str] = Field(default_factory=list)
    emails: list[str] = Field(default_factory=list)
    website: str | None = None
    language: str | None = None
    manager: str | None = None
    notes: str | None = None
    custom_text: str | None = None
    bank_details: list[dict] = Field(default_factory=list)
    branches: list[dict] = Field(default_factory=list)
    created_at: str | None = None


class Contact(BaseModel):
    id: str
    partner_id: str
    first_name: str
    last_name: str
    position: str | None = None
    email: str | None = None
    phone: str | None = None
    whatsapp: str | None = None
    notes: str | None = None


class SalesTask(BaseModel):
    id: str
    subject: str
    partner_id: str | None = None
    quote_id: str | None = None
    transaction_id: str | None = None
    responsible_user: str
    salesperson: str
    due_date: str
    due_time: str | None = None
    priority: TaskPriority
    status: TaskStatus
    contact_id: str | None = None
    email: str | None = None
    phone: str | None = None
    comment: str | None = None
    created_at: str | None = None
    contact_method: str = "call"
    auto_generated: bool = False


class Quote(BaseModel):
    id: str
    number: str
    partner_id: str
    subject: str
    status: QuoteStatus
    amount: float
    currency: str = "USD"
    issue_date: str
    valid_until: str
    salesperson: str
    contact_id: str | None = None
    notes: str | None = None
    lines: list[dict] = Field(default_factory=list)
    created_at: str | None = None
    reminder_rules: list[dict] = Field(default_factory=list)


class Operation(BaseModel):
    id: str
    number: str
    partner_id: str
    quote_id: str | None = None
    status: OperationStatus
    traffic_mode: str
    origin: str
    destination: str
    opened_at: str
    revenue: float
    currency: str = "USD"
    closed_at: str | None = None
    assigned_to: str = "Sales User"


class Interaction(BaseModel):
    id: str
    partner_id: str
    contact_id: str | None = None
    quote_id: str | None = None
    task_id: str | None = None
    channel: str
    direction: str
    subject: str
    body: str
    occurred_at: str
    created_by: str


class CrmNotification(BaseModel):
    id: str
    title: str
    message: str
    type: str
    severity: str
    created_at: str
    read_at: str | None = None
    partner_id: str | None = None
    task_id: str | None = None
    quote_id: str | None = None
    assigned_to: str | None = None


class AutomationEvent(BaseModel):
    id: str
    name: str
    trigger: str
    action: str
    status: str
    last_run_at: str
    next_run_at: str | None = None
    generated_task_id: str | None = None
    generated_notification_id: str | None = None


class CustomerHistoryEvent(BaseModel):
    id: str
    partner_id: str
    type: str
    title: str
    description: str
    occurred_at: str
    actor: str
    quote_id: str | None = None
    task_id: str | None = None
    operation_id: str | None = None


class SalesEvent(BaseModel):
    id: str
    partner_id: str
    task_id: str | None = None
    quote_id: str | None = None
    contact_id: str | None = None
    kind: str
    action: str
    note: str | None = None
    next_contact_date: str | None = None
    status: str | None = None
    occurred_at: str
    actor: str


class LoginRequest(BaseModel):
    email: str
    password: str


class UserAccount(BaseModel):
    id: str
    name: str
    email: str
    role: str = "sales"
    tenant_key: str = "uy-main"
    permissions: list[str] = Field(default_factory=list)


class ApiConnectionStatus(BaseModel):
    id: str
    system_name: str
    base_url: str
    status: str = "connected"
    last_sync_at: str
    permissions_source: str
    tenant_key: str
    sync_mode: str = "simulation"
    api_key_configured: bool = False


class AuditEvent(BaseModel):
    id: str
    actor_id: str | None = None
    actor_email: str | None = None
    action: str
    resource: str
    resource_id: str | None = None
    occurred_at: str
    details: dict = Field(default_factory=dict)
