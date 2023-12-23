from pytest import fixture
from sanic_testing.testing import SanicASGITestClient
from handshake.services.Endpoints.core import service_provider


@fixture()
def client() -> SanicASGITestClient:
    return service_provider.asgi_client
