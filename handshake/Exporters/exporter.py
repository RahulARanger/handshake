from ansitohtml.parser import Parser
from loguru import logger
from typing import Optional
from abc import ABC, abstractmethod
from handshake.services.DBService.models.attachmentBase import AssertBase
from handshake.services.DBService.models.result_base import (
    SuiteBase,
    SuiteType,
    SessionBase,
)
from handshake.services.DBService.models.static_base import StaticBase
from handshake.services.SchedularService.refer_types import (
    SubSetOfRunBaseRequiredForProjectExport,
)
from handshake.services.SchedularService.constants import JobType, exportExportFileName
from asyncio import TaskGroup
from tortoise import BaseDBAsyncClient
from tortoise.connection import connections
from tortoise.expressions import Q, RawSQL
from asyncio import gather


class Exporter(ABC):
    connection: BaseDBAsyncClient

    def __init__(
        self,
        dev_run: bool = False,
    ):
        self.converter = Parser()
        self.dev_run = dev_run
        self.export_mode = dict(json=False, excel=False)

    def convert_from_ansi_to_html(self, refer_from: dict, key: str):
        refer_from[key] = self.converter.parse(refer_from[key])

    async def start_exporting(
        self,
        run_id: Optional[str] = None,
        skip_project_summary: bool = False,
        skip_prep: bool = False,
    ):
        self.connection: BaseDBAsyncClient = connections.get("default")
        if not skip_prep:
            self.prepare()
        await self.export_runs_page(run_id, skip_project_summary)
        self.completed()

    @abstractmethod
    def completed(self): ...

    @abstractmethod
    def prepare(self): ...

    async def export_runs_page(
        self, run_id: Optional[str] = None, skip_project_summary=False
    ):
        logger.debug("Exporting Runs Page...")
        path = (
            f"'/api/Attachments/' || rb.testID || '/{exportExportFileName}'"
            if self.dev_run
            else f"'/Attachments/' || rb.testID || '/{exportExportFileName}'"
        )
        extra_join_query = f"and rb.testID = '{run_id}'" if run_id else ""

        async with TaskGroup() as exporter:
            runs = []
            projects = {}

            for row in (
                await self.connection.execute_query(
                    f"""
select rb.*, cb.*,
rank() over (order by rb.ended desc) as timelineIndex,
rank() over (partition by projectName order by rb.ended desc) as projectIndex,
IIF(tb.type <> '', {path}, '') as excelExport
from RUNBASE rb
join testconfigbase cb 
on rb.testID = cb.test_id {extra_join_query}
left join taskbase tb
on tb.test_id = rb.testID and tb.type = '{JobType.EXPORT_EXCEL}'
WHERE rb.ended <> '' order by rb.started;
-- note for: projectIndex and timelineIndex, latest -> oldest => 0 - ...
    """
                )
            )[-1]:
                run = dict(row)
                test_run = SubSetOfRunBaseRequiredForProjectExport.model_validate(run)
                runs.append(run)

                logger.info(
                    "Exporting runs page for {} - {}",
                    test_run.projectName,
                    test_run.testID,
                )

                exporter.create_task(
                    self.export_test_run_summary(test_run.testID, run),
                    name=f"export-test-run-summary-{test_run.testID}",
                )

                if not skip_project_summary:
                    projects[test_run.projectName] = projects.get(
                        test_run.projectName, []
                    )
                    projects[test_run.projectName].append(
                        dict(
                            testID=test_run.testID,
                            passed=test_run.passed,
                            failed=test_run.failed,
                            skipped=test_run.skipped,
                            xfailed=test_run.xfailed,
                            xpassed=test_run.xpassed,
                            tests=test_run.tests,
                            passedSuites=test_run.passedSuites,
                            failedSuites=test_run.failedSuites,
                            skippedSuites=test_run.skippedSuites,
                            xfailedSuites=test_run.xfailedSuites,
                            xpassedSuites=test_run.xpassedSuites,
                            suites=test_run.suites,
                            duration=test_run.duration,
                        )
                    )

                exporter.create_task(
                    self.export_run_page(test_run.testID),
                    name="export-more-for-run-page",
                )

            if not skip_project_summary:
                exporter.create_task(
                    self.export_project_summary(runs, projects),
                    name="export-project-summary",
                )

            logger.info("Exported Runs Page!")

    @abstractmethod
    def export_test_run_summary(self, testID: str, results): ...

    async def export_run_page(self, run_id: str, skip_recent_suites: bool = False):
        await gather(
            self.export_overview_page(run_id, skip_recent_suites),
            self.export_all_suites(run_id),
        )

    @abstractmethod
    async def export_project_summary(self, run_feed, projects_feed): ...

    async def export_overview_page(self, run_id: str, skip_recent_suites: bool = False):
        if not skip_recent_suites:
            recent_suites = await (
                SuiteBase.filter(
                    Q(session__test_id=run_id) & Q(suiteType=SuiteType.SUITE)
                )
                .order_by("-started")
                .limit(6)
                .annotate(
                    # numberOfErrors=RawSQL("json_array_length(errors)"),
                    id=RawSQL("suiteID"),
                    s=RawSQL("suitebase.started"),
                )
                .values(
                    "title",
                    "passed",
                    "failed",
                    "skipped",
                    "xfailed",
                    "xpassed",
                    "duration",
                    suiteID="id",
                    started="s",
                )
            )
        else:
            recent_suites = []

        aggregated = (
            await SuiteBase.filter(session__test_id=run_id)
            .annotate(
                sessions=RawSQL("count(DISTINCT session_id)"),
                files=RawSQL("count(DISTINCT file)"),
            )
            .only("sessions", "files")
            .first()
            .values("sessions", "files")
        )

        platforms = (
            await SessionBase.filter(test_id=run_id)
            .only("entityName", "entityVersion", "simplified")
            .distinct()
            .values("entityName", "entityVersion", "simplified")
        )

        await self.export_overview_of_test_run(
            run_id,
            dict(
                recentSuites=recent_suites,
                aggregated=aggregated,
                platforms=platforms,
            ),
        ),

    @abstractmethod
    async def export_overview_of_test_run(self, run_id: str, summary): ...

    async def export_all_suites(self, run_id: str, export_suite_wise: bool = True):
        all_suites = await (
            SuiteBase.filter(Q(session__test_id=run_id) & Q(suiteType=SuiteType.SUITE))
            .order_by("started")
            .prefetch_related("rollup")
            .annotate(
                numberOfErrors=RawSQL("json_array_length(errors)"),
                id=RawSQL("suiteID"),
                p_id=RawSQL("parent"),
                aliasID=RawSQL(
                    "substr(suitebase.suiteID, 0, instr(suitebase.suiteID, '-'))"
                ),
                s=RawSQL("suitebase.started"),
                e=RawSQL("suitebase.ended"),
                error=RawSQL("errors ->> '[0]'"),
                total_duration=RawSQL(
                    "suitebase.duration + suitebase.setup_duration + suitebase.teardown_duration"
                ),
                parent_title=RawSQL(
                    "(select sb.title from suitebase sb where sb.suiteID = suitebase.parent)"
                ),
                nextSuite=RawSQL(
                    "(select suiteID from suitebase sb where sb.parent = suitebase.parent"
                    " and sb.session_id = suitebase.session_id and suitebase.started <= sb.started"
                    " and sb.suiteID <> suitebase.suiteID"
                    " order by sb.started limit 1)"
                ),
                prevSuite=RawSQL(
                    "(select suiteID from suitebase sb where sb.parent = suitebase.parent and sb.suiteType = 'SUITE'"
                    " and sb.session_id = suitebase.session_id and suitebase.started >= sb.started"
                    " and sb.suiteID <> suitebase.suiteID"
                    " order by sb.started limit 1)"
                ),
                hasChildSuite=RawSQL(
                    "(select count(*) from suitebase sb where sb.parent=suitebase.suiteID and sb.suiteType = 'SUITE'"
                    " and sb.suiteType='SUITE' LIMIT 1)"
                ),
            )
            .values(
                "title",
                "passed",
                "failed",
                "xpassed",
                "xfailed",
                "aliasID",
                "standing",
                "tests",
                "skipped",
                "duration",
                "file",
                "retried",
                "tags",
                "description",
                "errors",
                "error",
                "numberOfErrors",
                "hasChildSuite",
                "nextSuite",
                "prevSuite",
                "retried_later",
                "setup_duration",
                "teardown_duration",
                "total_duration",
                "parent_title",
                suiteID="id",
                parent="p_id",
                started="s",
                ended="e",
                entityName="session__entityName",
                entityVersion="session__entityVersion",
                hooks="session__hooks",
                simplified="session__simplified",
                rollup_passed="rollup__passed",
                rollup_failed="rollup__failed",
                rollup_skipped="rollup__skipped",
                rollup_xpassed="rollup__xpassed",
                rollup_xfailed="rollup__xfailed",
                rollup_tests="rollup__tests",
            )
        )
        # keep here as we would need to create directory first for the suite
        await self.export_all_suites_of_test_run(
            run_id,
            all_suites,
        )
        if export_suite_wise:
            await gather(
                *[
                    self.export_suite(run_id, str(suite))
                    for suite in await SuiteBase.filter(
                        Q(session__test_id=run_id) & Q(suiteType=SuiteType.SUITE)
                    ).values_list("suiteID", flat=True)
                ],
            )
        else:
            await self.export_suite(run_id)

    @abstractmethod
    async def export_all_suites_of_test_run(self, run_id, all_suites): ...

    @staticmethod
    def export_test_query(based_on: str):
        return (
            SuiteBase.filter(Q(parent=based_on)),
            AssertBase.filter(entity__parent=based_on),
            StaticBase.filter(entity__parent=based_on),
        )

    async def export_suite(self, run_id: str, suite_id: Optional[str] = None):
        test_query, assertion_query, attachment_query = self.export_test_query(
            suite_id if suite_id else run_id
        )
        tests = await (
            test_query.order_by("-suiteType", "started")
            .prefetch_related("rollup")
            .annotate(
                aliasID=RawSQL(
                    "substr(suitebase.suiteID, 0, instr(suitebase.suiteID, '-'))"
                ),
                numberOfErrors=RawSQL("json_array_length(errors)"),
                id=RawSQL("suiteID"),
                s=RawSQL("suitebase.started"),
                total_duration=RawSQL(
                    "suitebase.duration + suitebase.setup_duration + suitebase.teardown_duration"
                ),
                parent_title=RawSQL(
                    "(select sb.title from suitebase sb where sb.suiteID = suitebase.parent)"
                ),
                e=RawSQL("suitebase.ended"),
                error=RawSQL("errors ->> '[0]'"),
                assertions=RawSQL(
                    "(select count(ab.entity_id) from assertbase ab where ab.entity_id=suitebase.suiteID)"
                ),
            )
            .values(
                "title",
                "aliasID",
                "standing",
                "assertions",
                "duration",
                "file",
                "retried",
                "tags",
                "suiteType",
                "description",
                "errors",
                "error",
                "numberOfErrors",
                "retried_later",
                "setup_duration",
                "teardown_duration",
                "total_duration",
                "parent",
                "parent_title",
                suiteID="id",
                started="s",
                ended="e",
                hooks="session__hooks",
                rollup_passed="rollup__passed",
                rollup_failed="rollup__failed",
                rollup_skipped="rollup__skipped",
                rollup_tests="rollup__tests",
                rollup_xpassed="rollup__xpassed",
                rollup_xfailed="rollup__xfailed",
            )
        )

        assertions = (
            await assertion_query.annotate(
                id=RawSQL("entity_id"),
                raw=RawSQL("message"),
                aliasID=RawSQL(
                    "substr(assertbase.entity_id, 0, instr(assertbase.entity_id, '-'))"
                ),
            )
            .all()
            .values(
                "title",
                "message",
                "raw",
                "interval",
                "passed",
                "wait",
                "aliasID",
                entity_id="id",
            )
        )

        written_records = {}
        # TODO: Export Attachments to excel
        assertion_records = {}
        written = (
            await attachment_query.annotate(
                id=RawSQL("entity_id"),
                file=RawSQL("value"),
                url=RawSQL(
                    f"'/api/Attachments' || '/{run_id}/' || entity_id || '/' || value"
                    if self.dev_run
                    else f"'/Attachments' || '/{run_id}/' || entity_id || '/' || value"
                ),
            )
            .all()
            .values("type", "title", "description", "file", "url", entity_id="id")
        )

        for refer_from, save_in, for_records in zip(
            (written, assertions),
            (written_records, assertion_records),
            ("written", "assertions"),
        ):
            for record in refer_from:
                records = save_in.get(record["entity_id"], [])
                records.append(record)
                if for_records == "assertions":
                    self.convert_from_ansi_to_html(record, "message")
                save_in[record["entity_id"]] = records

        retried_map = {}

        _, rows = await connections.get("default").execute_query(
            "select key, value as suite, rb.tests, length, suite_id"
            " from retriedbase rb join json_each(rb.tests)"
            " join suitebase sb on suite = sb.suiteID"
            " join sessionbase ssb on ssb.sessionID = sb.session_id"
            " where ssb.test_id = ?",
            (run_id,),
        )

        for row in rows:
            retried_map[row["suite"]] = dict(row)

        await gather(
            self.export_tests(run_id, suite_id, tests),
            self.export_attachments(
                run_id, suite_id, assertion_records, written_records
            ),
            self.export_retries_map(run_id, suite_id, retried_map),
        )

    @abstractmethod
    def export_tests(self, run_id, suite_id, tests): ...

    @abstractmethod
    def export_attachments(
        self, run_id, suite_id, assertion_records, written_records
    ): ...

    @abstractmethod
    def export_retries_map(self, run_id, suite_id, retried_map): ...
