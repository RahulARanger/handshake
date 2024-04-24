from handshake.services.DBService.models.result_base import TestLogBase, LogType
from handshake.services.DBService.models.dynamic_base import TaskBase
from loguru import logger
from typing import Optional
from tortoise.expressions import Q
from typing import Union
from uuid import UUID


async def skip_test_run(test_id: Union[str, UUID], reason: str, **extra) -> False:
    logger.error(reason)
    await TestLogBase.create(
        test_id=str(test_id),
        feed=extra,
        type=LogType.ERROR,
        message=reason,
    )
    return False


async def pruneTasks(task_id: Optional[str] = ""):
    if task_id:
        logger.error("Deleting Few Tasks as per request")
    else:
        logger.warning("Pruning some Tasks, which are related to error test runs")

    to_prune = await TaskBase.filter(
        Q(
            test_id__in=await TestLogBase.filter(type=LogType.ERROR)
            .filter(
                test_id__in=await TaskBase.filter(processed=False)
                .only("test_id")
                .distinct()
                .values_list("test_id", flat=True)
            )
            .only("test_id")
            .distinct()
            .values_list("test_id", flat=True)
        )
    )

    pruned = []
    for task in to_prune:
        logger.error(
            "Found an error in this task: {}. hence marking it as processed."
            " Please report it as an issue if it was not expected.",
            task.ticketID,
        )
        task.processed = True
        task.picked = True
        pruned.append(task)

    await TaskBase.bulk_update(
        pruned,
        (
            "picked",
            "processed",
        ),
        100,
    )

    if not to_prune:
        logger.debug("No Tasks were pruned.")

    if task_id:
        # removing the prune task
        await TaskBase.filter(ticketID=task_id).delete()
