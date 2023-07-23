import pathlib
import subprocess
import tempfile
import zipfile
import shutil

import click


def expected_cache(path: pathlib.Path):
    return path / "cache"


def static_results(path):
    return path / "out"


def init_repo(name: str, parent_dir: pathlib.Path, fresh_copy: bool) -> pathlib.Path:
    results = parent_dir / name
    results.mkdir()

    generate_copy = fresh_copy or not expected_cache(results).exists()
    if generate_copy:
        # removing the previously stored nextjs scripts when required
        save_board(results)

    return results


def save_board(path):
    click.secho("Generating the template...", blink=True, bold=True, fg="blue")
    board = pathlib.Path(__file__).parent.parent / "wdio-next-dashboard"
    saved = expected_cache(path)
    if saved.exists():
        shutil.rmtree(saved, ignore_errors=False)
        click.secho("Removing dashboard files", fg="red")

    shutil.copytree(
        board, saved,
        ignore=shutil.ignore_patterns("**node_modules", "**out", "**.next", "**.vscode")
    )
    click.secho("Done!", bold=True, fg="green")
    click.secho("Downloading npm packages", fg="blue", bold=True, blink=True)
    init_npm(saved)
    click.secho("Done!", bold=True, fg="green")


def init_npm(path: pathlib.Path):
    subprocess.run(
        "npm install", cwd=path, check=True, shell=True
    )


def export_results(path: pathlib.Path) -> pathlib.Path:
    cache = expected_cache(path)
    click.secho(f"Exporting the results to {cache}", bold=True, fg="blue")
    subprocess.run(
        f"npx next build --no-lint",
        cwd=cache, check=True, shell=True
    )
    click.secho("Generated the export", bold=True, fg="green")

    # removing previous results
    static = static_results(path)
    if static.exists():
        click.secho("Removing previous results", blink=True, bold=True, fg="blue")
        shutil.rmtree(static, ignore_errors=False)
        click.secho("Done!", bold=True, fg="green")

    shutil.copytree(expected_cache(path) / "out", static)
    click.secho(f"saved results in {static}", fg="green", bold=True, blink=True)
    return static


def demo(name: str, dir_path: str, node: str) -> bool:
    package = pathlib.Path(__file__, "wdio-next-dashboard")

    packed = zipfile.ZipFile(package)
