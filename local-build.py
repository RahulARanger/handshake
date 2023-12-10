# helper script to place the python local build to make it accessible to node js reporters

from pathlib import Path
from platform import system
from shutil import copyfile

dist = Path(__file__).parent / "dist"
dist_name = f"handshake-{system()}"

changed = False
if "win" in system().lower():
    changed = True
    dist_name += ".exe"

commons = (
    Path(__file__).parent
    / "handshake-reporters"
    / "packages"
    / "handshake-commons"
    / "bin"
)

copyfile(
    src=dist / dist_name,
    dst=commons / (f"handshake" + ".exe" if changed else ""),
)

# make sure to run the pyinstaller starter.spec before running this script
