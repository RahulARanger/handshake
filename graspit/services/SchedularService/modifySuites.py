from graspit.services.DBService.models.result_base import SuiteBase
from graspit.services.DBService.models.dynamic_base import TaskBase
from graspit.services.DBService.models.enums import Status
from graspit.services.SchedularService.shared import drop_task
from tortoise.expressions import Q
from loguru import logger
from itertools import chain


async def patchTestSuite(suiteID: str, testID: str):
    # suiteID can also be treated as a ticketID
    task = await TaskBase.filter(ticketID=suiteID).first()
    suite = await SuiteBase.filter(suiteID=suiteID).first()
    logger.info("Modifying suite {} belonging to the test {}", suite.title, testID)

    if suite.standing != Status.YET_TO_CALCULATE:
        logger.warning("Removing this task {} as it was already processed", suite.title)
        return await drop_task(task.ticketID)

    pending_child_tasks = await SuiteBase.filter(
        Q(parent=suite.suiteID) & (Q(standing=Status.PENDING) | Q(standing=Status.YET_TO_CALCULATE))).exists()

    if pending_child_tasks:
        logger.warning(
            "There are some child suites, which are not yet processed, so will process {} suite in the next iteration",
            suite.title
        )
        await task.update_from_dict(dict(picked=False))
        return await task.save()  # continue in the next run

    filtered_suites = SuiteBase.filter(parent=suite.suiteID)
    passed = await filtered_suites.filter(standing=Status.PASSED).count()
    failed = await filtered_suites.filter(standing=Status.FAILED).count()
    skipped = await filtered_suites.filter(standing=Status.SKIPPED).count()
    total = await filtered_suites.count()
    standing = fetch_key_from_status(passed, failed, skipped)

    # rollup for the errors
    errors = list(chain.from_iterable(
        map(lambda suite_with_errors: suite_with_errors.errors, await filtered_suites.filter(~Q(errors='[]')).all())
    ))

    await suite.update_from_dict(
        dict(standing=standing, passed=passed, skipped=skipped, failed=failed, tests=total, errors=errors)
    )
    await suite.save()

    logger.info("Successfully processed suite: {}", suite.title)
    return await drop_task(task.ticketID)


def fetch_key_from_status(passed, failed, skipped):
    return Status.FAILED if failed > 0 else Status.PASSED if passed > 0 or skipped == 0 else Status.SKIPPED
