# pyinstaller.spec - Optimized for faster builds and smaller size
import os
from PyInstaller.utils.hooks import collect_data_files, collect_submodules

# Collect only essential data files (avoid collecting entire directories)
datas = [
    # Core configuration and database files
    ('core/config.py', 'core'),
    ('core/database.py', 'core'),
    ('core/logging.py', 'core'),
    ('core/validation.py', 'core'),
    # Only essential model files
    ('models/models.py', 'models'),
    ('models/evidence.py', 'models'),
    # Only essential service files
    ('../services/fraud_detection.py', 'services'),
    ('../services/auth.py', 'services'),
]

# Selective hidden imports - only what's actually needed
hiddenimports = [
    # FastAPI core
    'fastapi',
    'fastapi.applications',
    'fastapi.routing',
    'fastapi.responses',
    'fastapi.middleware',
    'fastapi.middleware.cors',
    'fastapi.staticfiles',
    'fastapi.templating',

    # Uvicorn core
    'uvicorn',
    'uvicorn.main',
    'uvicorn.server',
    'uvicorn.config',
    'uvicorn.loops.asyncio',

    # SQLAlchemy core
    'sqlalchemy',
    'sqlalchemy.orm',
    'sqlalchemy.ext.declarative',
    'sqlalchemy.engine',
    'sqlalchemy.pool',

    # Pydantic core
    'pydantic',
    'pydantic.main',
    'pydantic.fields',
    'pydantic.validators',

    # Database and async
    'aiosqlite',
    'sqlite3',

    # Fuzzy matching
    'thefuzz',
    'thefuzz.fuzz',
    'thefuzz.process',

    # Image processing (selective)
    'PIL',
    'PIL.Image',
    'PIL.ImageFilter',
    'PIL.ImageOps',

    # OpenCV (selective)
    'cv2',
]

# Add commonly needed submodules
hiddenimports += collect_submodules('starlette')  # FastAPI dependency
hiddenimports += collect_submodules('uvloop')     # Performance
hiddenimports += collect_submodules('cryptography')  # Security

a = Analysis(
    ['main.py'],
    pathex=['.'],
    binaries=[],
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    runtime_hooks=[],
    excludes=[
        # GUI libraries not needed for server
        'tkinter',
        'matplotlib',
        'matplotlib.pyplot',
        'PyQt5',
        'PyQt6',
        'PySide2',
        'PySide6',
        'wx',
        'kivy',
        'pygame',

        # System libraries not needed
        'curses',
        'readline',

        # Testing libraries (not needed in production)
        'pytest',
        'unittest',
        'doctest',

        # Development tools
        'pdb',
        'profile',
        'pstats',

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
    strip=True,  # Enable stripping to reduce size
    upx=True,    # Enable UPX compression
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,  # Hide console in production
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)