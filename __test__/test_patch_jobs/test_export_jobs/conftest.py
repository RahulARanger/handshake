import shutil
import time
from urllib.request import urlopen, urlretrieve, Request
from json import loads
from pytest import fixture
from pathlib import Path
from __test__.conftest import testNames
from handshake.services.DBService.shared import db_path as shared_db_path
from handshake.services.DBService.lifecycle import init_tortoise_orm, close_connection
from handshake.services.DBService.models import RunBase


@fixture()
def root_dir():
    return Path(__file__).parent.parent.parent.parent / "TestExportBase"


@fixture()
def report_dir(root_dir):
    return root_dir.parent / "TestExportedReports"


@fixture()
def db_path(root_dir):
    return shared_db_path(root_dir)


@fixture()
def zipped_build(root_dir):
    return root_dir.parent / "dashboard.tar.bz2"


@fixture(autouse=True)
async def clean_close(db_path, init_db, root_dir, report_dir, zipped_build):
    if root_dir.exists():
        shutil.rmtree(root_dir)
    zipped_build.unlink(missing_ok=True)

    root_dir.mkdir()
    release_info = urlopen(
        Request(
            "https://api.github.com/repos/RahulARanger/handshake/releases",
            headers=dict(accept="application/vnd.github+json"),
        )
    )

    urlretrieve(
        loads(release_info.read().decode("utf-8"))[0]["assets"][0][
            "browser_download_url"
        ],
        zipped_build,
    )

    assert zipped_build.exists()

    if not db_path.exists():
        init_db()

    await init_tortoise_orm(db_path)
    yield

    # deleting sample test runs
    await RunBase.filter(projectName=testNames).all().delete()
    await close_connection()
    time.sleep(1)

    if root_dir.exists():
        shutil.rmtree(root_dir)

    if zipped_build.exists():
        zipped_build.unlink()
