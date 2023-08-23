import datetime
from uuid import UUID
from src.services.DBService.models.result_base import SessionBase, SuiteBase, RunBase
from sanic.request import Request
from sanic.blueprints import Blueprint
from sanic.response import json, JSONResponse, text
from tortoise.functions import Max
from src.services.DBService.models.types import SuiteType

get_service = Blueprint("GetService", url_prefix="/get")


@get_service.get("/latest-run-id")
async def get_latest_run(_: Request):
    recent_record = await RunBase.annotate(recent_record=Max("ended")).first()
    if recent_record:
        to_send: UUID = recent_record.testID
        return text(str(to_send), status=200)
    else:
        return text("No Recent Runs found", status=404)


@get_service.get("/runs")
async def get_test_runs(_: Request):
    return JSONResponse(list(map(lambda mapped: str(mapped.get('testID', False)), await RunBase.all().values("testID"))))


@get_service.get("/run")
async def get_run_details(request: Request):
    test_id = request.args.get("test_id")
    run = await RunBase.filter(testID=test_id).first()
    if not run:
        return text("Not Found", status=404)
    return JSONResponse(
        dict(
            projectName=run.projectName,
            testID=str(run.testID),
            standing=run.standing,
            passed=run.passed,
            failed=run.failures,
            skipped=run.skipped,
            tests=run.tests,
            duration=run.duration,
            label=run.collectionName,
            framework=run.framework,
            started=run.started.isoformat(),
            ended=run.ended if not run.ended else run.ended.isoformat(),
            retried=run.retried,
            instances=run.instances,
            logLevel=run.logLevel,
            tags=run.tags,
            suitesConfig=run.suitesConfig,
            specs=run.specs
        )
    )


@get_service.get("/suites")
async def get_all_suites(request: Request):
    test_id = request.args.get('test_id')
    suites = await SuiteBase.filter(session__test_id=test_id, suiteType=SuiteType.SUITE).all()

    return JSONResponse(list(map(lambda suite: dict(
        suiteID=suite.suiteID,
        started=suite.started.isoformat(),
        ended=suite.ended if not suite.ended else suite.ended.isoformat(),
        passed=suite.passed,
        failed=suite.failures,
        skipped=suite.skipped,
        duration=suite.duration,
        retried=suite.retried,
        standing=suite.standing,
        suitesConfig=suite.suitesConfig,
        title=suite.title,
        fullTitle=suite.fullTitle,
        tests=suite.tests
    ), suites)))
