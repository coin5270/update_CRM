import json
import os
from copy import deepcopy
from contextlib import contextmanager
from contextvars import ContextVar
from pathlib import Path
from typing import Any

import psycopg
from psycopg.rows import dict_row

from app.models import AutomationEvent, Contact, CrmNotification, Interaction, Operation, Partner, Quote, SalesTask

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = Path(__file__).resolve().parents[1] / "data"
DB_FILE = DATA_DIR / "crm.sqlite3"

try:
    from dotenv import load_dotenv

    load_dotenv(PROJECT_ROOT / ".env", override=False)
    load_dotenv(PROJECT_ROOT / ".env.local", override=True)
except ImportError:
    pass

DB_URL = os.getenv("CRM_DATABASE_URL", "").strip()
DEFAULT_TENANT_KEY = "uy-main"
_CURRENT_TENANT_KEY: ContextVar[str] = ContextVar("current_tenant_key", default=DEFAULT_TENANT_KEY)
USE_POSTGRES = bool(DB_URL)

RESOURCE_TABLES = {
    "partners": "crm_partners",
    "contacts": "crm_contacts",
    "tasks": "crm_tasks",
    "quotes": "crm_opportunities",
    "opportunities": "crm_opportunities",
    "operations": "crm_operations",
    "interactions": "crm_interactions",
    "notifications": "crm_alerts",
    "history": "crm_customer_history",
    "sales_events": "crm_sales_events",
    "automations": "crm_reminders",
    "reminders": "crm_reminders",
    "pipeline": "crm_pipeline",
    "api_connections": "crm_api_connections",
    "users": "crm_users",
    "sessions": "crm_sessions",
    "audit": "crm_audit",
}

seed_partners = [
    Partner(id="p1", company_name="Acme Logistics S.A.", roles=["customer", "supplier"], status="active", salesperson="Maria Lopez", country="Argentina", tax_id="30-12345678-9"),
    Partner(id="p2", company_name="Global Freight Partners LLC", roles=["customer"], status="prospect", salesperson="Juan Smith", country="USA"),
]
seed_contacts = [
    Contact(id="c1", partner_id="p1", first_name="Lucia", last_name="Fernandez", email="lucia@acme-logistics.com"),
    Contact(id="c2", partner_id="p2", first_name="Sarah", last_name="Mitchell", email="sarah@gfp.com"),
]
seed_tasks = [
    SalesTask(id="t1", subject="Follow up on Q4 freight contract", partner_id="p1", quote_id="q1", responsible_user="Maria Lopez", salesperson="Maria Lopez", due_date="2026-05-27", due_time="10:30", priority="high", status="pending", contactMethod="call"),
]
seed_quotes = [
    Quote(id="q1", number="Q-2034", partner_id="p1", subject="Q4 freight contract", status="sent", amount=48500, issue_date="2026-05-19", valid_until="2026-06-09", salesperson="Maria Lopez", lines=[], createdAt="2026-05-19T00:00:00Z"),
]
seed_operations = [
    Operation(id="op1", number="OP-8910", partner_id="p1", quote_id="q1", status="active", traffic_mode="ocean", origin="Buenos Aires", destination="Miami", opened_at="2026-05-21", revenue=48500, currency="USD", assigned_to="Maria Lopez"),
]
seed_interactions = [
    Interaction(id="i1", partner_id="p1", channel="email", direction="outbound", subject="Updated tariff sheet sent", body="Shared revised ocean freight rates.", occurred_at="2026-05-25", created_by="Maria Lopez"),
]
seed_notifications = [
    CrmNotification(id="n1", title="Quote expiring soon", message="Q-2034 expires soon.", type="reminder", severity="warning", created_at="2026-05-25", partner_id="p1"),
]
seed_automations = [
    AutomationEvent(id="a1", name="Quote expiry reminders", trigger="Quote valid-until date approaches", action="Create task and notification", status="enabled", last_run_at="2026-05-26", next_run_at="2026-05-27"),
]
seed_pipeline = [
    {
        "id": "pipeline-default",
        "name": "Sales pipeline",
        "description": "Default opportunity stages for the CRM.",
        "stages": [
            {"id": "pipeline-stage-draft", "name": "Draft", "status": "draft", "order": 1},
            {"id": "pipeline-stage-sent", "name": "Sent", "status": "sent", "order": 2},
            {"id": "pipeline-stage-negotiation", "name": "Negotiation", "status": "negotiation", "order": 3},
            {"id": "pipeline-stage-won", "name": "Won", "status": "won", "order": 4},
            {"id": "pipeline-stage-lost", "name": "Lost", "status": "lost", "order": 5},
        ],
    }
]
seed_history = [
    {"id": "h1", "partner_id": "p1", "type": "quote", "title": "Quote Q-2034 sent", "description": "Commercial proposal sent for Q4 freight contract.", "occurred_at": "2026-05-19", "actor": "Maria Lopez", "quote_id": "q1"},
]
seed_sales_events = [
    {
        "id": "se1",
        "partner_id": "p1",
        "task_id": "t1",
        "quote_id": "q1",
        "contact_id": "c1",
        "kind": "follow_up",
        "action": "Quoted shipment options and requested confirmation.",
        "note": "Waiting on approval from Lucia.",
        "next_contact_date": "2026-05-28",
        "status": "open",
        "occurred_at": "2026-05-26",
        "actor": "Maria Lopez",
    }
]
seed_api_connections = [
    {"id": "api1", "system_name": "SDC Cargo", "base_url": "https://api.sdc-cargo.example", "status": "connected", "last_sync_at": "2026-05-26", "permissions_source": "Management software user profile", "tenant_key": "uy-main", "sync_mode": "simulation", "api_key_configured": False},
]
seed_users = [
    {"id": "u0", "name": "Super Admin", "email": "superadmin@salescrm.app", "role": "super_admin", "tenant_key": DEFAULT_TENANT_KEY, "password_hash": "ff2c647c8d7107c022da686c23d3244a24ca9249f6f8dd7a4de3b76744e67172", "permissions": ["*:write"]},
    {"id": "u1", "name": "Maria Lopez", "email": "maria@salescrm.app", "role": "sales_manager", "tenant_key": DEFAULT_TENANT_KEY, "password_hash": "ff2c647c8d7107c022da686c23d3244a24ca9249f6f8dd7a4de3b76744e67172", "permissions": ["partners:read", "partners:write", "contacts:read", "contacts:write", "tasks:read", "tasks:write", "quotes:read", "quotes:write", "operations:read", "operations:write", "interactions:read", "interactions:write", "notifications:read", "notifications:write", "history:read", "history:write", "automations:read", "automations:write", "integration:read", "integration:write", "pipeline:read", "pipeline:write", "audit:read", "users:read", "users:write"]},
    {"id": "u2", "name": "Juan Smith", "email": "juan@salescrm.app", "role": "sales", "tenant_key": DEFAULT_TENANT_KEY, "password_hash": "ff2c647c8d7107c022da686c23d3244a24ca9249f6f8dd7a4de3b76744e67172", "permissions": ["partners:read", "contacts:read", "tasks:read", "tasks:write", "quotes:read", "operations:read", "interactions:read", "interactions:write", "notifications:read", "notifications:write", "history:read", "pipeline:read"]},
    {"id": "u3", "name": "Admin Lite", "email": "admin-lite@salescrm.app", "role": "sales_manager", "tenant_key": DEFAULT_TENANT_KEY, "password_hash": "ff2c647c8d7107c022da686c23d3244a24ca9249f6f8dd7a4de3b76744e67172", "permissions": ["partners:read", "partners:write", "contacts:read", "contacts:write", "tasks:read", "tasks:write", "quotes:read", "quotes:write", "operations:read", "interactions:read", "interactions:write", "notifications:read", "notifications:write", "history:read", "users:read", "users:write"]},
]


