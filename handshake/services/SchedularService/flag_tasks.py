from handshake.services.DBService.models.attachmentBase import TestLogBase, LogType
from handshake.services.DBService.models.dynamic_base import TaskBase
from loguru import logger
from typing import Optional
from tortoise.expressions import Q, Subquery
from typing import Union
from uuid import UUID


async def pruneTasks(task_id: Optional[str] = ""):
    if task_id:
        logger.warning("Deleting Few Tasks as per request")
    else:
        logger.debug("Pruning some old tasks")

    to_prune = await TaskBase.filter(
        Q(
            test_id__in=Subquery(
                TestLogBase.filter(type=LogType.ERROR)
                .filter(
                    test_id__in=Subquery(
                        TaskBase.filter(processed=False)
                        .only("test_id")
                        .distinct()
                        .values_list("test_id", flat=True)
                    )
                )
                .only("test_id")
                .distinct()
                .values_list("test_id", flat=True)
            )
        )
    )

    for task in to_prune:
        logger.error(
            "Found an error in this task: {}. hence marking it as processed."
            " Please report it as an issue if it was not expected.",
            task.ticketID,
        )
        task.processed = True
        task.picked = True

    if not to_prune:
        logger.debug("No Tasks were pruned.")
    else:
        await TaskBase.bulk_update(
            to_prune,
            (
                "picked",
                "processed",
            ),
            100,
        )

    if task_id:
        # removing the prune task
        await TaskBase.filter(ticketID=task_id).delete()


# async def skipTestRunForNow():
#     logger.warning(
#         "Marking few tasks to be picked in the next iteration since the details were not updated yet, which are "
#         "related to error test runs"
#     )
#
#     requests = (
#         await TaskBase.filter(type=JobType.SKIP_REQUEST)
#         .distinct()
#         .values_list("ticketID", flat=True)
#     )
#     to_skip = await TaskBase.filter(
#         test_id__in=Subquery(
#             TaskBase.filter(type=JobType.SKIP_REQUEST)
#             .distinct()
#             .values_list("test_id", flat=True)
#         )
#     )
#
#     for task in to_skip:
#         logger.error(
#             "Skipping this: {}. will be picked in the next export command"
#             " Please report it as an issue if it was not expected.",
#             task.ticketID,
#         )
#         task.skip = True
#         task.skip_times += 1
#         task.picked = False
#
#     await TaskBase.bulk_update(
#         to_skip,
#         ("skipped", "picked"),
#         100,
#     )
#
#     not to_skip and logger.debug("No Tasks were skipped.")
#
#     # removing the skip request task
#     requests and await TaskBase.filter(ticketID__in=requests).delete()
