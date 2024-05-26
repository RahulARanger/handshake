from os import getenv
from pathlib import Path
from dotenv import load_dotenv

# assuming you are in the root of the project

env_file = Path.cwd() / "handshake" / ".env"
env_file.write_text(getenv("ENV_FILE"))

load_dotenv(env_file)

# assert getenv("SENTRY_SDK")
# assert getenv("SENTRY_ORG")
# assert getenv("SENTRY_PROJECT")
# assert getenv("SENTRY_ENVIRONMENT")
