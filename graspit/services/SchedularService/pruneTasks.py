from graspit.services.DBService.models.enums import AttachmentType
from graspit.services.DBService.models.config_base import TestConfigBase
from graspit.services.DBService.models.dynamic_base import TaskBase


async def pruneTasks():
    multiple_test_ids = await TaskBase.all().only("test_id").distinct().values_list("test_id", flat=True)

    for test_id in multiple_test_ids:
        has_error = await TestConfigBase.exists(type=AttachmentType.ERROR, test_id=test_id)
        if not has_error:
            continue

        await TaskBase.filter(test_id=test_id).delete()
        # you can drop the tasks that would lead to deadlock
        # since these tasks cannot be completed (as they have incomplete information)

