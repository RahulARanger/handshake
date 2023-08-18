from src.services.DBService.models.result_base import SessionBase, understand_js_date, SuiteBase
from src.services.DBService.models.types import RegistersSession, RegisterSuite
from src.services.DBService.models.enums import Status, SuiteType
from src.services.SchedularService.center import schedule_update_suite
from src.services.DBService.shared import get_test_id
from sanic.request import Request
from sanic.blueprints import Blueprint
from sanic.response import HTTPResponse, text
from typing import Literal

service = Blueprint("DBService", url_prefix="/save")


@service.put("/registerSession")
async def register_session(request: Request) -> HTTPResponse:
    session: RegistersSession = request.json

    session["started"] = understand_js_date(session["started"])
    if session.get("ended", ""):
        session["ended"] = understand_js_date(session["ended"])

    created, _ = await SessionBase.update_or_create(**session, test_id=get_test_id())
    await created.save()
    return text(f"Registered Session: {created.sessionID}", status=201)


@service.put("/registerSuite")
async def register_suite(request: Request) -> HTTPResponse:
    resp: RegisterSuite = request.json
    resp["tags"] = ",".join(resp.get("tags", []))
    resp["suiteType"] = resp.get("suiteType", SuiteType.SUITE)

    if await SuiteBase.exists(suiteID=resp["suiteID"], session_id=resp["session_id"]):
        return text(resp["started"] + " || Existing", status=208)

    resp["started"] = understand_js_date(resp["started"])
    resp["tags"] = resp["tags"] if isinstance(resp["tags"], list) else [resp["tags"]]

    if resp.get("ended", ""):
        resp["ended"] = understand_js_date(resp["ended"])

    suite, _ = await SuiteBase.update_or_create(**resp)
    await suite.save()
    return text(f"Registered Suite: {suite.title} : {suite.suiteID}", status=201)


@service.put("/updateSuite")
async def updateSuite(request: Request):
    resp: RegisterSuite = request.json
    suite_id = resp["suiteID"]

    if not SuiteBase.exists(suiteID=suite_id):
        return text(resp["started"] + " || Not Found", status=404)

    suite = await SuiteBase.filter(suiteID=suite_id).first()
    resp["started"] = understand_js_date(resp["started"])
    resp["ended"] = understand_js_date(resp["ended"]) if resp.get("ended", False) else None

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
    job_id = schedule_update_suite(suite.suiteID, suite.title)
    return text(f'Updated Suite: {suite.title} : {suite.suiteID} || {job_id.name}', status=201)


@service.put("/updateSession")
async def update_session(request: Request):
    resp: RegistersSession = request.json

    if not SessionBase.exists(sessionID=resp["sessionID"]):
        return text(resp["sessionID"] + " || Session not found", status=404)

    session = await SessionBase.filter(sessionID=resp["sessionID"]).first()
    resp["ended"] = understand_js_date(resp["ended"]) if resp.get("ended", False) else None
    await session.update_from_dict(resp)
    await session.save()
    return text(resp["sessionID"] + " || Session updated", status=201)
