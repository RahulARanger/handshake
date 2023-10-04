from graspit.services.Endpoints.oneliners import one_liners
from graspit.services.DBService.center import service
from graspit.services.DBService.getThings import get_service
from graspit.services.DBService.lifecycle import init_tortoise_orm, close_connection
from graspit.services.DBService.shared import set_test_id, app_name
from graspit.services.Endpoints.errorHandling import handle_validation_error
import asyncio
from sanic import Sanic
from pydantic import ValidationError
from loguru import logger
from signal import signal, SIGTERM, SIGINT

service_provider = Sanic(app_name)
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
    logger.info("DB Connection is now online 🌍")


@service_provider.after_server_stop
async def close_scheduler(app: Sanic, loop):
    logger.info("Closing the db connection 👋")
    await close_connection()


def close_app(*args):
    asyncio.run(
        close_connection()
    )
    logger.warning("Services are offline as requested.")


@service_provider.main_process_ready
def handle_signals(app, loop):
    signal(SIGINT, close_app)
    signal(SIGTERM, close_app)
