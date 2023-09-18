from nextpyreports.services.DBService.models.dynamic_base import TaskBase


async def drop_task(ticket_id: str):
    task = await TaskBase.filter(ticketID=ticket_id).first()
    if not task:
        return
    await task.delete()
