from click import group, argument, Path as C_Path

general_requirement = argument(
    "COLLECTION_PATH", nargs=1, type=C_Path(exists=True, dir_okay=True), required=True
)
general_but_optional_requirement = argument(
    "COLLECTION_PATH", nargs=1, type=C_Path(dir_okay=True), required=True
)


@group(
    name="Graspit",
    short_help="Graspit command",
    help=f"""

{'{:*^69}'.format(" Welcome to Graspit's CLI ")}

Graspit simplifies the collection and processing of test results. The Graspit CLI serves as the foundation for essential operations.
Each command requires a <path> argument, representing the collection folder, often named as `collectionName` in your `rootDir`.

[ROOT-DIR] >> [COLLECTION_NAME] (*we need this) >> TeStReSuLtS.db & [Attachments] (for getting this).

{'{:*^69}'.format(" Glossary ")}\n
* [COLLECTION_NAME]: The name of the directory where you allow us to save our results in the [ROOT_DIR]\n
* [COLLECTION_PATH]: [ROOT_DIR]/[COLLECTION_NAME]
""",
)
def handle_cli():
    pass
