from sanic import Sanic
from src.services.Endpoints.oneliners import one_liners
from src.services.DBService.center import service
from src.services.DBService.getThings import get_service
from src.services.SchedularService.center import scheduler
from src.services.DBService.lifecycle import init_tortoise_orm, close_connection
from src.services.DBService.shared import set_test_id
from src.services.Endpoints.errorHandling import handle_validation_error
from pydantic import ValidationError

service_provider = Sanic("WDIO-PY")
service_provider.blueprint(one_liners)
service_provider.blueprint(service)
service_provider.blueprint(get_service)

service_provider.error_handler.add(ValidationError, handle_validation_error)


# from tortoise.contrib.sanic import register_tortoise
# custom way to register tortoise, we are doing this because the file path is dynamically generated

@service_provider.before_server_start
async def before_start_of_day(app: Sanic, loop):
    set_test_id()
    await init_tortoise_orm()

    app.ctx.scheduler = scheduler()
    app.ctx.scheduler.start()


@service_provider.after_server_stop
async def close_scheduler(app: Sanic, loop):
    app.ctx.scheduler.shutdown(wait=True)
    await close_connection()
