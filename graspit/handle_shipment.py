from click import group, Path as C_Path, argument
from pathlib import Path
from graspit.services.SchedularService.center import start_service
from graspit.services.DBService.shared import db_path
from graspit.services.SchedularService.lifecycle import start_loop


@group()
def handle_cli():
    pass


@handle_cli.command()
@argument("path", nargs=1, type=C_Path(exists=True, dir_okay=True), required=True)
def patch(path):
    if not Path(path).is_dir():
        raise NotADirectoryError(path)
    start_service(db_path(path))
    start_loop()


if __name__ == "__main__":
    start_service(db_path("../TestResults"))
    start_loop()
