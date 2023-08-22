from src.services.DBService.models.result_base import SuiteBase, SessionBase, RunBase
from src.services.DBService.models.types import Status
from src.services.DBService.shared import get_test_id
from tortoise.expressions import Q
from tortoise.functions import Sum
from datetime import datetime
from functools import reduce


async def modify_suite(suiteID: str):
    suite = await SuiteBase.filter(suiteID=suiteID).first()
    print(f"FOUND -- {suite.suiteID} for {suite.title}")
    if suite.standing != Status.YET_TO_CALCULATE:
        return
    pending = await SuiteBase.filter(parent=suite.suiteID, standing=Status.PENDING).count()
    if pending:
        return

    failed = await SuiteBase.filter(parent=suite.suiteID, standing=Status.FAILED).count()
    passed = await SuiteBase.filter(parent=suite.suiteID, standing=Status.PASSED).count()
    skipped = await SuiteBase.filter(parent=suite.suiteID, standing=Status.SKIPPED).count()

    standing = Status.FAILED if failed > 0 else Status.PASSED if passed > 0 or skipped == 0 else Status.SKIPPED
    total = failed + skipped + passed
    await suite.update_from_dict(
        dict(standing=standing, passed=passed, skipped=skipped, failures=failed, tests=total)
    )
    await suite.save()


async def fix_old_records():
    test_id = get_test_id()
    pending_suites = await SuiteBase.filter(Q(standing=Status.YET_TO_CALCULATE) & ~Q(session__test_id=test_id)).all()
    for suite in pending_suites:
        print("FIXING - ", suite.suiteID, suite.title)
        await modify_suite(suite.suiteID)


async def pending_tasks():
    return await SuiteBase.filter(standing=Status.YET_TO_CALCULATE).count()


def fetch_status(entities_status: set):
    return Status.FAILED if Status.FAILED in entities_status else Status.PASSED if Status.PASSED in entities_status else Status.SKIPPED


async def complete_test_run():
    test_id = get_test_id()

    test_run = await RunBase.filter(testID=test_id).first()
    filtered = SessionBase.filter(test_id=test_id)

    summary = await filtered.annotate(
        total_passed=Sum("passed"),
        total_failed=Sum("failures"),
        total_skipped=Sum("skipped"),
        total_retried=Sum("retried"),
        total_tests=Sum("tests"),
        duration=Sum("duration"),
    ).first().values(
        "total_passed", "total_failed", "total_skipped", "total_retried", "total_tests", "duration"
    )

    overall_spec_files = reduce(
        lambda a, b: a + b,
        await filtered.all().values_list("specs", flat=True)
    )

    suites = reduce(
        lambda a, b:
        (list(a.keys()) if isinstance(a, dict) else []) + (list(b.keys()) if isinstance(b, dict) else []),
        await filtered.all().values_list('suitesConfig')
    )

    print(summary)

    await test_run.update_from_dict(dict(
        ended=datetime.utcnow(),
        tests=summary.get("total_tests", 0),
        passed=summary.get("total_passed", 0),
        failures=summary.get("total_failed", 0),
        skipped=summary.get("total_skipped", 0),
        duration=summary.get("duration", 0.0),
        retried=summary.get("total_retried", 0),
        specs=overall_spec_files,
        suitesConfig=suites,
        standing=fetch_status(set(await filtered.all().values_list('standing', flat=True)))
    ))
    await test_run.save()

    print("COMPLETED saving a test run")
