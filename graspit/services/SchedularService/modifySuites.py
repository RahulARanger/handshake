from graspit.services.DBService.models.result_base import SuiteBase, RollupBase
from graspit.services.DBService.models.dynamic_base import TaskBase
from graspit.services.DBService.models.enums import Status, SuiteType
from tortoise.expressions import Q, F
from tortoise.functions import Count, Lower, Sum
from loguru import logger
from itertools import chain


async def rollup_suite_values(suiteID: str):
    # rollup for the errors
    errors = list(
        chain.from_iterable(
            map(
                lambda suite_with_errors: map(
                    lambda error: error
                    | dict(
                        mailedFrom=error.get("mailedFrom", [])
                        + [str(suite_with_errors.suiteID)]
                    ),
                    suite_with_errors.errors,
                ),
                await (
                    SuiteBase.filter(Q(parent=suiteID) & ~Q(errors="[]"))
                    .only("errors", "suiteID")
                    .all()
                ),
            )
        )
    )

    suite = await SuiteBase.filter(suiteID=suiteID).first()
    await suite.update_from_dict(
        dict(
            errors=errors,
        )
    )
    await suite.save()

    expected = dict(passed=0, skipped=0, failed=0, tests=0)
    direct_entities = await (
        SuiteBase.filter(parent=suiteID, suiteType=SuiteType.TEST)
        .only("parent", "passed", "skipped", "failed", "tests")
        .group_by("parent")
        .annotate(
            passed=Sum("passed"),
            skipped=Sum("skipped"),
            failed=Sum("failed"),
            tests=Sum("tests"),
        )
        .first()
        .values()
    )

    entities = direct_entities if direct_entities else expected

    greedy_suite = await RollupBase.create(**(entities | dict(suite_id=str(suiteID))))
    suites = await SuiteBase.filter(
        suiteType=SuiteType.SUITE, parent=suiteID
    ).values_list("suiteID", flat=True)

    indirect_entities = (
        (
            await RollupBase.filter(Q(suite_id__in=suites))
            .annotate(
                passed=Sum("passed"),
                skipped=Sum("skipped"),
                failed=Sum("failed"),
                tests=Sum("tests"),
            )
            .first()
            .values("passed", "skipped", "failed", "tests")
        )
        if suites
        else None
    )

    await greedy_suite.update_from_dict(indirect_entities if indirect_entities else {})
    await greedy_suite.save()


async def patchTestSuite(suiteID: str, testID: str):
    # suiteID can also be treated as a ticketID
    task = await TaskBase.filter(ticketID=suiteID).only("picked", "ticketID").first()
    suite = await SuiteBase.filter(suiteID=suiteID).first()
    logger.info("Modifying suite {} belonging to the test {}", suite.title, testID)

    if suite.standing != Status.YET_TO_CALCULATE:
        logger.warning("Removing this task {} as it was already processed", suite.title)
        return True

    pending_child_tasks = await SuiteBase.filter(
        Q(parent=suite.suiteID)
        & (Q(standing=Status.PENDING) | Q(standing=Status.YET_TO_CALCULATE))
    ).exists()

    if pending_child_tasks:
        logger.warning(
            "There are some child suites, which are not yet processed, so will process {} suite in the next iteration",
            suite.title,
        )
        await task.update_from_dict(dict(picked=False))
        await task.save()  # continue in the next run
        return False

    entities = SuiteBase.filter(parent=suite.suiteID)

    results = dict(
        await (
            entities.annotate(count=Count("standing"), status=Lower("standing"))
            .group_by("standing")
            .values_list("status", "count")
        )
    )

    results["standing"] = fetch_key_from_status(
        results.get("passed", 0), results.get("failed", 0), results.get("skipped", 0)
    )
    results["tests"] = await entities.count()

    await suite.update_from_dict(results)
    await suite.save()

    await rollup_suite_values(suiteID)

    logger.info("Successfully processed suite: {}", suite.title)
    return True


def fetch_key_from_status(passed, failed, skipped):
    return (
        Status.FAILED
        if failed > 0
        else Status.PASSED
        if passed > 0 or skipped == 0
        else Status.SKIPPED
    )
