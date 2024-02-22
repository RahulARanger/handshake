from tomllib import loads
from handshake import __version__


# checks if the project got bumped
def test_if_bumped(root_dir):
    root = root_dir.parent  # assumption: test_sanity as cwd
    version = loads((root / "pyproject.toml").read_text())["tool"]["poetry"]["version"]
    assert version == __version__


def test_if_env_file(root_dir):
    assert (root_dir.parent / "handshake" / ".env").exists()
