import json

from pytest import fixture
from handshake.services.DBService.models import (
    SuiteBase,
    TestConfigBase,
    SessionBase,
    AttachmentBase,
)
from handshake.services.DBService.models.enums import SuiteType, Status, AttachmentType
from handshake.services.SchedularService.register import register_patch_suite
import datetime
from asyncio import sleep


async def helper_create_suite(
    session_id: str,
    name: str = "suite-parent",
    parent: str = "",
    is_test: bool = False,
    standing=Status.YET_TO_CALCULATE,
    retried=0,
    started=datetime.datetime.now(),
    file: str = "test-1.js",
):
    extras = {standing.lower(): 1} if is_test else {}

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
        **extras,
    )


async def helper_create_all_types_of_tests(session_id: str, parent: str, retried=0):
    for test in range(3):
        for _ in (Status.PASSED, Status.FAILED, Status.SKIPPED):
            await sleep(0.002)
            await helper_create_suite(
                session_id, f"test-{test}-{_}", parent, True, _, retried=retried
            )


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

    for index in range(3):
        suite = await helper_create_suite(
            session_id,
            f"suite-parent-{index + 1}",
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
                title="suite-parent",
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
    test_id: str, file_retries=0, avoidParentSuitesInCount=False
):
    await TestConfigBase.create(
        fileRetries=file_retries,
        framework="pytest",
        exitCode=0,
        platform="windows",
        maxInstances=1,
        avoidParentSuitesInCount=avoidParentSuitesInCount,
        test_id=test_id,
    )


async def helper_create_assertion(entity_id: str, title: str, passed: bool):
    await AttachmentBase.create(
        type=AttachmentType.ASSERT,
        attachmentValue=dict(
            color="",
            title="toExist",
            value=json.dumps(
                dict(
                    matcherName=title,
                    options=dict(wait=1000, interval=500),
                    result={"pass": passed},
                ),
            ),
        ),
        description="",
        entity_id=str(entity_id),
    )


async def helper_create_session(test_id: str, entityName="sample"):
    await sleep(0.0025)
    started = datetime.datetime.now(datetime.UTC)
    return await SessionBase.create(
        started=started,
        entityName=entityName,
        test_id=test_id,
        ended=started + datetime.timedelta(milliseconds=24),
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
