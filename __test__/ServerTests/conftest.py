import pytest
from src.service.center import service_provider


@pytest.fixture(scope="session")
def app():
    return service_provider
