from src.services.DBService.models.config_base import SuiteBase, SessionBase
from src.services.DBService.models.types import Status


async def find_and_update_suites():
    first_record = await SuiteBase.filter(standing=Status.YET_TO_CALCULATE).order_by("-modified").first()
    if first_record:
        return await modify_suite(first_record)


async def modify_suite(first_record: SuiteBase):
    failed = await SuiteBase.filter(parent=first_record.suiteID, standing=Status.FAILED).count()
    passed = await SuiteBase.filter(parent=first_record.suiteID, standing=Status.PASSED).count()
    skipped = await SuiteBase.filter(parent=first_record.suiteID, standing=Status.SKIPPED).count()

    standing = Status.FAILED if failed > 0 else Status.PASSED if passed > 0 or skipped == 0 else Status.SKIPPED
    total = failed + skipped + passed

    await first_record.update_from_dict(
        dict(standing=standing, passed=passed, skipped=skipped, failures=failed, tests=total)
    )
    await first_record.save()
