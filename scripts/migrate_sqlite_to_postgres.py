from __future__ import annotations

import json
import os
import sqlite3
from pathlib import Path

import psycopg
from psycopg.rows import dict_row

ROOT = Path(__file__).resolve().parents[1]
SQLITE_DB = Path(os.getenv("CRM_SQLITE_SOURCE", str(ROOT / "backend" / "data" / "crm.sqlite3"))).expanduser()
PG_URL = os.getenv("CRM_DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/salescrm").strip()

TABLES = {
    "partners": "crm_partners",
    "contacts": "crm_contacts",
    "tasks": "crm_tasks",
    "quotes": "crm_opportunities",
    "operations": "crm_operations",
    "interactions": "crm_interactions",
    "notifications": "crm_alerts",
    "history": "crm_customer_history",
    "automations": "crm_reminders",
    "pipeline": "crm_pipeline",
    "api_connections": "crm_api_connections",
    "users": "crm_users",
    "sessions": "crm_sessions",
    "audit": "crm_audit",
}


def read_sqlite_payloads() -> dict[str, list[dict[str, object]]]:
    if not SQLITE_DB.exists():
        raise SystemExit(f"SQLite database not found: {SQLITE_DB}")
    conn = sqlite3.connect(SQLITE_DB)
    conn.row_factory = sqlite3.Row
    data: dict[str, list[dict[str, object]]] = {key: [] for key in TABLES}
    try:
        for resource, table in TABLES.items():
            rows = conn.execute(f"SELECT payload FROM {table}").fetchall()
            for row in rows:
                payload = row["payload"]
                data[resource].append(json.loads(payload) if isinstance(payload, str) else dict(payload))
    finally:
        conn.close()
    return data


def ensure_schema(conn: psycopg.Connection) -> None:
    for table in TABLES.values():
        conn.execute(
            f"""
            CREATE TABLE IF NOT EXISTS {table} (
                tenant_id TEXT NOT NULL DEFAULT 'uy-main',
                id TEXT NOT NULL,
                payload JSONB NOT NULL,
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                PRIMARY KEY (tenant_id, id)
            )
            """
        )


def main() -> None:
    payloads = read_sqlite_payloads()
    with psycopg.connect(PG_URL, row_factory=dict_row) as conn:
        ensure_schema(conn)
        for resource, rows in payloads.items():
            table = TABLES[resource]
            conn.execute(f"DELETE FROM {table}")
            for row in rows:
                tenant_id = row.get("tenant_id", "uy-main")
                row_id = row["id"]
                conn.execute(
                    f"""
                    INSERT INTO {table} (tenant_id, id, payload)
                    VALUES (%s, %s, %s::jsonb)
                    """,
                    (tenant_id, row_id, json.dumps(row, ensure_ascii=False)),
                )
        conn.commit()
    print(f"Migrated SQLite data from {SQLITE_DB} to {PG_URL}")


if __name__ == "__main__":
    main()
