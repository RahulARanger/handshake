from handshake.services.SchedularService.constants import (
    EXPORT_RUN_PAGE_FILE_NAME,
    EXPORT_PROJECTS_FILE_NAME,
    EXPORT_RUNS_PAGE_FILE_NAME,
    EXPORT_OVERVIEW_PAGE,
    EXPORT_ALL_SUITES,
    EXPORT_SUITE_PAGE_FILE_NAME,
    EXPORT_SUITE_TESTS_PAGE,
    EXPORT_TEST_ASSERTIONS,
    EXPORT_TEST_ENTITY_ATTACHMENTS,
    EXPORT_SUITE_RETRIED_MAP,
    exportAttachmentFolderName,
)
from handshake.Exporters.exporter import Exporter
from loguru import logger
from asyncio import gather, TaskGroup
from shutil import rmtree
from pathlib import Path
from json import dumps
from aiofiles.os import mkdir
from aiofiles import open


async def write_as_plain_string(path, string):
    async with open(path, "w") as file_pointer:
        await file_pointer.write(string)


class JsonExporter(Exporter):
    def __init__(self, db_path: Path, save_in: Path, dev_run: bool = False):
        super().__init__(dev_run)
        self.save_in = save_in / exportAttachmentFolderName
        self.db_path: Path = db_path

    def prepare(self):
        # we reset entire export folder
        if self.save_in.exists():
            logger.debug("removing previous results")
            rmtree(self.save_in)

        self.save_in.parent.mkdir(exist_ok=True)
        self.save_in.mkdir(exist_ok=False)

    def completed(self):
        logger.info("Export Completed, saved in {}", self.save_in)

    async def export_test_run_summary(self, test_id: str, summary):
        await mkdir(self.save_in / str(test_id))
        await write_as_plain_string(
            self.save_in / str(test_id) / EXPORT_RUN_PAGE_FILE_NAME,
            dumps(summary),
        )

    async def export_project_summary(self, run_feed, projects_feed):
        return gather(
            write_as_plain_string(
                self.save_in / EXPORT_RUNS_PAGE_FILE_NAME,
                dumps(run_feed),
            ),
            write_as_plain_string(
                self.save_in / EXPORT_PROJECTS_FILE_NAME,
                dumps(projects_feed),
            ),
        )

    async def export_overview_of_test_run(self, run_id, summary):
        await write_as_plain_string(
            self.save_in / run_id / EXPORT_OVERVIEW_PAGE,
            dumps(summary),
        )

    async def export_all_suites_of_test_run(self, run_id: str, all_suites):
        async with TaskGroup() as prep:
            for suite in all_suites:
                suite_id = suite["suiteID"]
                await mkdir(self.save_in / run_id / suite_id)

                prep.create_task(
                    write_as_plain_string(
                        self.save_in / run_id / suite_id / EXPORT_SUITE_PAGE_FILE_NAME,
                        dumps(suite),
                    )
                )

        await write_as_plain_string(
            self.save_in / run_id / EXPORT_ALL_SUITES, dumps(all_suites)
        )

    async def export_tests(self, run_id, suite_id, tests):
        await write_as_plain_string(
            self.save_in / run_id / suite_id / EXPORT_SUITE_TESTS_PAGE,
            dumps(tests),
        )

    async def export_attachments(
        self, run_id, suite_id, assertion_records, written_records
    ):
        return gather(
            write_as_plain_string(
                self.save_in / run_id / suite_id / EXPORT_TEST_ENTITY_ATTACHMENTS,
                dumps(dict(written=written_records)),
            ),
            write_as_plain_string(
                self.save_in / run_id / suite_id / EXPORT_TEST_ASSERTIONS,
                dumps(assertion_records),
            ),
        )

    async def export_retries_map(self, run_id, suite_id, retried_map):
        await write_as_plain_string(
            self.save_in / run_id / suite_id / EXPORT_SUITE_RETRIED_MAP,
            dumps(retried_map),
        )
