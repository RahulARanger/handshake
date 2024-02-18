import typing
from sqlite3 import connect
from handshake.services.DBService import DB_VERSION
from handshake.services.DBService.models.enums import ConfigKeys
from sqlite3.dbapi2 import Connection
from typing import Optional, Tuple
from pathlib import Path
from loguru import logger


def check_version(
    path: Path = None, connection: Optional[Connection] = None
) -> Tuple[bool, Connection, bool, Optional[int]]:
    connection = connection if connection else connect(path)
    query = f"select value from configbase where key = '{ConfigKeys.version}'"
    result = connection.execute(query).fetchone()

    version_stored = False
    migration_required = False

    if not result:
        logger.warning(
            f"Could not find the version, Please raise this as an issue or re-run after deleting the folder at: {path}."
        )
    else:
        version_stored = result if not result else int(result[0])
        migration_required = version_stored != DB_VERSION

        logger.log(
            "INFO" if not migration_required else "WARNING",
            "Currently at: v{}."
            if not migration_required
            else 'Found version: v{}. but required is v{}. Please execute: \n"handshake migrate [COLLECTION_PATH]"',
            result[0],
            DB_VERSION,
        )
    return (
        migration_required,
        connection,
        version_stored < DB_VERSION,
        version_stored,
    )


# returns True if it requires further migration
def migrate(
    connection: Optional[Connection] = None, db_path: Optional[Path] = None
) -> typing.Tuple[bool, bool]:  # further migration required, migration was done
    if not connection:
        connection = connect(db_path)

    try:
        is_required, connection, bump_if_required, version_stored = check_version(
            connection=connection
        )

        if not is_required:
            logger.info("Already migrated to required version")
            return False, False

        if not bump_if_required:
            logger.error(
                "You have more recent version of database, v{}. but we can only support: v{}. "
                "Hence requesting you to update your reporter, to support this version.",
                # "use your backup database inside the collection_path.",
                version_stored,
                DB_VERSION,
            )
            return False, False

        script = Path(__file__).parent / "scripts" / f"bump-v{version_stored}.sql"
        logger.info("Executing {} to migrate from v{}", script.name, version_stored)
        connection.executescript(script.read_text())
    finally:
        if db_path:
            connection.commit()
            connection.close()

    return (version_stored + 1) < DB_VERSION, version_stored < DB_VERSION


def migration(path: Path):
    migration_was_conducted = False
    if not path.exists():
        logger.info("Migration check is not required, as the db does not exist.")
        return

    connection = connect(path)
    try:
        backup_file = "backup_results.db"

        while True:
            first_time = not migration_was_conducted
            further_required, migration_was_conducted = migrate(connection)
            if migration_was_conducted and first_time:
                backup_path = path.parent / backup_file
                backup_path.unlink(missing_ok=True)
                backup = connect(backup_path)
                logger.info(
                    "Before migration, Taking a backup and storing it in {}",
                    backup_path,
                )
                connection.backup(backup)
                backup.close()
            if not migration_was_conducted:
                migration_was_conducted = True
                break

        if migration_was_conducted:
            (path.parent / backup_file).unlink(missing_ok=True)
            connection.commit()
            logger.info("Migrated to latest version!")

    except Exception as error:
        logger.error(f"Failed to execute migration script, due to {error}")
        return True
    finally:
        connection.close()


if __name__ == "__main__":
    migration(Path.cwd().parent.parent.parent / "TestResults" / "TeStReSuLtS.db")
