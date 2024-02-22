import os
from handshake.services.DBService.lifecycle import DB_VERSION
from handshake.services.Endpoints.internalEndpoints import one_liners
from handshake.services.DBService.shared import APP_NAME
from handshake.services.Endpoints.blueprints.coreEndpoints import service
from handshake.services.Endpoints.blueprints.writeServices import writeServices
from handshake.services.Endpoints.errorHandling import handle_validation_error
from sanic import Sanic
from pydantic import ValidationError
import sentry_sdk
from handshake import __version__

dns = os.getenv("SENTRY_SDK")
if dns:
    sentry_sdk.init(
        dsn=os.getenv("SENTRY_SDK"),
        enable_tracing=True,
        max_breadcrumbs=10,
        release=f"{__version__} - {DB_VERSION}",
        server_name=APP_NAME,
    )

service_provider = Sanic(APP_NAME)
service_provider.config.TOUCHUP = False
service_provider.blueprint(one_liners)
service_provider.blueprint(service)
service_provider.blueprint(writeServices)

service_provider.error_handler.add(ValidationError, handle_validation_error)
