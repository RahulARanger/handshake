from handshake.services.DBService.models.result_base import (
    SessionBase,
    RunBase,
    SuiteBase,
)
from handshake.services.DBService.models.static_base import (
    TestConfigBase,
    AttachmentType,
)
from handshake.services.DBService.models.types import PydanticModalForTestRunConfigBase
from uuid import UUID
from typing import Union
from traceback import format_exc
from handshake.services.SchedularService.register import (
    skip_test_run,
)
from handshake.services.DBService.models.dynamic_base import TaskBase
from handshake.services.DBService.models.types import Status, SuiteType
from handshake.services.SchedularService.refer_types import PathTree, PathItem
from handshake.services.SchedularService.modifySuites import fetch_key_from_status
from tortoise.functions import Sum, Max, Min, Count, Lower
from datetime import datetime, timezone
from typing import List
from pathlib import Path
from os.path import join
from loguru import logger
from tortoise.expressions import Q


async def skip_coz_error(test_id: Union[str, UUID], reason: str, **extra) -> False:
    return await skip_test_run(
        "Job Failed: Failed to Patch Test Run", test_id, reason, **extra
    )


async def mark_test_failure_if_required(test_id: str) -> bool:
    test_run = await RunBase.filter(testID=test_id).first()
    if test_run.ended is None:
        await skip_coz_error(
            test_id,
            f"Failed to process test Run{test_id}: {test_run.projectName} because it didn't have a end date",
            incomplete=test_run.projectName,
        )
        return True

    suites = [
        str(_)
        for _ in await SuiteBase.filter(session__test_id=test_id)
        .filter(Q(standing=Status.YET_TO_CALCULATE) | Q(standing=Status.PENDING))
        .all()
        .values_list("suiteID", flat=True)
    ]

    does_it_exist = await TaskBase.exists(ticketID__in=suites)
    if does_it_exist:
        # it means there are child tasks ensured to complete the child suites
        return False

    reason = f"Failed to process {test_id} because of incomplete child suites"
    await skip_coz_error(test_id, reason, incomplete=suites)
    return True


def simplify_file_paths(paths: List[str]):
    tree: PathTree = {"<path>": ""}
    _paths: List[PathItem] = [
        dict(
            children=list(reversed(Path(path).parts)),
            pointer=tree,
        )
        for path in paths
    ]

    # Tree - Builder
    while _paths:
        path_to_include = _paths[-1]
        if not path_to_include["children"]:
            _paths.pop()
            continue

        parent_pointer: PathTree = path_to_include["pointer"]
        possible_parent: str = path_to_include["children"].pop()
        # that dict will be inside the tree

        pointing_to = parent_pointer.setdefault(
            possible_parent, {"<path>": join(parent_pointer["<path>"], possible_parent)}
        )
        path_to_include["pointer"] = pointing_to

    # Reducer
    while True:
        stack = [(_, tree) for _ in tree.keys() if not _.startswith("<")]
        movements = 0

        while stack:
            node_key, parent_node = stack.pop()
            target_node = parent_node[node_key]

            children = set(target_node.keys())
            children.remove("<path>")

            if len(children) > 1:
                for child_key in target_node.keys():
                    if child_key.startswith("<"):
                        continue
                    stack.append((child_key, target_node))
                continue

            if not children:
                continue
            child_key = children.pop()

            movements += 1
            target_popped = parent_node.pop(node_key)
            new_key = join(node_key, child_key)
            parent_node[new_key] = target_popped.pop(child_key)
            new_child = parent_node[new_key]
            new_child["<path>"] = join(target_popped["<path>"], child_key)

            for child_key in new_child.keys():
                if child_key.startswith("<"):
                    continue
                stack.append((child_key, new_child))

        if not movements:
            break

    return tree


async def patchValues(test_run: RunBase):
    test_id = test_run.testID

    filtered = SessionBase.filter(Q(test_id=test_id) & Q(retried=False))
    retried_sessions = await SessionBase.filter(
        Q(test_id=test_id) & Q(retried=True)
    ).count()

    actual_start = "actual_start"
    actual_end = "actual_end"

    test_result = (
        await filtered.annotate(
            passed=Sum("passed"),
            failed=Sum("failed"),
            skipped=Sum("skipped"),
            tests=Sum("tests"),
            actual_end=Max("ended"),
            actual_start=Min("started"),
        )
        .first()
        .values("passed", "failed", "skipped", "tests", actual_start, actual_end)
    )

    test_config = await TestConfigBase.filter(
        test_id=test_id, type=AttachmentType.CONFIG
    ).first()

    refer = SuiteBase

    if test_config:
        # consider cucumber files
        # if the feature file has 3 scenarios, then if user sets the avoidParentSuitesInCount
        # we would get a value of 3 as total scenarios else 4
        config = PydanticModalForTestRunConfigBase.model_validate(
            test_config.attachmentValue
        )
        if config.avoidParentSuitesInCount:
            refer = SuiteBase.filter(~Q(parent=""))

    # we want to count the number of suites status
    summary = dict(passed=0, failed=0, skipped=0)
    summary.update(
        await refer.filter(
            Q(session__test_id=test_id)
            & Q(suiteType=SuiteType.SUITE)
            & ~Q(standing=Status.RETRIED)
        )
        .annotate(count=Count("suiteID"), status=Lower("standing"))
        .group_by("standing")
        .values_list("status", "count")
    )
    summary["count"] = sum(summary.values())

    # start date was initially when we start the shipment
    # now it is when the first session starts
    started = test_result.get(actual_start, test_run.started) or test_run.started
    ended = test_result.get(actual_end, datetime.now(timezone.utc)) or datetime.now(
        timezone.utc
    )
    test_result.pop(actual_start) if actual_start in test_result else ...
    test_result.pop(actual_end) if actual_end in test_result else ...

    await test_run.update_from_dict(
        dict(
            **{_: test_result[_] or 0 for _ in test_result.keys()},
            retried=retried_sessions,
            started=started,
            ended=ended,
            duration=(ended - started).total_seconds() * 1000,
            specStructure=simplify_file_paths(
                [
                    path
                    for paths in await filtered.all()
                    .distinct()
                    .values_list("specs", flat=True)
                    for path in paths
                ]
            ),
            standing=fetch_key_from_status(
                summary["passed"], summary["failed"], summary["skipped"]
            ),
            suiteSummary=summary,
        )
    )
    return True


async def patchTestRun(test_id: str, current_test_id: str):
    test_run = await RunBase.filter(testID=test_id).first()
    if not test_run:
        return True

    task = await TaskBase.filter(ticketID=test_run.testID).first()
    if not task:
        return True

    logger.info("Patching up the Test Run: {}", test_id)
    if test_run.standing != Status.PENDING:
        return True

    pending_items = (
        await SuiteBase.filter(session__test_id=test_id)
        .filter(Q(standing=Status.YET_TO_CALCULATE) | Q(standing=Status.PENDING))
        .count()
    )

    if pending_items > 0:
        if await mark_test_failure_if_required(test_id):
            return
        logger.warning(
            "Patch Test Run: {} will be picked in the next run, some of its entities are not processed yet.",
            test_id,
        )
        await task.update_from_dict(dict(picked=False))
        await task.save()  # continue in the next run
        return False

    to_return = False
    try:
        if await patchValues(test_run):
            logger.info("Completed the patch for test run: {}", test_id)
            to_return = True
    except Exception:
        await skip_coz_error(
            test_id,
            f"Failed to patch the test run, error in calculation, {format_exc()}",
        )
    finally:
        await test_run.save()

    return to_return
