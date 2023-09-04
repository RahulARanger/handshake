from nextpyreports.services.DBService.models.task_base import TaskBase
import logging


async def drop_task(ticket_id: str):
    task = await TaskBase.filter(ticketID=ticket_id).first()
    if not task:
        return
    await task.delete()
    await task.save()


def get_scheduler_logger():
    return logging.getLogger('apscheduler.executors.default')
