import datetime
from typing import Optional
from asyncio import gather
from handshake import __version__
from handshake.services.DBService.lifecycle import (
    handshake_meta,
    save_handshake_meta_dashboard,
    handshake_meta_dashboard,
    attachment_folder,
)
from handshake.services.SchedularService.constants import writtenAttachmentFolderName
from handshake.Exporters.json_exporter import JsonExporter
from shutil import rmtree, copytree
from loguru import logger
from pathlib import Path
from httpx import AsyncClient, RequestError, StreamError
from tarfile import open as t_open
from aiofiles import open as a_open
from click import progressbar


class HTMLExporter(JsonExporter):
    template: Path = Path(__file__).parent / "dashboard.tar.bz2"
    fetch: bool
    fetched: bool = False

    def __init__(self, db_path: Path, save_in: Path, dev_run: bool = False):
        super().__init__(db_path, save_in, dev_run)
        self.html_export_in = save_in

    def prepare(self):
        # we reset entire export folder
        if self.html_export_in.exists():
            logger.debug("removing previous results")
            rmtree(self.html_export_in)
        else:
            self.html_export_in.mkdir()

        self.fetch = not self.template.exists()
        super().prepare()

    async def start_exporting(
        self,
        run_id: Optional[str] = None,
        skip_project_summary: bool = False,
        skip_prepare: bool = False,
    ):
        self.prepare()
        await gather(
            self.prepare_download(),
            super().start_exporting(run_id, skip_project_summary, True),
        )

    async def prepare_download(self):
        meta = handshake_meta_dashboard()
        file_ready = False

        if not self.fetch:
            if not meta:
                self.fetch = True  # if the meta is not available, we fetch the file
            elif meta and meta.get("version", "") != __version__:
                self.fetch = True  # if the version is not matching, we fetch the file
            else:
                file_ready = True

        if self.fetch:
            file_ready = await self.download_zip()

        if file_ready:
            with t_open(self.template, "r:bz2") as tar_file:
                tar_file.extractall(self.html_export_in)

            logger.info(
                'HTML Report is available in {}, Please execute handshake display "{}" at {}',
                self.html_export_in,
                self.html_export_in.name,
                self.html_export_in.parent,
            )
        else:
            logger.warning(
                "HTML Export was faulted due to failure in downloading the zip file"
            )

    @staticmethod
    async def download_zip() -> bool:
        """
        Downloads a zip file from a given URL and saves it to the specified location.

        Returns:
        bool: True if the download is successful, False otherwise.
        """
        url = handshake_meta()["0"].get("browser_download_url", "")
        downloaded = False

        try:
            async with AsyncClient(follow_redirects=True) as client:
                async with client.stream("GET", url) as response:
                    with progressbar(
                        length=int(response.headers.get("Content-Length")),
                        label="Downloading Build",
                    ) as bar:
                        bar.length = 23
                        async with a_open(HTMLExporter.template, "wb") as file:
                            chunk_count = 1
                            async for chunk in response.aiter_bytes(chunk_size=1024):
                                bar.update(1024 * chunk_count)
                                chunk_count += 1
                                await file.write(chunk)

            downloaded = True

        except RequestError:
            logger.exception(
                "Failed to download from {}. due to the request error",
                url,
            )
        except StreamError:
            logger.exception(
                "Failed to download from {}. due to the stream error",
                url,
            )

        if downloaded:
            save_handshake_meta_dashboard(
                version=__version__,
                browser_download_url_for_dashboard=url,
                downloaded_dashboard_at=datetime.datetime.now().isoformat(),
            )

        return downloaded

    def completed(self):
        logger.info("Adding Attachments to the HTML Report.")
        copytree(
            attachment_folder(self.db_path),
            self.html_export_in / writtenAttachmentFolderName,
        )
        logger.info("Added Attachments to the HTML Report.")
