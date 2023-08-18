from src.shipment import Shipment
from click import option, group, Path as C_Path
from pathlib import Path


@group()
def handle_cli():
    pass


@handle_cli.command()
@option(
    '-s', '--save', default="results", help='Export folder name (not absolute path)', show_default=True
)
@option(
    '-o', '--out', default=Path.cwd(), show_default=True,
    help='Parent Folder of the expected results', type=C_Path()
)
def init_shipment(out: str, save: str):
    root = Path(out)
    parcel = Shipment(save, root)
    parcel.init_cache_repo()
