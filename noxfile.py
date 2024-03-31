import nox
import pathlib
import tomllib
from json import dumps


@nox.session
def version(session):
    """
    bumps the version of the project and notes the version at the right places
    example: nox -s version -- minor
    :param session: nox session
    :return:
    """
    bump = session.posargs[0].lower()
    assert bump in {"minor", "major", "patch"}
    root = pathlib.Path(__file__).parent
    target_node = (
        root
        / "handshake-nodejs-reporters"
        / "packages"
        / "common-handshakes"
        / ".version"
    )
    assert target_node.exists()

    session.run("poetry", "version", bump, external=True)

    version_text = tomllib.loads((root / "pyproject.toml").read_text())["tool"][
        "poetry"
    ]["version"]
    note_file = root / "handshake" / "__init__.py"
    note_file.write_text(f'__version__ = "{version_text}"\n')

    target_node.write_text(dumps(dict(version=version_text)))


@nox.session(python=["3.11", "3.12"])
def test(session):
    """
    nox -s test
    :param session: nox session
    :return:
    """
    session.install("poetry")
    session.run("poetry", "install")
    session.run("pytest", "__test__")
