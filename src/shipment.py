from subprocess import run
from shutil import copytree, rmtree, move, ignore_patterns
from pathlib import Path
from json import loads
from packaging.version import Version
from src.services.DBService.sanic_free_shared import db_name
from loguru import logger
from logging import INFO, WARNING


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
            logger.info("Checking for the package version of dashboard...")
            preferred = Version(loads((self.dashboard / 'package.json').read_text()).get("version", False))
            found = Version(loads((self.cache / 'package.json').read_text()).get("version", False))
            generate_cache = preferred > found
            logger.log(WARNING if generate_cache else INFO, f"Preferred: v{preferred}, Found: v{found}")

        if generate_cache:
            logger.info("Generating the Dashboard...", fg="blue", bold=True)
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
            logger.warning("Installing npm packages...", blink=True, fg="blue", bold=True)
            run("npm install", check=True, shell=True, cwd=self.cache)

        return logger.info("Dashboard is ready!", fg="green", bold=True)
