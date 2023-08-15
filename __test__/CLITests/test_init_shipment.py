from click.testing import CliRunner
from src.cli import handle_cli
from pathlib import Path
from pytest import fixture, mark
from tempfile import mkdtemp
from shutil import rmtree
from json import loads


@fixture(scope="class")
def temp_dir():
    return Path(mkdtemp(prefix="test-next-py-results"))


@fixture(scope="class")
def root_dir(temp_dir):
    return temp_dir.parent


@fixture(scope="class")
def collection_name(temp_dir):
    return temp_dir.name


@fixture(scope="class")
def cache_results(temp_dir):
    return temp_dir / "cache"


@fixture(autouse=True, scope="class")
def remove_files(root_dir, collection_name, cache_results):
    # Before all the tests in that class
    assert root_dir.exists() is True
    results = root_dir / collection_name
    assert cache_results.exists() is False

    yield

    # After the test cases
    assert cache_results.exists() is True
    rmtree(results)
    assert results.exists() is False


@mark.usefixtures("root_dir", "remove_files", "cache_results")
class TestShipment:
    runner = CliRunner()

    def test_first_run(self, root_dir, collection_name, cache_results):
        result = self.runner.invoke(handle_cli, ['init-shipment', '-s', collection_name, '-o', root_dir])
        print(result.output)
        assert result.exit_code == 0
        assert "Checking for the dashboard version..." not in result.output
        assert "Generating the Dashboard..." in result.output
        assert "Plain Dashboard is copied" in result.output
        assert "Installing npm packages..." in result.output
        assert "Done!" in result.output

        version = loads(
            (Path(__file__).parent.parent.parent / "next-dashboard" / 'package.json').read_text()
        ).get("version")

        found = loads(
            (cache_results / 'package.json').read_text()
        ).get("version")

        assert version == found

    def test_second_run(self, root_dir, collection_name, cache_results):
        result = self.runner.invoke(handle_cli, ['init-shipment', '-s', root_dir, '-o', collection_name])
        assert result.exit_code == 0
        assert "Checking for the dashboard version..." in result.output
        assert "Generating the Dashboard..." not in result.output
        assert "Plain Dashboard is copied" not in result.output
        assert "Installing npm packages..." not in result.output
        assert "Done!" not in result.output

        preferred = loads(
            (Path(__file__).parent.parent.parent / "next-dashboard" / 'package.json').read_text()
        ).get("version")

        found = loads(
            (cache_results / 'package.json').read_text()
        ).get("version")

        assert preferred == found

        assert f"Preferred: v{preferred}, Found: v{found}" in result.output
        assert 'skipping the step where we save your previous results, as this would be your first run' in result.output
