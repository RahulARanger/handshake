from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
import pathlib


app = FastAPI()

app.mount(
    "/",
    StaticFiles(directory=pathlib.Path(__file__).parent.parent / "next-dashboard" / "out"),
    name="static"
)

