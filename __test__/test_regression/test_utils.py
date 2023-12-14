import pathlib
from handshake.services.SchedularService.completeTestRun import (
    simplify_file_paths,
    fetch_key_from_status,
)
from handshake.services.DBService.models.config_base import ConfigKeys, ConfigBase
from handshake.services.SchedularService.modifySuites import Status
from pathlib import Path
from tempfile import mkdtemp
from shutil import rmtree
from subprocess import run
from pytest import mark


class TestSimplifyPathTree:
    def test_mock_paths(self):
        paths = [
            "a/b/c/d/e/f",
            "a/b/c/d/e/i/k",
            "x/b/c/d/e/f",
            "x/b/c/d/e/i/k",
            "x/b/c/d/g",
            "a/b/c/d/g",
            "a/h",
            "x/h",
        ]
        result = simplify_file_paths(paths)
        path = "<path>"

        assert paths != sorted(paths)
        assert result[path] == ""
        a = result["a"]
        x = result["x"]

        assert a[path] == "a"
        assert x[path] == "x"

        assert Path(result["a"][str(Path("b") / "c" / "d")]["e"]["f"][path]) == Path(
            paths[0]
        )
        assert Path(
            result["a"][str(Path("b") / "c" / "d")]["e"][str(Path("i") / "k")][path]
        ) == Path(paths[1])
        assert Path(result["a"][str(Path("b") / "c" / "d")]["g"][path]) == Path(
            paths[5]
        )
        assert Path(result["a"]["h"][path]) == Path(paths[6])
        assert Path(result["x"][str(Path("b") / "c" / "d")]["e"]["f"][path]) == Path(
            paths[2]
        )
        assert Path(
            result["x"][str(Path("b") / "c" / "d")]["e"][str(Path("i") / "k")][path]
        ) == Path(paths[3])
        assert Path(result["x"][str(Path("b") / "c" / "d")]["g"][path]) == Path(
            paths[4]
        )
        assert Path(result["x"]["h"][path]) == Path(paths[7])

    def test_real_paths(self):
        test_dir = Path(mkdtemp(prefix="TestDir"))
        files = [str(test_dir)]

        lvl_files = ["sample_file.py", "test_file.js", "comp_test.tsx"]
        for file in lvl_files:
            file_path = test_dir / file
            file_path.touch()
            files.append(str(file_path))

        lvl_2_folder = test_dir / "lvl_2"
        lvl_2_folder.mkdir()
        files.append(str(lvl_2_folder))

        for file in lvl_files:
            file_path = lvl_2_folder / file
            file_path.touch()
            files.append(str(file_path))

        path_tree = simplify_file_paths(files)

        root_path = path_tree[str(test_dir)]
        assert root_path["<path>"] == str(test_dir)
        assert root_path["comp_test.tsx"]["<path>"] == str(test_dir / "comp_test.tsx")
        assert root_path["sample_file.py"]["<path>"] == str(test_dir / "sample_file.py")
        assert root_path["test_file.js"]["<path>"] == str(test_dir / "test_file.js")
        assert root_path["lvl_2"]["<path>"] == str(lvl_2_folder)

        assert root_path["lvl_2"]["comp_test.tsx"]["<path>"] == str(
            lvl_2_folder / "comp_test.tsx"
        )
        assert root_path["lvl_2"]["sample_file.py"]["<path>"] == str(
            lvl_2_folder / "sample_file.py"
        )
        assert root_path["lvl_2"]["test_file.js"]["<path>"] == str(
            lvl_2_folder / "test_file.js"
        )

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
    async def test_set_config_with_one_para(self, root_dir, force=None):
        result = run(
            f'handshake config "{root_dir}" -mr 3',
            cwd=force if force else root_dir,
            shell=True,
        )
        assert result.returncode == 0
        config_record = await ConfigBase.filter(key=ConfigKeys.maxRuns).first()
        assert int(config_record.value) == 3
