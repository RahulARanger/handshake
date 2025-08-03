import subprocess
import uuid
from typing import Optional
from loguru import logger
from pytest import fixture, mark
from pathlib import Path

from handshake.services.DBService import DB_VERSION
from handshake.services.DBService.shared import db_path as shared_db_path
from tortoise.connection import connections
from handshake.services.DBService.lifecycle import (
    init_tortoise_orm,
    close_connection,
)
from json import dumps
from handshake.services.DBService.models import (
    RunBase,
    SessionBase,
    ConfigBase,
    TestConfigBase,
)
from datetime import datetime, timedelta, UTC
from time import sleep
from handshake.services.Endpoints.core import service_provider
from handshake.services.DBService.models.enums import ConfigKeys
from handshake.services.DBService.migrator import revert_step_back
from shutil import rmtree

pytestmark = mark.asyncio

testNames = "pyTestForOurProject"


@fixture()
def root_dir():
    return Path(__file__).parent.parent / "PyTestResults"


@fixture()
def db_path(root_dir):
    return shared_db_path(root_dir)


@fixture()
def version_file():
    return Path(__file__).parent.parent / "handshake" / ".version"


@fixture()
def init_db(root_dir):
    return lambda x=None: subprocess.call(
        f'handshake init "{x if x else root_dir}"', shell=True
    )


async def get_connection(db_path, v=5, connection=None):
    connection = connections.get("default") if not connection else connection

    if v > DB_VERSION:
        # for testing purposes only.
        await connection.execute_script(
            f'UPDATE configbase SET value = {v + 1} WHERE key = "VERSION"'
        )
    # assuming we are at DB_VERSION
    for revert in reversed(range(v + 1, DB_VERSION + 1)):
        revert_step_back(revert, db_path)

    return connection


@fixture
def get_vth_connection():
    return get_connection


@fixture
def scripts():
    return (
        Path(__file__).parent.parent
        / "handshake"
        / "services"
        / "DBService"
        / "scripts"
    )


@fixture(autouse=True)
async def clean_close(db_path, init_db):
    if not db_path.exists():
        init_db()

    await init_tortoise_orm(db_path)
    yield

    # deleting sample test runs
    await RunBase.filter(projectName__icontains=testNames).all().delete()
    await close_connection()

    rmtree(db_path.parent)


async def helper_create_test_config(
    test_id: str, file_retries=0, avoidParentSuitesInCount=False, connection=None, tags=None, manual=False
):
    if manual:
        conn = (connection if connection else connections.get("default"))
        await conn.execute_query(
            '''
            INSERT INTO "testconfigbase" (
                "test_id",
                "fileRetries",
                "framework",
                "platform",
                "maxInstances",
                "avoidParentSuitesInCount"
            ) VALUES (?, ?, ?,  ?, ?, ?)
            ON CONFLICT("test_id") DO UPDATE SET
                "fileRetries" = excluded."fileRetries",
                "framework" = excluded."framework",
                "platform" = excluded."platform",
                "maxInstances" = excluded."maxInstances",
                "avoidParentSuitesInCount" = excluded."avoidParentSuitesInCount"
            ''',
            [
                test_id,
                file_retries,
                "pytest",
                "windows",
                1,
                avoidParentSuitesInCount,
            ],
        )
        if tags:
            try:
                await conn.execute_query("UPDATE testconfigbase set tags = ? WHERE test_id = ?", [dumps(tags or []), test_id])
            except Exception as error:
                logger.exception("Failed to add tags")
                raise error

        return

    await TestConfigBase.update_or_create(
        fileRetries=file_retries,
        framework="pytest",
        platform="windows",
        maxInstances=1,
        avoidParentSuitesInCount=avoidParentSuitesInCount,
        test_id=test_id,
        using_db=connection,
    )


async def sample_test_run(
    postfix: Optional[str] = "", connection=None, add_test_config=False
):
    noted = datetime.now(UTC)
    note = await RunBase.create(
        projectName=testNames + postfix,
        started=noted,
        ended=noted + timedelta(minutes=10),
        duration=timedelta(minutes=10).total_seconds() * 1000,
        using_db=connection,
    )
    if add_test_config:
        await helper_create_test_config(note.testID)
    return note


async def attach_db_config(maxRunsPerProject=2):
    record, _ = await ConfigBase.update_or_create(key=ConfigKeys.maxRunsPerProject)
    record.value = maxRunsPerProject
    await record.save()


@fixture()
def helper_create_test_run():
    return sample_test_run


@fixture()
def helper_set_db_config():
    return attach_db_config


async def create_test_and_session(
    postfix="", fix_tags=False, manual_insert_test_run=False, connection=None, return_id=False
):
    if manual_insert_test_run:
        # used only in test cases that too, on db with old versions
        test_id = str(uuid.uuid4())
        try:
            # we have fix tags to use for v15 onwards
            vals = [
                    "2024-09-14 17:33:57.568757+00:00",
                    "2024-09-14 17:43:57.568757+00:00",
                    2,
                    2,
                    0,
                    0,
                    0,
                    2,
                    "PENDING",
                    test_id,
                    "sample-test",
                    "{}",
                    0,

                ]
            if fix_tags:
                vals.append('[]')

            await (connection if connection else connections.get("default")).execute_query(
                'INSERT INTO "runbase" ("started","ended","tests","passed","failed","skipped","duration","retried",'
                f'"standing","testID","projectName","specStructure","exitCode" {', tags' if fix_tags else ''}) VALUES (?,?,?,?,?,'
                f"?,?,?,?,?,?,?,?{', ?' if fix_tags else ''})",
                vals
            )
        except Exception as error:
            print("FYI: ", error)
            raise error
    else:
        test_id = (await sample_test_run(postfix, connection)).testID

    if return_id:
        return test_id, await test_session(test_id, connection, True)
    else:
        return await test_session(test_id, connection)


@fixture()
def helper_to_create_test_and_session():
    return create_test_and_session


@fixture()
def attach_config():
    return helper_create_test_config


@fixture()
async def sample_test_session(helper_create_test_run):
    return await test_session((await helper_create_test_run()).testID)


async def test_session(test_id: str, connection=None, manual_insert=False):
    sleep(0.1)
    started = datetime.now(UTC) + timedelta(seconds=36)
    if not manual_insert:
        _ = await SessionBase.create(
            started=started,
            test_id=test_id,
            ended=started + timedelta(seconds=36),
            using_db=connection,
        )
        return _

    session_id = str(uuid.uuid4())

    await (connection if connection else connections.get("default")).execute_query(
        'INSERT INTO "sessionbase" ("sessionID","simplified","started","ended","tests","passed","failed","skipped",'
        '"duration","test_id") VALUES (?,?,?,?,?,?,?,'
        "?,?,?)",
        [
            session_id,
            "",
            started.isoformat(),
            (started + timedelta(seconds=36)).isoformat(),
            2,
            2,
            0,
            0,
            0,
            str(test_id),
        ],
    )

    return session_id


@fixture()
def helper_create_test_session():
    return test_session


@fixture()
def app():
    return service_provider


def helper_to_test_date_operator(from_db: datetime, from_json: str):
    assert datetime.strptime(from_json, "%Y-%m-%d %H:%M:%S.%f%z").strftime(
        "%Y-%m-%d %H:%M:%S%z"
    ) == from_db.astimezone(UTC).strftime("%Y-%m-%d %H:%M:%S%z"), "Datetime is not same"
