from sqlite3 import connect
from graspit.services.DBService import DB_VERSION
from sqlite3.dbapi2 import Connection
from typing import Optional, Tuple
from pathlib import Path
from loguru import logger


def check_version(
    path: Path, connection: Optional[Connection] = None
) -> Tuple[Optional[str], Connection]:
    connection = connection if connection else connect(path)
    query = "select value from configbase where key = 'VERSION'"

    result = connection.execute(query).fetchone()

    if not result:
        logger.warning(
            "Could not find the version, please either the delete the DB or raise an issue if required."
        )
    else:
        satisfied = int(result[0]) == DB_VERSION
        logger.log(
            "INFO" if satisfied else "WARNING",
            "Found version: v{} and required is v{}",
            result[0],
            DB_VERSION,
        )
        if not satisfied:
            logger.warning(
                "Requires migration, Please run 'graspit db-version migrate'"
            )
    return result[0] if result else result, connection


def initiate_migration(path: Path, aim=DB_VERSION):
    connection = connect(path)

    while True:
        _actual_version, _ = check_version(path, connection)
        if not _actual_version:
            return

        actual_version = int(_actual_version)
        if actual_version == aim:
            logger.info("Migration completed")
            break

        logger.warning(
            "Starting Migration as we found the version to be of v{} but required is v{}",
            actual_version,
            DB_VERSION,
        )
        new_version = actual_version + (-1 if aim < actual_version else 1)

        result = (
            revert(connection, new_version)
            if aim < actual_version
            else bump(connection, new_version)
        )
        if result:
            return

        connection.execute(
            "update configbase set value = ? where key = 'VERSION'", (new_version,)
        )
        connection.commit()

        logger.info(
            "Migration is successful from v{} to v{}", actual_version, new_version
        )

    connection.close()


# def revert(connection: Connection, new_version: int) -> bool:
#     match new_version:
#         case 1:
#             revert_v2(connection)
#
#         case _:
#             logger.error(
#                 "Could not revert, Found the version: v{} but this is not a valid version",
#                 new_version,
#             )
#             return True
#
#     return False
#
#
# def bump(connection: Connection, new_version: int) -> bool:
#     match new_version:
#         case 2:
#             v2(connection)
#
#         case _:
#             logger.error(
#                 "Could not bump version, Found the version: v{} but this is not a valid version",
#                 new_version,
#             )
#             return True
#     return False
