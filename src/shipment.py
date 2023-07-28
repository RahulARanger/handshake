import pathlib
import subprocess
import tempfile
import zipfile
import shutil

import click


class Shipment:
    def __init__(self, name: str, parent_dir: pathlib.Path):
        self.root = parent_dir / name
        self.root.mkdir(exist_ok=True)

    @property
    def cache(self):
        return self.root / "cache"

    @property
    def static_results(self):
        return self.root / "out"

    @property
    def public(self):
        return self.cache / "public"

    @property
    def prev_results(self):
        return self.static_results / "TestResults"

    @property
    def cache_results(self):
        return self.public / "TestResults"

    @property
    def dashboard(self):
        return pathlib.Path(__file__).parent.parent / "next-dashboard"

    @property
    def saved_results(self):
        return self.root / "saved.zip"

    def init_cache_repo(self, force: bool):
        click.secho("Checking if we require to generate the dashboard")

        generate_cache = force or (self.cache_results.exists() and self.prev_results.exists())
        if generate_cache:
            click.secho("Generating the Dashboard", fg="blue", bold=True)
            shutil.rmtree(self.cache_results)
            shutil.copytree(
                self.dashboard, self.cache_results,
                ignore=shutil.ignore_patterns("**node_modules", "**out", "**.next", "**.vscode"))
            click.secho("Generated the results", fg="green", bold=True)

        node_modules = self.cache_results / "node_modules"
        if node_modules.exists():
            return

        click.secho("Installing npm packages...", blink=True, fg="blue", bold=True)
        subprocess.run("npm install", check=True, shell=True, cwd=self.cache_results)
        click.secho("Done!", fg="green", bold=True)

    def save_prev_results(self):
        click.secho("Checking and saving the previous results...", fg="green", bold=True)

        if not self.prev_results.exists():
            click.secho("Failed to find the previous results, hence skipping", fg="yellow", bold=True, blink=True)
            return

        return shutil.make_archive("saved", "zip", self.root)

    def attach_saved_results(self):
        if self.cache_results.exists():
            shutil.rmtree(self.cache_results)

        saved = zipfile.ZipFile(self.saved_results)
        saved.extractall(self.public)

    def export_the_results(self):
        click.secho("Exporting the results...")
        subprocess.run("npx export --no-lint", check=True, shell=True, cwd=self.cache_results)

        if self.static_results.exists():
            shutil.rmtree(self.static_results)

        shutil.copytree(self.cache_results / "out", self.static_results)
        click.secho("Exported", fg="green", bold=True, blink=True)


def demo(name: str, dir_path: str, node: str) -> bool:
    package = pathlib.Path(__file__, "wdio-next-dashboard")

    packed = zipfile.ZipFile(package)
