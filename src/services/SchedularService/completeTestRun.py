from src.services.DBService.models.result_base import SessionBase, RunBase
from src.services.DBService.shared import get_test_id
from src.services.SchedularService.types import PathTree, PathItem
from src.services.SchedularService.modifySuites import fetch_key_from_status
from src.services.SchedularService.shared import get_scheduler_logger
from tortoise.functions import Sum
from datetime import datetime
from typing import List
from pathlib import Path
from os.path import join


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


async def _complete_test_run(test_id: str):
    test_run = await RunBase.filter(testID=test_id).first()
    # if test_run.test:
    #     return
    filtered = SessionBase.filter(test_id=test_id)

    test_result = await filtered.annotate(
        total_passed=Sum("passed"),
        total_failed=Sum("failed"),
        total_skipped=Sum("skipped"),
        total_retried=Sum("retried"),
        total_tests=Sum("tests"),
        duration=Sum("duration"),
    ).first().values(
        "total_passed", "total_failed", "total_skipped", "total_retried", "total_tests", "duration"
    )
    passed = test_result.get("total_passed", 0)
    failed = test_result.get("total_failed", 0)
    skipped = test_result.get("total_skipped", 0)

    await test_run.update_from_dict(dict(
        ended=datetime.utcnow(),
        tests=test_result.get("total_tests", 0),
        passed=passed,
        failed=failed,
        skipped=skipped,
        duration=test_result.get("duration", 0.0),
        retried=test_result.get("total_retried", 0),
        specStructure=simplify_file_paths([
            path
            for paths in await filtered.all().distinct().values_list("specs", flat=True)
            for path in paths
        ]),
        standing=fetch_key_from_status(passed, failed, skipped)
    ))
    await test_run.save()

    print("COMPLETED saving a test run")


async def complete_test_run(test_id: str):
    logger = get_scheduler_logger()
    try:
        await _complete_test_run(test_id)
        if test_id == get_test_id():
            return

    except Exception as e:
        logger.exception("Failed to fill the test run", exc_info=True)
