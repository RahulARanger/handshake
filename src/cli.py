from src.shipment import Shipment
from click import group, option, Path as C_Path
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
# @click.option(
#     '-f', '--force', default=False, flag_value=True, is_flag=True,
#     help='reuse the existing dashboard if available, if the package is updated ',
#     show_default=True
# )
def init_shipment(out: str, save: str):
    root = Path(out)
    parcel = Shipment(save, root)
    parcel.init_cache_repo()
    parcel.save_prev_results()


if __name__ == "__main__":
    handle_cli()
