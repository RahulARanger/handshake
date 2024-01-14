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


async def pruneTasks(request_id: Optional[str] = ""):
    if request_id:
        logger.error("Deleting Few Tasks as per request")
    else:
        logger.warning("Pruning some Tasks")

    await TaskBase.filter(
        Q(
            test_id__in=await TestLogBase.filter(type=LogType.ERROR)
            .filter(
                test_id__in=await TaskBase.all()
                .only("test_id")
                .distinct()
                .values_list("test_id", flat=True)
            )
            .only("test_id")
            .distinct()
            .values_list("test_id", flat=True)
        )
        & ~Q(ticketID=request_id)
    ).delete()
