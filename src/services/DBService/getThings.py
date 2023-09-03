from uuid import UUID
from sanic import HTTPResponse
from src.services.DBService.models.result_base import SuiteBase, RunBase, RunBasePydanticModel, \
    SuiteBasePydanticModel
from sanic.request import Request
from sanic.blueprints import Blueprint
from sanic.response import json, JSONResponse, text
from tortoise.functions import Max, Sum
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
async def get_test_runs(_: Request) -> JSONResponse:
    return JSONResponse(
        list(map(lambda mapped: str(mapped.get('testID', False)), await RunBase.all().values("testID"))))


@get_service.get("/run")
async def get_run_details(request: Request) -> HTTPResponse | JSONResponse:
    test_id = request.args.get("test_id")
    run = await RunBase.filter(testID=test_id).first()
    if not run:
        return text("Not Found", status=404)

    return text((await RunBasePydanticModel.from_tortoise_orm(run)).model_dump_json())


@get_service.get("/suites")
async def get_all_suites(request: Request) -> JSONResponse:
    test_id = request.args.get('test_id')
    suites = await SuiteBase.filter(session__test_id=test_id, suiteType=SuiteType.SUITE)

    return JSONResponse(list(map(lambda suite: dict(
        started=suite.started.isoformat(),
        ended=suite.ended if not suite.ended else suite.ended.isoformat(),
        passed=suite.passed,
        failed=suite.failed,
        skipped=suite.skipped,
        duration=suite.duration,
        retried=suite.retried,
        standing=suite.standing,
        title=suite.title,
        tests=suite.tests
    ), suites)))


@get_service.get("/test-run-summary")
async def summary(request: Request) -> JSONResponse:
    run = await RunBase.filter(testID=request.args.get("test_id")).first()
    return json(dict(
        TESTS=dict(
            tests=run.tests,
            passed=run.passed,
            failed=run.failed,
            skipped=run.skipped
        ),
        SUITES=run.suiteSummary,
        RETRIED=run.retried
    ))
