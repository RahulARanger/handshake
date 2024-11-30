from subprocess import run, PIPE
from pytest import mark

try:
    import tabulate

    installed_tabulate = True
except ImportError:
    installed_tabulate = False


class TestQueryResults:
    @mark.skipif(installed_tabulate, reason="tabular module was installed")
    def test_inform_optional_deps(self, root_dir):
        run_result = run(
            f'handshake db "{root_dir.name}" query "select * from runbase;"',
            cwd=root_dir.parent,
            stdout=PIPE,
            shell=True,
            stderr=PIPE,
        )

        note = run_result.stderr.decode()
        assert "ERROR" in note
        assert (
            "could not execute the provided query,"
            ' Please install this package by pip install "handshakes[print-tables]"'
            in note
        )

    @mark.skipif(not installed_tabulate, reason="tabular module was not installed")
    def test_query_results(self, root_dir):
        run_result = run(
            f'handshake db "{root_dir.name}" query "select * from runbase;"',
            cwd=root_dir.parent,
            stdout=PIPE,
            shell=True,
            stderr=PIPE,
        )
        note = run_result.stderr.decode()
        assert "ERROR" not in note
        assert (
            "could not execute the provided query,"
            ' Please install this package by pip install "handshakes[print-tables]"'
            not in note
        )

        note = run_result.stdout.decode()
        assert "Returned" in note
        assert "rows" in note
