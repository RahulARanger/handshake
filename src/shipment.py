from subprocess import run
from shutil import copytree, rmtree, move, ignore_patterns
from click import secho
from pathlib import Path
from json import loads
from packaging.version import Version
from src.services.DBService.sanic_free_shared import db_name


class Shipment:
    def __init__(self, name: str, parent_dir: Path):
        self.root = parent_dir / name
        self.root.mkdir(exist_ok=True)

    # This is the cache folder where we refer the previous results from
    @property
    def cache(self):
        return self.root / "cache"

    # out is statically generated pages from cache folder
    @property
    def static_results(self):
        return self.root / "out"

    @property
    def test_results(self):
        return self.root / db_name()

    @property
    def dashboard(self):
        return Path(__file__).parent / "next-py-dashboard"

    def verify_cache(self) -> bool:
        return (self.cache / "package.json").exists() and \
            (self.cache / "src").exists() and (self.cache / "public").exists()

    def init_cache_repo(self):
        generate_cache = True

        if self.verify_cache():
            secho("Checking for the package version of dashboard...")
            preferred = Version(loads((self.dashboard / 'package.json').read_text()).get("version", False))
            found = Version(loads((self.cache / 'package.json').read_text()).get("version", False))
            generate_cache = preferred > found
            secho(f"Preferred: v{preferred}, Found: v{found}", bg="red" if generate_cache else "green")

        if generate_cache:
            secho("Generating the Dashboard...", fg="blue", bold=True)
            if self.cache.exists():
                rmtree(self.cache)

            copytree(
                self.dashboard, self.cache,
                ignore=ignore_patterns(
                    "**node_modules", "**out", "**.next", "**.vscode",
                    "**.env", "**.development", '.prettierrc', '.eslintrc.json'
                )
            )

        node_modules = self.cache / "node_modules"

        if not node_modules.exists():
            secho("Installing npm packages...", blink=True, fg="blue", bold=True)
            run("npm install", check=True, shell=True, cwd=self.cache)

        return secho("Dashboard is ready!", fg="green", bold=True)

    def export_the_results(self):
        secho("Exporting the results...")
        run("npx export --no-lint", check=True, shell=True, cwd=self.cache_results)

        if self.static_results.exists():
            rmtree(self.static_results)

        copytree(self.cache_results / "out", self.static_results)
        secho("Exported", fg="green", bold=True, blink=True)
