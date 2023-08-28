from src.services.SchedularService.constants import JobType
from src.services.SchedularService.handlePending import lookup_for_tasks
from apscheduler.schedulers.asyncio import AsyncIOScheduler


def scheduler() -> AsyncIOScheduler:
    schedular = AsyncIOScheduler()
    schedular.add_job(
        lookup_for_tasks, "interval", seconds=3,
        id=JobType.LOOKUP_JOB, name='lookup for tasks'
    )
    return schedular
