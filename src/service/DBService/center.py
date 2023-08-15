from src.service.DBService.models.config_base import SessionBase, understand_js_date, SuiteBase, \
    SuiteType
from src.service.DBService.models.types import RegistersSession, RegisterSuite
from sanic.request import Request
from sanic.blueprints import Blueprint
from sanic.response import HTTPResponse, text
from sanic import Sanic
from asyncio.tasks import Task
from src.service.DBService.updateRecords import sample_await

service = Blueprint("DBService", url_prefix="/save")


@service.put("/registerSession")
async def register_session(request: Request) -> HTTPResponse:
    session: RegistersSession = request.json

    if await SessionBase.exists(sessionID=session["sessionID"]):
        return text(session["sessionID"] + " || Existing", status=208)

    session["startDate"] = understand_js_date(session["startDate"])
    if session.get("endDate", ""):
        session["endDate"] = understand_js_date(session["endDate"])

    created = await SessionBase.create(**session)
    await created.save()
    return text(created.sessionID + " || Registered", status=201)


@service.put("/registerSuite")
async def register_suite(request: Request) -> HTTPResponse:
    resp: RegisterSuite = request.json
    resp["tags"] = ",".join(resp.get("tags", []))
    resp["suiteType"] = resp.get("suiteType", SuiteType.SUITE)

    if await SuiteBase.exists(suiteID=resp["suiteID"], session_id=resp["session_id"]):
        # already exists
        return text(resp["startDate"] + " || Existing", status=208)

    resp["startDate"] = understand_js_date(resp["startDate"])

    if not await SessionBase.exists(sessionID=resp["session_id"]):
        # in fallback case, if the session was not registered
        await SessionBase.create(sessionID=resp["session_id"], startDate=resp["startDate"])
        # user should be careful reg. this, they must ensure session id is updated later

    if resp.get("endDate", ""):
        resp["endDate"] = understand_js_date(resp["endDate"])
    suite = await SuiteBase.create(**resp)
    await suite.save()
    return text(str(suite.startDate) + " || Registered", status=201)


@service.put("/updateSuite")
async def updateSuite(request: Request):
    resp: RegisterSuite = request.json
    suite_id = resp["suiteID"]

    if not SuiteBase.exists(suiteID=suite_id):
        return text(resp["startDate"] + " || Not Found", status=404)

    suite = await SuiteBase.filter(suiteID=suite_id).first()
    resp["startDate"] = understand_js_date(resp["startDate"])
    resp["endDate"] = understand_js_date(resp["endDate"]) if resp["endDate"] else None
    await suite.update_from_dict(resp)
    await suite.save()

    app: Sanic = request.app

    task: Task = app.add_task(sample_await(), name=suite_id)

    return text(str(suite.startDate) + " || Updated || Task Name: " + task.get_name(), status=201)


@service.put("/updateSession")
async def update_session(request: Request):
    resp: RegistersSession = request.json

    if not SessionBase.exists(sessionID=resp["sessionID"]):
        return text(resp["sessionID"] + " || Session not found", status=404)

    session = await SessionBase.filter(sessionID=resp["sessionID"]).first()
    resp["endDate"] = understand_js_date(resp["endDate"]) if resp["endDate"] else None
    await session.update_from_dict(resp)
    await session.save()
    return text(resp["sessionID"] + " || Session updated", status=201)
