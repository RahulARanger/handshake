from src.services.DBService.models.result_base import SuiteBase
from src.services.DBService.models.task_base import TaskBase
from src.services.DBService.models.enums import Status
from tortoise.expressions import Q
from loguru import logger


async def handleSuiteStatus(suiteID: str, testID: str):
    task = await TaskBase.filter(ticketID=suiteID).first()
    suite = await SuiteBase.filter(suiteID=suiteID).first()
    logger.info("Modifying suite {} belonging to the test {}", suite.title, testID)

    if suite.standing != Status.YET_TO_CALCULATE:
        logger.warning("Removing this task {} as it was already processed", suite.title)
        if task:
            return await task.delete()

    pending_child_tasks = await SuiteBase.filter(
        Q(parent=suite.suiteID) & (Q(standing=Status.PENDING) | Q(standing=Status.YET_TO_CALCULATE))).exists()

    if pending_child_tasks:
        logger.warning(
            "There are some child suites, which are not yet processed, so will process {} suite in the next iteration",
            suite.title
        )
        await task.update_from_dict(dict(picked=False))
        return await task.save()  # continue in the next run

    raw_filter = SuiteBase.filter(parent=suite.suiteID)
    passed = await raw_filter.filter(standing=Status.PASSED).count()
    failed = await raw_filter.filter(standing=Status.FAILED).count()
    skipped = await raw_filter.filter(standing=Status.SKIPPED).count()
    total = await raw_filter.count()
    standing = fetch_key_from_status(passed, failed, skipped)

    await suite.update_from_dict(
        dict(standing=standing, passed=passed, skipped=skipped, failed=failed, tests=total)
    )
    await suite.save()

    logger.info("Successfully processed suite: {}", suite.title)
    return await task.delete()


def fetch_key_from_status(passed, failed, skipped):
    return Status.FAILED if failed > 0 else Status.PASSED if passed > 0 or skipped == 0 else Status.SKIPPED
