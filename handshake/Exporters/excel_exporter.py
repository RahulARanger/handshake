from typing import Optional
from handshake.services.SchedularService.constants import exportExportFileName, JobType
from handshake.services.SchedularService.register import warn_about_test_run
from handshake.services.DBService.models.dynamic_base import TaskBase
from handshake.Exporters.exporter import Exporter
from handshake.services.DBService.lifecycle import attachment_folder
from loguru import logger
from asyncio import gather, TaskGroup
from json import loads
from pathlib import Path
from aiofiles.os import mkdir
from datetime import datetime

try:
    from openpyxl import load_workbook, Workbook
    from openpyxl.worksheet.worksheet import Worksheet
    from openpyxl.comments.comments import Comment

    excel_export = True
except ImportError:
    excel_export = False


def save_datetime_in_excel(obj: datetime):
    return obj.strftime("%Y-%m-%d %H:%M:%S")


class ExcelExporter(Exporter):
    template: Workbook

    def __init__(self, db_path: Path, dev_run: bool = False):
        super().__init__(dev_run)
        self.save_in = attachment_folder(db_path)

    def prepare(self):
        self.template = load_workbook(Path(__file__).parent / "Template.xlsx")

    async def start_exporting(
        self, run_id: Optional[str] = None, skip_project_summary: bool = False
    ):
        if not excel_export:
            return logger.error(
                "Please install excel exporter using"
                " pip install handshake[excel-export] or poetry add handshake[excel-export]"
            )
        task = await TaskBase.filter(type=JobType.EXPORT_EXCEL, test_id=run_id).first()
        try:
            await super().start_exporting(run_id, True)
        except Exception as error:
            logger.exception("Failed to export this test run in excel due to {}", error)
            await warn_about_test_run(
                run_id,
                "Failed to export this test run in excel",
                error=repr(error),
                task=task.ticketID,
                type=task.type,
            )
            task.processed = True
            await task.save()
            return

        self.save_in.mkdir(exist_ok=True)
        if not run_id:
            return

        not (self.save_in / str(run_id)).exists() and await mkdir(
            self.save_in / str(run_id)
        )
        self.template.save(self.save_in / str(run_id) / exportExportFileName)

        task.processed = True
        task.picked = False
        await task.save()

    async def export_test_run_summary(self, test_id: str, summary):
        index_sheet = self.template.get_sheet_by_name("Index")
        reference_sheet = self.template.get_sheet_by_name("Reference")

        start_from_row = 6
        detail_col = 7

        suite_summary = loads(summary["suiteSummary"])

        edit_cell(index_sheet, start_from_row, detail_col, summary["projectName"], True)
        edit_cell(
            index_sheet,
            start_from_row + 1,
            detail_col,
            summary["standing"].lower().capitalize(),
            True,
        ).comment = Comment(
            f"Run Status: {summary['status'].lower().capitalize()}\n"
            f"Exit Code: {summary['exitCode']}",
            summary["framework"],
        )
        edit_cell(reference_sheet, 3, 3, summary["duration"] / 1000)

        edit_cell(index_sheet, start_from_row + 3, detail_col, suite_summary["count"])
        edit_cell(index_sheet, start_from_row + 4, detail_col, summary["tests"])

        edit_cell(
            index_sheet,
            start_from_row + 5,
            detail_col,
            suite_summary["passed"] / suite_summary["count"],
        )
        edit_cell(
            index_sheet,
            start_from_row + 6,
            detail_col,
            summary["passed"] / summary["tests"],
        )

        edit_cell(
            index_sheet, start_from_row + 8, detail_col, summary["platform"], True
        )
        edit_cell(index_sheet, start_from_row + 9, detail_col, summary["framework"])

        edit_cell(
            index_sheet,
            start_from_row + 12,
            detail_col,
            save_datetime_in_excel(datetime.fromisoformat(summary["started"])),
        )
        edit_cell(
            index_sheet,
            start_from_row + 13,
            detail_col,
            save_datetime_in_excel(datetime.fromisoformat(summary["ended"])),
        )
        edit_cell(
            index_sheet,
            start_from_row + 14,
            detail_col,
            save_datetime_in_excel(datetime.now()),
            resize=True,
        )

    async def export_run_page(self, run_id: str, skip_recent_suites: bool = False):
        await super().export_run_page(run_id, True)

    async def export_project_summary(self, run_feed, projects_feed): ...

    async def export_overview_of_test_run(self, run_id: str, summary):
        index_sheet = self.template.get_sheet_by_name("Index")

        start_from_row = 6
        detail_col = 7

        edit_cell(
            index_sheet, start_from_row + 7, detail_col, summary["aggregated"]["files"]
        )

    async def export_all_suites_of_test_run(self, run_id, all_suites): ...

    async def export_retries_map(self, run_id, suite_id, retried_map): ...

    async def export_suite(self, run_id: str, suite_id: str): ...

    async def export_attachments(
        self, run_id, suite_id, assertion_records, written_records
    ): ...

    async def export_tests(self, run_id, suite_id, tests): ...

    async def export_all_suites(self, run_id: str): ...

    async def export_overview_page(
        self, run_id: str, skip_recent_suites: bool = False
    ): ...


def edit_cell(
    sheet: Worksheet, row: int, col: int, value: str, resize: Optional[bool] = False
):
    cell = sheet.cell(row, col)
    cell.value = value
    if not value:
        print(row, col, value)
    if value and resize:
        sheet.column_dimensions[cell.column_letter].width = max(
            sheet.column_dimensions[cell.column_letter].width, len(value)
        )
    return cell
