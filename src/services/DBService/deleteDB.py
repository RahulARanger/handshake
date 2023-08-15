from pathlib import Path


def delete_db(main_file: Path):
    shm = main_file.parent / (main_file.name + "-shm")
    wal = main_file.parent / (main_file.name + "-wal")
    shm.unlink(missing_ok=True)
    wal.unlink(missing_ok=True)
    main_file.unlink(missing_ok=True)
