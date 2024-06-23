import shutil
import time

from pytest import fixture
from pathlib import Path
from __test__.conftest import testNames
from handshake.services.DBService.shared import db_path as shared_db_path
from handshake.services.DBService.lifecycle import init_tortoise_orm, close_connection
from handshake.services.DBService.models import RunBase
from handshake.services.DBService.models.enums import ConfigKeys
from tortoise import connections


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
    for _ in (root_dir_1, root_dir_2, root_dir_3):
        if _.exists():
            shutil.rmtree(_)

        _.mkdir()

        path = get_db_path(_)

        if not path.exists():
            init_db(_)

    yield
    time.sleep(1)
    await close_connection()

    for _ in (root_dir_1, root_dir_2, root_dir_3):
        if _.exists():
            shutil.rmtree(_)
