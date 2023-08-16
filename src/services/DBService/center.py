from src.services.DBService.models.result_base import SessionBase, understand_js_date, SuiteBase
from src.services.DBService.models.types import RegistersSession, RegisterSuite
from src.services.DBService.models.enums import Status, SuiteType
from src.services.SchedularService.center import schedule_update_suite
from sanic.request import Request
from sanic.blueprints import Blueprint
from sanic.response import HTTPResponse, text
from typing import Literal

service = Blueprint("DBService", url_prefix="/save")


@service.put("/registerSession")
async def register_session(request: Request) -> HTTPResponse:
    session: RegistersSession = request.json

    session["startDate"] = understand_js_date(session["startDate"])
    if session.get("endDate", ""):
        session["endDate"] = understand_js_date(session["endDate"])

    created, _ = await SessionBase.update_or_create(**session)
    await created.save()
    return text(f"Registered Session: {created.sessionID}", status=201)


@service.put("/registerSuite")
async def register_suite(request: Request) -> HTTPResponse:
    resp: RegisterSuite = request.json
    resp["tags"] = ",".join(resp.get("tags", []))
    resp["suiteType"] = resp.get("suiteType", SuiteType.SUITE)

    if await SuiteBase.exists(suiteID=resp["suiteID"], session_id=resp["session_id"]):
        return text(resp["startDate"] + " || Existing", status=208)

    resp["startDate"] = understand_js_date(resp["startDate"])

    if resp.get("endDate", ""):
        resp["endDate"] = understand_js_date(resp["endDate"])

    suite, _ = await SuiteBase.update_or_create(**resp)
    await suite.save()
    return text(f"Registered Suite: {suite.title} : {suite.suiteID}", status=201)


@service.put("/updateSuite")
async def updateSuite(request: Request):
    resp: RegisterSuite = request.json
    suite_id = resp["suiteID"]

    if not SuiteBase.exists(suiteID=suite_id):
        return text(resp["startDate"] + " || Not Found", status=404)

    suite = await SuiteBase.filter(suiteID=suite_id).first()
    resp["startDate"] = understand_js_date(resp["startDate"])
    resp["endDate"] = understand_js_date(resp["endDate"]) if resp["endDate"] else None

    if suite.suiteType == SuiteType.SUITE:
        resp["standing"] = Status.YET_TO_CALCULATE
    else:
        possible_fix = Literal["passed"] | Literal["skipped"] | Literal["failures"]
        key: possible_fix | None = "passed" if resp["standing"] == Status.PASSED else "failures" \
            if resp["standing"] == Status.FAILED else "skipped" if resp["standing"] == Status.SKIPPED else None
        if key:
            resp[key] = 1
            resp["tests"] = 1

    await suite.update_from_dict(resp)
    await suite.save()
    schedule_update_suite(suite.suiteID, suite.title)
    return text(f'Updated Suite: {suite.title} : {suite.suiteID}', status=201)


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
