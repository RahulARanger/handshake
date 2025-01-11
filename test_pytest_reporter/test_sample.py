import pytest


@pytest.mark.xfail
def test_function():
    print(1 / 0)


@pytest.mark.xfail
def test_xpass():
    print(1, 0)
