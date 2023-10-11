from sqlite3 import connect
from graspit.services.DBService import DB_VERSION
from graspit.services.DBService.migration import version_0_0_1
from pathlib import Path
from loguru import logger


def check_version(path: Path):
    connection = connect(path)
    query = "select value from configbase where key = 'VERSION'"

    result = connection.execute(query).fetchone()
    actual_version = DB_VERSION if result is None else result[0]
    return actual_version == DB_VERSION, actual_version, connection


def initiate_migration(path: Path):
    is_safe, actual_version, connection = check_version(path)
    if is_safe:
        return

    logger.warning(
        "Starting Migration as we found the version to be of {} but required is {}",
        actual_version,
        DB_VERSION,
    )

    while True:
        match actual_version:
            case "0.0.1":
                version_0_0_1(connection)
            case _:
                logger.error(
                    "Found the version: {} but this is not a valid version",
                    actual_version,
                )
