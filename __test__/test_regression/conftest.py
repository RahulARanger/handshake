from pytest import fixture
from handshake.services.DBService.lifecycle import init_tortoise_orm, close_connection
from handshake.services.DBService.models import RunBase, SessionBase
from datetime import datetime, timedelta
from subprocess import call
from sanic_testing.testing import SanicASGITestClient
from handshake.services.Endpoints.core import service_provider
from __test__.conftest import testNames


@fixture()
def init_db(root_dir, dist_name):
    return lambda: call(f'{dist_name} config "{root_dir}"', shell=True)


@fixture(autouse=True)
async def clean_close(db_path, init_db):
    if not db_path.exists():
        init_db()

    await init_tortoise_orm(db_path)
    yield

    # deleting sample test runs
    await RunBase.filter(projectName=testNames).all().delete()
    await close_connection()


@fixture()
async def sample_test_run():
    return await RunBase.create(projectName=testNames, started=datetime.utcnow())


@fixture()
async def sample_test_session(sample_test_run: RunBase):
    started = datetime.utcnow()
    return await SessionBase.create(
        started=started,
        test_id=(await sample_test_run).testID,
        ended=started + timedelta(milliseconds=24),
    )


@fixture()
def app():
    return service_provider


@fixture()
def client() -> SanicASGITestClient:
    return service_provider.asgi_client
