from graspit.services.Endpoints.internalEndpoints import one_liners
from graspit.services.DBService.getThings import get_service
from graspit.services.DBService.shared import APP_NAME
from graspit.services.Endpoints.blueprints.coreEndpoints import service
from graspit.services.Endpoints.blueprints.writeServices import writeServices
from graspit.services.Endpoints.errorHandling import handle_validation_error
from sanic import Sanic
from pydantic import ValidationError

service_provider = Sanic(APP_NAME)
service_provider.config.TOUCHUP = False
service_provider.blueprint(one_liners)
service_provider.blueprint(service)
service_provider.blueprint(writeServices)
service_provider.blueprint(get_service)

service_provider.error_handler.add(ValidationError, handle_validation_error)
