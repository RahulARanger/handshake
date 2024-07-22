import json
from pytest import fixture
from handshake.services.DBService.models import (
    SuiteBase,
    TestConfigBase,
    SessionBase,
    AssertBase,
    StaticBase,
)
from handshake.services.DBService.models.enums import SuiteType, Status, AttachmentType
from handshake.services.DBService.shared import db_path as shared_db_path
from handshake.services.Endpoints.blueprints.writeServices import (
    writtenAttachmentFolderName,
)
from handshake.services.SchedularService.register import register_patch_suite
import datetime
from asyncio import sleep
from pathlib import Path


async def helper_create_suite(
    session_id: str,
    name: str = "suite-parent",
    parent: str = "",
    is_test: bool = False,
    standing=Status.YET_TO_CALCULATE,
    retried=0,
    started=datetime.datetime.now(),
    file: str = "test-1.js",
    connection=None,
):
    extras = {standing.lower(): 1} if is_test else {}
    error = [] if standing != Status.FAILED else [{"message": "sample-error"}]

    return await SuiteBase.create(
        session_id=session_id,
        suiteType=SuiteType.TEST if is_test else SuiteType.SUITE,
        started=started.isoformat(),
        ended=started + datetime.timedelta(milliseconds=12),
        title=name,
        standing=standing,
        file=file,
        parent=parent,
        tests=1,
        retried=retried,
        errors=error,
        using_db=connection,
        **extras,
    )


async def helper_create_all_types_of_tests(
    session_id: str, parent: str, retried=0, connection=None
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
):
    to_return = []

    # 3 suites with each suite having 9 tests with 3 in failed, 2 passed, 3 skipped
    for thing in suite_files:
        session = await helper_create_session(test_id, connection=connection)
        suite = await helper_create_suite(
            session.sessionID,
            parent_suite,
            started=started,
            file=thing,
            connection=connection,
        )
        to_return.append(str(session.sessionID))
        await helper_create_all_types_of_tests(
            session.sessionID, suite.suiteID, connection=connection
        )
        await session.update_from_dict(dict(passed=3, failed=3, skipped=3, tests=9))
        await session.save(using_db=connection)
        if not skip_register:
            await register_patch_suite(suite.suiteID, test_id, connection=connection)

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

        for test in range(3):
            await sleep(0.002)
            started = datetime.datetime.now()
            test = await SuiteBase.create(
                session_id=session_id,
                suiteType=SuiteType.TEST,
                started=started.isoformat(),
                ended=started + datetime.timedelta(milliseconds=2),
                title=f"test-{index + 1}-{test + 1}",
                standing=Status.FAILED,
                file=suite_files[index],
                parent=suites[-1],
                errors=[{"message": f"{index}-{test}"}],
                retried=retried,
            )
            _tests.append(test.suiteID)

        await register_patch_suite(suites[-1], test_id)
        tests.append(_tests)

    return tests, suites


async def helper_create_test_config(
    test_id: str, file_retries=0, avoidParentSuitesInCount=False, connection=None
):
    await TestConfigBase.create(
        fileRetries=file_retries,
        framework="pytest",
        exitCode=0,
        platform="windows",
        maxInstances=1,
        avoidParentSuitesInCount=avoidParentSuitesInCount,
        test_id=test_id,
        using_db=connection,
    )


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
        using_db=connection,
    )
    file_name = f"{str(record.attachmentID)}.{record.type.lower()}"
    await record.update_from_dict(
        dict(
            attachmentValue=dict(value=file_name, title=title),
        )
    )
    (written / str(suite_id)).mkdir(exist_ok=True)
    (written / str(suite_id) / file_name).write_text("SAMPLE-NOTES")
    return record


async def helper_create_session(test_id: str, entityName="sample", connection=None):
    await sleep(0.0025)
    started = datetime.datetime.now(datetime.UTC)
    return await SessionBase.create(
        started=started,
        entityName=entityName,
        test_id=test_id,
        ended=started + datetime.timedelta(milliseconds=24),
        using_db=connection,
    )


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
def attach_config():
    return helper_create_test_config


@fixture
def add_assertion():
    return helper_create_assertion


@fixture
def create_session():
    return helper_create_session


@fixture
def create_session_with_hierarchy_with_no_retries():
    return helper_create_session_with_hierarchy_with_no_retries


@fixture()
def get_db_path():
    return lambda x: shared_db_path(x)


@fixture()
def create_static_attachment():
    return helper_create_written_attachment
