from src.services.SchedularService.modifySuites import add_task_if_required as modify_suite
from src.services.DBService.models.result_base import SuiteBase
from src.services.DBService.models.types import Status
from src.services.DBService.shared import get_test_id
from tortoise.expressions import Q


async def fix_old_suite_records():
    pending_suites = await SuiteBase.filter(
        Q(standing=Status.YET_TO_CALCULATE) & ~Q(session__test_id=get_test_id())).all()
    for suite in pending_suites:
        await modify_suite(suite.suiteID)


async def fix_old_records():
    await fix_old_suite_records()
