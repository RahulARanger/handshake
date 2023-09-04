from multiprocessing import Process
from pathlib import Path
from psutil import process_iter
from datetime import datetime


def test_wdio_py_service():
    snapshot = set(_.pid for _ in process_iter(["pid"]))
    Process("npm next dev")
    after_snapshot = set(_.pid for _ in process_iter(["pid"]))

    newly_added = after_snapshot.difference(snapshot)
    print(newly_added)

