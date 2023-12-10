from click import echo
from graspit.services.CommandLine.export import handle_cli, general_requirement
from graspit.services.DBService.shared import db_path
from graspit.services.DBService.migrator import check_version, migration


@handle_cli.group()
def db():
    ...


@general_requirement
@db.command()
def version(collection_path):
    return check_version(db_path(collection_path))


@general_requirement
@db.command()
def migrate(collection_path):
    return migration(db_path(collection_path))
