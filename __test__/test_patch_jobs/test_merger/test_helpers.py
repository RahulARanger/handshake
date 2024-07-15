from tortoise.connection import connections
from subprocess import call
from handshake.services.DBService.lifecycle import writtenAttachmentFolderName, db_path


async def test_zipper(
    helper_to_create_test_and_session,
    create_session_with_hierarchy_with_no_retries,
    root_dir_1,
    create_tests,
    create_suite,
    create_static_attachment,
):
    first_connection = connections.get(root_dir_1.name)
    sample = await helper_to_create_test_and_session(connection=first_connection)
    suite = await create_suite(sample.sessionID, connection=first_connection)
    tests = await create_tests(
        sample.sessionID, suite.suiteID, connection=first_connection
    )
    await create_static_attachment(
        root_dir_1, tests[0].suiteID, suite.suiteID, connection=first_connection
    )

    assert (
        call(f'handshake zip-results "{root_dir_1}"', shell=True, cwd=root_dir_1) == 0
    )

    assert (root_dir_1 / f"{root_dir_1.name}.tar.bz2").exists()
    (root_dir_1 / f"{root_dir_1.name}.tar.bz2").unlink()

    assert (
        call(
            f'handshake zip-results "{root_dir_1}" -o "{root_dir_1}"',
            shell=True,
        )
        == 0
    )

    assert (root_dir_1 / f"{root_dir_1.name}.tar.bz2").exists()

    assert (
        call(
            f'handshake zip-results "{root_dir_1}" --out "{root_dir_1}"',
            shell=True,
        )
        == 0
    )
    assert (root_dir_1 / f"{root_dir_1.name}.tar.bz2").exists()
    (root_dir_1 / f"{root_dir_1.name}.tar.bz2").unlink()


async def test_extract(
    helper_to_create_test_and_session,
    create_session_with_hierarchy_with_no_retries,
    root_dir_1,
    root_dir_2,
    create_tests,
    create_suite,
    create_static_attachment,
):
    first_connection = connections.get(root_dir_1.name)
    sample = await helper_to_create_test_and_session(connection=first_connection)
    suite = await create_suite(sample.sessionID, connection=first_connection)
    tests = await create_tests(
        sample.sessionID, suite.suiteID, connection=first_connection
    )
    written = await create_static_attachment(
        root_dir_1, tests[0].suiteID, suite.suiteID, connection=first_connection
    )

    assert (
        call(f'handshake zip-results "{root_dir_1}"', shell=True, cwd=root_dir_1) == 0
    )

    file_name = f"{root_dir_1.name}.tar.bz2"
    assert (root_dir_1 / file_name).exists()

    assert (
        call(f'handshake extract-results "{file_name}"', shell=True, cwd=root_dir_1)
        == 0
    )

    async def helper_test_attachment(folder_name: str):
        new_test_results = root_dir_1 / folder_name
        assert new_test_results.exists()
        attachment = new_test_results / writtenAttachmentFolderName
        assert attachment.exists()

        assert (
            attachment / str(suite.suiteID) / written.attachmentValue["value"]
        ).exists()

        assert db_path(new_test_results).exists()

    await helper_test_attachment(root_dir_1.name)

    assert (
        call(
            f'handshake extract-results "{file_name}" -o sample_name',
            shell=True,
            cwd=root_dir_1,
        )
        == 0
    )

    await helper_test_attachment("sample_name")

    assert (
        call(
            f'handshake extract-results "{file_name}" --out sample_name',
            shell=True,
            cwd=root_dir_1,
        )
        == 0
    )

    await helper_test_attachment("sample_name")
