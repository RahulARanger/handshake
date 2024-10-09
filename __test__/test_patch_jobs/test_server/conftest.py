from pytest import fixture
from sanic_testing.testing import SanicASGITestClient
from handshake.services.Endpoints.core import service_provider


@fixture()
def client() -> SanicASGITestClient:
    return service_provider.asgi_client


@fixture()
def savePts():
    return lambda port, suffix: f"http://127.0.0.1:{port}/save/{suffix}"


@fixture()
def createPts():
    return lambda port, suffix: f"http://127.0.0.1:{port}/create/{suffix}"


@fixture()
def updatePts():
    return lambda port, suffix: f"http://127.0.0.1:{port}/save/{suffix}"
