from handshake.reporters.markers import set_info

pytestmark = set_info(
    name="test_sample", description="contains nested and simple tests"
)


@set_info(name="test_dummy", description="just asserting with the value 1 with 1")
def test_dummy():
    assert 1 == 1


@set_info(
    name="test_dummy_2_class", description="created this suite to test the nested suite"
)
class TestDummy2:
    class TestDummy4:
        def test_dummy_5(self):
            print("this will run")
            assert 1 == 1

    def test_dummy_4(self): ...


def test_dummy_3():
    def test_dummy_4():  # this is ignored
        assert 1 == 1

    assert 1 == 1
