from importlib.util import find_spec

if not find_spec("sanic_ext"):

    def definition(**_):
        def accept(func):
            return func

        return accept

else:
    from sanic_ext import openapi

    definition = openapi.definition
