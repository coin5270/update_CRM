from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from app import repository


def log(
    action: str,
    resource: str,
    user: dict[str, Any] | None = None,
    resource_id: str | None = None,
    details: dict[str, Any] | None = None,
) -> dict[str, Any]:
    event = {
        "id": f"audit-{uuid4().hex}",
        "actor_id": user.get("id") if user else None,
        "actor_email": user.get("email") if user else None,
        "action": action,
        "resource": resource,
        "resource_id": resource_id,
        "occurred_at": datetime.now(timezone.utc).isoformat(),
        "details": details or {},
    }
    repository.upsert("audit", event)
    return event
