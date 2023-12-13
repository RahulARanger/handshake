from sanic import Sanic

static_provider = Sanic("Serve-Handshake", strict_slashes=True)
static_provider.config.TOUCHUP = False
