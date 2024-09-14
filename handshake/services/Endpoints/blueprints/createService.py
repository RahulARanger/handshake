from handshake.services.DBService.models.result_base import (
    SessionBase,
)
from handshake.services.DBService.models.types import (
    RegisterSession,
    PydanticModalForCreatingTestRunConfigBase,
)
from handshake.services.Endpoints.define_api import definition
from handshake.services.DBService.models.config_base import TestConfigBase
from sanic.blueprints import Blueprint
from sanic.response import text, HTTPResponse
from loguru import logger
from sanic.request import Request
from handshake.services.DBService.shared import get_test_id


create_service = Blueprint("CreateService", url_prefix="/create")


@create_service.post("/Session")
@definition(
    summary="Registers a Session",
    description="Registers a session with datetime on the currently running Test Run. Please take a note of the "
    "sessionID sent",
    tag="create",
    body={"application/json": RegisterSession.model_json_schema()},
)
async def register_test_session(request: Request) -> HTTPResponse:
    try:
        session = RegisterSession.model_validate(request.json)
        session_record = await SessionBase.create(
            **session.model_dump(), test_id=get_test_id()
        )
        await session_record.save()
    except Exception as error:
        logger.error("Failed to create a session due to exception: {}", str(error))
        return text(str(error), status=400)

    return text(str(session_record.sessionID), status=201)


@create_service.post("/RunConfig")
async def create_test_run_config(request: Request) -> HTTPResponse:
    run_config = PydanticModalForCreatingTestRunConfigBase.model_validate(request.json)
    _, created = await TestConfigBase.get_or_create(
        test_id=get_test_id(),
        **run_config.model_dump(),
    )

    return text(
        "configuration was added to the current test run"
        if created
        else "config cannot be updated, please raise a request for this endpoint",
        status=201 if created else 406,
    )
