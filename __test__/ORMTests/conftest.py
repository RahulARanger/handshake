import pytest
from tortoise.contrib.test import finalizer, initializer


@pytest.fixture(scope="session", autouse=True)
def initialize_tests(request):
    db_url = "sqlite://:memory:"
    initializer(["src.service.DBService.models"], db_url=db_url, app_label="models")
    request.addfinalizer(finalizer)
