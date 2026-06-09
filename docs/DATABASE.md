# Database Manual

The CRM uses PostgreSQL as the runtime database.

## Default Local Database

```text
Host: localhost
Port: 5432
Database: salescrm
User: postgres
Password: postgres
Tenant: uy-main
```

Connection string:

```bash
CRM_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/salescrm
```

## Storage Model

The backend stores each CRM resource in a tenant-scoped table with this shape:

```sql
tenant_id TEXT NOT NULL
id TEXT NOT NULL
payload JSONB NOT NULL
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
PRIMARY KEY (tenant_id, id)
```

The JSON payload contains the business fields for each resource. This makes updates flexible while keeping tenant isolation at the table key level.

## Tenant Equals Company

Each company using the CRM should have a unique tenant key. Users are assigned to a tenant through their `tenant_key` field.

Example:

```json
{
  "id": "u-sdc-001",
  "name": "SDC User",
  "email": "user@sdc.example",
  "role": "sales",
  "tenant_key": "sdc-main",
  "permissions": ["partners:read", "tasks:read"]
}
```

Authenticated API requests are scoped by the tenant stored in the user's session token. This prevents one company's users from seeing another company's CRM records even if a different `X-Tenant-Key` header is manually sent.

## Tables

| Resource                | Table                  |
| ----------------------- | ---------------------- |
| Business partners       | `crm_partners`         |
| Contacts                | `crm_contacts`         |
| Tasks / follow-ups      | `crm_tasks`            |
| Quotes                  | `crm_opportunities`    |
| Bookings / operations   | `crm_operations`       |
| Interactions / messages | `crm_interactions`     |
| Notifications           | `crm_alerts`           |
| History                 | `crm_customer_history` |
| Sales activity events   | `crm_sales_events`     |
| Automations / reminders | `crm_reminders`        |
| Pipeline                | `crm_pipeline`         |
| API connections         | `crm_api_connections`  |
| Users                   | `crm_users`            |
| Sessions                | `crm_sessions`         |
| Audit                   | `crm_audit`            |

## Schema Creation

There is no separate migration command in the current project. The backend creates missing tables automatically in `backend/app/repository.py`.

Schema creation runs when the backend first accesses a collection, for example:

```bash
curl http://localhost:8000/api/bootstrap
```

## Seed Data

There is no separate seeder command. Seed records are embedded in `backend/app/repository.py` and are inserted automatically with `ON CONFLICT DO NOTHING`.

This means:

- seed data is inserted only if the same tenant/id does not already exist
- existing records are not overwritten by seed data
- the default seed tenant is `uy-main`

To trigger seeding:

```bash
curl http://localhost:8000/api/bootstrap
```

Seeded users all use password:

```text
demo
```

## Backup

The database should be delivered to the client as a PostgreSQL custom dump file:

```text
salescrm.dump
```

This file contains the CRM database state at the moment of delivery. It is the file the client or hosting provider restores into PostgreSQL.

Custom PostgreSQL dump:

```bash
pg_dump -h 127.0.0.1 -U postgres -d salescrm -F c -f salescrm.dump
```

Plain SQL dump:

```bash
pg_dump -h 127.0.0.1 -U postgres -d salescrm -f salescrm.sql
```

Docker Compose variant:

```bash
docker compose exec postgres pg_dump -U postgres -d salescrm -F c -f /tmp/salescrm.dump
docker cp sale-crm-postgres-1:/tmp/salescrm.dump ./salescrm.dump
```

Podman variant:

```bash
podman exec salecrm-postgres pg_dump -U postgres -d salescrm -F c -f /tmp/salescrm.dump
podman cp salecrm-postgres:/tmp/salescrm.dump ./salescrm.dump
```

## Restore

Use this process when receiving the project package for the first time.

Files needed:

- repository folder
- `salescrm.dump`
- PostgreSQL username/password

Restore into the existing database:

```bash
pg_restore -h 127.0.0.1 -U postgres -d salescrm --clean --if-exists salescrm.dump
```

Restore into a new database:

```bash
createdb -h 127.0.0.1 -U postgres salescrm_restore
pg_restore -h 127.0.0.1 -U postgres -d salescrm_restore salescrm.dump
```

Docker Compose variant:

