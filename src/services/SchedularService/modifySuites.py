from src.services.DBService.models.result_base import SuiteBase, SuiteBasePydanticModel
from src.services.DBService.models.task_base import TaskBase
from src.services.DBService.models.enums import Status
from src.services.SchedularService.shared import drop_task
from src.services.SchedularService.constants import JobType
from src.services.DBService.shared import get_test_id
from tortoise.expressions import Q
from typing import Union


async def handleSuiteStatus(ticketID: str):
    task = await TaskBase.filter(ticketID=ticketID).first()
    if not task:
        return

    suite = await SuiteBase.filter(suiteID=task.ticketID).first()
    if suite.standing == Status.YET_TO_CALCULATE:
        return await drop_task(ticketID)

    pending_child_tasks = await SuiteBase.filter(
        Q(parent=suite.suiteID) & (Q(standing=Status.PENDING) | Q(standing=Status.YET_TO_CALCULATE))).exists()
    if pending_child_tasks:
        return  # add this task in the next run

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


async def add_task_if_required() -> Union[bool, TaskBase]:
    suite = await SuiteBase.filter(standing=Status.YET_TO_CALCULATE).order_by("ended").first()
    task, created = await TaskBase.update_or_create(
        ticketID=suite.suiteID,
        test_id=get_test_id(),
        type=JobType.MODIFY_SUITE
    )
    await task.save()
    return task if created else False
