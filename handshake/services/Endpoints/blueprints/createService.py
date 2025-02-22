from handshake.services.DBService.models.result_base import SessionBase, SuiteBase
from handshake.services.DBService.models.attachmentBase import (
    AssertBase,
    EntityLogBase,
    LogGeneratedBy,
)
from handshake.services.DBService.models.static_base import (
    AttachmentBase,
    AttachmentType,
)
from handshake.services.DBService.models.types import (
    AddAttachmentForEntity,
    RegisterSession,
    CreatePickedSuiteOrTest,
    PydanticModalForCreatingTestRunConfigBase,
    Status,
    SuiteType,
)
from pydantic import ValidationError
from handshake.services.Endpoints.define_api import definition
from handshake.services.DBService.models.config_base import TestConfigBase
from sanic.blueprints import Blueprint
from sanic.response import text, HTTPResponse
from sanic.log import error_logger
from sanic.request import Request
from handshake.services.DBService.shared import get_test_id
from handshake.services.SchedularService.register import register_bulk_patch_suites
from typing import List
from handshake.services.Endpoints.blueprints.utils import (
    attachWarn,
    extractPydanticErrors,
)

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
        error_logger.error(
            "Failed to create a session due to exception: {}", str(error)
        )
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
        (
            "configuration was added to the current test run"
            if created
            else "config cannot be updated, please raise a request for this endpoint"
        ),
        status=201 if created else 406,
    )


@create_service.post("/Suite")
async def create_suite(request: Request) -> HTTPResponse:
    suite = CreatePickedSuiteOrTest.model_validate(request.json)
    to_load = suite.model_dump()
    if to_load.pop("is_processing"):
        to_load["standing"] = Status.PROCESSING
    else:
        to_load["standing"] = Status.PENDING

    suite_record = await SuiteBase.create(**to_load)
    await suite_record.save()

    return text(str(suite_record.suiteID), status=201)


@create_service.post("/ScheduleSuites")
async def register_modify_suites(request: Request) -> HTTPResponse:
    test_id = get_test_id()

    suites_to_register = await SuiteBase.filter(
        session__test_id=test_id,
        suiteType=SuiteType.SUITE,
        started=None,
        ended=None,
    )

    suites = []
    for suite in suites_to_register:
        suite.standing = str(Status.YET_TO_CALCULATE)
        suites.append(suite.suiteID)

    suites_to_register and await SuiteBase.bulk_update(
        suites_to_register, ("standing",), 100
    )
    await register_bulk_patch_suites(test_id, suites)

    return text("Done", status=202)


@create_service.post("/Attachments")
@definition(
    summary="adds multiple attachments to the specified entities",
    description="provide the list of attachments (assertion/link/description) as mentioned in the body, "
    "and attachments would be inserted in their respective tables",
    tag="add",
    body={"application/json": List[AddAttachmentForEntity]},
)
async def addAttachmentForEntity(request: Request) -> HTTPResponse:
    attachments = []
    note = []
    logs = []
    assertions = []

    for _ in request.json:
        try:
            if _["type"] == AttachmentType.ASSERT:
                value = _.get("value", dict())
                value["wait"] = value.get("wait", -1)
                value["interval"] = value.get("interval", -1)

            attachment = AddAttachmentForEntity.model_validate(_)
        except ValidationError as error:
            note.append(_.get("entityID", False))
            await attachWarn(extractPydanticErrors(request.url, _, error), request.url)
            continue

        match attachment.type:
            case AttachmentType.ASSERT:
                assertions.append(
                    await AssertBase(
                        **dict(
                            entity_id=attachment.entity_id,
                            title=attachment.title,
                            message=attachment.description,
                            passed=attachment.value["passed"],
                            interval=attachment.value["interval"],
                            wait=attachment.value["wait"],
                        )
                    )
                )

            case AttachmentType.LOG:
                logs.append(
                    await EntityLogBase(
                        **dict(
                            entity_id=attachment.entity_id,
                            title=attachment.title,
                            message=attachment.description,
                            type=attachment.value["type"],
                            tags=attachment.tags,
                            feed=attachment.extraValues,
                            generatedByGroup=LogGeneratedBy.USER,
                            generatedBy="User",
                        )
                    )
                )

            case _:
                attachments.append(AttachmentBase(**attachment.model_dump()))

    if attachments:
        await AttachmentBase.bulk_create(attachments)
    if logs:
        await EntityLogBase.bulk_create(logs)
    if assertions:
        await AssertBase.bulk_create(assertions)
    return text(
        "Attachments was added successfully", status=201 if not len(note) else 206
    )
