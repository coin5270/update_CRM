from datetime import date, timedelta

import pytest
from pydantic import ValidationError

from app import audit, auth, automation, integration
from app import analytics
from app import main
from app.models import Partner
from app.models import Operation
from app.models import Quote
from app.models import SalesTask
from app.models import Interaction
from app.models import CrmNotification
from app.models import AutomationEvent


def test_auth_roundtrip(isolated_repository):
    assert auth.authenticate("maria@salescrm.app", "wrong") is None

    user = auth.authenticate("maria@salescrm.app", "demo")
    assert user is not None
    assert user["email"] == "maria@salescrm.app"

    public = auth.public_user(user)
    assert public == {
        "id": "u1",
        "name": "Maria Lopez",
        "email": "maria@salescrm.app",
        "role": "sales_manager",
        "tenant_key": "uy-main",
        "permissions": user["permissions"],
    }

    session = auth.create_session(user)
    assert session["id"]
    assert session["tenant_key"] == "uy-main"
    assert auth.user_for_token(session["id"])["email"] == "maria@salescrm.app"
    assert auth.tenant_for_token(session["id"]) == "uy-main"
    assert auth.user_for_token("missing-token") is None


def test_login_finds_user_from_another_tenant(isolated_repository):
    repository = isolated_repository
    with repository.tenant_scope("company-b-main"):
        other_user = repository.upsert(
            "users",
            {
                "id": "u-company-b",
                "name": "Company B User",
                "email": "company-b@salescrm.app",
                "role": "sales",
                "tenant_key": "company-b-main",
                "password_hash": auth.password_hash("demo"),
                "permissions": ["partners:read"],
            },
        )

    with repository.tenant_scope("uy-main"):
        user = auth.authenticate("company-b@salescrm.app", "demo")
        assert user is not None
        assert user["tenant_key"] == "company-b-main"

        session = auth.create_session(user)
        assert session["tenant_key"] == "company-b-main"
        assert auth.tenant_for_token(session["id"]) == "company-b-main"
        assert auth.user_for_token(session["id"])["email"] == other_user["email"]


def test_repository_upsert_delete_and_replace_all(isolated_repository):
    repository = isolated_repository

    partners = repository.collection("partners")
    assert any(item["id"] == "p1" for item in partners)
    assert repository.collection("pipeline")
    assert repository.collection("pipeline")[0]["stages"][0]["status"] == "draft"

    repository.upsert(
        "partners",
        {
            "id": "p-new",
            "company_name": "New Carrier SRL",
            "roles": ["customer"],
            "status": "active",
        },
    )
    assert any(item["id"] == "p-new" for item in repository.collection("partners"))

    assert repository.delete("partners", "p-new") is True
    assert not any(item["id"] == "p-new" for item in repository.collection("partners"))

    snapshot = repository.replace_all(
        {
            "partners": [
                {
                    "id": "p-x",
                    "company_name": "Replacement Partner",
                    "roles": ["customer"],
                    "status": "prospect",
                }
            ]
        }
    )
    assert any(item["id"] == "p-x" for item in snapshot["partners"])
    assert any(item["id"] == "p1" for item in snapshot["partners"])


def test_pipeline_upsert_persists_stage_statuses(isolated_repository):
    repository = isolated_repository

    pipeline = repository.collection("pipeline")[0]
    repository.upsert(
        "pipeline",
        {
            **pipeline,
            "description": "Updated sales stages",
            "stages": [
                {**pipeline["stages"][0], "name": "Qualification"},
                *pipeline["stages"][1:],
            ],
        },
    )

    updated = repository.collection("pipeline")[0]
    assert updated["description"] == "Updated sales stages"
    assert updated["stages"][0]["name"] == "Qualification"


