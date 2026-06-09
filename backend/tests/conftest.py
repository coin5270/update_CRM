from pathlib import Path
import os
import sys
from uuid import uuid4

import pytest


BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))


@pytest.fixture()
def isolated_repository(monkeypatch):
    from app import repository

    test_tenant = f"test-{uuid4().hex}"
    database_url = os.getenv(
        "CRM_DATABASE_URL",
        "postgresql://postgres:postgres@127.0.0.1:5432/salescrm",
    )
    monkeypatch.setattr(repository, "DB_URL", database_url)
    monkeypatch.setattr(repository, "USE_POSTGRES", True)
    monkeypatch.setattr(repository, "DEFAULT_TENANT_KEY", test_tenant)

    with repository.tenant_scope(test_tenant):
        try:
            with repository._connect() as connection:
                repository._ensure_schema(connection)
                for table_name in set(repository.RESOURCE_TABLES.values()):
                    connection.execute(
                        "DELETE FROM " + table_name + " WHERE tenant_id = %s",
                        (test_tenant,),
                    )
                connection.commit()
        except Exception as error:
            pytest.skip(
                "Backend tests require a reachable PostgreSQL database. "
                "Start it with `docker compose up -d postgres` or set CRM_DATABASE_URL. "
                f"Original error: {error}"
            )

        yield repository

        with repository._connect() as connection:
            for table_name in set(repository.RESOURCE_TABLES.values()):
                connection.execute(
                    "DELETE FROM " + table_name + " WHERE tenant_id = %s",
                    (test_tenant,),
                )
            connection.commit()
