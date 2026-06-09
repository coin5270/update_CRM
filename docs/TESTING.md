# Client Testing Guide

Use this guide to verify the CRM after local setup, deployment, database restore, or code updates.

## 1. Start Services

Start PostgreSQL:

```bash
docker compose up -d postgres
```

Start backend:

```bash
source .venv/bin/activate
export CRM_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/salescrm
export CRM_FRONTEND_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port 8000 --reload
```

Start frontend:

```bash
npm run dev -- --host 0.0.0.0 --port 5173
```

Open:

```text
http://localhost:5173
```

## 2. Verify Backend

```bash
curl http://localhost:8000/health
curl http://localhost:8000/api/bootstrap
```

Expected:

- health returns `status: ok`
- bootstrap returns CRM data collections

## 3. Login Tests

Use password `demo`.

- `maria@salescrm.app`
- `juan@salescrm.app`
- `admin-lite@salescrm.app`

## 4. Business Partner Synchronization Test

1. Login as Maria.
2. Open Business Partners.
3. Confirm existing partners are visible.
4. Use the API to create or update a partner.

```bash
curl -X PUT http://localhost:8000/api/partners/test-partner-001 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Key: uy-main" \
  -d '{
    "id": "test-partner-001",
    "company_name": "Test Partner S.A.",
    "roles": ["customer"],
    "status": "active",
    "salesperson": "Maria Lopez",
    "country": "Uruguay",
    "tax_id": "RUT-TEST-001"
  }'
```

5. Refresh Business Partners.
6. Confirm `Test Partner S.A.` appears and `tax_id` maps to Tax ID in the CRM UI.

## 5. Follow-up Flow Test

1. Login as Maria.
2. Open Follow-ups.
3. Create or edit a task assigned to Juan Smith.
4. Logout.
5. Login as Juan.
6. Open Follow-ups.
7. Confirm Juan can see the assigned task.
8. Add a follow-up note.
9. Set a next contact date.
10. Mark the task completed.

## 6. Follow-up Report Test

1. Open Follow-up Report.
2. Switch language to Spanish.
3. Filter by Business Partner.
4. Filter by User.
5. Filter by Status.
6. Select `Fecha de próximo contacto` and use Desde/Hasta.
7. Select `Fecha de comentario` and use Desde/Hasta.
8. Confirm rows change according to the selected date type.
9. Export CSV.
10. Use Print / PDF and confirm the print preview is populated.

## 7. Traceability Test

1. Open Sales Activity.
2. Confirm the follow-up note appears.
3. Open History.
4. Confirm client, quote, task, and booking events are visible.
5. Open a Business Partner detail page.
6. Confirm related tasks, quotes, messages, history, and profile data are visible.

## 8. Booking Test

1. Open Bookings.
2. Click New booking.
3. Create a booking linked to a partner.
4. Open the booking detail page.
5. Confirm trace shortcuts and recent history are visible.

## 9. Report Export Expectations

The Follow-up Report CSV includes:

- task
- client
- contact
- next contact
- comment date
- date type
- status
- commentary

The Print / PDF output should include:

- report title
- generated date
- grouped client sections
- task
- next contact
- commentary
- status

## 10. Permission Test

1. Login as a user without a specific write permission.
2. Attempt the restricted action.
3. Confirm the permission warning modal appears.
