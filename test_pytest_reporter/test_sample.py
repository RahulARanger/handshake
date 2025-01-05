import pytest


@pytest.mark.xfail()
def test_function():
    print(1, 0)
