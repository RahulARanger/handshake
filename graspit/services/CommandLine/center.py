from graspit.services.CommandLine.core import handle_cli
from click import argument, Path as C_Path
from pathlib import Path
from graspit.services.SchedularService.center import start_service
from graspit.services.DBService.shared import db_path
from graspit.services.SchedularService.lifecycle import start_loop


@handle_cli.command()
@argument(
    "path",
    nargs=1,
    type=C_Path(exists=True, dir_okay=True),
    required=False,
    default=Path.cwd(),
)
def patch(path):
    if not Path(path).is_dir():
        raise NotADirectoryError(path)
    start_service(db_path(path))
    start_loop()