def test_tenant_scoping_keeps_records_isolated(isolated_repository):
    repository = isolated_repository

    with repository.tenant_scope("tenant-a"):
        repository.upsert(
            "partners",
            {
                "id": "p-shared",
                "company_name": "Tenant A Partner",
                "roles": ["customer"],
                "status": "active",
            },
        )

    with repository.tenant_scope("tenant-b"):
        assert not any(item["id"] == "p-shared" for item in repository.collection("partners"))
        repository.upsert(
            "partners",
            {
                "id": "p-shared",
                "company_name": "Tenant B Partner",
                "roles": ["customer"],
                "status": "prospect",
            },
        )

    with repository.tenant_scope("tenant-a"):
        assert next(item for item in repository.collection("partners") if item["id"] == "p-shared")[
            "company_name"
        ] == "Tenant A Partner"

    with repository.tenant_scope("tenant-b"):
        assert next(item for item in repository.collection("partners") if item["id"] == "p-shared")[
            "company_name"
        ] == "Tenant B Partner"


def test_partner_model_validation():
    with pytest.raises(ValidationError):
        Partner(id="p-invalid", company_name="Invalid", status="not-a-status")


def test_partner_lead_workflow_creates_task_and_history(isolated_repository):
    repository = isolated_repository

    partner = next(item for item in repository.collection("partners") if item["id"] == "p1")
    updated = Partner(**{**partner, "status": "lead"})

    result = main.upsert_partner("p1", updated, user={"id": "u1", "name": "Maria Lopez"})
    assert result["status"] == "lead"

    tasks = repository.collection("tasks")
    assert any(item["id"] == "lead-qualification-p1" for item in tasks)

    history = repository.collection("history")
    assert any(item["id"] == "lead-workflow-p1" for item in history)

    second = main.upsert_partner("p1", updated, user={"id": "u1", "name": "Maria Lopez"})
    assert second["status"] == "lead"
    assert sum(1 for item in repository.collection("tasks") if item["id"] == "lead-qualification-p1") == 1
    assert sum(1 for item in repository.collection("history") if item["id"] == "lead-workflow-p1") == 1


def test_automation_creates_and_stays_idempotent(isolated_repository, monkeypatch):
    repository = isolated_repository
    monkeypatch.setattr(automation, "_today", lambda: date(2026, 5, 27))

    repository.upsert(
        "tasks",
        {
            "id": "overdue-1",
            "subject": "Overdue follow-up",
            "partner_id": "p1",
            "responsible_user": "Maria Lopez",
            "salesperson": "Maria Lopez",
            "due_date": "2026-05-26",
            "priority": "high",
            "status": "pending",
        },
    )

    result = automation.run_automations()
    assert result["created_tasks"] >= 1
    assert result["created_notifications"] >= 2
    assert result["created_history"] >= 1

    tasks = repository.collection("tasks")
    notifications = repository.collection("notifications")
    history = repository.collection("history")
    assert any(item["id"] == "auto-quote-expiry-q1" for item in tasks)
    assert any(item["id"] == "auto-notification-quote-expiry-q1" for item in notifications)
    assert any(item["id"] == "auto-notification-overdue-task-overdue-1" for item in notifications)
    assert any(item["id"] == "auto-history-quote-expiry-q1" for item in history)

    second_run = automation.run_automations()
    assert second_run["created_tasks"] == 0
    assert second_run["created_notifications"] == 0
    assert second_run["created_history"] == 0


def test_paused_quote_automation_is_skipped(isolated_repository, monkeypatch):
    repository = isolated_repository
    monkeypatch.setattr(automation, "_today", lambda: date(2026, 5, 27))

    item = next(item for item in repository.collection("automations") if item["id"] == "a1")
    result = main.upsert_automation(
        "a1",
        AutomationEvent(**{**item, "status": "paused"}),
        user={"id": "u1", "email": "maria@salescrm.app"},
    )
    assert result["status"] == "paused"

    summary = automation.run_automations()

    assert summary["created_tasks"] == 0
    assert not any(item["id"] == "auto-quote-expiry-q1" for item in repository.collection("tasks"))
    assert not any(
        item["id"] == "auto-notification-quote-expiry-q1"
        for item in repository.collection("notifications")
    )


