from datetime import datetime, timezone
from typing import Any

from app import repository


def sync_connection(connection_id: str = "api1") -> dict[str, Any]:
    connection = next(
        (item for item in repository.collection("api_connections") if item.get("id") == connection_id),
        None,
    )
    if not connection:
        raise ValueError("Integration connection not found")

    now = datetime.now(timezone.utc).isoformat()
    configured = bool(connection.get("api_key_configured"))
    next_connection = {
        **connection,
        "status": "connected" if configured else "degraded",
        "last_sync_at": now,
        "sync_mode": connection.get("sync_mode", "simulation"),
    }
    repository.upsert("api_connections", next_connection)

    history_id = f"integration-sync-{connection_id}-{now[:10]}"
    if not any(item.get("id") == history_id for item in repository.collection("history")):
        repository.upsert(
            "history",
            {
                "id": history_id,
                "partner_id": "p1",
                "type": "automation",
                "title": f"{connection.get('system_name', 'External system')} sync completed",
                "description": "Simulated API sync refreshed CRM integration status.",
                "occurred_at": now[:10],
                "actor": "Integration sync",
            },
        )

    return {
        "connection_id": connection_id,
        "system_name": next_connection.get("system_name"),
        "status": next_connection["status"],
        "last_sync_at": next_connection["last_sync_at"],
        "imported_partners": len(repository.collection("partners")),
        "imported_operations": len(repository.collection("operations")),
        "mode": next_connection.get("sync_mode", "simulation"),
    }
