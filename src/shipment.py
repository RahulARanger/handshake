from subprocess import run
from shutil import copytree, rmtree, make_archive, ignore_patterns
from zipfile import ZipFile
from click import secho
from pathlib import Path
from json import loads
from packaging.version import Version


class Shipment:
    def __init__(self, name: str, parent_dir: Path):
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
        return Path(__file__).parent.parent / "next-dashboard"

    @property
    def saved_results(self):
        return self.root / "saved.zip"

    def verify_cache(self):
        return (self.cache / "package.json").exists() and \
            self.cache_results.exists() and \
            (self.cache / "src").exists()

    def init_cache_repo(self):
        generate_cache = True

        if self.verify_cache():
            secho("Checking for the dashboard version...")
            preferred = Version(loads((self.dashboard / 'package.json').read_text()).get("version", False))
            found = Version(loads((self.cache / 'package.json').read_text()).get("version", False))
            generate_cache = preferred > found
            secho(f"Preferred: v{preferred}, Found: v{found}", bg="red" if generate_cache else "green")

        if generate_cache:
            secho("Generating the Dashboard...", fg="blue", bold=True)
            if self.cache_results.exists():
                rmtree(self.cache)

            copytree(
                self.dashboard, self.cache,
                ignore=ignore_patterns(
                    "**node_modules", "**out", "**.next", "**.vscode",
                    "**.env", "**.development", '.prettierrc', '.eslintrc.json'
                )
            )
            secho("Plain Dashboard is copied", fg="green", bold=True)

        node_modules = self.cache / "node_modules"
        if node_modules.exists():
            return

        secho("Installing npm packages...", blink=True, fg="blue", bold=True)
        run("npm install", check=True, shell=True, cwd=self.cache_results)
        secho("Done!", fg="green", bold=True)

    def save_prev_results(self):
        if not self.prev_results.exists():
            secho("skipping the step where we save your previous results, as this would be your first run", bg="yellow",
                  bold=True, blink=True)
            return

        secho("Saving the results generated in the previous runs", fg="green", bold=True)
        return make_archive("saved", "zip", self.root, self.prev_results)

    def attach_saved_results(self):
        if self.cache_results.exists():
            rmtree(self.cache_results)

        saved = ZipFile(self.saved_results)
        saved.extractall(self.public)

    def export_the_results(self):
        secho("Exporting the results...")
        run("npx export --no-lint", check=True, shell=True, cwd=self.cache_results)

        if self.static_results.exists():
            rmtree(self.static_results)

        copytree(self.cache_results / "out", self.static_results)
        secho("Exported", fg="green", bold=True, blink=True)
