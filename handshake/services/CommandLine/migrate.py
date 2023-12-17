from click import echo
from handshake.services.CommandLine.export import handle_cli, general_requirement
from handshake.services.DBService.shared import db_path
from handshake.services.DBService.migrator import check_version, migration


@general_requirement
@handle_cli.command()
def db_version(collection_path):
    return check_version(db_path(collection_path))


@general_requirement
@handle_cli.command()
def migrate(collection_path):
    return migration(db_path(collection_path))