def _to_jsonable(value: Any) -> Any:
    if hasattr(value, "model_dump"):
        return value.model_dump(mode="json")
    if isinstance(value, list):
        return [_to_jsonable(item) for item in value]
    if isinstance(value, dict):
        return {key: _to_jsonable(item) for key, item in value.items()}
    return value


@contextmanager
def tenant_scope(tenant_key: str | None):
    token = _CURRENT_TENANT_KEY.set((tenant_key or DEFAULT_TENANT_KEY).strip() or DEFAULT_TENANT_KEY)
    try:
        yield
    finally:
        _CURRENT_TENANT_KEY.reset(token)


def current_tenant_key() -> str:
    return _CURRENT_TENANT_KEY.get()


def _with_tenant(item: dict[str, Any], tenant_key: str | None = None) -> dict[str, Any]:
    return {**item, "tenant_id": tenant_key or current_tenant_key()}


def _table_for(resource: str) -> str:
    if resource not in RESOURCE_TABLES:
        raise KeyError(f"Unknown CRM resource: {resource}")
    return RESOURCE_TABLES[resource]


def _connect():
    if USE_POSTGRES:
        return psycopg.connect(DB_URL, row_factory=dict_row)
    raise RuntimeError("CRM_DATABASE_URL is required for backend storage")


def database_status() -> dict[str, str]:
    try:
        with _connect() as connection:
            connection.execute("SELECT 1").fetchone()
        return {"status": "ok"}
    except Exception as error:
        return {"status": "error", "detail": str(error)}


def _placeholder() -> str:
    return "%s"


def _payload_sql() -> str:
    return "payload JSONB NOT NULL"


def _json_param(value: Any) -> Any:
    return json.dumps(value, ensure_ascii=False)


def _json_decode(payload: Any) -> dict[str, Any]:
    if isinstance(payload, dict):
        return payload
    return json.loads(payload)


def _seed_data() -> dict[str, object]:
    payload = _to_jsonable({"partners": seed_partners, "contacts": seed_contacts, "tasks": seed_tasks, "quotes": seed_quotes, "operations": seed_operations, "interactions": seed_interactions, "notifications": seed_notifications, "history": seed_history, "sales_events": seed_sales_events, "automations": seed_automations, "pipeline": seed_pipeline, "reminders": [], "api_connections": seed_api_connections, "users": seed_users, "sessions": [], "audit": []})
    for resource, values in payload.items():
        if isinstance(values, list):
            payload[resource] = [_with_tenant(item, DEFAULT_TENANT_KEY) if isinstance(item, dict) and item.get("id") else item for item in values]
    return payload


