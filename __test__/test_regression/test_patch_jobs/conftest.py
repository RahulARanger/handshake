from pytest import fixture
from graspit.services.DBService.models import SuiteBase, TestConfigBase, SessionBase
from graspit.services.DBService.models.enums import SuiteType, Status, AttachmentType
from graspit.services.SchedularService.register import register_patch_suite
import datetime


async def helper_create_suite(
    session_id: str,
    name: str = "suite-parent",
    parent: str = "",
    is_test: bool = False,
    standing=Status.YET_TO_CALCULATE,
    retried=0,
):
    extras = {standing.lower(): 1} if is_test else {}

    started = datetime.datetime.now()
    return await SuiteBase.create(
        session_id=session_id,
        suiteType=SuiteType.TEST if is_test else SuiteType.SUITE,
        started=started.isoformat(),
        ended=started + datetime.timedelta(milliseconds=12),
        title=name,
        standing=standing,
        file="test-1.js",
        parent=parent,
        tests=1,
        retried=retried,
        **extras,
    )


async def helper_create_all_types_of_tests(session_id: str, parent: str, retried=0):
    for test in range(3):
        for _ in (Status.PASSED, Status.FAILED, Status.SKIPPED):
            await helper_create_suite(
                session_id, f"test-{test}-{_}", parent, True, _, retried=retried
            )


async def helper_create_normal_suites(
    session_id: str, parent_suite: str, test_id: str, retried=0
):
    suites = []
    tests = []

    for index in range(3):
        suite = await helper_create_suite(
            session_id, f"suite-parent-{index + 1}", parent_suite, retried=retried
        )
        suites.append(suite.suiteID)

        _tests = []

        for test in range(3):
            started = datetime.datetime.now()
            test = await SuiteBase.create(
                session_id=session_id,
                suiteType=SuiteType.TEST,
                started=started.isoformat(),
                ended=started + datetime.timedelta(milliseconds=2),
                title="suite-parent",
                standing=Status.FAILED,
                file="test-1.js",
                parent=suites[-1],
                errors=[{"message": f"{index}-{test}"}],
                retried=retried,
            )
            _tests.append(test.suiteID)

        await register_patch_suite(suites[-1], test_id)
        tests.append(_tests)

    return tests, suites


async def helper_create_test_config(test_id: str, file_retries=0):
    await TestConfigBase.create(
        type=AttachmentType.CONFIG,
        attachmentValue=dict(
            fileRetries=file_retries,
            framework="pytest",
            exitCode=0,
            platformName="windows",
            maxInstances=1,
            saveOptions=dict(),
        ),
        description="sample-test",
        test_id=test_id,
    )


async def helper_create_session(test_id: str):
    started = datetime.datetime.utcnow()
    return await SessionBase.create(
        started=started,
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
def create_session():
    return helper_create_session
