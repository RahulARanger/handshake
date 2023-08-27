from pydantic import ValidationError
from sanic.request import Request
from sanic.response import JSONResponse, json


async def handle_validation_error(request: Request, validation_error: ValidationError) -> JSONResponse:
    return json(validation_error.errors(), status=400)