def _ensure_schema(connection) -> None:
    for table_name in RESOURCE_TABLES.values():
        connection.execute(
            f"""
            CREATE TABLE IF NOT EXISTS {table_name} (
                tenant_id TEXT NOT NULL DEFAULT '{DEFAULT_TENANT_KEY}',
                id TEXT NOT NULL,
                {_payload_sql()},
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                PRIMARY KEY (tenant_id, id)
            )
            """
        )


def _ensure_seeded() -> None:
    with _connect() as connection:
        _ensure_schema(connection)
        for resource, values in _seed_data().items():
            if not isinstance(values, list):
                continue
            table_name = _table_for(resource)
            for item in values:
                if not isinstance(item, dict) or not item.get("id"):
                    continue
                payload = _with_tenant(item, item.get("tenant_id"))
                connection.execute(
                    f"""
                    INSERT INTO {table_name} (tenant_id, id, payload)
                    VALUES ({_placeholder()}, {_placeholder()}, {_placeholder()}::jsonb)
                    ON CONFLICT (tenant_id, id) DO NOTHING
                    """,
                    (payload["tenant_id"], item["id"], _json_param(payload)),
                )
        connection.commit()


def collection(name: str) -> list[dict[str, Any]]:
    _ensure_seeded()
    table_name = _table_for(name)
    with _connect() as connection:
        rows = connection.execute(
            f"SELECT payload FROM {table_name} WHERE tenant_id = {_placeholder()} ORDER BY updated_at DESC, id",
            (current_tenant_key(),),
        ).fetchall()
    return [_json_decode(row["payload"]) for row in rows]


def collection_any_tenant(name: str) -> list[dict[str, Any]]:
    _ensure_seeded()
    table_name = _table_for(name)
    with _connect() as connection:
        rows = connection.execute(f"SELECT payload FROM {table_name} ORDER BY updated_at DESC, id").fetchall()
    return [_json_decode(row["payload"]) for row in rows]


def get_any_tenant(name: str, item_id: str) -> dict[str, Any] | None:
    _ensure_seeded()
    table_name = _table_for(name)
    with _connect() as connection:
        row = connection.execute(
            f"SELECT payload FROM {table_name} WHERE id = {_placeholder()} ORDER BY updated_at DESC LIMIT 1",
            (item_id,),
        ).fetchone()
    return _json_decode(row["payload"]) if row else None


def upsert(name: str, item: dict[str, Any]) -> dict[str, Any]:
    if not item.get("id"):
        raise ValueError("Item requires an id")
    _ensure_seeded()
    payload = _with_tenant(item)
    table_name = _table_for(name)
    with _connect() as connection:
        connection.execute(
            f"""
            INSERT INTO {table_name} (tenant_id, id, payload, updated_at)
            VALUES ({_placeholder()}, {_placeholder()}, {_placeholder()}::jsonb, NOW())
            ON CONFLICT (tenant_id, id) DO UPDATE SET
                payload = excluded.payload,
                updated_at = NOW()
            """,
            (payload["tenant_id"], str(item["id"]), _json_param(payload)),
        )
        connection.commit()
    return deepcopy(payload)


def delete(name: str, item_id: str) -> bool:
    _ensure_seeded()
    table_name = _table_for(name)
    with _connect() as connection:
        cursor = connection.execute(
            f"DELETE FROM {table_name} WHERE id = {_placeholder()} AND tenant_id = {_placeholder()}",
            (item_id, current_tenant_key()),
        )
        connection.commit()
    return cursor.rowcount > 0


def all_data() -> dict[str, object]:
    _ensure_seeded()
    return {name: collection(name) for name in ["partners", "contacts", "tasks", "quotes", "operations", "interactions", "notifications", "history", "sales_events", "automations", "pipeline", "reminders", "api_connections", "users", "audit"]}


def replace_all(data: dict[str, Any]) -> dict[str, object]:
    allowed = {"partners", "contacts", "tasks", "quotes", "operations", "interactions", "notifications", "history", "automations", "pipeline", "reminders", "api_connections", "users", "audit"}
    with _connect() as connection:
        _ensure_schema(connection)
        for resource, values in data.items():
            if resource not in allowed or not isinstance(values, list):
                continue
            table_name = _table_for(resource)
            connection.execute(f"DELETE FROM {table_name} WHERE tenant_id = {_placeholder()}", (current_tenant_key(),))
            for item in values:
                if not isinstance(item, dict) or not item.get("id"):
                    continue
                payload = _with_tenant(item)
                connection.execute(
                    f"INSERT INTO {table_name} (tenant_id, id, payload) VALUES ({_placeholder()}, {_placeholder()}, {_placeholder()}{'::jsonb' if USE_POSTGRES else ''})",
                    (payload["tenant_id"], item["id"], _json_param(payload)),
                )
        connection.commit()
    _ensure_seeded()
    return all_data()
