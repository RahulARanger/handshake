from graspit.services.DBService.models.enums import AttachmentType
from graspit.services.DBService.models.config_base import TestConfigBase
from graspit.services.DBService.models.dynamic_base import TaskBase, JobType
from uuid import uuid4


async def mark_for_prune_task(test_id: str):
    await TaskBase.create(
        ticketID=str(uuid4()), type=JobType.PRUNE_TASKS, test_id=test_id
    )


async def pruneTasks():
    # await TaskBase.filter(
    #     test_id__in=await TestConfigBase.filter(type=AttachmentType.ERROR)
    #     .only("test_id")
    #     .distinct()
    #     .values_list("test_id", flat=True)
    # )

    await TaskBase.filter(
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
    ).delete()
