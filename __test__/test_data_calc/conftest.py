from typing import Optional
from pytest import fixture
from handshake.services.DBService.models import (
    SuiteBase,
    SessionBase,
    AssertBase,
    StaticBase,
)
from handshake.services.DBService.models.enums import SuiteType, Status, AttachmentType
from handshake.services.DBService.shared import db_path as shared_db_path
from handshake.services.Endpoints.blueprints.writeServices import (
    writtenAttachmentFolderName,
)
from __test__.conftest import test_session
from tortoise.connection import connections
from handshake.services.SchedularService.register import register_patch_suite
import datetime
from asyncio import sleep
from pathlib import Path
from uuid import uuid4


async def helper_create_suite(
    session_id: str,
    name: str = "suite-parent",
    parent: str = "",
    is_test: bool = False,
    standing=Status.YET_TO_CALCULATE,
    retried=0,
    started: Optional[datetime] = datetime.datetime.now(),
    file: str = "test-1.js",
    connection=None,
    hook: Optional[str] = None,
    duration: Optional[datetime.timedelta] = datetime.timedelta(seconds=10),
    manual_insert: Optional[bool] = False,
):
    if manual_insert:
        connection = connection if connection else connections.get("default")
        _id = str(uuid4())
        payload = [
            _id,
            "sample-suite",
            (
                Status.PASSED
                if hook
                else (Status.PASSED if is_test else Status.YET_TO_CALCULATE)
            ),
            "2024-10-02 21:04:00.349714+00:00" if started else None,
            "2024-10-02 21:04:00.361714+00:00" if started else None,
            1,
            1,
            0,
            0,
            2000 if started else 0,
            0,
            file,
            hook if hook else (SuiteType.TEST if is_test else SuiteType.SUITE),
            "[]",
            str(session_id),
            "[]",
        ]
        await connection.execute_query(
            'INSERT INTO "suitebase" ("suiteID","title","standing","started","ended","tests","passed",'
            '"failed","skipped","duration","retried","file","suiteType","errors",'
            '"session_id","tags"'
            ") VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            payload,
        )
        return payload
    extras = {standing.lower(): 1} if is_test else {}
    error = [] if standing != Status.FAILED else [{"message": "sample-error"}]

    save_duration = (duration.seconds * 1_000) if duration else 12

    return await SuiteBase.create(
        session_id=session_id,
        suiteType=hook if hook else (SuiteType.TEST if is_test else SuiteType.SUITE),
        started=started.isoformat() if started else None,
        ended=(
            (started + (duration if duration else datetime.timedelta(milliseconds=12)))
            if started
            else None
        ),
        title=name,
        standing=standing,
        duration=save_duration,
        setup_duration=save_duration if hook == SuiteType.SETUP else 0,
        teardown_duration=save_duration if hook == SuiteType.TEARDOWN else 0,
        file=file,
        parent=parent,
        tests=1,
        retried=retried,
        errors=error,
        using_db=connection,
        **extras,
    )


async def helper_create_all_types_of_tests(
    session_id: str,
    parent: str,
    retried=0,
    connection=None,
    manual_insert: Optional[bool] = False,
):
    tests = []

    for test in range(3):
        for _ in (Status.PASSED, Status.FAILED, Status.SKIPPED):
            await sleep(0.002)
            tests.append(
                await helper_create_suite(
                    session_id,
                    f"test-{test}-{_}",
                    parent,
                    True,
                    _,
                    retried=retried,
                    connection=connection,
                    manual_insert=manual_insert,
                )
            )
    return tests


