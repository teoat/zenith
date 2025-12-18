# Simplified PyInstaller spec for backend
import os
from PyInstaller.utils.hooks import collect_submodules

# Only include essential data files
datas = [
    ('core/config.py', 'core'),
    ('core/database.py', 'core'),
    ('core/logging.py', 'core'),
    ('core/validation.py', 'core'),
    ('models/models.py', 'models'),
    ('models/evidence.py', 'models'),
    ('../services/fraud_detection.py', 'services'),
    ('../services/auth.py', 'services'),
]

# Essential hidden imports
hiddenimports = [
    # Core web framework
    'fastapi',
    'uvicorn',
    'uvicorn.main',
    'uvicorn.server',
    'starlette',
    'starlette.applications',
    'starlette.routing',
    'starlette.responses',
    'starlette.middleware',
    'starlette.middleware.cors',

    # Database
    'sqlalchemy',
    'sqlalchemy.orm',
    'sqlalchemy.engine',
    'sqlite3',

    # Authentication
    'python_jose',
    'passlib',
    'bcrypt',

    # Async
    'asyncio',
    'aiofiles',

    # Other essentials
    'dotenv',
    'pydantic',
]

# Add some commonly needed submodules
hiddenimports += collect_submodules('starlette')
hiddenimports += collect_submodules('fastapi')

a = Analysis(
    ['main.py'],
    pathex=['.'],
    binaries=[],
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    runtime_hooks=[],
    excludes=[
        # GUI libraries
        'tkinter',
        'matplotlib',
        'PyQt5',
        'PyQt6',
        'wx',
        'pygame',

        # Testing libraries
        'pytest',
        'unittest',

        # Development tools
        'pdb',
        'profile',

        # Unused scientific computing
        'scipy',
        'numpy.testing',
        'pandas.tests',
    ],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=None,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=None)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='backend',
    debug=False,
    bootloader_ignore_signals=False,
    strip=True,
    upx=True,
    runtime_tmpdir=None,
    console=True,  # Keep console for debugging
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)