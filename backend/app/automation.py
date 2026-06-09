from datetime import date, datetime, timedelta, timezone
from typing import Any

from app import repository


def _parse_date(value: str | None) -> date | None:
    if not value:
        return None
    try:
        return date.fromisoformat(value)
    except ValueError:
        return None


def _exists(resource: str, item_id: str) -> bool:
    return any(item.get("id") == item_id for item in repository.collection(resource))


def _today() -> date:
    return date.today()


def _automation_enabled(automation_id: str) -> bool:
    automation = next(
        (item for item in repository.collection("automations") if item.get("id") == automation_id),
        None,
    )
    return not automation or automation.get("status") == "enabled"


def run_automations() -> dict[str, Any]:
    today = _today()
    created_tasks = 0
    created_notifications = 0
    created_history = 0

    if _automation_enabled("a1"):
        for quote in repository.collection("quotes"):
            valid_until = _parse_date(quote.get("valid_until"))
            if not valid_until:
                continue
            days_until_expiry = (valid_until - today).days
            if days_until_expiry < 0:
                continue
            if days_until_expiry > 14:
                continue

            quote_id = quote["id"]
            task_id = f"auto-quote-expiry-{quote_id}"
            notification_id = f"auto-notification-quote-expiry-{quote_id}"
            history_id = f"auto-history-quote-expiry-{quote_id}"

            if not _exists("tasks", task_id):
                repository.upsert(
                    "tasks",
                    {
                        "id": task_id,
                        "partner_id": quote.get("partner_id"),
                        "quote_id": quote_id,
                        "subject": f"Follow up before {quote.get('number', 'quote')} expires",
                        "comment": f"Quote expires in {days_until_expiry} days.",
                        "responsible_user": quote.get("salesperson", "Sales User"),
                        "salesperson": quote.get("salesperson", "Sales User"),
                        "created_at": today.isoformat(),
                        "due_date": min(today + timedelta(days=1), valid_until).isoformat(),
                        "priority": "high" if days_until_expiry <= 3 else "medium",
                        "status": "pending",
                        "contact_method": "email",
                        "auto_generated": True,
                    },
                )
                created_tasks += 1

            if not _exists("notifications", notification_id):
                repository.upsert(
                    "notifications",
                    {
                        "id": notification_id,
                        "title": "Quote expiring soon",
                        "message": f"{quote.get('number', 'Quote')} expires on {valid_until.isoformat()}.",
                        "type": "reminder",
                        "severity": "warning" if days_until_expiry > 3 else "critical",
                        "created_at": today.isoformat(),
                        "partner_id": quote.get("partner_id"),
                        "quote_id": quote_id,
                        "assigned_to": quote.get("salesperson"),
                    },
                )
                created_notifications += 1

            if not _exists("history", history_id):
                repository.upsert(
                    "history",
                    {
                        "id": history_id,
                        "partner_id": quote.get("partner_id"),
                        "type": "automation",
                        "title": "Quote expiry automation ran",
                        "description": f"Created follow-up tracking for {quote.get('number', 'quote')}.",
                        "occurred_at": today.isoformat(),
                        "actor": "CRM automation engine",
                        "quote_id": quote_id,
                        "task_id": task_id,
                    },
                )
                created_history += 1

        for quote in repository.collection("quotes"):
            valid_until = _parse_date(quote.get("valid_until"))
            if not valid_until or valid_until >= today:
                continue
            if quote.get("status") in {"won", "lost", "expired"}:
                continue
            history_created, notification_created = _expire_quote(quote, today)
            created_history += int(history_created)
            created_notifications += int(notification_created)

        _touch_automation("a1", today)

    if _automation_enabled("a2"):
        for task in repository.collection("tasks"):
            due_date = _parse_date(task.get("due_date"))
            if not due_date or due_date >= today or task.get("status") in {"completed", "cancelled"}:
                continue

            task_id = task["id"]
            notification_id = f"auto-notification-overdue-task-{task_id}"
            if _exists("notifications", notification_id):
                continue
            repository.upsert(
                "notifications",
                {
                    "id": notification_id,
                    "title": "Overdue task",
                    "message": f"{task.get('subject', 'Task')} is overdue.",
                    "type": "alert",
                    "severity": "critical",
                    "created_at": today.isoformat(),
                    "partner_id": task.get("partner_id"),
                    "task_id": task_id,
                    "assigned_to": task.get("responsible_user"),
                },
            )
            created_notifications += 1

        _touch_automation("a2", today)

    return {
        "created_tasks": created_tasks,
        "created_notifications": created_notifications,
        "created_history": created_history,
        "ran_at": datetime.now(timezone.utc).isoformat(),
    }


def _expire_quote(quote: dict[str, Any], today: date) -> tuple[bool, bool]:
    quote_id = quote["id"]
    partner_id = quote.get("partner_id")
    history_id = f"auto-history-quote-overdue-{quote_id}"
    notification_id = f"auto-notification-quote-overdue-{quote_id}"
    history_created = not _exists("history", history_id)
    notification_created = not _exists("notifications", notification_id)
    repository.upsert(
        "quotes",
        {
            **quote,
            "status": "expired",
        },
    )
    repository.upsert(
        "history",
        {
            "id": history_id,
            "partner_id": partner_id,
            "type": "quote",
            "title": "Quote marked expired automatically",
            "description": f"Quote {quote.get('number', quote_id)} passed its valid-until date.",
            "occurred_at": today.isoformat(),
            "actor": "CRM automation engine",
            "quote_id": quote_id,
        },
    )
    repository.upsert(
        "notifications",
        {
            "id": notification_id,
            "title": "Quote expired",
            "message": f"{quote.get('number', 'Quote')} expired on {quote.get('valid_until')}.",
            "type": "alert",
            "severity": "critical",
            "created_at": today.isoformat(),
            "partner_id": partner_id,
            "quote_id": quote_id,
            "assigned_to": quote.get("salesperson"),
        },
    )
    return history_created, notification_created


def _touch_automation(automation_id: str, today: date) -> None:
    automation = next(
        (item for item in repository.collection("automations") if item.get("id") == automation_id),
        None,
    )
    if not automation:
        return
    repository.upsert(
        "automations",
        {
            **automation,
            "last_run_at": today.isoformat(),
            "next_run_at": (today + timedelta(days=1)).isoformat(),
        },
    )
