from handshake.services.DBService.models.result_base import SuiteBase, RunBase
from docx import Document
from docx.shared import Cm
from asyncio import gather
from pathlib import Path
from handshake.services.DBService.models.result_base import RunBase
from docx.enum.text import WD_ALIGN_PARAGRAPH


class ExportDocx:
    test_record: RunBase

    def __init__(self, test_id: str, out: str):
        self.test_id = test_id
        self.document = Document()
        self.out = Path(out)

    async def start(self):
        self.test_record = await RunBase.filter(testID=self.test_id).first()
        if not self.test_record:
            return

        self.write_start_page()
        
        self.save_file()

    def write_start_page(self):
        header = self.document.add_heading(self.test_record.projectName, 0)
        header.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
        
    def save_file(self):
        self.document.save(str(self.out / "test.docx"))
