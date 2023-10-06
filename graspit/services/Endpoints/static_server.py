from sanic import Sanic
from sanic.response import text, redirect

static_provider = Sanic("Graspit-Serve", strict_slashes=True)
