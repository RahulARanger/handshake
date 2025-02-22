import datetime
from sqlite3 import connect
from handshake.services.DBService import DB_VERSION, OLDEST_VERSION
from handshake.services.DBService.models.enums import ConfigKeys
from handshake.services.DBService.models.config_base import (
    MigrationStatus,
    MigrationTrigger,
)
from sqlite3.dbapi2 import Connection
from typing import Optional, Tuple, Union, Literal
from pathlib import Path
from loguru import logger


def log_migration(
    connection: Connection,
    from_version: int,
    to_version: int,
    trigger: MigrationTrigger,
    passed: bool,
    error: Optional[Exception] = None,
):
    connection.execute(
        "INSERT INTO migrationbase(fromVersion, toVersion, modified, trigger, status, error) VALUES(?,?,?,?,?,?)",
        (
            from_version,
            to_version,
            datetime.datetime.now(tz=datetime.UTC).isoformat(),
            trigger,
            MigrationStatus.PASSED if passed else MigrationStatus.FAILED,
            repr(error) if error else "",
        ),
    )


def check_version(
    connection: Optional[Connection] = None, path: Optional[Path] = None, is_auto=False
) -> Tuple[bool, bool, Union[Literal[False], int]]:
    query = f"select value from configbase where key = '{ConfigKeys.version}'"

    close_connection = not connection
    connection = connection if connection else connect(path)

    try:
        result = connection.execute(query).fetchone()
    finally:
        close_connection and connection.close()

    version_stored = False
    migration_required = False

    if not result:
        logger.warning(
            f"Could not find the version inside the configbase which is not expected!,"
            f" Please raise this as an issue."
        )
    else:
        version_stored = result if not result else int(result[0])
        migration_required = version_stored != DB_VERSION

        logger.log(
            "DEBUG" if not migration_required else "WARNING",
            (
                "Currently at: v{}."
                if not migration_required
                else "Found version: v{}. but required is v{}."
                + (
                    ""
                    if is_auto or version_stored > DB_VERSION
                    else ' Please execute: \n"handshake migrate [COLLECTION_PATH]"'
                )
            ),
            result[0],
            DB_VERSION,
        )
    return (
        migration_required,  # migration is required or now
        version_stored < DB_VERSION,  # bump version or not
        version_stored,  # what was the version stored?
    )


def migration(path: Path, trigger=MigrationTrigger.AUTOMATIC, do_once=False) -> bool:
    if not path.exists():
        logger.debug("Migration check is not required, as the db does not exist.")
        return False
    connection = connect(path)
    stored_version = False
    try:
        is_required, bump_required, stored_version = check_version(
            connection, is_auto=True
        )

        if not is_required:
            logger.debug("Already migrated to required version.")
            return False
        if not stored_version:
            return False
        if not bump_required:
            logger.error(
                "Found a version v{}. but we can migrate till v{}. "
                "Please check the python build version and accordingly "
                'execute: "handshake step-back [COLLECTION_PATH]"',
                stored_version,
                DB_VERSION,
            )
            return False

        for version_to_bump in range(stored_version, DB_VERSION):
            script = Path(__file__).parent / "scripts" / f"bump-v{version_to_bump}.sql"
            logger.info(
                "Executing {} to migrate from v{} to v{}",
                script.name,
                version_to_bump,
                version_to_bump + 1,
            )
            connection.executescript(script.read_text())
            if do_once:
                # this is only for testing purposes
                break
        to_version = (stored_version + 1) if do_once else DB_VERSION

        log_migration(
            connection,
            stored_version,
            to_version,
            trigger,
            True,
        )
        connection.commit()
        logger.info("Migrated to latest version v{}!", to_version)
        return True
    except Exception as error:
        logger.error("Failed to execute migration script, due to {}", error)
        connection.rollback()
        logger.warning(
            "Changes made are rolled back you are now in v{}. Please raise an issue regarding this.",
            stored_version,
        )
        stored_version and log_migration(
            connection,
            stored_version,
            (stored_version + 1) if do_once else DB_VERSION,
            trigger,
            False,
            error,
        )
        connection.commit()
        return False
    finally:
        connection.close()


def revert_step_back(
    to_revert: int,
    db_path: Path,
):
    # we do not recommend calling this function unless it is necessary

    logger.warning(
        "Please note we would be reverting from version: v{} to v{}",
        to_revert,
        to_revert - 1,
    )
    script = Path(__file__).parent / "scripts" / f"revert-v{to_revert}.sql"
    if not script.exists():
        if to_revert <= OLDEST_VERSION:
            logger.error(
                "we didn't find a revert script: {}. you are in the older version of handshakes",
                script.name,
            )
        else:
            logger.error(
                "we didn't find a revert script: {}. you are already in the older version of db",
                script.name,
            )
        logger.error("NOTE: you are now in the version: v{}", to_revert)
        return False

    connection = connect(db_path)
    try:
        connection.executescript(script.read_text())
        log_migration(connection, to_revert, to_revert - 1, MigrationTrigger.CLI, True)
        connection.commit()
        logger.info("Done!, you are now at: v{}", to_revert - 1)

    except Exception as error:
        logger.error(f"Failed to execute reversion script, due to {error}")
        logger.warning(
            "Changes are now rolled back, Please raise an issue regarding this. you are still in v{}",
            to_revert,
        )
        connection.rollback()
        log_migration(
            connection, to_revert, to_revert - 1, MigrationTrigger.CLI, False, error
        )
        connection.commit()
    finally:
        connection.close()


if __name__ == "__main__":
    migration(Path.cwd().parent.parent.parent / "TestResults" / "TeStReSuLtS.db")
