from pytest import fixture, mark
from handshake.services.DBService.lifecycle import models
from subprocess import Popen
from requests import Session, post
from handshake.services.DBService.models import ConfigBase
from requests.adapters import HTTPAdapter, Retry
from shutil import rmtree
from pathlib import Path
from tortoise import Tortoise
from tortoise.connection import connections

session: Session


@fixture()
def root_dir_server():
    return Path(__file__).parent / "TestServerResults"


@fixture(autouse=True)
async def open_server(root_dir_server, get_db_path):
    if root_dir_server.exists():
        rmtree(root_dir_server)

    result = Popen(
        f'handshake run-app test-life-cycle "{root_dir_server}" -p 6979', shell=True
    )

    global session
    session = Session()
    _session = Session()

    retries = Retry(total=15, backoff_factor=0.1, status_forcelist=[500, 502, 503, 504])
    _session.mount("http://", HTTPAdapter(max_retries=retries))
    response = _session.get("http://127.0.0.1:6979/")
    assert response.text == "1"
    _session.close()

    await Tortoise.init(
        {
            "connections": {
                _.stem: {
                    "engine": "tortoise.backends.sqlite",
                    "credentials": {"file_path": get_db_path(_)},
                }
                for _ in (root_dir_server,)
            },
            "apps": {
                "models": {"models": models, "default_connection": "default"},
            },
        }
    )
    await Tortoise.generate_schemas()

    yield

    try:
        response = post("http://127.0.0.1:6979/bye")
        assert response.text == "1"
    except KeyboardInterrupt:
        result.kill()
        assert False, "Force terminated"

    await connections.get(root_dir_server.name).close()


@mark.usefixtures("open_server")
async def test_init_db_from_server_start(root_dir_server):
    # there is an optional initialization scripts for TestResults which will only run when required
    # run-app is the only automatic way of initializing TestResults
    first_connection = connections.get(root_dir_server.name)
    assert (await ConfigBase.all(using_db=first_connection).count()) > 0
    # now we would have the required data in the configbase
