import nox
import pathlib
import tomllib
from json import dumps, loads
from pathlib import Path
from shutil import make_archive, move


def save_version_to_version_file():
    root = pathlib.Path(__file__).parent
    target_node = (
        root
        / "handshake-nodejs-reporters"
        / "packages"
        / "common-handshakes"
        / ".version"
    )
    assert target_node.exists()
    version_text = tomllib.loads((root / "pyproject.toml").read_text())["project"][
        "version"
    ]
    note_file = root / "handshake" / "__init__.py"
    note_file.write_text(f'__version__ = "{version_text}"\n')

    prev = dict(**loads(target_node.read_text()))
    prev.pop("version")
    target_node.write_text(dumps(dict(**prev, version=version_text)))


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

    session.run("poetry", "version", bump, external=True)
    save_version_to_version_file()


@nox.session
def save_version(session):
    """
    saves the version and saves it to the required places
    example: nox -s save_version
    :param session: nox session
    :return:
    """
    save_version_to_version_file()


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

    expected_here = Path.cwd() / "dashboard.tar.bz2"
    if expected_here.exists():
        expected_here.unlink()
    assert expected_here == dashboard.parent / "dashboard.tar.bz2"

    make_archive("dashboard", "bztar", dashboard)
    move(
        expected_here,
        expected_here.parent
        / "handshake-nodejs-reporters"
        / "packages"
        / "common-handshakes"
        / "dashboard.tar.bz2",
    )
