import click
import pathlib
from shipment import init_repo, export_results


@click.command()
@click.option('-o', '--out', default="results", help='Export folder name', show_default=True)
@click.option(
    '-s', '--save', default=pathlib.Path.cwd(), show_default=True,
    help='Parent Folder of the expected results', type=click.Path()
)
@click.option(
    '-f', '--force', default=False, flag_value=True,
    help='Instead of copying the next dashboard everytime,'
    'we store the templates in a folder for quickly generating the results, use this to generate the results from '
    'beginning',
    show_default=True
)
@click.option('-d', '--demo', help="Show only demo results", default=False, flag_value=True)
def init_shipment(out: str, save: str, force: bool, demo: bool):
    root = pathlib.Path(save)

    results_dir = init_repo(out, root, force)
    export_results(results_dir)


if __name__ == "__main__":
    init_shipment()
