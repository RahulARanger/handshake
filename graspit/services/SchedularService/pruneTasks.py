from graspit.services.DBService.models.enums import AttachmentType
from graspit.services.DBService.models.static_base import TestConfigBase
from graspit.services.DBService.models.dynamic_base import TaskBase, JobType
from loguru import logger
from typing import Optional
from tortoise.expressions import Q


async def pruneTasks(request_id: Optional[str] = ""):
    if request_id:
        logger.error("Deleting Few Tasks as per request")
    else:
        logger.warning("Pruning some Tasks")

    await TaskBase.filter(
        Q(
            test_id__in=await TestConfigBase.filter(type=AttachmentType.ERROR)
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
