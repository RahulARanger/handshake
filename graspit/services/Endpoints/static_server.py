from sanic import Sanic
from sanic.response import text, redirect

static_provider = Sanic("Graspit-Serve", strict_slashes=True)


@static_provider.get("/RUNS/")
def set_runs(_):
    return redirect("/RUNS.html")


# matches routes that does not end with ".html
@static_provider.get("/RUNS/<run:.*(?<!.html)$>")
def for_test_run(_, run: str):
    return redirect(f"/RUNS/{run}.html")
