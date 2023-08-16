from subprocess import run
from shutil import copytree, rmtree, move, ignore_patterns
from click import secho
from pathlib import Path
from json import loads
from packaging.version import Version


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

    # this is where we store TestResults
    @property
    def public(self):
        return self.cache / "public"

    @property
    def cache_db(self):
        return self.public / "TestResults.db"

    @property
    def dashboard(self):
        return Path(__file__).parent.parent / "next-dashboard"

    def verify_cache(self) -> bool:
        return (self.cache / "package.json").exists() and \
            (self.cache / "src").exists()

    @property
    def prev_result(self):
        return self.root / "TestResults.db"

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
                self.save_prev_results()
                rmtree(self.cache)

            copytree(
                self.dashboard, self.cache,
                ignore=ignore_patterns(
                    "**node_modules", "**out", "**.next", "**.vscode",
                    "**.env", "**.development", '.prettierrc', '.eslintrc.json'
                )
            )
            if self.prev_result.exists():
                move(self.prev_result, self.cache_db)

            secho("Dashboard is ready!", fg="green", bold=True)

        node_modules = self.cache / "node_modules"
        if node_modules.exists():
            return secho("Dashboard is ready!", fg="green")

        secho("Installing npm packages...", blink=True, fg="blue", bold=True)
        run("npm install", check=True, shell=True, cwd=self.cache)
        secho("Done!", fg="green", bold=True)

    def save_prev_results(self):
        if not (self.prev_result.exists() or self.cache_db.exists()):
            secho(
                "Didn't find your previous results, will generate new result", bg="yellow",
                bold=True, blink=True)
            return

        secho("Saving the results generated in the previous runs", fg="green", bold=True)
        if self.prev_result.exists():
            secho(
                "Found two results, giving preference to cache ones, Please raise an issue if this conflicts your plan",
                bg="red", blink=True
            )
            try:
                self.prev_result.unlink()
            except PermissionError:
                secho("Someone is using this DB, please run this project one at a time", bg="red")
            except OSError as error:
                secho(f"OS didn't allow us to delete this file: {error}", bg="red")
        try:
            move(self.cache_db, self.prev_result)
        except PermissionError:
            secho("Someone is using this DB, please run this project one at a time", bg="red")
        except OSError as error:
            secho(f"OS didn't allow us to move this file: {error}", bg="red")

    def export_the_results(self):
        secho("Exporting the results...")
        run("npx export --no-lint", check=True, shell=True, cwd=self.cache_results)

        if self.static_results.exists():
            rmtree(self.static_results)

        copytree(self.cache_results / "out", self.static_results)
        secho("Exported", fg="green", bold=True, blink=True)
