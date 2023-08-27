from src.services.DBService.models.result_base import SuiteBase, SessionBase, RunBase
from src.services.DBService.models.types import Status
from src.services.DBService.shared import get_test_id
from src.services.SchedularService.types import PathTree, PathItem
from tortoise.expressions import Q
from tortoise.functions import Sum
from datetime import datetime
from collections import Counter
from typing import List
from pathlib import Path
from os.path import join


async def modify_suite(suiteID: str):
    suite = await SuiteBase.filter(suiteID=suiteID).first()
    print(f"FOUND -- {suite.suiteID} for {suite.title}")

    if suite.standing != Status.YET_TO_CALCULATE:
        return

    raw_filter = SuiteBase.filter(parent=suiteID)
    records = await raw_filter.all()
    statuses = []

    for record in records:
        record.tests = 1
        key = "failures" if record.standing == Status.FAILED else record.standing.lower()
        setattr(record, key, 1)
        statuses.append(record.standing)

    counted = Counter(statuses)
    passed = counted.get(Status.PASSED, 0)
    failed = counted.get(Status.FAILED, 0)
    skipped = counted.get(Status.SKIPPED, 0)
    total = len(statuses)

    standing = Status.FAILED if failed > 0 else Status.PASSED if passed > 0 or skipped == 0 else Status.SKIPPED
    await SuiteBase.bulk_update(
        records, fields=["tests", "failures", "skipped", "passed"], batch_size=100
    )
    await suite.save()
    await suite.update_from_dict(
        dict(standing=standing, passed=passed, skipped=skipped, failures=failed, tests=total)
    )
    await suite.save()


async def fix_old_records():
    test_id = get_test_id()
    pending_suites = await SuiteBase.filter(Q(standing=Status.YET_TO_CALCULATE) & ~Q(session__test_id=test_id)).all()
    for suite in pending_suites:
        print("FIXING - ", suite.suiteID, suite.title)
        await modify_suite(suite.suiteID)


async def pending_tasks():
    return await SuiteBase.filter(standing=Status.YET_TO_CALCULATE).count()


def fetch_status(entities_status: set):
    return Status.FAILED if Status.FAILED in entities_status else Status.PASSED if Status.PASSED in entities_status else Status.SKIPPED


async def complete_test_run():
    test_id = get_test_id()

    test_run = await RunBase.filter(testID=test_id).first()
    filtered = SuiteBase.filter(session__test_id=test_id)

    summary = await filtered.annotate(
        total_passed=Sum("passed"),
        total_failed=Sum("failures"),
        total_skipped=Sum("skipped"),
        total_retried=Sum("retried"),
        total_tests=Sum("tests"),
        duration=Sum("duration"),
    ).first().values(
        "total_passed", "total_failed", "total_skipped", "total_retried", "total_tests", "duration"
    )

    await test_run.update_from_dict(dict(
        ended=datetime.utcnow(),
        tests=summary.get("total_tests", 0),
        passed=summary.get("total_passed", 0),
        failures=summary.get("total_failed", 0),
        skipped=summary.get("total_skipped", 0),
        duration=summary.get("duration", 0.0),
        retried=summary.get("total_retried", 0),
        specStructure=simplify_file_paths(await filtered.all().distinct().values_list("file", flat=True)),
        standing=fetch_status(set(await filtered.all().values_list('standing', flat=True)))
    ))
    await test_run.save()

    print("COMPLETED saving a test run")


def simplify_file_paths(paths: List[str]):
    tree: PathTree = {"<path>": ""}
    _paths: List[PathItem] = [
        dict(
            children=list(reversed(Path(path).parts)),
            pointer=tree,
        ) for path in paths
    ]

    while _paths:
        path_to_include = _paths[-1]
        if not path_to_include['children']:
            _paths.pop()
            continue

        parent_pointer: PathTree = path_to_include["pointer"]
        possible_parent: str = path_to_include["children"].pop()
        # that dict will be inside the tree

        pointing_to = parent_pointer.setdefault(
            possible_parent,
            {
                "<path>": join(parent_pointer["<path>"], possible_parent)
            }
        )
        path_to_include["pointer"] = pointing_to

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


