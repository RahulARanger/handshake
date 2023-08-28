from src.services.SchedularService.modifySuites import handleSuiteStatus
from src.services.SchedularService.constants import JobType, MODIFY_SUITE_JOB
from src.services.DBService.models.task_base import TaskBase
from src.services.SchedularService.center import ctx_scheduler


def lookup_for_tasks():
    rounds = 10
    _scheduler = ctx_scheduler()

    for look_up_rounds in range(rounds):
        task = await TaskBase.first()

        match task.type:
            case JobType.MODIFY_SUITE:
                _scheduler.add_job(
                    handleSuiteStatus, "date", args=[task.ticketID],
                    name=f'update suite: {task.ticketID}', id=f'{MODIFY_SUITE_JOB}-{task.ticketID}'
                )
            case _:
                print("Not Implemented yet..")