```bash
docker cp salescrm.dump sale-crm-postgres-1:/tmp/salescrm.dump
docker compose exec postgres pg_restore -U postgres -d salescrm --clean --if-exists /tmp/salescrm.dump
```

Podman variant:

```bash
podman cp salescrm.dump salecrm-postgres:/tmp/salescrm.dump
podman exec -it salecrm-postgres pg_restore -U postgres -d salescrm --clean --if-exists /tmp/salescrm.dump
```

## Restore Verification

After restoring the dump, run these checks:

```bash
PGPASSWORD=postgres psql -h 127.0.0.1 -U postgres -d salescrm -c "select count(*) from crm_users;"
PGPASSWORD=postgres psql -h 127.0.0.1 -U postgres -d salescrm -c "select count(*) from crm_partners;"
PGPASSWORD=postgres psql -h 127.0.0.1 -U postgres -d salescrm -c "select count(*) from crm_tasks;"
```

Then start the backend and check:

```bash
curl http://localhost:8000/health
```

Expected result:

```json
{
  "status": "ok",
  "database": {
    "status": "ok"
  }
}
```

Finally, open the frontend and log in with one of the delivered users.

## Database Update Manual

Use this process before applying backend changes that affect data fields or resources.

1. Back up the current database.

```bash
pg_dump -h 127.0.0.1 -U postgres -d salescrm -F c -f salescrm-before-db-update.dump
```

2. Apply the new code version.

3. Restart the backend.

4. Trigger schema checks and seeding.

```bash
curl http://localhost:8000/api/bootstrap
```

5. Verify the affected resource tables.

```bash
psql -h 127.0.0.1 -U postgres -d salescrm
```

Useful checks:

```sql
SELECT COUNT(*) FROM crm_partners WHERE tenant_id = 'uy-main';
SELECT COUNT(*) FROM crm_tasks WHERE tenant_id = 'uy-main';
SELECT COUNT(*) FROM crm_sales_events WHERE tenant_id = 'uy-main';
SELECT COUNT(*) FROM crm_users WHERE tenant_id = 'uy-main';
```

6. Test the frontend flows that depend on the changed data.

## Update Package Rules

Every future database-related update should include one of these:

- no database file, if the update only changes code
- a SQL script, if a small data/schema adjustment is needed
- a new `salescrm.dump`, if the client should replace the full database state

Recommended naming:

```text
updates/
2026-06-04-code-only/
2026-06-04-database-update.sql
2026-06-04-salescrm.dump
```

Recommended update note:

```text
1. Back up the current database.
2. Apply the code update.
3. If this package includes a SQL script, run it with psql.
4. If this package includes a dump, restore it with pg_restore.
5. Restart the backend.
6. Check /health.
7. Log in and run the testing checklist.
```

SQL script example:

```bash
PGPASSWORD=postgres psql -h 127.0.0.1 -U postgres -d salescrm -f updates/2026-06-04-database-update.sql
```

## Adding or Updating Seed Data

Seed data lives in:

```text
backend/app/repository.py
```

To add a new seed record:

1. Add it to the appropriate `seed_*` list.
2. Give it a stable unique `id`.
3. Include required model fields from `backend/app/models.py`.
4. Restart the backend.
5. Call `/api/bootstrap`.

Because seeds use `ON CONFLICT DO NOTHING`, changing an existing seed record will not update a database row that already exists. To force a seed update in a local test database, delete that row or restore a fresh database.

Example:

```sql
DELETE FROM crm_tasks WHERE tenant_id = 'uy-main' AND id = 't1';
```

Then call:

```bash
curl http://localhost:8000/api/bootstrap
```

## Import / Export Through the API

Users with integration permissions can export all CRM data:

```bash
curl -H "Authorization: Bearer <token>" http://localhost:8000/api/admin/export
```

Users with integration write permission can import a JSON backup:

```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  --data @backup.json \
  http://localhost:8000/api/admin/import
```

## Testing After Database Updates

- Login with `maria@salescrm.app`.
- Confirm `/api/bootstrap` returns partners, contacts, tasks, quotes, operations, sales events, and users.
- Create a follow-up task.
- Add a follow-up note.
- Confirm the note appears in Sales Activity.
- Confirm the task appears in Follow-up Report.
- Filter Follow-up Report by Business Partner, User, Status, Next Contact Date, and Comment Date.
- Print the Follow-up Report.
- Export CSV.
