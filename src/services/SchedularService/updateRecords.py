from src.services.DBService.models.result_base import SuiteBase
from src.services.DBService.models.types import Status


async def modify_suite(suiteID: str):
    suite = await SuiteBase.filter(suiteID=suiteID).first()
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


async def pending_tasks():
    return await SuiteBase.filter(standing=Status.YET_TO_CALCULATE).count()
