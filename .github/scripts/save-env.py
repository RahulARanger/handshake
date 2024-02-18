from os import getenv
from pathlib import Path

# assuming you are in the root of the project

(Path.cwd() / "handshake" / ".env").write_text(getenv("PROD_ENV"))
