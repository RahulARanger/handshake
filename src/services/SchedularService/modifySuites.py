from src.services.DBService.models.result_base import SuiteBase, SuiteBasePydanticModel
from src.services.DBService.models.task_base import TaskBase
from src.services.DBService.models.enums import Status
from src.services.SchedularService.center import drop_task
from src.services.SchedularService.constants import JobType
from src.services.DBService.shared import get_test_id
from tortoise.expressions import Q


async def handleSuiteStatus(taskID: str):
    task = await TaskBase.filter(taskID=taskID).first()
    if not task:
        return

    suite = SuiteBasePydanticModel(**task.meta)
    pending_child_tasks = await SuiteBase.filter(
        Q(parent=suite.suiteID) & (Q(standing=Status.PENDING) | Q(standing=Status.YET_TO_CALCULATE))).exists()
    if pending_child_tasks:
        return  # add this task in the next run

    if not suite:
        return drop_task(taskID)

    raw_filter = SuiteBase.filter(parent=suite.suiteID)
    passed = await raw_filter.filter(standing=Status.PASSED).count()
    failed = await raw_filter.filter(standing=Status.FAILED).count()
    skipped = await raw_filter.filter(standing=Status.SKIPPED).count()
    total = await raw_filter.count()
    standing = fetch_key_from_status(passed, failed, skipped)

    await suite.update_from_dict(
        dict(standing=standing, passed=passed, skipped=skipped, failures=failed, tests=total)
    )
    await suite.save()


def fetch_key_from_status(passed, failed, skipped):
    return Status.FAILED if failed > 0 else Status.PASSED if passed > 0 or skipped == 0 else Status.SKIPPED


def add_task(suiteID: str):
    suite = await SuiteBase.filter(suiteID=suiteID).first()
    if not suite:
        return
    ticket = await TaskBase.filter(ticketID=suiteID).first()
    if not ticket:
        return

    converted = await SuiteBasePydanticModel.from_tortoise_orm(suite)

    await suite.delete()
    task = await TaskBase.create(
        ticketID=suiteID,
        testID=get_test_id(),
        type=JobType.MODIFY_SUITE,
        meta=converted.model_dump()
    )
    await suite.save()

    return task
