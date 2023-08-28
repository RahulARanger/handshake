from src.services.DBService.models.result_base import SessionBase, SuiteBase
from src.services.DBService.models.types import RegisterSession, RegisterSuite, MarkSuite, MarkSession
from src.services.DBService.models.enums import Status, SuiteType
from src.services.DBService.shared import get_test_id
from sanic.request import Request
from sanic.blueprints import Blueprint
from sanic.response import HTTPResponse, text

service = Blueprint("DBService", url_prefix="/save")


@service.put("/registerSession")
async def register_session(_: Request) -> HTTPResponse:
    session = RegisterSession.model_validate(_.json)
    created = await SessionBase.create(**session.model_dump(), test_id=get_test_id())
    await created.save()
    return text(f"Registered Session: {created.sessionID}", status=201)


@service.put("/registerSuite")
async def register_suite(_: Request) -> HTTPResponse:
    suite = RegisterSuite.model_validate(_.json)
    if await SuiteBase.exists(suiteID=suite.suiteID, session_id=suite.session_id):
        return text(suite.started.isoformat() + " || Existing", status=208)

    suite_record = await SuiteBase.create(**suite.model_dump())
    await suite_record.save()
    return text(
        f"Registered {suite_record.suiteType.capitalize()}: {suite_record.title} || {suite_record.suiteID}",
        status=201
    )


@service.put("/updateSuite")
async def updateSuite(_: Request) -> HTTPResponse:
    suite = MarkSuite.model_validate(_.json)

    suite_record = await SuiteBase.filter(suiteID=suite.suiteID).first()
    if not suite_record:
        return text(suite.suiteID + " || Not Found", status=404)

    if suite_record.suiteType == SuiteType.SUITE:
        suite.standing = Status.YET_TO_CALCULATE

    await suite_record.update_from_dict(suite.model_dump())
    await suite_record.save()

    return text(f'Updated Suite: {suite_record.title} || {suite_record.suiteID}', status=201)


@service.put("/updateSession")
async def update_session(_: Request) -> HTTPResponse:
    session = MarkSession.model_validate(_.json)
    test_session = await SessionBase.filter(sessionID=session.sessionID).first()
    if not test_session:
        return text(session.sessionID + " || Session not found", status=404)

    await test_session.update_from_dict(session.model_dump())
    await test_session.save()
    return text(session.sessionID + " || Session updated", status=201)


@service.put("/addMisc")
async def update_misc(request: Request):
    ...
