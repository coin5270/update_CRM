import os
from datetime import datetime, timezone
from typing import Any

from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware

from app import audit
from app import auth
from app import automation
from app import analytics
from app import integration
from app import repository
from app.models import (
    ApiConnectionStatus,
    AutomationEvent,
    Contact,
    CrmNotification,
    CustomerHistoryEvent,
    Interaction,
    LoginRequest,
    Operation,
    Partner,
    QuoteStatus,
    SalesPipeline,
    Quote,
    SalesTask,
    SalesEvent,
    UserAccount,
)

app = FastAPI(title="Sales CRM API", version="0.1.0")

frontend_origins = [
    origin.strip()
    for origin in os.getenv(
        "CRM_FRONTEND_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:8082,http://127.0.0.1:8082,http://82.38.44.28:8082",
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def tenant_context(request: Request, call_next):
    scheme, _, token = (request.headers.get("Authorization") or "").partition(" ")
    token_tenant = auth.tenant_for_token(token) if scheme.lower() == "bearer" and token else None
    tenant_key = (token_tenant or request.headers.get("X-Tenant-Key") or repository.DEFAULT_TENANT_KEY).strip()
    with repository.tenant_scope(tenant_key):
        response = await call_next(request)
    response.headers["X-Tenant-Key"] = tenant_key or repository.DEFAULT_TENANT_KEY
    return response


def _require_user(authorization: str | None = Header(default=None)) -> dict[str, Any]:
    scheme, _, token = (authorization or "").partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=401, detail="Missing bearer token")
    user = auth.user_for_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid session")
    return user


def _require_permission(permission: str):
    def dependency(user: dict[str, Any] = Depends(_require_user)) -> dict[str, Any]:
        permissions = user.get("permissions", [])
        if permission not in permissions and "*:write" not in permissions:
            raise HTTPException(status_code=403, detail=f"Permission required: {permission}")
        return user

    return dependency


@app.get("/health")
def health() -> dict[str, object]:
    return {
        "status": "ok",
        "tenant": repository.current_tenant_key(),
        "frontend_origins": frontend_origins,
        "database_url": repository.DB_URL,
        "database": repository.database_status(),
    }


@app.post("/api/auth/login")
def login(request: LoginRequest) -> dict[str, object]:
    user = auth.authenticate(request.email, request.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    session = auth.create_session(user)
    audit.log("login", "auth", user=user)
    return {
        "token": session["id"],
        "user": auth.public_user(user),
    }


@app.get("/api/auth/me")
def me(user: dict[str, Any] = Depends(_require_user)) -> dict[str, object]:
    return auth.public_user(user)


@app.get("/api/users")
def list_users(user: dict[str, Any] = Depends(_require_permission("users:read"))) -> object:
    return [auth.public_user(item) for item in repository.collection("users")]


@app.put("/api/users/{item_id}")
def upsert_user(
    item_id: str,
    item: UserAccount,
    user: dict[str, Any] = Depends(_require_permission("users:write")),
) -> object:
    target_tenant = item.tenant_key or repository.DEFAULT_TENANT_KEY
    with repository.tenant_scope(target_tenant):
        existing = next(
            (record for record in repository.collection("users") if record.get("id") == item_id),
            {},
        )
        payload = {
            **existing,
            **item.model_dump(mode="json"),
            "id": item_id,
            "tenant_key": target_tenant,
            "password_hash": existing.get("password_hash") or auth.password_hash("demo"),
        }
        return auth.public_user(repository.upsert("users", payload))


@app.get("/api/bootstrap")
def bootstrap() -> dict[str, object]:
    return repository.all_data()


@app.get("/api/opportunities")
def list_opportunities() -> object:
    return repository.collection("opportunities")


@app.put("/api/opportunities/{item_id}")
def upsert_opportunity(
    item_id: str,
    item: Quote,
    user: dict[str, Any] = Depends(_require_permission("quotes:write")),
) -> object:
    existing = next(
        (record for record in repository.collection("opportunities") if record.get("id") == item_id),
        {},
    )
    result = _upsert("opportunities", item_id, item.model_dump(mode="json"), user)
    _record_quote_result(existing, result, user)
    return result


@app.delete("/api/opportunities/{item_id}")
def delete_opportunity(
    item_id: str,
    user: dict[str, Any] = Depends(_require_permission("quotes:write")),
) -> dict[str, str]:
    return _delete("opportunities", item_id, user)


@app.get("/api/pipeline")
def list_pipeline(user: dict[str, Any] = Depends(_require_permission("pipeline:read"))) -> object:
    return repository.collection("pipeline")


@app.put("/api/pipeline/{item_id}")
def upsert_pipeline(
    item_id: str,
    item: SalesPipeline,
    user: dict[str, Any] = Depends(_require_permission("pipeline:write")),
) -> object:
    return _upsert("pipeline", item_id, item.model_dump(mode="json"), user)


@app.get("/api/admin/export")
def export_data(user: dict[str, Any] = Depends(_require_permission("integration:read"))) -> dict[str, object]:
    audit.log("export", "admin", user=user)
    return repository.all_data()


@app.post("/api/admin/import")
def import_data(
    data: dict[str, Any],
    user: dict[str, Any] = Depends(_require_permission("integration:write")),
) -> dict[str, object]:
    audit.log("import", "admin", user=user, details={"resources": sorted(data.keys())})
    return repository.replace_all(data)


@app.get("/api/partners")
def list_partners() -> object:
    return repository.collection("partners")


@app.put("/api/partners/{item_id}")
def upsert_partner(
    item_id: str,
    item: Partner,
    user: dict[str, Any] = Depends(_require_permission("partners:write")),
) -> object:
    existing = next(
        (record for record in repository.collection("partners") if record.get("id") == item_id),
        {},
    )
    result = _upsert("partners", item_id, item.model_dump(mode="json"), user)
    _record_lead_workflow(existing, result, user)
    return result


@app.delete("/api/partners/{item_id}")
def delete_partner(
    item_id: str,
    user: dict[str, Any] = Depends(_require_permission("partners:write")),
) -> dict[str, str]:
    return _delete("partners", item_id, user)


@app.get("/api/contacts")
def list_contacts() -> object:
    return repository.collection("contacts")


@app.put("/api/contacts/{item_id}")
def upsert_contact(
    item_id: str,
    item: Contact,
    user: dict[str, Any] = Depends(_require_permission("contacts:write")),
) -> object:
    return _upsert("contacts", item_id, item.model_dump(mode="json"), user)


@app.delete("/api/contacts/{item_id}")
def delete_contact(
    item_id: str,
    user: dict[str, Any] = Depends(_require_permission("contacts:write")),
) -> dict[str, str]:
    return _delete("contacts", item_id, user)


@app.get("/api/tasks")
def list_tasks() -> object:
    return repository.collection("tasks")


@app.put("/api/tasks/{item_id}")
def upsert_task(
    item_id: str,
    item: SalesTask,
    user: dict[str, Any] = Depends(_require_permission("tasks:write")),
) -> object:
    existing = next(
        (record for record in repository.collection("tasks") if record.get("id") == item_id),
        {},
    )
    result = _upsert("tasks", item_id, item.model_dump(mode="json"), user)
    _record_task_completion(existing, result, user)
    return result


@app.delete("/api/tasks/{item_id}")
def delete_task(
    item_id: str,
    user: dict[str, Any] = Depends(_require_permission("tasks:write")),
) -> dict[str, str]:
    return _delete("tasks", item_id, user)


@app.get("/api/quotes")
def list_quotes() -> object:
    return repository.collection("quotes")


@app.put("/api/quotes/{item_id}")
def upsert_quote(
    item_id: str,
    item: Quote,
    user: dict[str, Any] = Depends(_require_permission("quotes:write")),
) -> object:
    existing = next(
        (record for record in repository.collection("quotes") if record.get("id") == item_id),
        {},
    )
    result = _upsert("quotes", item_id, item.model_dump(mode="json"), user)
    _record_quote_result(existing, result, user)
    return result


@app.delete("/api/quotes/{item_id}")
def delete_quote(
    item_id: str,
    user: dict[str, Any] = Depends(_require_permission("quotes:write")),
) -> dict[str, str]:
    return _delete("quotes", item_id, user)


@app.get("/api/operations")
def list_operations() -> object:
    return repository.collection("operations")


@app.get("/api/analytics/operations")
def operations_analytics(user: dict[str, Any] = Depends(_require_permission("operations:read"))) -> object:
    return analytics.operations_summary()


@app.put("/api/operations/{item_id}")
def upsert_operation(
    item_id: str,
    item: Operation,
    user: dict[str, Any] = Depends(_require_permission("operations:write")),
) -> object:
    existing = next(
        (record for record in repository.collection("operations") if record.get("id") == item_id),
        {},
    )
    result = _upsert("operations", item_id, item.model_dump(mode="json"), user)
    _record_operation_history(existing, result, user)
    return result


@app.delete("/api/operations/{item_id}")
def delete_operation(
    item_id: str,
    user: dict[str, Any] = Depends(_require_permission("operations:write")),
) -> dict[str, str]:
    return _delete("operations", item_id, user)


@app.get("/api/interactions")
def list_interactions() -> object:
    return repository.collection("interactions")


@app.put("/api/interactions/{item_id}")
def upsert_interaction(
    item_id: str,
    item: Interaction,
    user: dict[str, Any] = Depends(_require_permission("interactions:write")),
) -> object:
    return _upsert("interactions", item_id, item.model_dump(mode="json"), user)


@app.delete("/api/interactions/{item_id}")
def delete_interaction(
    item_id: str,
    user: dict[str, Any] = Depends(_require_permission("interactions:write")),
) -> dict[str, str]:
    return _delete("interactions", item_id, user)


@app.get("/api/notifications")
def list_notifications() -> object:
    return repository.collection("notifications")


@app.get("/api/alerts")
def list_alerts() -> object:
    return repository.collection("notifications")


@app.get("/api/reminders")
def list_reminders() -> object:
    return repository.collection("reminders")


@app.put("/api/reminders/{item_id}")
def upsert_reminder(
    item_id: str,
    item: dict[str, Any],
    user: dict[str, Any] = Depends(_require_permission("automations:write")),
) -> object:
    return _upsert("reminders", item_id, item, user)


@app.put("/api/notifications/{item_id}")
def upsert_notification(
    item_id: str,
    item: CrmNotification,
    user: dict[str, Any] = Depends(_require_permission("notifications:write")),
) -> object:
    return _upsert("notifications", item_id, item.model_dump(mode="json"), user)


@app.delete("/api/notifications/{item_id}")
def delete_notification(
    item_id: str,
    user: dict[str, Any] = Depends(_require_permission("notifications:write")),
) -> dict[str, str]:
    return _delete("notifications", item_id, user)


@app.get("/api/history")
def list_history() -> object:
    return repository.collection("history")


@app.get("/api/sales_events")
@app.get("/api/sales-events")
def list_sales_events() -> object:
    return repository.collection("sales_events")

@app.put("/api/sales_events/{item_id}")
@app.put("/api/sales-events/{item_id}")
def upsert_sales_event(
    item_id: str,
    item: SalesEvent,
    user: dict[str, Any] = Depends(_require_permission("history:write")),
) -> object:
    return _upsert("sales_events", item_id, item.model_dump(mode="json"), user)


@app.put("/api/history/{item_id}")
def upsert_history(
    item_id: str,
    item: CustomerHistoryEvent,
    user: dict[str, Any] = Depends(_require_permission("history:write")),
) -> object:
    return _upsert("history", item_id, item.model_dump(mode="json"), user)


@app.get("/api/automations")
def list_automations() -> object:
    return repository.collection("automations")


@app.put("/api/automations/{item_id}")
def upsert_automation(
    item_id: str,
    item: AutomationEvent,
    user: dict[str, Any] = Depends(_require_permission("automations:write")),
) -> object:
    return _upsert("automations", item_id, item.model_dump(mode="json"), user)


@app.delete("/api/automations/{item_id}")
def delete_automation(
    item_id: str,
    user: dict[str, Any] = Depends(_require_permission("automations:write")),
) -> dict[str, str]:
    return _delete("automations", item_id, user)


@app.post("/api/automations/run")
def run_automations(user: dict[str, Any] = Depends(_require_permission("automations:write"))) -> object:
    result = automation.run_automations()
    audit.log("run", "automations", user=user, details=result)
    return result


@app.get("/api/integration")
def list_api_connections() -> object:
    return repository.collection("api_connections")


@app.put("/api/integration/{item_id}")
def upsert_api_connection(
    item_id: str,
    item: ApiConnectionStatus,
    user: dict[str, Any] = Depends(_require_permission("integration:write")),
) -> object:
    return _upsert("api_connections", item_id, item.model_dump(mode="json"), user)


@app.post("/api/integration/{item_id}/sync")
def sync_api_connection(
    item_id: str,
    user: dict[str, Any] = Depends(_require_permission("integration:write")),
) -> object:
    try:
        result = integration.sync_connection(item_id)
        audit.log("sync", "integration", user=user, resource_id=item_id, details=result)
        return result
    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@app.get("/api/audit")
def list_audit(user: dict[str, Any] = Depends(_require_permission("audit:read"))) -> object:
    return repository.collection("audit")[:200]


def _upsert(
    collection: str,
    item_id: str,
    item: dict[str, Any],
    user: dict[str, Any] | None = None,
) -> object:
    payload = {**item, "id": item_id}
    try:
        result = repository.upsert(collection, payload)
        audit.log("upsert", collection, user=user, resource_id=item_id)
        return result
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


def _delete(
    collection: str,
    item_id: str,
    user: dict[str, Any] | None = None,
) -> dict[str, str]:
    deleted = repository.delete(collection, item_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Item not found")
    audit.log("delete", collection, user=user, resource_id=item_id)
    return {"status": "deleted"}


def _record_quote_result(
    previous: dict[str, Any],
    current: dict[str, Any],
    user: dict[str, Any] | None = None,
) -> None:
    previous_status = previous.get("status")
    current_status = current.get("status")
    if previous_status == current_status or current_status not in {"won", "lost", "expired"}:
        return

    quote_id = current["id"]
    occurred_at = datetime.now(timezone.utc).date().isoformat()
    title_map = {
        "won": "Quote marked won",
        "lost": "Quote marked lost",
        "expired": "Quote expired",
    }
    repository.upsert(
        "history",
        {
            "id": f"quote-result-{quote_id}",
            "partner_id": current.get("partner_id"),
            "type": "quote",
            "title": title_map[current_status],
            "description": f"Quote status changed from {previous_status or 'draft'} to {current_status}.",
            "occurred_at": occurred_at,
            "actor": user.get("name") if user else "CRM",
            "quote_id": quote_id,
        },
    )

    if current_status != "won":
        return

    existing_operation = next(
        (operation for operation in repository.collection("operations") if operation.get("quote_id") == quote_id),
        None,
    )
    repository.upsert(
        "operations",
        {
            "id": existing_operation.get("id") if existing_operation else f"quote-operation-{quote_id}",
            "number": existing_operation.get("number") if existing_operation else f"OP-{current.get('number', quote_id)}",
            "partner_id": current.get("partner_id"),
            "quote_id": quote_id,
            "status": existing_operation.get("status") if existing_operation else "active",
            "traffic_mode": existing_operation.get("traffic_mode") if existing_operation else "ocean",
            "origin": existing_operation.get("origin") if existing_operation else "TBD",
            "destination": existing_operation.get("destination") if existing_operation else "TBD",
            "opened_at": existing_operation.get("opened_at") if existing_operation else occurred_at,
            "revenue": current.get("amount", 0),
            "currency": current.get("currency", "USD"),
            "assigned_to": current.get("salesperson", "Sales User"),
        },
    )


def _record_operation_history(
    previous: dict[str, Any],
    current: dict[str, Any],
    user: dict[str, Any] | None = None,
) -> None:
    fields = ("partner_id", "quote_id", "status", "traffic_mode", "origin", "destination", "revenue")
    changed = previous.get("id") is None or any(previous.get(field) != current.get(field) for field in fields)
    if not changed:
        return

    operation_id = current["id"]
    actor = user.get("name") if user else "CRM"
    changed_fields = [field.replace("_", " ") for field in fields if previous.get(field) != current.get(field)]
    title = "Operation created" if not previous.get("id") else "Operation updated"
    description = (
        f"Created operation {current.get('number', operation_id)}."
        if not previous.get("id")
        else f"Updated {', '.join(changed_fields) if changed_fields else 'operation details'}."
    )

    repository.upsert(
        "history",
        {
            "id": f"operation-history-{operation_id}",
            "partner_id": current.get("partner_id"),
            "type": "operation",
            "title": title,
            "description": description,
            "occurred_at": datetime.now(timezone.utc).date().isoformat(),
            "actor": actor,
            "quote_id": current.get("quote_id"),
            "operation_id": operation_id,
        },
    )


def _record_task_completion(
    previous: dict[str, Any],
    current: dict[str, Any],
    user: dict[str, Any] | None = None,
) -> None:
    if previous.get("status") == current.get("status") or current.get("status") != "completed":
        return

    task_id = current["id"]
    repository.upsert(
        "history",
        {
            "id": f"task-completed-{task_id}",
            "partner_id": current.get("partner_id"),
            "type": "task",
            "title": "Task completed",
            "description": f"Completed task {current.get('subject', task_id)}.",
            "occurred_at": datetime.now(timezone.utc).date().isoformat(),
            "actor": user.get("name") if user else current.get("responsible_user", "CRM"),
            "quote_id": current.get("quote_id"),
            "task_id": task_id,
        },
    )


def _record_lead_workflow(
    previous: dict[str, Any],
    current: dict[str, Any],
    user: dict[str, Any] | None = None,
) -> None:
    previous_status = previous.get("status")
    current_status = current.get("status")
    if previous_status == current_status or current_status != "lead":
        return

    partner_id = current["id"]
    occurred_at = datetime.now(timezone.utc).date().isoformat()
    actor = user.get("name") if user else "CRM"
    task_id = f"lead-qualification-{partner_id}"
    history_id = f"lead-workflow-{partner_id}"
    task_subject = f"Qualify lead — {current.get('company_name', partner_id)}"
    salesperson = current.get("salesperson") or actor

    repository.upsert(
        "tasks",
        {
            "id": task_id,
            "subject": task_subject,
            "partner_id": partner_id,
            "quote_id": None,
            "transaction_id": None,
            "responsible_user": salesperson,
            "salesperson": salesperson,
            "due_date": occurred_at,
            "due_time": None,
            "priority": "high",
            "status": "pending",
            "contact_id": None,
            "email": (current.get("emails") or [None])[0],
            "phone": (current.get("phones") or [None])[0],
            "comment": "Auto-generated from lead qualification workflow.",
            "created_at": occurred_at,
            "contact_method": "call",
            "auto_generated": True,
        },
    )
    repository.upsert(
        "history",
        {
            "id": history_id,
            "partner_id": partner_id,
            "type": "automation",
            "title": "Lead workflow qualification created",
            "description": f"Created a qualification task for {current.get('company_name', partner_id)}.",
            "occurred_at": occurred_at,
            "actor": actor,
            "task_id": task_id,
        },
    )
