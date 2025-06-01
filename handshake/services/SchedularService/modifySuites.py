from typing import Optional
import traceback
from handshake.services.DBService.models.result_base import (
    SuiteBase,
    RollupBase,
    RetriedBase,
)
from handshake.services.DBService.models.config_base import TestConfigBase
from handshake.services.DBService.models.dynamic_base import TaskBase
from handshake.services.DBService.models.enums import Status, SuiteType
from tortoise.expressions import Q
from tortoise.functions import Count, Lower, Sum, Min, Max
from loguru import logger
from handshake.services.SchedularService.register import (
    cancel_patch_for_test_run,
    JobType,
)
from itertools import chain
from tortoise.transactions import atomic
from asyncio import gather


def fetch_key_from_status(passed, failed, skipped, xfailed=0, xpassed=0):
    if failed > 0:
        return Status.FAILED
    if xpassed > 0:
        return Status.XPASSED
    elif passed > 0:
        return Status.PASSED
    elif xfailed > 0:
        return Status.XFAILED
    elif skipped > 0:
        return Status.SKIPPED
    else:
        return Status.PASSED


def is_non_test_related():
    return Q(suiteType=SuiteType.SETUP) | Q(suiteType=SuiteType.TEARDOWN)


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
        logger.debug(
            "Preparing Suite: {} | {} for export", self.suite.suiteID, self.suite.title
        )

        if self.suite.standing != Status.YET_TO_CALCULATE:
            logger.debug(
                "Suite: {} was not scheduled to be calculated, its status is {}. Hence marking it as processed.",
                self.suite.suiteID,
                self.suite.standing,
            )
            await self.mark_processed()
            return False

        pending_child_test_tasks = await SuiteBase.filter(
            Q(parent=self.suite.suiteID)
            & (Q(standing=Status.PENDING) | Q(standing=Status.PROCESSING))
        ).exists()

        if pending_child_test_tasks:
            await self.fall_back(
                f"There are some child suites/tests for suite: {self.suite.suiteID}; Which are not yet updated,"
                " would happen if the test run was interrupted."
            )
            return

        pending_child_tasks = await SuiteBase.filter(
            parent=self.suite.suiteID, standing=Status.YET_TO_CALCULATE
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

    @property
    def test_entities(self):
        return SuiteBase.filter(Q(parent=self.suite_id), ~is_non_test_related())

    """
    returns true if suite is patched else false
    """

    @atomic("default")
    async def patch_suite(self) -> bool:
        await self.fetch_records()
        if not await self.do_we_need_to_patch():
            return False

        if not self.suite.started or not self.suite.ended:
            info = (
                await SuiteBase.filter(parent=self.suite_id)
                .annotate(
                    actual_end=Max("ended"),
                    actual_start=Min("started"),
                )
                .first()
                .values("actual_start", "actual_end")
            )

            started, ended = self.suite.started, self.suite.ended
            if not self.suite.started:
                self.suite.started = info.get("actual_start", self.suite.started)
                logger.debug(
                    "added suite: {}[{}]'s start datetime as {}",
                    self.suite.title,
                    self.suite_id,
                    self.suite.started,
                )
                started = self.suite.started

            if not self.suite.ended:
                logger.debug("adding suite: {}'s end datetime", self.suite.title)
                self.suite.ended = info.get("actual_end", self.suite.ended)
                logger.debug(
                    "added suite: {}[{}]'s end datetime as {}",
                    self.suite.title,
                    self.suite_id,
                    self.suite.ended,
                )
                ended = self.suite.ended

            self.suite.duration = (ended - started).total_seconds() * 1000
            await self.suite.save()

        await gather(
            self.patch_status(),
            self.patch_rollup_value_for_errors(),
            self.patch_rollup_table(),
            self.patch_retried_records(),
            self.update_duration_drill_down(),
        )

        logger.debug("Successfully processed suite: {}", self.suite.suiteID)
        await self.mark_processed()
        return True

    async def patch_status(self):
        results = dict(
            await (
                self.test_entities.annotate(
                    count=Count("standing"), status=Lower("standing")
                )
                .group_by("standing")
                .values_list("status", "count")
            )
        )
        results["standing"] = fetch_key_from_status(
            results.get("passed", 0),
            results.get("failed", 0),
            results.get("skipped", 0),
            results.get("xfailed", 0),
            results.get("xpassed", 0),
        )
        results["tests"] = await self.test_entities.count()

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
        required = ("passed", "failed", "skipped", "tests", "xfailed", "xpassed")

        # we are only considering tests for these values
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
        await previous_suite.update_from_dict(
            dict(standing=Status.RETRIED, retried_later=True)
        )
        await previous_suite.save()

        await previous.update_from_dict(
            dict(
                length=previous.length + 1,
                tests=previous.tests + [self.suite_id],
                suite_id=suite.suiteID,
            )
        )

        child_entities = []
        current_loop = (
            await SuiteBase.filter(
                Q(parent=previous_suite.suiteID) & ~Q(suiteType=SuiteType.SUITE)
            )
            .only("suiteID")
            .values_list("suiteID", flat=True)
        )

        while current_loop:
            child_entities.extend(current_loop)
            temp = (
                await SuiteBase.filter(
                    Q(parent__in=current_loop) & ~Q(suiteType=SuiteType.SUITE)
                )
                .only("suiteID")
                .values_list("suiteID", flat=True)
            )

            current_loop.clear()
            current_loop.extend(temp)

        entities = []
        for entity in await SuiteBase.filter(suiteID__in=child_entities):
            entity.retried_later = True
            entities.append(entity)

        entities and await SuiteBase.bulk_update(
            entities,
            ("retried_later",),
        )

        await previous.save()
        return previous

    async def update_duration_drill_down(self):
        results = (
            await SuiteBase.filter(parent=self.suite_id)
            .group_by("parent")
            .annotate(
                setup_duration=Sum("setup_duration"),
                teardown_duration=Sum("teardown_duration"),
            )
            .first()
            .values("teardown_duration", "setup_duration")
        )
        if not results:
            return
        await self.suite.update_from_dict(results)
        await self.suite.save()

    async def fall_back(
        self, reason: Optional[str] = None, was_interrupted: bool = False
    ):
        await cancel_patch_for_test_run(
            self.test_id,
            (
                reason
                if reason
                else f"Failed to prepare the test suite for export, found an error in calculation: {traceback.format_exc()}"
            ),
            was_interrupted,
            JobType.MODIFY_SUITE,
            suiteID=self.suite_id,
            job=JobType.MODIFY_SUITE,
        )


async def patchTestSuite(suiteID: str, testID: str):
    patcher = PatchTestSuite(suiteID, testID)
    try:
        has_patched = await patcher.patch_suite()
        return has_patched
    except Exception:
        logger.exception("Failed to prepare test suite for export")
        await patcher.fall_back()
        return False