async def helper_create_session_with_hierarchy_with_no_retries(
    test_id: str,
    suite_files=("test-1.js", "test-2.js", "test-3.js"),
    parent_suite: str = "",
    started=datetime.datetime.now(),
    connection=None,
    skip_register=False,
    manual_insert: Optional[bool] = False,
):
    to_return = []

    # 3 suites with each suite having 9 tests with 3 in failed, 2 passed, 3 skipped
    for thing in suite_files:
        session_id = await test_session(
            test_id, connection=connection, manual_insert=manual_insert
        )
        if not manual_insert:
            session_id = session_id.sessionID

        suite = await helper_create_suite(
            session_id,
            parent=parent_suite,
            started=started,
            file=thing,
            connection=connection,
            manual_insert=manual_insert,
        )
        to_return.append(str(session_id))
        await helper_create_all_types_of_tests(
            session_id,
            suite[0] if manual_insert else suite.suiteID,
            connection=connection,
            manual_insert=manual_insert,
        )
        if not manual_insert:
            session = (
                await SessionBase.all(using_db=connection)
                .filter(sessionID=str(session_id))
                .first()
            )
            await session.update_from_dict(dict(passed=3, failed=3, skipped=3, tests=9))
            await session.save(using_db=connection)

        if not skip_register:
            await register_patch_suite(
                suite[0] if manual_insert else suite.suiteID,
                test_id,
                connection=connection,
            )

    return to_return


async def helper_create_normal_suites(
    session_id: str,
    parent_suite: str,
    test_id: str,
    retried=0,
    suite_files=("test-1.js", "test-2.js", "test-3.js"),
    started=datetime.datetime.now(),
):
    suites = []
    tests = []

    # 3 suites with 3 tests in each (all tests have failed)
    for index in range(3):
        suite = await helper_create_suite(
            session_id,
            f"suite-{index + 1}",
            parent_suite,
            retried=retried,
            file=suite_files[index],
            started=started,
        )
        suites.append(suite.suiteID)

        _tests = []

        for test_index, stat in enumerate(
            (Status.PASSED, Status.FAILED, Status.SKIPPED)
        ):
            await sleep(0.002)
            test_started_at = started + datetime.timedelta(
                milliseconds=2.1 * test_index
            )
            test = await SuiteBase.create(
                session_id=session_id,
                suiteType=SuiteType.TEST,
                started=test_started_at.isoformat(),
                ended=test_started_at + datetime.timedelta(milliseconds=2),
                title=f"test-{index + 1}-{test_index + 1}",
                standing=stat,
                file=suite_files[index],
                parent=suites[-1],
                errors=[{"message": f"{index}-{test_index}"}],
                retried=retried,
                tests=1,
                **{stat.lower(): 1},
            )
            _tests.append(test.suiteID)

        await register_patch_suite(suites[-1], test_id)
        tests.append(_tests)

    return tests, suites


async def helper_create_assertion(
    entity_id: str, passed: bool, title: str = "toExist", connection=None
):
    await AssertBase.create(
        type=AttachmentType.ASSERT,
        title=title,
        wait=1000,
        interval=500,
        passed=passed,
        message="",
        entity_id=str(entity_id),
        using_db=connection,
    )


async def helper_create_written_attachment(
    root_dir: Path,
    test_id: str,
    suite_id: str,
    title="sample-title",
    description="sample-description",
    connection=None,
):
    written = root_dir / writtenAttachmentFolderName
    record = await StaticBase.create(
        entity_id=test_id,
        type=AttachmentType.PNG,
        description=description,
        title=title,
        value="",
        using_db=connection,
    )
    file_name = f"{str(record.attachmentID)}.{record.type.lower()}"
    record.value = file_name
    await record.save()
    (written / str(suite_id)).mkdir(exist_ok=True)
    (written / str(suite_id) / file_name).write_text("SAMPLE-NOTES")
    return record


@fixture
def create_suite():
    return helper_create_suite


@fixture
def create_tests():
    return helper_create_all_types_of_tests


@fixture
def create_hierarchy():
    return helper_create_normal_suites


@fixture
def add_assertion():
    return helper_create_assertion


@fixture
def create_session():
    return test_session


@fixture
def create_session_with_hierarchy_with_no_retries():
    return helper_create_session_with_hierarchy_with_no_retries


@fixture()
def get_db_path():
    return lambda x: shared_db_path(x)


@fixture()
def create_static_attachment():
    return helper_create_written_attachment
