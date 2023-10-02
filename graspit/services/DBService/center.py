import json
from graspit.services.DBService.models.result_base import SessionBase, SuiteBase
from graspit.services.DBService.models.types import RegisterSession, RegisterSuite, MarkSuite, MarkSession, \
    AddAttachmentForEntity
from graspit.services.DBService.models.dynamic_base import TaskBase, JobType
from graspit.services.DBService.models.config_base import PydanticModalForTestRunConfigBase, AttachmentType, \
    TestConfigBase, AttachmentBase
from graspit.services.DBService.models.enums import Status, SuiteType
from graspit.services.SchedularService.modifySuites import fetch_key_from_status
from sanic.blueprints import Blueprint
from sanic.response import JSONResponse, text, HTTPResponse
from loguru import logger
from sanic.request import Request
from graspit.services.DBService.shared import get_test_id

service = Blueprint("DBService", url_prefix="/save")


@service.on_response
async def handle_response(request: Request, response: JSONResponse):
    if 200 <= response.status < 300:
        return response

    await TestConfigBase.create(
        test_id=get_test_id(),
        attachmentValue=dict(
            url=request.url, payload=request.json, status=response.status,
            reason=response.body.decode()
        ),
        type=AttachmentType.ERROR,
        description=f'Failed to process the request at: {request.url}, will affect the test run'
    )


@service.put("/registerSession")
async def register_session(request: Request) -> HTTPResponse:
    try:
        session = RegisterSession.model_validate(request.json)
        session_record = await SessionBase.create(**session.model_dump(), test_id=get_test_id())
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
    return text(
        str(suite_record.suiteID),
        status=201
    )


@service.put("/updateSuite")
async def updateSuite(request: Request) -> HTTPResponse:
    suite = MarkSuite.model_validate(request.json)

    suite_record = await SuiteBase.filter(suiteID=suite.suiteID).first()
    if not suite_record:
        logger.error("Was not able to found {} suite", str(suite.suiteID))
        return text(f'Suite {suite.suiteID} was not found', status=404)

    if suite_record.suiteType == SuiteType.SUITE:
        suite.standing = Status.YET_TO_CALCULATE
    else:
        note = {
            fetch_key_from_status(suite_record.passed, suite_record.failed, suite_record.skipped).lower(): 1,
            "tests": 1
        }
        await suite_record.update_from_dict(note)
        await suite_record.save()

    await suite_record.update_from_dict(suite.model_dump())
    await suite_record.save()

    if suite_record.suiteType == SuiteType.SUITE:
        task = (
            await TaskBase.create(ticketID=suite_record.suiteID, test_id=get_test_id(), type=JobType.MODIFY_SUITE)
        ).ticketID
    else:
        task = "Updated"

    return text(f'Updated Suite: {  suite_record.title} || {suite_record.suiteID} || {task}', status=201)


@service.put("/updateSession")
async def update_session(request: Request) -> HTTPResponse:
    session = MarkSession.model_validate(request.json)
    test_session = await SessionBase.filter(sessionID=session.sessionID).first()
    if not test_session:
        logger.error("Expected {} session was not found", str(session.sessionID))
        return text(f"Session {session.sessionID} was not found", status=404)

    await test_session.update_from_dict(session.model_dump())
    await test_session.save()
    return text(f"{session.sessionID} was updated", status=201)


@service.put("/addAttachmentForEntity")
async def addAttachmentForEntity(request: Request) -> HTTPResponse:
    attachment = AddAttachmentForEntity.model_validate(request.json)
    await AttachmentBase.create(
        entity_id=attachment.entityID,
        description=attachment.description,
        type=attachment.type,
        attachmentValue=attachment.content
    )

    return text(f"Attachment added successfully for {attachment.entityID}", status=201)


@service.put("/currentRun")
async def update_run_config(request: Request) -> HTTPResponse:
    run_config = PydanticModalForTestRunConfigBase.model_validate(request.json)

    config = await TestConfigBase.filter(test_id=get_test_id()).first()
    if not config:
        return text(get_test_id() + " || Test Run not found", status=404)

    updated_value = config.attachmentValue
    updated_value.update(run_config)

    await config.update_from_dict(dict(attachmentValue=updated_value))
    await config.save()
    return text(json.dumps(updated_value), status=201)
