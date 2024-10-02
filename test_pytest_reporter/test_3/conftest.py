from pytest import fixture
from time import sleep


@fixture(scope="session", autouse=True)
def sample_setup_1():
    sleep(2)


@fixture()
def sample_setup_2():
    sleep(2)
