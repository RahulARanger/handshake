from click import group, Path as C_Path, argument, option
from pathlib import Path
from graspit.services.SchedularService.center import start_service
from graspit.services.DBService.shared import db_path
from graspit.services.SchedularService.lifecycle import start_loop
from click import secho
from subprocess import call


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


@handle_cli.command()
@argument("path", nargs=1, type=C_Path(exists=True, dir_okay=True), required=True)
@option("--node_modules", type=C_Path(exists=True, dir_okay=True), required=True)
def export(path, node_modules):
    if not db_path(path).exists():
        raise FileNotFoundError(f"DB file not in {path}")

    graspit = Path(node_modules) / "graspit"
    if not graspit.exists():
        raise FileNotFoundError("Please install graspit in your project, npm install graspit")

    secho("Directory Found!", fg="blue")
    secho(f"Running the command at {graspit}, npm run dev", fg="yellow")
    call("npm run dev", cwd=graspit, shell=True)


if __name__ == "__main__":
    start_service(db_path("../TestResults"))
    start_loop()
