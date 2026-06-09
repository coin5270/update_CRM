# CRM Backend Scaffold

This folder is the Python REST API starting point for the CRM described in the functional document.

## Run locally

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r backend/requirements.txt
export CRM_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/salescrm
uvicorn app.main:app --app-dir backend --reload
```

PostgreSQL is now the default and only runtime database for the backend.
The repository layer stores CRM resources in tenant-scoped tables such as
`crm_tasks`, `crm_opportunities`, `crm_interactions`, `crm_customer_history`,
`crm_alerts`, and `crm_reminders`.

The backend now scopes records by `X-Tenant-Key` and defaults to `uy-main`, which is the single tenant used by the current frontend.

For deployment, set `CRM_FRONTEND_ORIGINS` to the deployed frontend origin or origins, for example:

```bash
CRM_FRONTEND_ORIGINS=https://1.carlosa5270.workers.dev
```

Then point the frontend at the deployed API with `VITE_CRM_API_URL`.

After deploy, check:

```bash
/health
```

It should return the tenant and configured frontend origins so you can confirm the environment is wired correctly.

## Local PostgreSQL

For local development, the easiest path is:

```bash
docker compose up -d postgres
export CRM_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/salescrm
python scripts/migrate_sqlite_to_postgres.py
uvicorn app.main:app --app-dir backend --reload
```

## Run tests

```bash
pip install -r backend/requirements-dev.txt
pytest backend/tests
```
