import click
import pathlib


@click.command()
@click.option('--save', default="results", help='Results are stored in this file', show_default=True)
@click.option(
    '-d', '--dir', default=pathlib.Path.cwd(), show_default=True,
    help="directory where i can access node.exe, note: Not its actual path",
    type=click.Path(exists=True)
)
@click.option(
    '-s', '--save', default=pathlib.Path.cwd(), show_default=True,
    help='Parent Folder of the expected results', type=click.Path()
)
@click.option('-d', help="Show only demo results", default=False, flag_value=True)
def init_shipment(saved_to_dir: str, name: str, parent_folder: str):
    click.echo(f"Will be saved in the dir: {saved_to_dir}")


if __name__ == "__main__":
    init_shipment()
