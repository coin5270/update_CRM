# Deployment and Update Guide

This guide describes how to deploy the CRM, update it safely, and verify that the client can test the delivered features.

## Required Environment

- Node.js 20 or newer
- Python 3.11 or newer
- PostgreSQL 16
- `npm`
- `pip`
- `pg_dump`, `pg_restore`, and `psql`

## Environment Variables

Backend:

```bash
CRM_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/salescrm
CRM_FRONTEND_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://82.38.44.28:8082
```

Frontend:

```bash
VITE_CRM_API_URL=http://localhost:8000
VITE_CRM_TENANT_KEY=uy-main
```

For production, replace the hostnames with the deployed frontend and backend URLs.

For AWS, `CRM_DATABASE_URL` should point to the AWS PostgreSQL/RDS database, not to `127.0.0.1`, unless PostgreSQL is running on the same EC2 instance as the backend.

Example RDS-style backend values:

```bash
CRM_DATABASE_URL=postgresql://<user>:<password>@<rds-endpoint>:5432/salescrm
CRM_FRONTEND_ORIGINS=https://<frontend-domain>
```

Example frontend values:

```bash
VITE_CRM_API_URL=https://<backend-domain>
VITE_CRM_TENANT_KEY=uy-main
```

The CRM supports one shared frontend for users from multiple tenant companies. The frontend can keep one default tenant key for public/bootstrap context:

```bash
VITE_CRM_TENANT_KEY=uy-main
```

After login, the backend uses the tenant attached to the authenticated user/session. A user from `sdc-main` and a user from `company-b-main` can log in through the same frontend URL, and authenticated data access is enforced by the backend session tenant.

## First Deployment

1. Start or provision PostgreSQL.

```bash
docker compose up -d postgres
```

2. Restore the delivered database dump if available.

```bash
docker cp salescrm.dump sale-crm-postgres-1:/tmp/salescrm.dump
docker compose exec postgres pg_restore -U postgres -d salescrm --clean --if-exists /tmp/salescrm.dump
```

If no dump is restored, the backend will create the schema and insert baseline seed data on first API access.

3. Install backend dependencies.

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
```

4. Start the backend.

```bash
export CRM_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/salescrm
export CRM_FRONTEND_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://82.38.44.28:8082
uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port 8000
```

5. Install and build the frontend.

```bash
npm install
npm run build
```

6. Serve the generated `dist` folder with the selected hosting platform.

## Client Transfer Workflow

Use this workflow when handing the project to the client or to the client's hosting provider.

1. Export the current PostgreSQL database.

```bash
pg_dump -h 127.0.0.1 -U postgres -d salescrm -F c -f salescrm.dump
```

2. Package these items together.

```text
Sale-CRM repository
salescrm.dump
README.md
docs/API.md
docs/DATABASE.md
docs/DEPLOYMENT.md
docs/TESTING.md
.env.example
```

3. Tell the receiver to restore the dump before starting the backend.

```bash
createdb -h 127.0.0.1 -U postgres salescrm
pg_restore -h 127.0.0.1 -U postgres -d salescrm --clean --if-exists salescrm.dump
```

4. Tell the receiver to verify the restore.

```bash
PGPASSWORD=postgres psql -h 127.0.0.1 -U postgres -d salescrm -c "select count(*) from crm_users;"
PGPASSWORD=postgres psql -h 127.0.0.1 -U postgres -d salescrm -c "select count(*) from crm_partners;"
```

5. Start the backend and check `/health`.

```bash
curl http://localhost:8000/health
```

The response should include:

```json
"database": {
  "status": "ok"
}
```

6. Open the frontend and run the checklist in `docs/TESTING.md`.

## Local Test Deployment

Run backend:

```bash
source .venv/bin/activate
export CRM_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/salescrm
export CRM_FRONTEND_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://82.38.44.28:8082
uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port 8000 --reload
```

Run frontend:

```bash
npm run dev -- --host 0.0.0.0 --port 5173
```

Open:

```text
http://localhost:5173
```

## Updating an Existing Deployment

Always back up the database before updating code.

1. Create a backup.

```bash
pg_dump -h 127.0.0.1 -U postgres -d salescrm -F c -f salescrm-before-update.dump
```

2. Stop the running backend process.

3. Copy or pull the new repository version.

4. Install dependencies.

```bash
npm install
source .venv/bin/activate
pip install -r backend/requirements.txt
```

5. Restart the backend.

```bash
export CRM_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/salescrm
uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port 8000
```

6. Rebuild and redeploy the frontend.

```bash
npm run build
```

7. Run the verification checklist.

If the update package includes a database SQL script:

```bash
PGPASSWORD=postgres psql -h 127.0.0.1 -U postgres -d salescrm -f updates/update.sql
```

If the update package includes a replacement dump:

```bash
pg_restore -h 127.0.0.1 -U postgres -d salescrm --clean --if-exists salescrm.dump
```

## Rollback

1. Stop the backend.
2. Restore the previous repository version.
3. Restore the database backup if needed.

```bash
pg_restore -h 127.0.0.1 -U postgres -d salescrm --clean --if-exists salescrm-before-update.dump
```

4. Restart backend and frontend.

## Verification Checklist

- `GET /health` returns `status: ok`.
- `GET /health` returns `database.status: ok`.
- Login works with `maria@salescrm.app` and `juan@salescrm.app`.
- Spanish/English toggle works.
- Business Partners list renders.
- Follow-ups can be created, assigned, updated, and completed.
- Follow-up Report filters by Business Partner, User, Status, and date range.
- Follow-up Report date selector filters by Next Contact Date and Comment Date.
- Follow-up Report CSV export works.
- Follow-up Report Print/PDF opens a populated print preview.
- Sales Activity shows created follow-up events.
- History shows traceability for clients, quotes, tasks, and bookings.
- Bookings detail page loads.
- Integration backup/export works for users with permission.

## AWS Persistence Smoke Test

Use this after uploading to AWS to confirm that data is really saving to PostgreSQL/RDS and not only appearing in the browser.

1. Open the AWS backend health endpoint.

```bash
curl https://<backend-domain>/health
```

Expected:

```json
"database": {
  "status": "ok"
}
```

2. Log in through the frontend.

3. Create a clearly named test Business Partner, for example:

```text
AWS Persistence Test Partner
```

4. Refresh the browser.

5. Confirm the partner is still visible.

6. Restart the backend service.

7. Refresh the frontend again.

8. Confirm the partner is still visible after backend restart.

9. If database shell access is available, verify directly:

```sql
SELECT payload
FROM crm_partners
WHERE payload->>'company_name' = 'AWS Persistence Test Partner';
```

If the record disappears after refresh or restart, check:

- `CRM_DATABASE_URL` points to the AWS PostgreSQL/RDS database
- `/health` shows `database.status: ok`
- the frontend `VITE_CRM_API_URL` points to the AWS backend
- the user is logged in before creating records
- the browser does not show a backend sync/offline warning

## Seed Data and Test Credentials

The seed data is embedded in `backend/app/repository.py`. It is inserted automatically when the backend first accesses a collection.

Default seeded password:

```text
demo
```

Default tenant:

```text
uy-main
```

The seeded users are:

- `maria@salescrm.app`
- `juan@salescrm.app`
- `admin-lite@salescrm.app`
