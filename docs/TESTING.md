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
export CRM_FRONTEND_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://82.38.44.28:8082
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
- health returns `database.status: ok`
- bootstrap returns CRM data collections

For AWS, use the deployed backend URL instead:

```bash
curl https://<backend-domain>/health
```

If `database.status` is not `ok`, the backend is running but is not connected correctly to PostgreSQL/RDS.

## 3. Login Tests

Use password `demo`.

- `superadmin@salescrm.app`
- `maria@salescrm.app`
- `juan@salescrm.app`
- `admin-lite@salescrm.app`

The login screen also has a `Sign up` option. Use it to create a new company tenant and first sales manager user. The sign-up form requires:

- full name
- email
- password with at least 8 characters
- tenant/company key, for example `new-company-main`
- optional company name

After sign-up, the user is logged into that tenant and should only see data for that company.

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

For AWS persistence testing:

1. Create a Business Partner named `AWS Persistence Test Partner`.
2. Refresh the browser.
3. Restart the backend service.
4. Refresh the browser again.
5. Confirm the partner is still visible.

If the partner disappears, the browser was using local fallback data or the backend was not writing to PostgreSQL/RDS.

## 5. Multi-company Tenant Isolation Test

Use this test to confirm that users from one company cannot see or edit another company's CRM data.

### 5.1 Get an admin token

Login as Maria and copy the returned `token`.

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"maria@salescrm.app","password":"demo"}'
```

For the commands below, replace:

```text
<ADMIN_TOKEN>
```

with Maria's token.

### 5.2 Create two users in two different tenant companies

Create a Company A user:

```bash
curl -X PUT http://localhost:8000/api/users/u-company-a \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "u-company-a",
    "name": "Company A User",
    "email": "company-a@salescrm.app",
    "role": "sales_manager",
    "tenant_key": "company-a-main",
    "permissions": ["partners:read", "partners:write", "tasks:read", "tasks:write"],
    "password": "companyA123"
  }'
```

Create a Company B user:

```bash
curl -X PUT http://localhost:8000/api/users/u-company-b \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "u-company-b",
    "name": "Company B User",
    "email": "company-b@salescrm.app",
    "role": "sales_manager",
    "tenant_key": "company-b-main",
    "permissions": ["partners:read", "partners:write", "tasks:read", "tasks:write"],
    "password": "companyB123"
  }'
```

### 5.3 Login as each company user

Login as Company A:

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"company-a@salescrm.app","password":"companyA123"}'
```

Copy the token as:

```text
<COMPANY_A_TOKEN>
```

Login as Company B:

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"company-b@salescrm.app","password":"companyB123"}'
```

Copy the token as:

```text
<COMPANY_B_TOKEN>
```

### 5.4 Create one Business Partner per tenant

Create a Company A partner:

```bash
curl -X PUT http://localhost:8000/api/partners/company-a-partner \
  -H "Authorization: Bearer <COMPANY_A_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "company-a-partner",
    "company_name": "Company A Private Partner",
    "roles": ["customer"],
    "status": "active",
    "salesperson": "Company A User",
    "country": "Uruguay",
    "tax_id": "A-PRIVATE-001"
  }'
```

Create a Company B partner:

```bash
curl -X PUT http://localhost:8000/api/partners/company-b-partner \
  -H "Authorization: Bearer <COMPANY_B_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "company-b-partner",
    "company_name": "Company B Private Partner",
    "roles": ["customer"],
    "status": "active",
    "salesperson": "Company B User",
    "country": "Uruguay",
    "tax_id": "B-PRIVATE-001"
  }'
```

### 5.5 Confirm each user only sees their own company data

Company A should see Company A data:

```bash
curl http://localhost:8000/api/bootstrap \
  -H "Authorization: Bearer <COMPANY_A_TOKEN>" | grep "Company A Private Partner"
```

Company A should not see Company B data:

```bash
curl http://localhost:8000/api/bootstrap \
  -H "Authorization: Bearer <COMPANY_A_TOKEN>" | grep "Company B Private Partner"
```

Expected: no output.

Company B should see Company B data:

```bash
curl http://localhost:8000/api/bootstrap \
  -H "Authorization: Bearer <COMPANY_B_TOKEN>" | grep "Company B Private Partner"
```

Company B should not see Company A data:

```bash
curl http://localhost:8000/api/bootstrap \
  -H "Authorization: Bearer <COMPANY_B_TOKEN>" | grep "Company A Private Partner"
```

Expected: no output.

### 5.6 Confirm the frontend behavior

1. Open the same frontend URL.
2. Login as `company-a@salescrm.app` with password `companyA123`.
3. Open Business Partners.
4. Confirm `Company A Private Partner` is visible.
5. Confirm `Company B Private Partner` is not visible.
6. Logout.
7. Login as `company-b@salescrm.app` with password `companyB123`.
8. Open Business Partners.
9. Confirm `Company B Private Partner` is visible.
10. Confirm `Company A Private Partner` is not visible.

This proves that one shared frontend can serve multiple companies while authenticated CRM data remains isolated by tenant.

## 6. Follow-up Flow Test

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

## 7. Follow-up Report Test

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

## 8. Traceability Test

1. Open Sales Activity.
2. Confirm the follow-up note appears.
3. Open History.
4. Confirm client, quote, task, and booking events are visible.
5. Open a Business Partner detail page.
6. Confirm related tasks, quotes, messages, history, and profile data are visible.

## 9. Booking Test

1. Open Bookings.
2. Click New booking.
3. Create a booking linked to a partner.
4. Open the booking detail page.
5. Confirm trace shortcuts and recent history are visible.

## 10. Report Export Expectations

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

## 11. Permission Test

1. Login as a user without a specific write permission.
2. Attempt the restricted action.
3. Confirm the permission warning modal appears.
