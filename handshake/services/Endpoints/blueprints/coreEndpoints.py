from handshake.services.DBService.models.result_base import (
    SessionBase,
    SuiteBase,
    RunBase,
)
from handshake.services.DBService.models.types import (
    RegisterSession,
    RegisterSuite,
    PunchInSuite,
    UpdateSuite,
    MarkSuite,
    UpdateSession,
    MarkSession,
    AddAttachmentForEntity,
    PydanticModalForTestRunConfigBase,
    PydanticModalForTestRunUpdate,
    WrittenAttachmentForEntity,
    MarkTestRun,
)
from handshake.services.Endpoints.blueprints.utils import (
    attachError,
    extractPayload,
    attachWarn,
    extractPydanticErrors,
    prune_nones,
)
from handshake.services.DBService.models.static_base import (
    AttachmentBase,
    AttachmentType,
)
from handshake.services.Endpoints.define_api import definition
from handshake.services.DBService.models.config_base import TestConfigBase
from handshake.services.DBService.models.attachmentBase import AssertBase
from handshake.services.DBService.models.enums import (
    Status,
    SuiteType,
)
from handshake.services.DBService.models.static_base import StaticBase
from sanic.blueprints import Blueprint
from sanic.response import JSONResponse, text, HTTPResponse
from loguru import logger
from typing import List
from sanic.request import Request
from handshake.services.DBService.shared import get_test_id
from handshake.services.SchedularService.register import (
    register_patch_suite,
    register_patch_test_run,
)
from pydantic import ValidationError
from handshake.services.DBService.lifecycle import attachment_folder, db_path
from tortoise.expressions import F

update_service = Blueprint("UpdateService", url_prefix="/save")


@update_service.on_response
async def handle_response(request: Request, response: JSONResponse):
    if 200 <= response.status < 300:
        return response

    payload = extractPayload(request, response)
    await attachError(payload, request.url)
    return JSONResponse(body=payload, status=response.status)


@update_service.put("/registerSession")
@definition(
    summary="Registers a Session",
    description="Registers a session with state datetime on the currently running Test Run.",
    tag="register",
    body={"application/json": RegisterSession.model_json_schema()},
)
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


@update_service.put("/registerSuite")
@definition(
    summary="Registers a Suite under a session",
    description="Registers a suite/test with provided meta details of suite/test and session id",
    tag="register",
    body={"application/json": RegisterSuite},
)
async def register_suite(request: Request) -> HTTPResponse:
    suite = RegisterSuite.model_validate(request.json)
    suite_record = await SuiteBase.create(**suite.model_dump())
    await suite_record.save()

    return text(str(suite_record.suiteID), status=201)


@update_service.put("/PunchInSuite", error_format="json")
@definition(
    summary="Updates the suite's start datetime",
    description="we have dynamic dashboard, and since the start time can be provided anytime from the framework, "
    "we allow suite to be created without starttime, this request is to update start time as soon as "
    "possible.",
    tag="update",
    body={"application/json": PunchInSuite.model_json_schema()},
)
async def punch_in_test_suite(request: Request) -> HTTPResponse:
    payload = request.json
    suite = PunchInSuite.model_validate(payload)
    suite_record = await SuiteBase.filter(suiteID=suite.suiteID).first()
    if not suite_record:
        logger.error("Was not able to found {} suite", str(suite.suiteID))
        return text(f"Suite {suite.suiteID} was not found", status=404)

    payload = suite.model_dump()
    payload["standing"] = Status.PROCESSING
    suite_record = await suite_record.update_from_dict(payload)
    await suite_record.save()
    return text(str(suite_record.suiteID), status=200)


