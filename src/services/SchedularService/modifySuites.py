from src.services.SchedularService.specific import _scheduler
from src.services.DBService.models.result_base import SuiteBase
from src.services.DBService.models.task_base import TaskBase
from src.services.DBService.models.enums import Status
from src.services.SchedularService.shared import drop_task, get_scheduler_logger
from src.services.SchedularService.constants import JobType
from tortoise.expressions import Q


def get_modify_suite(suite_id):
    return _scheduler.get_job(f'{JobType.MODIFY_SUITE}-{suite_id}')


def remove_suite_job(suite_id):
    job = get_modify_suite(suite_id)
    if not job:
        return
    return job.remove()


async def handleSuiteStatus(ticketID: str):
    task = await TaskBase.filter(ticketID=ticketID).first()
    if not task:
        return remove_suite_job(ticketID)

    suite = await SuiteBase.filter(suiteID=task.ticketID).first()
    if suite.standing != Status.YET_TO_CALCULATE:
        remove_suite_job(ticketID)
        return await drop_task(ticketID)

    pending_child_tasks = await SuiteBase.filter(
        Q(parent=suite.suiteID) & (Q(standing=Status.PENDING) | Q(standing=Status.YET_TO_CALCULATE))).exists()
    if pending_child_tasks:
        return  # continue in the next run

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

    await drop_task(ticketID)
    return remove_suite_job(ticketID)


def fetch_key_from_status(passed, failed, skipped):
    return Status.FAILED if failed > 0 else Status.PASSED if passed > 0 or skipped == 0 else Status.SKIPPED
