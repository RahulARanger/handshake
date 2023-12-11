import platform
import subprocess

from pytest import fixture, mark
from pathlib import Path
from handshake.services.DBService.shared import db_path as shared_db_path


pytestmark = mark.asyncio

testNames = "pyTestForOurProject"


@fixture()
def root_dir():
    return Path(__file__).parent.parent / "TestResults"


@fixture()
def db_path(root_dir):
    return shared_db_path(root_dir)


@fixture()
def dist(root_dir):
    return root_dir.parent / "dist"


@fixture()
def dist_name():
    return f"handshake-{platform.system()}"


@fixture()
def init_db(root_dir, dist, dist_name):
    return lambda: subprocess.call(
        f'{dist_name} config "{root_dir}"', shell=True, cwd=dist
    )