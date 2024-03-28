import nox


@nox.session(python=["3.11", "3.12"])
def test(session):
    session.install("poetry")
    session.install("setuptools")
    session.run("poetry", "install")
    session.run("pytest", "__test__/test_regression")


@nox.session(python=["3.11", "3.12"])
def sanity_test(session):
    session.install("handshakes")
    session.run("handshake", "--version")
