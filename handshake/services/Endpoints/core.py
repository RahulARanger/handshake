from handshake.services.Endpoints.internalEndpoints import one_liners
from handshake.services.DBService.shared import APP_NAME
from handshake.services.Endpoints.blueprints.coreEndpoints import update_service
from handshake.services.Endpoints.blueprints.createService import create_service
from handshake.services.Endpoints.blueprints.writeServices import writeServices
from handshake.services.Endpoints.errorHandling import handle_validation_error
from handshake.services.Endpoints.blueprints.utils import extractPayload, attachWarn
from sanic import Sanic, Request
from sanic.response import JSONResponse
from pydantic import ValidationError
from sanic.blueprints import Blueprint


listeners = Blueprint.group(
    create_service, update_service, writeServices, name_prefix="listeners"
)


@listeners.on_response
async def handle_response(request: Request, response: JSONResponse):
    if 200 <= response.status < 300:
        return response

    payload = extractPayload(request, response)
    await attachWarn(payload, request.url)
    return JSONResponse(body=payload, status=response.status)


service_provider = Sanic(APP_NAME)
service_provider.config.TOUCHUP = False
service_provider.blueprint(one_liners)
service_provider.blueprint(listeners)

service_provider.error_handler.add(ValidationError, handle_validation_error)
