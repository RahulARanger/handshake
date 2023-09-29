import time
from multiprocessing import Process
from pytest import mark
from graspit.services.SchedularService.center import init_scheduler


# verifying if the scheduler is able to respond termination signals

@mark.usefixtures("db_path")
def test_signal_handling_sigterm(db_path):
    process = Process(target=init_scheduler, args=(db_path,))
    process.start()
    time.sleep(2)
    process.kill()
    process.join()
    assert not process.is_alive(), "We have created a zombie process 🧟"
