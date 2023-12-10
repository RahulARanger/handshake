from sanic import Sanic

static_provider = Sanic("Graspit-Serve", strict_slashes=True)
static_provider.config.TOUCHUP = False
