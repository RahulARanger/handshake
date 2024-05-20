import nox
import pathlib
import tomllib
from json import dumps, loads
from pathlib import Path
from shutil import make_archive


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

    target_node.write_text(
        dumps(dict(**loads(target_node.read_text()), version=version_text))
    )


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


# nox -s zip_results
@nox.session
def zip_results(session):
    dashboard = pathlib.Path(__file__).parent / "dashboard"
    assert dashboard.exists(), (
        "Dashboard build is not generated yet., Please generate it with npm run local-build in the dashboard package or"
        " through dashboard build-pipeline"
    )

    expected_here = Path.cwd() / "dashboard.zip"
    if expected_here.exists():
        expected_here.unlink()
    assert expected_here == dashboard.parent / "dashboard.zip"

    make_archive("dashboard", "zip", dashboard)
