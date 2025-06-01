from handshake.services.DBService.models.result_base import (
    SessionBase,
    RunBase,
    SuiteBase,
)
from handshake.services.DBService.models.config_base import TestConfigBase
from uuid import UUID
from typing import Union
from traceback import format_exc
from handshake.services.SchedularService.register import (
    cancel_patch_for_test_run,
)
from handshake.services.SchedularService.constants import JobType
from handshake.services.DBService.models.dynamic_base import TaskBase
from handshake.services.DBService.models.types import Status, SuiteType
from handshake.services.SchedularService.refer_types import PathTree, PathItem
from handshake.services.SchedularService.modifySuites import fetch_key_from_status
from tortoise.functions import Sum, Max, Min, Count, Lower, Coalesce
from datetime import datetime, timezone
from typing import List, Tuple
from pathlib import Path
from os.path import join
from loguru import logger
from tortoise.expressions import Q, Subquery
from typing import Optional
from asyncio import gather


class PatchTestRun:
    actual_start = "actual_start"
    actual_end = "actual_end"

    def __init__(self, test_id):
        self.test: Optional[RunBase] = None
        self.test_id = test_id
        self.task: Optional[TaskBase] = None

    async def fetch_records(self):
        self.test = await RunBase.filter(testID=self.test_id).first()
        self.task = await TaskBase.filter(ticketID=self.test_id).first()

    async def patch_test(self):
        await self.fetch_records()
        if not await self.do_we_need_patch():
            return False
        await self.patch_test_values()
        await self.mark_processed()
        return True

    async def mark_processed(self):
        self.task.processed = True
        await self.task.save()

    async def fetch_suite_summary(self):
        test_config = await TestConfigBase.filter(test_id=self.test_id).first()

        refer = SuiteBase

        if test_config and test_config.avoidParentSuitesInCount:
            # consider cucumber files
            # if the feature file has 3 scenarios, then, if the user sets the avoidParentSuitesInCount,
            # we would get a value of 3 as total scenarios else 4
            refer = SuiteBase.filter(~Q(parent=""))

        # we want to count the amount of suite status
        summary = dict(passed=0, failed=0, skipped=0, xpassed=0, xfailed=0)
        summary.update(
            await refer.filter(
                Q(session__test_id=self.test_id)
                & Q(suiteType=SuiteType.SUITE)
                & ~Q(standing=Status.RETRIED)
            )
            .annotate(count=Count("suiteID"), status=Lower("standing"))
            .group_by("standing")
            .values_list("status", "count")
        )
        summary["count"] = sum(summary.values())

        return summary

    async def fetch_agg_values_of_test(self):
        filtered_sessions = SessionBase.filter(test_id=self.test_id)

        filtered = SuiteBase.filter(
            Q(session_id__in=Subquery(filtered_sessions.values("sessionID")))
            & Q(suiteType=SuiteType.TEST)
            & Q(retried_later=False)
        )

        # we get the values of the test run from the non-retried test entities
        test_result = (
            await filtered.annotate(
                passed=Coalesce(Sum("passed"), 0),
                failed=Coalesce(Sum("failed"), 0),
                skipped=Coalesce(Sum("skipped"), 0),
                tests=Coalesce(Sum("tests"), 0),
                xfailed=Coalesce(Sum("xfailed"), 0),
                xpassed=Coalesce(Sum("xpassed"), 0),
            )
            .first()
            .values("passed", "failed", "skipped", "tests", "xpassed", "xfailed")
        )
        test_result.update(
            await filtered_sessions.annotate(
                actual_end=Max("ended"),
                actual_start=Min("started"),
            )
            .first()
            .values(
                self.actual_start,
                self.actual_end,
            )
        )

        return test_result

    async def patch_test_values(self):
        (summary, test_result, retried_suites) = await gather(
            self.fetch_suite_summary(),
            self.fetch_agg_values_of_test(),
            # just to get the count of the retried suites we had in this run
            SuiteBase.filter(Q(parent="") & Q(standing=Status.RETRIED)).count(),
        )

        # the start date was initially when we start the shipment
        # now it is when the first session starts
        started = (
            test_result.get(self.actual_start, self.test.started) or self.test.started
        )
        ended = test_result.get(
            self.actual_end, datetime.now(timezone.utc)
        ) or datetime.now(timezone.utc)
        test_result.pop(self.actual_start) if self.actual_start in test_result else ...
        test_result.pop(self.actual_end) if self.actual_end in test_result else ...

        await self.test.update_from_dict(
            dict(
                **{_: test_result[_] or 0 for _ in test_result.keys()},
                **{
                    f"{_}Suites" if _ != "count" else "suites": summary[_] or 0
                    for _ in summary.keys()
                },
                retried=retried_suites,
                started=started,
                ended=ended,
                duration=(ended - started).total_seconds() * 1000,
                specStructure=simplify_file_paths(
                    [
                        path
                        for path in await SuiteBase.filter(
                            Q(session__test_id=self.test_id)
                            & Q(suiteType=SuiteType.SUITE)
                            & ~Q(standing=Status.RETRIED)
                            & Q(parent="")
                        )
                        .group_by("file")
                        .prefetch_related("rollup")
                        .annotate(tests=Sum("rollup__tests"))
                        .values_list("file", "tests")
                    ]
                ),
                standing=fetch_key_from_status(
                    summary["passed"],
                    summary["failed"],
                    summary["skipped"],
                    summary["xfailed"],
                    summary["xpassed"],
                ),
            )
        )
        await self.test.save()

    async def pick_it_later(self):
        self.task.picked = False
        await self.task.save()

    async def do_we_need_patch(self):
        # check: 1
        # to see if the test is not pending
        if self.test.standing != Status.PENDING:
            logger.warning("{} was already processed", self.test_id)
            await self.mark_processed()
            return False

        # check: 2
        # check if any child suites are yet to be processed,
        # this should not happen, as we are exporting all the related suites before test run

        pending_items = (
            await SuiteBase.filter(session__test_id=self.test_id)
            .filter(
                Q(standing=Status.YET_TO_CALCULATE)
                | Q(standing=Status.PENDING)
                | Q(standing=Status.PROCESSING)
            )
            .count()
        )

        if pending_items > 0:
            await skip_coz_error(
                self.test_id,
                f"Failed to export the Test Run: {self.test_id} of project: {self.test.projectName},"
                f" because some of the suites were not processed",
                incomplete=self.test.projectName,
                pending_suites=pending_items,
            )
            return False

        return True