@update_service.put("/Suite", error_format="json")
@definition(
    summary="Updates the suite past the test suite's execution",
    description="Once the Test suite/test gets executed, through this endpoint "
    "we would updates its status and timings on the registered suite/test",
    tag="update",
    body={"application/json": UpdateSuite.model_json_schema()},
)
async def update_suite_details(request: Request) -> HTTPResponse:
    payload = prune_nones(request.json)

    suite = UpdateSuite.model_validate(payload)
    suite_record = await SuiteBase.filter(suiteID=suite.suiteID).first()
    if not suite_record:
        logger.error("Was not able to found {} suite", str(suite.suiteID))
        return text(f"Suite {suite.suiteID} was not found", status=404)

    # first, we save the details that were provided
    before_duration = suite_record.duration or 0
    if suite_record.suiteType == SuiteType.SUITE:
        suite.standing = Status.YET_TO_CALCULATE
    else:
        note = {
            suite.standing.lower(): 1,
            "tests": 1,
        }
        if (
            suite_record.suiteType == SuiteType.TEARDOWN
            or suite_record.suiteType == SuiteType.SETUP
        ):
            note[f"{suite_record.suiteType.lower()}_duration"] = suite.duration
        await suite_record.update_from_dict(note)

    await suite_record.update_from_dict(prune_nones(suite.model_dump()))
    await suite_record.save()

    # now we calculate certain data
    added_task = False

    match suite_record.suiteType:
        case SuiteType.SUITE:
            added_task = bool(
                await register_patch_suite(suite_record.suiteID, get_test_id())
            )
        # we can't have combined expression with duration and int at the same time, so we update twice
        case SuiteType.SETUP:
            # note here suite_record.duration means hook's duration
            await SuiteBase.filter(suiteID=suite_record.parent).update(
                setup_duration=F("setup_duration") + suite_record.duration
            )
            await SuiteBase.filter(suiteID=suite_record.parent).update(
                setup_duration=F("setup_duration") - before_duration
            )
        case SuiteType.TEARDOWN:
            await SuiteBase.filter(suiteID=suite_record.parent).update(
                teardown_duration=F("teardown_duration") + suite_record.duration
            )
            await SuiteBase.filter(suiteID=suite_record.parent).update(
                teardown_duration=F("teardown_duration") - before_duration
            )

    return text(str(suite_record.suiteID), status=201 if added_task else 200)


@update_service.put("/Session", error_format="json")
@definition(
    summary="Updates the session past the test session's execution",
    description="Once the Test session gets executed, through this endpoint "
    "we would updates its status and timings on the registered session",
    tag="update",
    body={"application/json": UpdateSession.model_json_schema()},
)
async def update_test_session_details(request: Request) -> HTTPResponse:
    session = UpdateSession.model_validate(request.json)
    test_session = await SessionBase.filter(sessionID=session.sessionID).first()
    if not test_session:
        logger.error("Expected {} session was not found", str(session.sessionID))
        return text(f"Session {session.sessionID} was not found", status=404)

    await test_session.update_from_dict(session.model_dump())
    await test_session.save()
    return text(f"{session.sessionID} was updated", status=200)


# NOTE: this API was made specifically to support a registering describeBlocks
# NOTE: Planning to depreciate this soon.
@update_service.put("/registerParentEntities")
@definition(
    summary="Registers a set of parent suites starting from root hierarchy",
    description="Registers set of parent suites with provided meta details of suites and session id",
    tag="register",
    body={"application/json": RegisterSuite},
)
async def register_parent_entities(request: Request) -> HTTPResponse:
    prev_parent = ""
    store = []
    for _suite in request.json:
        if isinstance(_suite, str):
            prev_parent = _suite
            store.append(prev_parent)
            continue

        suite = RegisterSuite.model_validate(_suite)
        values = suite.model_dump()
        values["parent"] = prev_parent
        suite_record = await SuiteBase.create(**values)
        prev_parent = str(suite_record.suiteID)
        await suite_record.save()
        store.append(prev_parent)

    return JSONResponse(body=store, status=201)


