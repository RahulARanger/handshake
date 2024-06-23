from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from tortoise import run_async
from handshake.services.DBService.lifecycle import (
    init_tortoise_orm,
    db_path,
    attachment_folder,
)
from handshake.services.DBService.migrator import migration
from loguru import logger
from shutil import unpack_archive, copytree, copyfile
from tempfile import TemporaryDirectory
from sqlite3 import connect
from typing import Tuple


class Merger:
    def __init__(self, output_folder):
        output_folder = output_folder
        self.output_db_path = db_path(output_folder)

        set_default_first = not Path(output_folder).exists()
        if set_default_first:
            Path(output_folder).mkdir(exist_ok=True)

        run_async(init_tortoise_orm(self.output_db_path, True, close_it=True))

    def start(self, to_merge: Tuple[str]):
        with ThreadPoolExecutor(max_workers=6) as merger:
            for collection in to_merge:
                merger.submit(self.merge_with, Path(collection), merger)

    def merge_with(self, zipped_results: Path, executor: ThreadPoolExecutor):
        logger.info("merging {}", zipped_results)
        with TemporaryDirectory() as temp_results:
            logger.debug("unpacking {} into {}", zipped_results, temp_results)
            unpack_archive(zipped_results, temp_results, "bztar")

            logger.debug("migrating {}", db_path(temp_results))
            migration(db_path(temp_results))

            logger.debug(
                "merging {} into {}", db_path(temp_results), self.output_db_path
            )
            try:
                self.merge(db_path(temp_results))
            except Exception as error:
                logger.exception(
                    "Failed to merge {} with {}. due to {}",
                    zipped_results.stem,
                    self.output_db_path,
                    repr(error),
                )
                return

            dest = attachment_folder(self.output_db_path)
            for test_run in attachment_folder(db_path(temp_results)).iterdir():
                if test_run.is_dir():
                    executor.submit(copytree, test_run, dest)
                else:
                    executor.submit(copyfile, test_run, dest)

            logger.info("Merged {} with {}", zipped_results.stem, self.output_db_path)

        logger.info("Merge Completed Successfully.")

    def merge(self, child_path):
        with connect(self.output_db_path) as connection:
            connection.execute("ATTACH ? as dba", (str(child_path.absolute()),))
            connection.execute("BEGIN")
            logger.debug("Appending records")
            for row in connection.execute(
                "SELECT * FROM dba.sqlite_master WHERE type='table'"
            ):
                if row[1] == "configbase":
                    continue
                combine = "INSERT INTO " + row[1] + " SELECT * FROM dba." + row[1]
                logger.debug("Executed, {} on {}", combine, child_path.parent.name)
                connection.execute(combine)
            connection.commit()
            connection.execute("detach database dba")
