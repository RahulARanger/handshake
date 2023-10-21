from loguru import logger
from graspit.services.DBService.models.dynamic_base import TaskBase, JobType
from uuid import uuid4


async def register_patch_suite(suiteID: str, testID: str) -> TaskBase:
    return await TaskBase.create(
        ticketID=suiteID, test_id=testID, type=JobType.MODIFY_SUITE
    )


async def register_patch_test_run(testID: str) -> TaskBase:
    return await TaskBase.create(
        type=JobType.MODIFY_TEST_RUN, test_id=testID, ticketID=testID
    )


async def mark_for_prune_task(test_id: str):
    logger.warning("Requested to prune some tasks")
    await TaskBase.create(
        ticketID=str(uuid4()), type=JobType.PRUNE_TASKS, test_id=test_id
    )
