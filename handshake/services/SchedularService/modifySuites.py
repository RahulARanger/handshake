from typing import Optional
import traceback
from handshake.services.DBService.models.result_base import (
    SuiteBase,
    RollupBase,
    RetriedBase,
    SessionBase,
)
from handshake.services.DBService.models.config_base import TestConfigBase
from handshake.services.DBService.models.dynamic_base import TaskBase
from handshake.services.DBService.models.enums import Status, SuiteType
from tortoise.expressions import Q
from tortoise.functions import Count, Lower, Sum
from loguru import logger
from handshake.services.SchedularService.register import skip_test_run
from itertools import chain
from asyncio import gather


def fetch_key_from_status(passed, failed, skipped):
    return (
        Status.FAILED
        if failed > 0
        else Status.PASSED
        if passed > 0 or skipped == 0
        else Status.SKIPPED
    )


class PatchTestSuite:
    def __init__(self, suite_id, test_id):
        self.suite: Optional[SuiteBase] = None
        self.related_task: Optional[TaskBase] = None
        self.test_config: Optional[TestConfigBase] = None
        self.suite_id = str(suite_id)
        self.test_id = str(test_id)

    async def fetch_records(self):
        self.suite, self.related_task, self.test_config = await gather(
            SuiteBase.filter(suiteID=self.suite_id).first(),
            TaskBase.filter(ticketID=self.suite_id).first(),
            TestConfigBase.filter(test_id=self.test_id).first(),
        )

    async def do_we_need_to_patch(self):
        logger.info("Patching Suite: {} | {}", self.suite.suiteID, self.suite.title)

        if self.suite.standing != Status.YET_TO_CALCULATE:
            logger.warning("Skipping already patch suite for: {}", self.suite.suiteID)
            await self.mark_processed()
            return False

        pending_child_tasks = await SuiteBase.filter(
            Q(parent=self.suite.suiteID)
            & (Q(standing=Status.PENDING) | Q(standing=Status.YET_TO_CALCULATE))
        ).exists()

        if pending_child_tasks:
            logger.warning(
                "There are some child suites, which are not yet processed,"
                " so will process {} suite in the next iteration",
                self.suite.suiteID,
            )
            await self.pick_it_later()
            return False
        return True

    async def pick_it_later(self):
        self.related_task.picked = False
        await self.related_task.save()

    async def mark_processed(self):
        self.related_task.processed = True
        await self.related_task.save()

    """
    returns true if suite is patched else false
    """

    async def patch_suite(self) -> bool:
        await self.fetch_records()
        if not await self.do_we_need_to_patch():
            return False

        await gather(
            self.patch_status(),
            self.patch_rollup_value_for_errors(),
            self.patch_rollup_table(),
            self.patch_retried_records(),
        )

        logger.info("Successfully processed suite: {}", self.suite.suiteID)
        await self.mark_processed()
        return True

    async def patch_status(self):
        entities = SuiteBase.filter(parent=self.suite.suiteID)

        results = dict(
            await (
                entities.annotate(count=Count("standing"), status=Lower("standing"))
                .group_by("standing")
                .values_list("status", "count")
            )
        )
        results["standing"] = fetch_key_from_status(
            results.get("passed", 0),
            results.get("failed", 0),
            results.get("skipped", 0),
        )
        results["tests"] = await entities.count()

        await self.suite.update_from_dict(results)
        await self.suite.save()

    async def patch_rollup_value_for_errors(self):
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
                        SuiteBase.filter(Q(parent=self.suite.suiteID) & ~Q(errors="[]"))
                        .only("errors", "suiteID")
                        .all()
                    ),
                )
            )
        )

        await self.suite.update_from_dict(
            dict(
                errors=errors,
            )
        )
        await self.suite.save()

    async def patch_rollup_table(self):
        required = ("passed", "failed", "skipped", "tests")

        direct_entities = (
            await (
                SuiteBase.filter(parent=self.suite_id, suiteType=SuiteType.TEST)
                .only("parent", *required)
                .group_by("parent")
                .annotate(**{key: Sum(key) for key in required})
                .first()
                .values(*required)
            )
            or {}
        )

        suites = await SuiteBase.filter(
            suiteType=SuiteType.SUITE, parent=self.suite_id
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
            suite_id=self.suite_id,
            **{
                key: direct_entities.get(key, 0) + indirect_entities.get(key, 0)
                for key in required
            },
        )

    async def patch_retried_records(self):
        if not (self.test_config and self.test_config.fileRetries > 0):
            return

        # assuming we would need to match the retries
        suite = await SuiteBase.filter(suiteID=self.suite_id).first()
        if suite.retried == 0:
            return await RetriedBase.create(
                tests=[self.suite_id], suite_id=self.suite_id, length=1
            )

        matching_previous_suites = (
            await SuiteBase.filter(
                Q(title=suite.title)
                & Q(session__test_id=self.test_id)
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
                tests=previous.tests + [self.suite_id],
                suite_id=suite.suiteID,
            )
        )

        await previous.save()
        return previous

    async def fall_back(self):
        await skip_test_run(
            self.test_id,
            f"Failed to patch the test suite, found an error in calculation: {traceback.format_exc()}",
            suiteID=self.suite_id,
        )


async def patchTestSuite(suiteID: str, testID: str):
    patcher = PatchTestSuite(suiteID, testID)
    try:
        has_patched = await patcher.patch_suite()
        return has_patched
    except Exception:
        logger.exception("Failed to patch test suite")
        await patcher.fall_back()
        return False
