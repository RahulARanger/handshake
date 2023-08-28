from src.services.SchedularService.modifySuites import handleSuiteStatus, add_task_if_required as modify_suite
from src.services.SchedularService.constants import JobType, MODIFY_SUITE_JOB
from src.services.SchedularService.shared import ctx_scheduler
from src.services.DBService.models.config_base import get_config


async def lookup_for_tasks():
    _scheduler = ctx_scheduler()
    rounds = max((await get_config()).lookUpFrequency, 1)

    for look_up_rounds in range(rounds):
        task = await modify_suite()

        if not task:
            ...  # add another type of task if required
        if not task:
            break  # take a break and return when you are called

        match task.type:
            case JobType.MODIFY_SUITE:
                _scheduler.add_job(
                    handleSuiteStatus, "date", args=[task.ticketID],
                    name=f'update suite: {task.ticketID}', id=f'{MODIFY_SUITE_JOB}-{task.ticketID}'
                )
            case _:
                print("Not Implemented yet..")
