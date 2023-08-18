from sanic import Sanic
from src.services.Endpoints.oneliners import one_liners
from src.services.DBService.center import service
from src.services.DBService.getThings import get_service
from src.services.SchedularService.center import scheduler
from src.services.DBService.lifecycle import init_tortoise_orm
from src.services.DBService.shared import set_test_id

service_provider = Sanic("WDIO-PY")
service_provider.blueprint(one_liners)
service_provider.blueprint(service)
service_provider.blueprint(get_service)


# from tortoise.contrib.sanic import register_tortoise
# custom way to register tortoise, we are doing this because the file path is dynamically generated

@service_provider.before_server_start
async def before_start_of_day(app: Sanic, loop):
    set_test_id()
    await init_tortoise_orm()

    app.ctx.scheduler = scheduler()
    app.ctx.scheduler.start()
