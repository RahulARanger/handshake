from pytest import fixture
from graspit.services.DBService.models import SuiteBase
from graspit.services.DBService.models.enums import SuiteType, Status
from graspit.services.SchedularService.register import register_patch_suite
import datetime


async def helper_create_suite(
    session_id: str,
    name: str = "suite-parent",
    parent: str = "",
    is_test: bool = False,
    standing=Status.YET_TO_CALCULATE,
):
    extras = {standing.lower(): 1} if is_test else {}
    return await SuiteBase.create(
        session_id=session_id,
        suiteType=SuiteType.TEST if is_test else SuiteType.SUITE,
        started=datetime.datetime.now().isoformat(),
        title=name,
        standing=standing,
        file="test-1.js",
        parent=parent,
        tests=1,
        **extras,
    )


async def helper_create_all_types_of_tests(session_id: str, parent: str):
    for test in range(3):
        for _ in (Status.PASSED, Status.FAILED, Status.SKIPPED):
            await helper_create_suite(session_id, f"test-{test}-{_}", parent, True, _)


async def helper_create_normal_suites(session_id: str, parent_suite: str, test_id: str):
    suites = []
    tests = []

    for index in range(3):
        suite = await helper_create_suite(session_id, "suite-parent", parent_suite)
        suites.append(suite.suiteID)

        _tests = []

        for test in range(3):
            test = await SuiteBase.create(
                session_id=session_id,
                suiteType=SuiteType.TEST,
                started=datetime.datetime.now().isoformat(),
                title="suite-parent",
                standing=Status.FAILED,
                file="test-1.js",
                parent=suites[-1],
                errors=[{"message": f"{index}-{test}"}],
            )
            _tests.append(test.suiteID)

        await register_patch_suite(suites[-1], test_id)
        tests.append(_tests)

    return tests, suites


@fixture
def create_suite():
    return helper_create_suite


@fixture
def create_tests():
    return helper_create_all_types_of_tests


@fixture
def create_hierarchy():
    return helper_create_normal_suites
