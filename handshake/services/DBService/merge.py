from concurrent.futures import ThreadPoolExecutor, Future
from pathlib import Path
from tortoise import run_async
from tortoise.connection import connections
from handshake.services.DBService.lifecycle import (
    init_tortoise_orm,
    db_path,
    attachment_folder,
)
from handshake.services.DBService.migrator import migration
from loguru import logger
from shutil import unpack_archive, rmtree, move, copytree
from tempfile import mkdtemp
from typing import Tuple, List
from sqlite3.dbapi2 import Connection, connect


async def reset_sqlite_sequence(output_db_path):
    await init_tortoise_orm(
        output_db_path, True, init_script=True, close_it=True, avoid_config=True
    )
    connection = connections.get("default")
    await connection.execute_query("delete from sqlite_sequence")
    await connection.close()


def prep_minis(zipped_results: Path) -> Path:
    logger.debug("preparing a temp. copy of {}...", zipped_results.name)
    temp_folder = Path(mkdtemp(prefix="handshake-merge-"))
    is_zip = zipped_results.is_file()

    try:
        if is_zip:
            logger.debug("unpacking {} into {}", zipped_results, temp_folder)
            temp_folder /= zipped_results.name.split(".")[0]
            temp_folder.mkdir()
            unpack_archive(zipped_results, temp_folder, "bztar")
            logger.debug("checking for possible migration for {}", db_path(temp_folder))
            logger.debug("running migrator on {}", db_path(temp_folder))
        else:
            logger.debug("copying provided folder {} to a temp folder", zipped_results)
            temp_folder /= zipped_results.name
            copytree(zipped_results, temp_folder)
            logger.debug("{} is now copied to {}", zipped_results, temp_folder)
            logger.debug("running migrator on {}", db_path(temp_folder))
    except Exception as error:
        logger.warning("cleaning temp folders as it failed.")
        rmtree(temp_folder.parent)
        raise error

    migration(db_path(temp_folder))
    return temp_folder


class Merger:
    avoid_tables = {"configbase", "sqlite_sequence"}

    def __init__(self, output_folder):
        output_folder = output_folder
        self.output_db_path = db_path(output_folder)

        set_default_first = not Path(output_folder).exists()
        if set_default_first:
            Path(output_folder).mkdir(exist_ok=True)

        run_async(
            reset_sqlite_sequence(
                self.output_db_path,
            )
        )

    def start(self, to_merge: Tuple[str]):
        futures: List[Future[Path[str]]] = []
        with ThreadPoolExecutor(max_workers=6) as prep:
            for collection in to_merge:
                futures.append(prep.submit(prep_minis, Path(collection)))

        paths: List[Path[str]] = []

        for future in futures:
            has_failed = future.exception()
            if has_failed:
                logger.error(
                    "Failed to create temporary directory for merging refer to the error: {}. hence skipping",
                    has_failed,
                )
                continue

            path = future.result()
            paths.append(path)

        try:
            self.merge_internals(paths)

            dest = attachment_folder(self.output_db_path)

            with ThreadPoolExecutor(max_workers=6) as after_merge:
                logger.debug("moving static folders and files")
                for collection in paths:
                    for test_run in attachment_folder(
                        db_path(str(collection))
                    ).iterdir():
                        after_merge.submit(move, test_run, dest)

            logger.debug("done, cleaning temp folders...")

        finally:
            with ThreadPoolExecutor(max_workers=6) as cleaner:
                for collection in paths:
                    cleaner.submit(rmtree, collection.parent)
            logger.debug("temp folders have been removed successfully")
        logger.info("Merge Completed, saved to {}!", self.output_db_path.parent)

    def merge_internals(self, paths: List[Path]):
        with connect(self.output_db_path) as connection:
            connection.isolation_level = None
            for path in paths:
                self.merge_database(connection, db_path(path))

    def merge_database(self, connection: Connection, child_db_path: Path):
        connection.execute("ATTACH ? as dba", (str(child_db_path.absolute()),))
        connection.execute("BEGIN;")
        logger.debug("Appending records")

        try:
            self.merge_tables(connection, child_db_path)
        except Exception as error:
            logger.exception(
                "Failed to merge with {}. hence skipping it. due to {}",
                child_db_path.parent.name,
                repr(error),
            )
            connection.rollback()
        else:
            connection.commit()
            logger.debug(
                "Merged {} with output db successfully.",
                child_db_path.parent.name,
            )

        finally:
            connection.execute("detach dba;")

    def merge_tables(self, connection: Connection, child_path: Path):
        for row in connection.execute(
            "SELECT * FROM dba.sqlite_master WHERE type='table'"
        ):
            table_name = row[1]

            if table_name in self.avoid_tables:
                continue

            cols = set(
                [
                    _[0]
                    for _ in connection.execute(
                        f"SELECT name from PRAGMA_TABLE_INFO('{table_name}')"
                    )
                ]
            )

            if "id" in cols:
                cols.remove("id")

            joined_cols = ", ".join(cols)
            # join cols even if id is not in the cols, since migration scripts can rearrange
            # the order of the columns in the table
            combine = f"INSERT INTO {table_name}({joined_cols}) SELECT {joined_cols} FROM dba.{table_name}"

            logger.debug("Executed, {} on {}", combine, child_path.parent.name)
            connection.execute(combine)
