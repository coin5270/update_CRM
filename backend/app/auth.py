import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any

from app import repository

PASSWORD_SALT = "sales-crm-local-dev"
SESSION_TTL_HOURS = 12


def password_hash(password: str) -> str:
    return hashlib.sha256(f"{PASSWORD_SALT}:{password}".encode("utf-8")).hexdigest()


def public_user(user: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "role": user.get("role", "sales"),
        "tenant_key": user.get("tenant_key") or repository.DEFAULT_TENANT_KEY,
        "permissions": user.get("permissions", []),
    }


def authenticate(email: str, password: str) -> dict[str, Any] | None:
    normalized = email.strip().lower()
    for user in repository.collection_any_tenant("users"):
        if user.get("email", "").lower() != normalized:
            continue
        if user.get("password_hash") == password_hash(password):
            return user
    return None


def create_session(user: dict[str, Any]) -> dict[str, Any]:
    tenant_key = user.get("tenant_key") or repository.DEFAULT_TENANT_KEY
    now = datetime.now(timezone.utc)
    session = {
        "id": secrets.token_urlsafe(32),
        "user_id": user["id"],
        "tenant_key": tenant_key,
        "created_at": now.isoformat(),
        "expires_at": (now + timedelta(hours=SESSION_TTL_HOURS)).isoformat(),
    }
    with repository.tenant_scope(tenant_key):
        repository.upsert("sessions", session)
    return session


def user_for_token(token: str) -> dict[str, Any] | None:
    if not token:
        return None
    session = repository.get_any_tenant("sessions", token)
    if not session:
        return None
    if _session_expired(session):
        return None
    user_id = session.get("user_id")
    tenant_key = session.get("tenant_key") or repository.DEFAULT_TENANT_KEY
    with repository.tenant_scope(tenant_key):
        return next((user for user in repository.collection("users") if user.get("id") == user_id), None)


def tenant_for_token(token: str) -> str | None:
    if not token:
        return None
    session = repository.get_any_tenant("sessions", token)
    if not session:
        return None
    if _session_expired(session):
        return None
    return session.get("tenant_key") or repository.DEFAULT_TENANT_KEY


def _session_expired(session: dict[str, Any]) -> bool:
    expires_at = session.get("expires_at")
    if not expires_at:
        return True
    try:
        expiry = datetime.fromisoformat(str(expires_at).replace("Z", "+00:00"))
    except ValueError:
        return True
    return expiry <= datetime.now(timezone.utc)
