from click import group, Path as C_Path, argument, option
from pathlib import Path
from graspit.services.SchedularService.center import start_service
from graspit.services.DBService.shared import db_path
from graspit.services.SchedularService.lifecycle import start_loop
from os.path import relpath
from click import secho
from subprocess import call, check_output


@group()
def handle_cli():
    pass


@handle_cli.command()
@argument("path", nargs=1, type=C_Path(exists=True, dir_okay=True), required=False, default=Path.cwd())
def patch(path):
    if not Path(path).is_dir():
        raise NotADirectoryError(path)
    start_service(db_path(path))
    start_loop()


@handle_cli.command()
@argument("path", nargs=1, type=C_Path(exists=True, dir_okay=True), required=True)
@option("--out", type=C_Path(dir_okay=True), required=True)
def export(path, out):
    saved_db_path = db_path(path)
    if not saved_db_path.exists():
        raise FileNotFoundError(f"DB file not in {path}")

    resolved = Path(out).resolve()

    secho(f"Currently at: {Path.cwd()}", fg="yellow")
    node_modules = check_output("npm root", shell=True, text=True, cwd=Path.cwd()).strip()
    secho(f"Found Node modules at: {node_modules}", fg="yellow")

    graspit = Path(node_modules) / "graspit"
    if not graspit.exists():
        secho(f"graspit was not found in {graspit} please try this command, npm install graspit", fg="red")
        raise FileNotFoundError("Please install graspit in your project, npm install graspit")

    secho("Directory Found!", fg="blue")
    secho(f"Exporting results to {relpath(resolved, graspit)}", fg="yellow")
    secho(
        f"Raising a request with command: \"npx cross-env EXPORT_DIR={relpath(resolved, graspit)} DB_PATH={relpath(saved_db_path, graspit)} npm run export\"",
        fg="blue"
    )

    call(
        f"npx cross-env EXPORT_DIR={relpath(resolved, graspit)} DB_PATH={relpath(saved_db_path, graspit)} npm run export",
        cwd=graspit, shell=True
    )


if __name__ == "__main__":
    start_service(db_path("../TestResults"))
    start_loop()
