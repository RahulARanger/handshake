# @handle_cli.group()
# def db_version():
#     pass


# @db_version.command()
# @argument("path", nargs=1, type=C_Path(exists=True, dir_okay=True), required=True)
# def check(path: str):
#     return check_version(db_path(Path(path)))
#
#
# @db_version.command()
# @argument("path", nargs=1, type=C_Path(exists=True, dir_okay=True), required=True)
# def migrate(path: str):
#     return initiate_migration(db_path(Path(path)))
