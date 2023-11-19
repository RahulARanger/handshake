# -*- mode: python ; coding: utf-8 -*-
import pathlib
import platform

a = Analysis(
    [str(pathlib.Path("graspit") / "services" / "starter.py")],
    pathex=[],
    binaries=[],
    datas=[],
    hiddenimports=["tracerite", "html5tagger"],
    hookspath=[
        "pyinstaller-hooks",
    ],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name=f"graspit-{platform.system()}",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
