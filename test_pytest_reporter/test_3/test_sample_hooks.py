def test_sample_3(sample_setup_3):
    print("Test Sample 3 Ran", sample_setup_3)
    assert 1 == 1, "passed assertion"


def test_sample_2():
    print("Test Sample 2 Ran")
    assert False is False, "is operator"
    assert 2 * 2 != 1, "not equal to operator"
    assert sample_function() > 0, "returns non zero"


def sample_function():
    return 2
