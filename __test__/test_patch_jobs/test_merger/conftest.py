import shutil
import time

from pytest import fixture
from pathlib import Path
from __test__.conftest import testNames
from handshake.services.DBService.shared import db_path as shared_db_path
from handshake.services.DBService.lifecycle import models, close_connection
from handshake.services.DBService.models import RunBase
from handshake.services.DBService.models.enums import ConfigKeys
from tortoise import connections, Tortoise


@fixture()
def root_dir():
    return Path(__file__).parent.parent.parent.parent / "TestMerge"


@fixture()
def root_dir_1():
    return Path(__file__).parent.parent.parent.parent / "TestMerge1"


@fixture()
def root_dir_2():
    return Path(__file__).parent.parent.parent.parent / "TestMerge2"


@fixture()
def root_dir_3():
    return Path(__file__).parent.parent.parent.parent / "TestMerge3"


@fixture(autouse=True)
async def cleanup(root_dir_1, root_dir_2, root_dir_3, get_db_path, init_db):
    dir_s = (root_dir_1, root_dir_2, root_dir_3)

    for _ in dir_s:
        if _.exists():
            shutil.rmtree(_)

        _.mkdir()

        path = get_db_path(_)

        if not path.exists():
            init_db(_)

    await Tortoise.init(
        {
            "connections": {
                _.stem: {
                    "engine": "tortoise.backends.sqlite",
                    "credentials": {"file_path": get_db_path(_)},
                }
                for _ in dir_s
            },
            "apps": {
                "models": {"models": models, "default_connection": "default"},
            },
        }
    )
    await Tortoise.generate_schemas()

    yield
    time.sleep(1)
    await close_connection()

    for _ in dir_s:
        if _.exists():
            shutil.rmtree(_)