def test_overdue_quote_is_expired_by_automation(isolated_repository, monkeypatch):
    repository = isolated_repository
    monkeypatch.setattr(automation, "_today", lambda: date(2026, 5, 27))

    repository.upsert(
        "quotes",
        {
            "id": "q-overdue",
            "number": "Q-9999",
            "partner_id": "p1",
            "subject": "Past due quote",
            "status": "sent",
            "amount": 1000,
            "currency": "USD",
            "issue_date": "2026-05-01",
            "valid_until": "2026-05-20",
            "salesperson": "Maria Lopez",
            "lines": [],
        },
    )

    result = automation.run_automations()
    assert result["created_history"] >= 1
    assert result["created_notifications"] >= 1

    quote = next(item for item in repository.collection("quotes") if item["id"] == "q-overdue")
    assert quote["status"] == "expired"

    history = repository.collection("history")
    assert any(item["id"] == "auto-history-quote-overdue-q-overdue" for item in history)

    notifications = repository.collection("notifications")
    assert any(item["id"] == "auto-notification-quote-overdue-q-overdue" for item in notifications)

    second_run = automation.run_automations()
    assert second_run["created_history"] == 0
    assert second_run["created_notifications"] == 0


def test_integration_sync_updates_connection_and_history(isolated_repository):
    repository = isolated_repository

    repository.upsert(
        "api_connections",
        {
            **repository.collection("api_connections")[0],
            "api_key_configured": True,
        },
    )

    result = integration.sync_connection("api1")
    assert result["connection_id"] == "api1"
    assert result["status"] == "connected"
    assert result["mode"] == "simulation"
    assert result["imported_partners"] == len(repository.collection("partners"))
    assert result["imported_operations"] == len(repository.collection("operations"))

    connection = next(item for item in repository.collection("api_connections") if item["id"] == "api1")
    assert connection["status"] == "connected"
    assert connection["last_sync_at"]

    history = repository.collection("history")
    assert any("sync completed" in item["title"].lower() for item in history)


def test_operations_summary_reports_expected_metrics(isolated_repository):
    repository = isolated_repository

    repository.upsert(
        "history",
        {
            "id": "history-operation-1",
            "partner_id": "p1",
            "type": "operation",
            "title": "Operation OP-8910 opened",
            "description": "Tracked as an operational history event.",
            "occurred_at": "2026-05-21",
            "actor": "Operations",
            "operation_id": "op1",
        },
    )

    summary = analytics.operations_summary()
    assert summary["operation_count"] == len(repository.collection("operations"))
    assert summary["active_operations"] == len(
        [item for item in repository.collection("operations") if item["status"] == "active"]
    )
    assert summary["quote_operation_ratio"] >= 0
    assert summary["last_operation"]["id"] == "op1"
    assert summary["operations_by_traffic"]
    assert summary["operational_history_count"] >= 1


def test_quote_result_creates_history_and_operation(isolated_repository):
    repository = isolated_repository

    quote = next(item for item in repository.collection("quotes") if item["id"] == "q1")
    updated = Quote(**{**quote, "status": "won"})

    result = main.upsert_quote("q1", updated, user={"id": "u1", "name": "Maria Lopez"})
    assert result["status"] == "won"

    history = repository.collection("history")
    assert any(item["id"] == "quote-result-q1" for item in history)

    operations = repository.collection("operations")
    assert any(item["quote_id"] == "q1" for item in operations)


def test_operation_upsert_records_history(isolated_repository):
    repository = isolated_repository

    operation = next(item for item in repository.collection("operations") if item["id"] == "op1")
    updated = {
        **operation,
        "status": "completed",
        "revenue": operation["revenue"] + 250,
    }

    result = main.upsert_operation("op1", Operation(**updated), user={"id": "u1", "name": "Maria Lopez"})
    assert result["status"] == "completed"

    history = repository.collection("history")
    assert any(item["id"] == "operation-history-op1" for item in history)

    second = main.upsert_operation("op1", Operation(**updated), user={"id": "u1", "name": "Maria Lopez"})
    assert second["status"] == "completed"
    assert sum(1 for item in repository.collection("history") if item["id"] == "operation-history-op1") == 1


