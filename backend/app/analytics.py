from collections import Counter
from datetime import date
from typing import Any

from app import repository


def _parse_date(value: str | None) -> date | None:
    if not value:
        return None
    try:
        return date.fromisoformat(value)
    except ValueError:
        return None


def operations_summary() -> dict[str, Any]:
    operations = repository.collection("operations")
    quotes = repository.collection("quotes")
    history = repository.collection("history")

    active_operations = [operation for operation in operations if operation.get("status") == "active"]
    traffic_counts = Counter(operation.get("traffic_mode", "unknown") for operation in operations)
    quoted_operations = [operation for operation in operations if operation.get("quote_id")]
    last_operation = max(
        operations,
        key=lambda operation: (_parse_date(operation.get("opened_at")) or date.min, operation.get("id", "")),
        default=None,
    )

    operations_by_traffic = [
        {"traffic_mode": traffic_mode, "count": count}
        for traffic_mode, count in sorted(traffic_counts.items(), key=lambda item: item[0])
    ]
    quote_operation_ratio = round(len(quoted_operations) / len(quotes), 2) if quotes else 0.0
    operational_history = [
        event
        for event in history
        if event.get("type") in {"operation", "automation"} or event.get("operation_id")
    ]

    return {
        "operation_count": len(operations),
        "active_operations": len(active_operations),
        "completed_operations": len([operation for operation in operations if operation.get("status") == "completed"]),
        "total_revenue": sum(float(operation.get("revenue", 0)) for operation in operations),
        "last_operation": last_operation,
        "operations_by_traffic": operations_by_traffic,
        "quote_operation_ratio": quote_operation_ratio,
        "operational_history_count": len(operational_history),
        "recent_history": sorted(
            operational_history,
            key=lambda event: event.get("occurred_at", ""),
            reverse=True,
        )[:5],
    }
