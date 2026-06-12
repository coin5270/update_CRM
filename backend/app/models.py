from enum import Enum
from datetime import date, datetime
import re

from pydantic import BaseModel, Field, field_validator


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


class TrafficMode(StrEnum):
    ocean = "ocean"
    air = "air"
    road = "road"
    rail = "rail"
    multimodal = "multimodal"


class InteractionChannel(StrEnum):
    email = "email"
    call = "call"
    whatsapp = "whatsapp"
    meeting = "meeting"
    note = "note"


class InteractionDirection(StrEnum):
    inbound = "inbound"
    outbound = "outbound"
    internal = "internal"


def _validate_iso_date(value: str | None) -> str | None:
    if value in (None, ""):
        return value
    try:
        if "T" in value:
            datetime.fromisoformat(value.replace("Z", "+00:00"))
        else:
            date.fromisoformat(value)
    except ValueError as error:
        raise ValueError("Date must use YYYY-MM-DD or ISO datetime format") from error
    return value


def _validate_email(value: str | None) -> str | None:
    if value in (None, ""):
        return value
    if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", value):
        raise ValueError("Invalid email format")
    return value.lower()


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

    @field_validator("created_at")
    @classmethod
    def validate_created_at(cls, value: str | None) -> str | None:
        return _validate_iso_date(value)

    @field_validator("emails")
    @classmethod
    def validate_emails(cls, values: list[str]) -> list[str]:
        return [_validate_email(value) or value for value in values]


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

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str | None) -> str | None:
        return _validate_email(value)


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

    @field_validator("due_date", "created_at")
    @classmethod
    def validate_dates(cls, value: str | None) -> str | None:
        return _validate_iso_date(value)


class Quote(BaseModel):
    id: str
    number: str
    partner_id: str
    subject: str
    status: QuoteStatus
    amount: float = Field(ge=0)
    currency: str = "USD"
    issue_date: str
    valid_until: str
    salesperson: str
    contact_id: str | None = None
    notes: str | None = None
    lines: list[dict] = Field(default_factory=list)
    created_at: str | None = None
    reminder_rules: list[dict] = Field(default_factory=list)

    @field_validator("issue_date", "valid_until", "created_at")
    @classmethod
    def validate_dates(cls, value: str | None) -> str | None:
        return _validate_iso_date(value)


class Operation(BaseModel):
    id: str
    number: str
    partner_id: str
    quote_id: str | None = None
    status: OperationStatus
    traffic_mode: TrafficMode
    origin: str
    destination: str
    opened_at: str
    revenue: float = Field(ge=0)
    currency: str = "USD"
    closed_at: str | None = None
    assigned_to: str = "Sales User"

    @field_validator("opened_at", "closed_at")
    @classmethod
    def validate_dates(cls, value: str | None) -> str | None:
        return _validate_iso_date(value)


class Interaction(BaseModel):
    id: str
    partner_id: str
    contact_id: str | None = None
    quote_id: str | None = None
    task_id: str | None = None
    channel: InteractionChannel
    direction: InteractionDirection
    subject: str
    body: str
    occurred_at: str
    created_by: str

    @field_validator("occurred_at")
    @classmethod
    def validate_occurred_at(cls, value: str) -> str:
        return _validate_iso_date(value) or value


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

    @field_validator("created_at", "read_at")
    @classmethod
    def validate_dates(cls, value: str | None) -> str | None:
        return _validate_iso_date(value)


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

    @field_validator("last_run_at", "next_run_at")
    @classmethod
    def validate_dates(cls, value: str | None) -> str | None:
        return _validate_iso_date(value)


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

    @field_validator("occurred_at")
    @classmethod
    def validate_occurred_at(cls, value: str) -> str:
        return _validate_iso_date(value) or value


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

    @field_validator("next_contact_date", "occurred_at")
    @classmethod
    def validate_dates(cls, value: str | None) -> str | None:
        return _validate_iso_date(value)


class LoginRequest(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        return _validate_email(value) or value


class UserAccount(BaseModel):
    id: str
    name: str
    email: str
    role: str = "sales"
    tenant_key: str = "uy-main"
    permissions: list[str] = Field(default_factory=list)
    password: str | None = Field(default=None, min_length=8)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        return _validate_email(value) or value

    @field_validator("role")
    @classmethod
    def validate_role(cls, value: str) -> str:
        allowed = {"super_admin", "sales_manager", "sales", "operations", "viewer"}
        if value not in allowed:
            raise ValueError(f"Role must be one of: {', '.join(sorted(allowed))}")
        return value


class SignupRequest(BaseModel):
    name: str
    email: str
    password: str = Field(min_length=8)
    tenant_key: str
    company_name: str | None = None

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        return _validate_email(value) or value

    @field_validator("tenant_key")
    @classmethod
    def validate_tenant_key(cls, value: str) -> str:
        normalized = value.strip().lower()
        if not re.match(r"^[a-z0-9][a-z0-9-]{1,62}$", normalized):
            raise ValueError("Tenant key must use lowercase letters, numbers, and hyphens")
        return normalized


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8)


class ReminderRule(BaseModel):
    id: str
    quote_id: str | None = None
    task_id: str | None = None
    name: str
    trigger: str
    action: str
    status: str = "enabled"
    next_run_at: str | None = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str) -> str:
        if value not in {"enabled", "paused", "completed"}:
            raise ValueError("Status must be enabled, paused, or completed")
        return value

    @field_validator("next_run_at")
    @classmethod
    def validate_next_run_at(cls, value: str | None) -> str | None:
        return _validate_iso_date(value)


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
