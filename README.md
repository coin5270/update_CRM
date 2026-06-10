# SalesCRM Cargo Cockpit

Bilingual CRM for business partners, contacts, quotes, follow-ups, bookings, messages, audit history, sales activity, and follow-up reporting.

## Included Deliverables

- React frontend source code
- Python FastAPI backend source code
- PostgreSQL Docker configuration
- PostgreSQL dump: `salescrm.dump`
- API documentation: `docs/API.md`
- Database/update manual: `docs/DATABASE.md`
- Deployment/update guide: `docs/DEPLOYMENT.md`
- Client testing guide: `docs/TESTING.md`

## Client Handoff Package

The project should be transferred as a complete package, not only as source code.

Give the client these files/folders:

- the complete repository folder
- `salescrm.dump`, the PostgreSQL database backup
- `.env.example`, the environment variable template
- `README.md`, the quick start and test checklist
- `docs/API.md`, API integration documentation
- `docs/DATABASE.md`, database restore/update manual
- `docs/DEPLOYMENT.md`, deployment and update guide
- `docs/TESTING.md`, step-by-step client testing guide

Recommended delivery format:

```text
Sale-CRM/
salescrm.dump
handoff-notes.txt
```

The client can give this package to any hosting provider, IT technician, or future developer. The database can be restored from `salescrm.dump`, and the application can be started by following the commands in this README and in `docs/DEPLOYMENT.md`.

## Test Users

All seeded users use the password `demo`.

| User        | Email                     | Purpose                                     |
| ----------- | ------------------------- | ------------------------------------------- |
| Maria Lopez | `maria@salescrm.app`      | Sales manager with write permissions        |
| Juan Smith  | `juan@salescrm.app`       | Sales user for assignment/follow-up testing |
| Admin Lite  | `admin-lite@salescrm.app` | Admin-style test user                       |

## Local Setup

1. Install frontend dependencies.

```bash
npm install
```

2. Create local environment files.

```bash
cp .env.example .env.local
```

3. Start PostgreSQL.

```bash
docker compose up -d postgres
```

4. Start the backend.

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
export CRM_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/salescrm
export CRM_FRONTEND_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port 8000 --reload
```

5. Start the frontend in another terminal.

```bash
npm run dev -- --host 0.0.0.0 --port 5173
```

6. Open the app.

```text
http://localhost:5173
```

## How Seeding Works

There is no separate seeder command. The backend creates tables and inserts baseline records automatically from `backend/app/repository.py` when an API endpoint first reads or writes data.

To trigger schema creation and seed insertion:

```bash
curl http://localhost:8000/health
curl http://localhost:8000/api/bootstrap
```

The seeded data uses tenant key `uy-main`. If a public request does not send `X-Tenant-Key`, the backend defaults to `uy-main`. After login, authenticated data access uses the tenant stored in the user's session, so the same frontend can serve users from different tenant companies.

## Restore the Delivered Database Dump

Use this when the client wants to test with the delivered database state instead of only the built-in seed data.

```bash
docker compose up -d postgres
docker cp salescrm.dump sale-crm-postgres-1:/tmp/salescrm.dump
docker compose exec postgres pg_restore -U postgres -d salescrm --clean --if-exists /tmp/salescrm.dump
```

If the container name is different, check it with:

```bash
docker ps
```

For Podman:

```bash
podman cp salescrm.dump salecrm-postgres:/tmp/salescrm.dump
podman exec -it salecrm-postgres pg_restore -U postgres -d salescrm --clean --if-exists /tmp/salescrm.dump
```

After restoring, verify the database:

```bash
PGPASSWORD=postgres psql -h 127.0.0.1 -U postgres -d salescrm -c "select count(*) from crm_users;"
PGPASSWORD=postgres psql -h 127.0.0.1 -U postgres -d salescrm -c "select count(*) from crm_partners;"
```

## Create a New Database Dump

Docker Compose:

```bash
docker compose exec postgres pg_dump -U postgres -d salescrm -F c -f /tmp/salescrm.dump
docker cp sale-crm-postgres-1:/tmp/salescrm.dump ./salescrm.dump
```

Podman:

```bash
podman exec salecrm-postgres pg_dump -U postgres -d salescrm -F c -f /tmp/salescrm.dump
podman cp salecrm-postgres:/tmp/salescrm.dump ./salescrm.dump
```

## Update Workflow

Use this process when deploying new code to an existing installation.

1. Back up the database.

```bash
pg_dump -h 127.0.0.1 -U postgres -d salescrm -F c -f salescrm-before-update.dump
```

2. Pull or copy the new repository version.

3. Install updated frontend dependencies.

```bash
npm install
```

4. Install updated backend dependencies.

```bash
source .venv/bin/activate
pip install -r backend/requirements.txt
```

5. Restart the backend.

```bash
uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port 8000
```

6. Build or restart the frontend.

```bash
npm run build
```

7. Verify the app with the checklist below.

If an update includes a new database dump, restore the dump before restarting the backend. If an update does not include a dump, start the backend normally; it will create any missing CRM tables automatically.

## Client Test Checklist

1. Login with `maria@salescrm.app` and password `demo`.
2. Switch language to Spanish from the header.
3. Open `Business Partners` and confirm partners are visible.
4. Run the multi-company tenant isolation test in `docs/TESTING.md`.
5. Open `Follow-ups`, assign or update a task, and add a follow-up note.
6. Login with `juan@salescrm.app` and confirm the assigned task is visible.
7. Open `Follow-up Report`.
8. Filter by Business Partner.
9. Filter by User.
10. Filter by Status.
11. Filter date range by `Next contact date`.
12. Change date type to `Comment date` and filter again.
13. Export CSV.
14. Use `Print / PDF`.
15. Open `Sales Activity` and confirm follow-up events appear.
16. Open `History` and confirm client/quote/task traceability is visible.
17. Open `Bookings` and confirm booking details load.

## Useful Commands

Backend health:

```bash
curl http://localhost:8000/health
```

Bootstrap data:

```bash
curl http://localhost:8000/api/bootstrap
```

Frontend build:

```bash
npm run build
```

Backend tests:

```bash
pip install -r backend/requirements-dev.txt
pytest backend/tests
```
