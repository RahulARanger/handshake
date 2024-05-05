from handshake.services.SchedularService.completeTestRun import (
    simplify_file_paths,
    fetch_key_from_status,
)
from handshake.services.DBService.models.config_base import ConfigKeys, ConfigBase
from handshake.services.SchedularService.modifySuites import Status
from pathlib import Path
from tempfile import mkdtemp
from shutil import rmtree, which
from subprocess import run
from pytest import mark


class TestSimplifyPathTree:
    def test_mock_paths(self):
        paths = [
            ("a/b/c/d/e/f", 2),
            ("a/b/c/d/e/i/k", 4),
            ("x/b/c/d/e/f", 3),
            ("x/b/c/d/e/i/k", 1),
            ("x/b/c/d/g", 0),
            ("a/b/c/d/g", 2),
            ("a/h", 1),
            ("x/h", 2),
        ]
        result = simplify_file_paths(paths)
        path = "current"

        assert paths != sorted(paths)
        assert len(result) == 2
        a = result["a"]
        x = result["x"]

        assert a[path] == "a"
        assert x[path] == "x"

        assert Path(
            result["a"]["paths"][str(Path("b") / "c" / "d")]["paths"]["e"]["paths"][
                "f"
            ][path]
        ) == Path(paths[0][0])
        assert (
            result["a"]["paths"][str(Path("b") / "c" / "d")]["paths"]["e"]["paths"][
                "f"
            ]["suites"]
            == 2
        )

        assert Path(
            result["a"]["paths"][str(Path("b") / "c" / "d")]["paths"]["e"]["paths"][
                str(Path("i") / "k")
            ][path]
        ) == Path(paths[1][0])
        assert (
            result["a"]["paths"][str(Path("b") / "c" / "d")]["paths"]["e"]["paths"][
                str(Path("i") / "k")
            ]["suites"]
            == 4
        )

        assert Path(
            result["a"]["paths"][str(Path("b") / "c" / "d")]["paths"]["g"][path]
        ) == Path(paths[5][0])
        assert (
            result["a"]["paths"][str(Path("b") / "c" / "d")]["paths"]["g"]["suites"]
            == 2
        )

        assert Path(result["a"]["paths"]["h"][path]) == Path(paths[6][0])
        assert Path(
            result["x"]["paths"][str(Path("b") / "c" / "d")]["paths"]["e"]["paths"][
                "f"
            ][path]
        ) == Path(paths[2][0])
        assert Path(
            result["x"]["paths"][str(Path("b") / "c" / "d")]["paths"]["e"]["paths"][
                str(Path("i") / "k")
            ][path]
        ) == Path(paths[3][0])
        assert Path(
            result["x"]["paths"][str(Path("b") / "c" / "d")]["paths"]["g"][path]
        ) == Path(paths[4][0])
        assert Path(result["x"]["paths"]["h"][path]) == Path(paths[7][0])

    def test_real_paths(self):
        test_dir = Path(mkdtemp(prefix="TestDir"))
        files = []

        lvl_files = ["sample_file.py", "test_file.js", "comp_test.tsx"]
        for file in lvl_files:
            file_path = test_dir / file
            file_path.touch()
            files.append((str(file_path), 3))

        lvl_2_folder = test_dir / "lvl_2"
        lvl_2_folder.mkdir()

        for file in lvl_files:
            file_path = lvl_2_folder / file
            file_path.touch()
            files.append((str(file_path), 3))

        path_tree = simplify_file_paths(files)

        root_path = path_tree[str(test_dir)]
        assert root_path["current"] == str(test_dir)
        assert root_path["paths"]["comp_test.tsx"]["current"] == str(
            test_dir / "comp_test.tsx"
        )
        assert root_path["paths"]["comp_test.tsx"]["suites"] == 3

        assert root_path["paths"]["sample_file.py"]["current"] == str(
            test_dir / "sample_file.py"
        )
        assert root_path["paths"]["sample_file.py"]["suites"] == 3

        assert root_path["paths"]["test_file.js"]["current"] == str(
            test_dir / "test_file.js"
        )
        assert root_path["paths"]["test_file.js"]["suites"] == 3
        assert root_path["paths"]["lvl_2"]["current"] == str(lvl_2_folder)

        assert root_path["paths"]["lvl_2"]["paths"]["comp_test.tsx"]["current"] == str(
            lvl_2_folder / "comp_test.tsx"
        )
        assert root_path["paths"]["lvl_2"]["paths"]["comp_test.tsx"]["suites"] == 3

        assert root_path["paths"]["lvl_2"]["paths"]["sample_file.py"]["current"] == str(
            lvl_2_folder / "sample_file.py"
        )
        assert root_path["paths"]["lvl_2"]["paths"]["sample_file.py"]["suites"] == 3

        assert root_path["paths"]["lvl_2"]["paths"]["test_file.js"]["current"] == str(
            lvl_2_folder / "test_file.js"
        )
        assert root_path["paths"]["lvl_2"]["paths"]["test_file.js"]["suites"] == 3

        rmtree(test_dir)


def test_status_from_values():
    assert fetch_key_from_status(0, 0, 0) == Status.PASSED
    assert fetch_key_from_status(2, 0, 0) == Status.PASSED
    assert fetch_key_from_status(2, 2, 0) == Status.FAILED
    assert fetch_key_from_status(2, 2, 2) == Status.FAILED
    assert fetch_key_from_status(2, 0, 2) == Status.PASSED
    assert fetch_key_from_status(0, 0, 2) == Status.SKIPPED


@mark.usefixtures("clean_close")
class TestSetConfigCommand:
    async def test_set_config_with_one_para(self, root_dir, force=None, max_runs=3):
        if force is None:
            result = run(
                f'handshake config "{root_dir}" -mr {max_runs}',
                cwd=root_dir,
                shell=True,
            )
        else:
            result = run(
                [force, "config", str(root_dir), "-mr", f"{max_runs}"],
                cwd=root_dir,
            )
        assert result.returncode == 0
        config_record = await ConfigBase.filter(
            key=ConfigKeys.maxRunsPerProject
        ).first()
        assert int(config_record.value) == max_runs
