from handshake.services.DBService.models.result_base import SessionBase, SuiteBase
from handshake.services.DBService.models.types import (
    RegisterSession,
    RegisterSuite,
    MarkSuite,
    MarkSession,
    AddAttachmentForEntity,
    PydanticModalForTestRunConfigBase,
    WrittenAttachmentForEntity,
)
from handshake.services.Endpoints.blueprints.utils import (
    attachError,
    extractPayload,
    attachWarn,
    extractPydanticErrors,
)
from handshake.services.DBService.models.static_base import (
    AttachmentBase,
    AttachmentType,
)
from handshake.services.DBService.models.config_base import TestConfigBase
from handshake.services.DBService.models.attachmentBase import AssertBase
from handshake.services.DBService.models.enums import Status, SuiteType
from handshake.services.DBService.models.static_base import StaticBase
from sanic.blueprints import Blueprint
from sanic.response import JSONResponse, text, HTTPResponse
from loguru import logger
from sanic.request import Request
from handshake.services.DBService.shared import get_test_id
from handshake.services.SchedularService.register import register_patch_suite
from pydantic import ValidationError
from dotenv import load_dotenv
from handshake.services.DBService.lifecycle import attachment_folder, db_path

load_dotenv()


service = Blueprint("DBService", url_prefix="/save")


@service.on_response
async def handle_response(request: Request, response: JSONResponse):
    if 200 <= response.status < 300:
        return response

    payload = extractPayload(request, response)
    await attachError(payload, request.url)
    return JSONResponse(body=payload, status=response.status)


@service.put("/registerSession")
async def register_session(request: Request) -> HTTPResponse:
    try:
        session = RegisterSession.model_validate(request.json)
        session_record = await SessionBase.create(
            **session.model_dump(), test_id=get_test_id()
        )
        await session_record.save()
    except Exception as error:
        logger.error("Failed to create a session due to exception: {}", str(error))
        return text(str(error), status=404)

    return text(str(session_record.sessionID), status=201)


@service.put("/registerSuite")
async def register_suite(request: Request) -> HTTPResponse:
    suite = RegisterSuite.model_validate(request.json)
    suite_record = await SuiteBase.create(**suite.model_dump())
    await suite_record.save()

    return text(str(suite_record.suiteID), status=201)


@service.put("/updateSuite", error_format="json")
async def updateSuite(request: Request) -> HTTPResponse:
    suite = MarkSuite.model_validate(request.json)

    suite_record = await SuiteBase.filter(suiteID=suite.suiteID).first()
    if not suite_record:
        logger.error("Was not able to found {} suite", str(suite.suiteID))
        return text(f"Suite {suite.suiteID} was not found", status=404)

    if suite_record.suiteType == SuiteType.SUITE:
        suite.standing = Status.YET_TO_CALCULATE
    else:
        note = {
            suite.standing.lower(): 1,
            "tests": 1,
        }
        await suite_record.update_from_dict(note)
        await suite_record.save()

    await suite_record.update_from_dict(suite.model_dump())
    await suite_record.save()

    if suite_record.suiteType == SuiteType.SUITE:
        await register_patch_suite(suite_record.suiteID, get_test_id())

    return text(
        f"Suite: {suite_record.title} - {suite_record.suiteID} was updated", status=201
    )


@service.put("/updateSession", error_format="json")
async def update_session(request: Request) -> HTTPResponse:
    session = MarkSession.model_validate(request.json)
    test_session = await SessionBase.filter(sessionID=session.sessionID).first()
    if not test_session:
        logger.error("Expected {} session was not found", str(session.sessionID))
        return text(f"Session {session.sessionID} was not found", status=404)

    await test_session.update_from_dict(session.model_dump())
    await test_session.save()
    return text(f"{session.sessionID} was updated", status=201)


@service.put("/addAttachmentsForEntities")
async def addAttachmentForEntity(request: Request) -> HTTPResponse:
    attachments = []
    note = []
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
            url = "/addAttachmentsForEntities"
            await attachWarn(extractPydanticErrors(url, _, error), url)
            continue

        match attachment.type:
            case AttachmentType.ASSERT:
                assertions.append(
                    await AssertBase(
                        **dict(
                            entity_id=attachment.entityID,
                            title=attachment.title,
                            message=attachment.value["message"],
                            passed=attachment.value["passed"],
                            interval=attachment.value["interval"],
                            wait=attachment.value["wait"],
                        )
                    )
                )

            case _:
                (
                    attachments.append(
                        await AttachmentBase(
                            **dict(
                                entity_id=attachment.entityID,
                                description=attachment.description,
                                type=attachment.type,
                                attachmentValue=dict(
                                    color=attachment.color,
                                    value=attachment.value,
                                    title=attachment.title,
                                ),
                            )
                        )
                    )
                )

    if attachments:
        await AttachmentBase.bulk_create(attachments)
    if assertions:
        await AssertBase.bulk_create(assertions)
    return text(
        "Attachments was added successfully", status=201 if not len(note) else 206
    )


@service.put("/currentRun")
async def update_run_config(request: Request) -> HTTPResponse:
    run_config = PydanticModalForTestRunConfigBase.model_validate(request.json)
    config = await TestConfigBase.create(
        test_id=get_test_id(),
        platform=run_config.platformName,
        framework=run_config.framework,
        maxInstances=run_config.maxInstances,
        fileRetries=run_config.fileRetries,
        avoidParentSuitesInCount=run_config.avoidParentSuitesInCount,
        bail=run_config.bail,
        tags=run_config.tags,
    )

    test = await config.test
    await test.update_from_dict(dict(exitCode=run_config.exitCode))
    await test.save()
    await config.save()

    return text("provided config was saved successfully.", status=200)


@service.put("/registerAWrittenAttachment", error_format="json")
async def saveImage(request: Request) -> HTTPResponse:
    attachment = WrittenAttachmentForEntity.model_validate(request.json)
    record = await StaticBase.create(
        entity_id=attachment.entityID,
        description=attachment.description,
        type=attachment.type,
    )
    file_name = f"{record.attachmentID}.{record.type.lower()}"
    await record.update_from_dict(
        dict(
            attachmentValue=dict(value=file_name, title=attachment.title),
        )
    )
    await record.save()
    # we can save the file in this request itself, but no. we let the framework's custom reporter cook.
    return text(
        str(attachment_folder(db_path()) / get_test_id() / file_name), status=201
    )