def test_operation_delete_removes_record_and_audits(isolated_repository):
    repository = isolated_repository
    operation = next(item for item in repository.collection("operations") if item["id"] == "op1")
    repository.upsert("operations", {**operation, "id": "op-delete", "number": "OP-DELETE"})

    result = main.delete_operation("op-delete", user={"id": "u1", "email": "maria@salescrm.app"})

    assert result == {"status": "deleted"}
    assert not any(item["id"] == "op-delete" for item in repository.collection("operations"))
    assert any(
        item["action"] == "delete"
        and item["resource"] == "operations"
        and item["resource_id"] == "op-delete"
        for item in repository.collection("audit")
    )


def test_interaction_delete_removes_record_and_audits(isolated_repository):
    repository = isolated_repository

    interaction = Interaction(
        id="i-delete",
        partner_id="p1",
        channel="call",
        direction="outbound",
        subject="Delete me",
        body="Temporary interaction.",
        occurred_at="2026-05-27",
        created_by="Maria Lopez",
    )
    main.upsert_interaction("i-delete", interaction, user={"id": "u1", "email": "maria@salescrm.app"})

    result = main.delete_interaction("i-delete", user={"id": "u1", "email": "maria@salescrm.app"})

    assert result == {"status": "deleted"}
    assert not any(item["id"] == "i-delete" for item in repository.collection("interactions"))
    assert any(
        item["action"] == "delete"
        and item["resource"] == "interactions"
        and item["resource_id"] == "i-delete"
        for item in repository.collection("audit")
    )


def test_notification_delete_removes_record_and_audits(isolated_repository):
    repository = isolated_repository

    notification = CrmNotification(
        id="n-delete",
        title="Temporary alert",
        message="This notification should be cleared.",
        type="system",
        severity="info",
        created_at="2026-05-27",
    )
    main.upsert_notification(
        "n-delete",
        notification,
        user={"id": "u1", "email": "maria@salescrm.app"},
    )

    result = main.delete_notification("n-delete", user={"id": "u1", "email": "maria@salescrm.app"})

    assert result == {"status": "deleted"}
    assert not any(item["id"] == "n-delete" for item in repository.collection("notifications"))
    assert any(
        item["action"] == "delete"
        and item["resource"] == "notifications"
        and item["resource_id"] == "n-delete"
        for item in repository.collection("audit")
    )


def test_automation_delete_removes_record_and_audits(isolated_repository):
    repository = isolated_repository

    automation_event = AutomationEvent(
        id="a-delete",
        name="Temporary automation",
        trigger="Temporary trigger",
        action="Temporary action",
        status="paused",
        last_run_at="2026-05-27",
    )
    main.upsert_automation(
        "a-delete",
        automation_event,
        user={"id": "u1", "email": "maria@salescrm.app"},
    )

    result = main.delete_automation("a-delete", user={"id": "u1", "email": "maria@salescrm.app"})

    assert result == {"status": "deleted"}
    assert not any(item["id"] == "a-delete" for item in repository.collection("automations"))
    assert any(
        item["action"] == "delete"
        and item["resource"] == "automations"
        and item["resource_id"] == "a-delete"
        for item in repository.collection("audit")
    )


def test_task_completion_records_history(isolated_repository):
    repository = isolated_repository

    task = next(item for item in repository.collection("tasks") if item["id"] == "t1")
    updated = {
        **task,
        "status": "completed",
    }

    result = main.upsert_task("t1", SalesTask(**updated), user={"id": "u1", "name": "Maria Lopez"})
    assert result["status"] == "completed"

    history = repository.collection("history")
    assert any(item["id"] == "task-completed-t1" for item in history)

    second = main.upsert_task("t1", SalesTask(**updated), user={"id": "u1", "name": "Maria Lopez"})
    assert second["status"] == "completed"
    assert sum(1 for item in repository.collection("history") if item["id"] == "task-completed-t1") == 1


def test_audit_log_records_event(isolated_repository):
    repository = isolated_repository

    event = audit.log(
        "login",
        "auth",
        user={"id": "u1", "email": "maria@salescrm.app"},
        details={"source": "pytest"},
    )

    assert event["action"] == "login"
    assert event["resource"] == "auth"
    assert event["actor_email"] == "maria@salescrm.app"
    assert event["details"] == {"source": "pytest"}

    events = repository.collection("audit")
    assert len(events) == 1
    assert events[0]["action"] == "login"
