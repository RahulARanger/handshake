from graspit.services.Endpoints.core import service_provider
from graspit.services.DBService.lifecycle import init_tortoise_orm, close_connection
from graspit.services.DBService.shared import set_test_id
import asyncio
from loguru import logger
from signal import signal, SIGTERM, SIGINT
from sanic import Sanic


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
    asyncio.run(close_connection())
    logger.warning("Services are offline as requested.")


@service_provider.main_process_ready
def handle_signals(app, loop):
    signal(SIGINT, close_app)
    signal(SIGTERM, close_app)