@update_service.put("/updateSuite", error_format="json")
@definition(
    summary="Updates the suite past the test suite's execution",
    description="Once the Test suite/test gets executed, through this endpoint "
    "we would updates its status and timings on the registered suite/test",
    tag="update",
    body={"application/json": MarkSuite.model_json_schema()},
)
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

    await suite_record.update_from_dict(suite.model_dump())
    await suite_record.save()

    match suite_record.suiteType:
        case SuiteType.SUITE:
            await register_patch_suite(suite_record.suiteID, get_test_id())
        case SuiteType.SETUP:
            await SuiteBase.filter(suiteID=suite_record.parent).update(
                setup_duration=F("setup_duration") + suite_record.duration
            )
        case SuiteType.TEARDOWN:
            await SuiteBase.filter(suiteID=suite_record.parent).update(
                teardown_duration=F("teardown_duration") + suite_record.duration
            )

    return text(
        f"Suite: {suite_record.title} - {suite_record.suiteID} was updated", status=201
    )


@update_service.put("/updateSession", error_format="json")
@definition(
    summary="Updates the session past the test session's execution",
    description="Once the Test session gets executed, through this endpoint "
    "we would updates its status and timings on the registered session",
    tag="update",
    body={"application/json": MarkSession.model_json_schema()},
)
async def update_session(request: Request) -> HTTPResponse:
    session = MarkSession.model_validate(request.json)
    test_session = await SessionBase.filter(sessionID=session.sessionID).first()
    if not test_session:
        logger.error("Expected {} session was not found", str(session.sessionID))
        return text(f"Session {session.sessionID} was not found", status=404)

    await test_session.update_from_dict(session.model_dump())
    await test_session.save()
    return text(f"{session.sessionID} was updated", status=201)


@update_service.put("/addAttachmentsForEntities")
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
                            entity_id=attachment.entity_id,
                            title=attachment.title,
                            message=attachment.value["message"],
                            passed=attachment.value["passed"],
                            interval=attachment.value["interval"],
                            wait=attachment.value["wait"],
                        )
                    )
                )

            case _:
                attachments.append(AttachmentBase(**attachment.model_dump()))

    if attachments:
        await AttachmentBase.bulk_create(attachments)
    if assertions:
        await AssertBase.bulk_create(assertions)
    return text(
        "Attachments was added successfully", status=201 if not len(note) else 206
    )


@update_service.put("/Run")
async def update_test_run(request: Request) -> HTTPResponse:
    to_update = MarkTestRun.model_validate(request.json)
    test_id = get_test_id()

    await register_patch_test_run(test_id)
    record = await RunBase.filter(testID=test_id).first()

    await record.update_from_dict(to_update.model_dump())
    await record.save()
    return text("updated test run successfully", status=200)


@update_service.put("/currentRun")
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

    return text("provided config was saved successfully.", status=200)


@update_service.put("/updateTestRun")
async def update_run(request: Request) -> HTTPResponse:
    about_run = PydanticModalForTestRunUpdate.model_validate(request.json)
    await register_patch_test_run(get_test_id())
    if not about_run:
        return text("No changes were made.", status=400)

    test = await RunBase.filter(testID=get_test_id()).first()
    await test.update_from_dict(about_run.model_dump())
    await test.save()
    return text(
        "test run was updated and task was also added successfully.", status=200
    )


@update_service.put("/registerAWrittenAttachment", error_format="json")
@definition(
    summary="Attach an Images to the specified entity",
    description="Writes an attachment inside of our Attachments folder, and attaches it with the specified entity",
    tag="add",
    body={"application/json": WrittenAttachmentForEntity},
)
async def saveImage(request: Request) -> HTTPResponse:
    attachment = WrittenAttachmentForEntity.model_validate(request.json)
    record = await StaticBase.create(**attachment.model_dump())
    file_name = f"{record.attachmentID}.{record.type.lower()}"
    record.value = file_name
    await record.save()
    # we can save the file in this request itself, but no. we let the framework's custom reporter cook.
    return text(
        str(
            attachment_folder(db_path())
            / get_test_id()
            / str(attachment.entity_id)
            / file_name
        ),
        status=201,
    )
