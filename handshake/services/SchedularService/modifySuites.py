import traceback
from handshake.services.DBService.models.result_base import (
    SuiteBase,
    RollupBase,
    RetriedBase,
    SessionBase,
)
from handshake.services.DBService.models.static_base import (
    TestConfigBase,
    AttachmentType,
)
from handshake.services.DBService.models.types import PydanticModalForTestRunConfigBase
from handshake.services.DBService.models.dynamic_base import TaskBase
from handshake.services.DBService.models.enums import Status, SuiteType
from tortoise.expressions import Q
from tortoise.functions import Count, Lower, Sum
from loguru import logger
from handshake.services.SchedularService.register import (
    skip_test_run,
)
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

    required = ("passed", "failed", "skipped", "tests")

    direct_entities = (
        await (
            SuiteBase.filter(parent=suiteID, suiteType=SuiteType.TEST)
            .only("parent", *required)
            .group_by("parent")
            .annotate(**{key: Sum(key) for key in required})
            .first()
            .values(*required)
        )
        or {}
    )

    suites = await SuiteBase.filter(
        suiteType=SuiteType.SUITE, parent=suiteID
    ).values_list("suiteID", flat=True)

    indirect_entities = (
        (
            await RollupBase.filter(Q(suite_id__in=suites))
            .annotate(**{key: Sum(key) for key in required})
            .first()
            .values(*required)
        )
        if suites
        else None
    ) or {}

    await RollupBase.create(
        suite_id=suiteID,
        **{
            key: direct_entities.get(key, 0) + indirect_entities.get(key, 0)
            for key in required
        },
    )


def fetch_key_from_status(passed, failed, skipped):
    return (
        Status.FAILED
        if failed > 0
        else Status.PASSED
        if passed > 0 or skipped == 0
        else Status.SKIPPED
    )


async def handleRetries(suiteID: str, test_id: str):
    # assuming we would need to match the retries
    suite = await SuiteBase.filter(suiteID=suiteID).first()
    suite_id = str(suite.suiteID)
    if suite.retried == 0:
        return await RetriedBase.create(tests=[suite_id], suite_id=suite_id, length=1)

    matching_previous_suites = (
        await SuiteBase.filter(
            Q(title=suite.title)
            & Q(session__test_id=test_id)
            & Q(file=suite.file)
            & Q(tags=suite.tags)
            & Q(retried=suite.retried - 1)
            & Q(suiteType=suite.suiteType)
            & ~Q(suiteID=suite.suiteID)
            & Q(ended__lte=suite.started)
        )
        .order_by("started")
        .values_list("suiteID", flat=True)
    )

    previous = (
        await RetriedBase.filter(
            Q(length=suite.retried) & Q(suite_id__in=matching_previous_suites)
        )
        .order_by("modified")
        .first()
    )

    previous_suite = await SuiteBase.filter(suiteID=previous.suite_id).first()
    await previous_suite.update_from_dict(dict(standing=Status.RETRIED))
    await previous_suite.save()

    session = await SessionBase.filter(
        sessionID=(await previous_suite.session).sessionID
    ).first()
    await session.update_from_dict(dict(retried=True))
    await session.save()

    await previous.update_from_dict(
        dict(
            length=previous.length + 1,
            tests=previous.tests + [suite_id],
            suite_id=suite.suiteID,
        )
    )

    await previous.save()
    return previous


async def _patchTestSuite(suiteID: str, testID: str):
    # suiteID can also be treated as a ticketID
    task = await TaskBase.filter(ticketID=suiteID).first()
    suite = await SuiteBase.filter(suiteID=suiteID).first()
    test_config_record = await TestConfigBase.filter(
        type=AttachmentType.CONFIG, test_id=testID
    ).first()

    logger.info("Patching Suite: {} | {}", suite.suiteID, suite.title)

    if suite.standing != Status.YET_TO_CALCULATE:
        logger.warning("Skipping patch suite for: {}", suite.suiteID)
        return True

    pending_child_tasks = await SuiteBase.filter(
        Q(parent=suite.suiteID)
        & (Q(standing=Status.PENDING) | Q(standing=Status.YET_TO_CALCULATE))
    ).exists()

    if pending_child_tasks:
        logger.warning(
            "There are some child suites, which are not yet processed, so will process {} suite in the next iteration",
            suite.suiteID,
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
    test_config = (
        0
        if not test_config_record
        else PydanticModalForTestRunConfigBase.model_validate(
            test_config_record.attachmentValue, strict=False
        )
    )
    if test_config and test_config.fileRetries > 0:
        await handleRetries(suiteID, testID)

    logger.info("Successfully processed suite: {}", suite.suiteID)
    return True


async def patchTestSuite(suiteID: str, testID: str):
    try:
        return await _patchTestSuite(suiteID, testID)
    except Exception:
        await skip_test_run(
            f"Failed to process the test suite {suiteID}",
            testID,
            f"Failed to patch the test suite, error in calculation, {traceback.format_exc()}",
        )
        return False