async def skip_coz_error(test_id: Union[str, UUID], reason: str, **extra) -> False:
    return await cancel_patch_for_test_run(
        test_id,
        reason,
        False,
        JobType.MODIFY_TEST_RUN,
        type=JobType.MODIFY_TEST_RUN,
        **extra,
    )


def simplify_file_paths(paths: List[Tuple[str, int]]):
    tree: PathTree = {"current": "", "paths": {}, "suites": 1}
    _paths: List[PathItem] = [
        dict(children=list(reversed(Path(path[0]).parts)), pointer=tree, count=path[1])
        for path in paths
    ]

    # Tree - Builder
    while _paths:
        path_to_include = _paths[-1]
        if not path_to_include["children"]:
            _paths.pop()
            path_to_include["pointer"]["suites"] = path_to_include["count"]
            continue

        parent_pointer: PathTree = path_to_include["pointer"]
        possible_parent: str = path_to_include["children"].pop()
        # that dict will be inside the tree

        # NOTE: we are not calculating the cumulative count of suites for the folder
        pointing_to = parent_pointer["paths"].setdefault(
            possible_parent,
            {
                "current": join(parent_pointer["current"], possible_parent),
                "paths": {},
                "suites": 1,
            },
        )
        path_to_include["pointer"] = pointing_to

    # Reducer
    while True:
        stack = [(_, tree) for _ in tree["paths"].keys()]
        movements = 0

        while stack:
            node_key, parent_node = stack.pop()
            target_node = parent_node["paths"][node_key]

            children = list(target_node["paths"].keys())
            if len(children) > 1:
                for child_key in target_node["paths"]:
                    stack.append((child_key, target_node))
                continue

            if not children:
                continue
            child_key = children.pop()

            movements += 1
            target_popped = parent_node["paths"].pop(node_key)
            new_key = join(node_key, child_key)
            parent_node["paths"][new_key] = target_popped["paths"].pop(child_key)
            new_child = parent_node["paths"][new_key]
            new_child["current"] = join(target_popped["current"], child_key)

            for child_key in new_child["paths"]:
                stack.append((child_key, new_child))

        if not movements:
            break

    return tree["paths"]


async def patchTestRun(test_id: str):
    patcher = PatchTestRun(test_id)
    to_return = False

    try:
        if await patcher.patch_test():
            logger.debug("Completed the export for test run: {}", test_id)
            to_return = True
    except Exception:
        await skip_coz_error(
            test_id,
            f"Failed to export the test run, error in calculation, {format_exc()}",
        )
    return to_return
