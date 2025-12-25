#!/usr/bin/env python3
"""
Automated Code Formatting and Import Sorting Script
Fixes all code quality issues using black and isort
"""

import subprocess
import sys
from pathlib import Path


def run_command(cmd, description):
    """Run a command and return success status"""
    print(f"\n🔧 {description}")
    print("-" * 50)

    try:
        result = subprocess.run(
            cmd, shell=True, capture_output=True, text=True, cwd="."
        )

        if result.returncode == 0:
            print("✅ SUCCESS")
            if result.stdout.strip():
                print(result.stdout.strip())
        else:
            print("❌ FAILED")
            if result.stderr.strip():
                print("STDERR:", result.stderr.strip())
            return False

    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

    return True


def format_code():
    """Format code using black and isort"""

    print("🎨 AUTOMATED CODE FORMATTING")
    print("=" * 60)

    success = True

    # Step 1: Sort imports with isort
    if not run_command(
        "python -m isort scripts/ backend/ --profile black --check-only --diff",
        "Checking import sorting issues",
    ):
        print("⚠️  Import sorting issues found. Fixing...")
        if not run_command(
            "python -m isort scripts/ backend/ --profile black", "Fixing import sorting"
        ):
            success = False

    # Step 2: Format code with black
    if not run_command(
        "python -m black --check --diff scripts/ backend/",
        "Checking code formatting issues",
    ):
        print("⚠️  Code formatting issues found. Fixing...")
        if not run_command(
            "python -m black scripts/ backend/", "Fixing code formatting"
        ):
            success = False

    # Step 3: Final verification
    print("\n🔍 FINAL VERIFICATION")
    print("-" * 30)

    isort_ok = run_command(
        "python -m isort scripts/ backend/ --profile black --check-only",
        "Verifying import sorting",
    )
    black_ok = run_command(
        "python -m black --check scripts/ backend/", "Verifying code formatting"
    )

    if isort_ok and black_ok:
        print("\n🎉 CODE FORMATTING COMPLETED SUCCESSFULLY")
        print("✅ All imports properly sorted")
        print("✅ All code properly formatted")
        return True
    else:
        print("\n⚠️  Some formatting issues remain")
        return False


def create_pre_commit_config():
    """Create pre-commit configuration for automated formatting"""

    pre_commit_config = """repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.4.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-added-large-files

  - repo: https://github.com/pycqa/isort
    rev: 5.12.0
    hooks:
      - id: isort
        args: ["--profile", "black"]

  - repo: https://github.com/psf/black
    rev: 23.9.1
    hooks:
      - id: black
        language_version: python3.11

  - repo: https://github.com/pycqa/flake8
    rev: 6.0.0
    hooks:
      - id: flake8
        args: [--max-line-length=120, --extend-ignore=E203,W503]

  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.5.1
    hooks:
      - id: mypy
        additional_dependencies: [types-all]
        args: [--ignore-missing-imports]
"""

    config_path = Path(".pre-commit-config.yaml")
    with open(config_path, "w") as f:
        f.write(pre_commit_config)

    print(f"✅ Created pre-commit configuration: {config_path}")


def create_formatting_script():
    """Create a script for easy code formatting"""

    script_content = """#!/usr/bin/env python3
\"\"\"
Code Formatting Helper Script
Run this to format all code in the project
\"\"\"

import subprocess
import sys

def format_code():
    print("🎨 FORMATTING CODE...")

    # Sort imports
    print("📦 Sorting imports...")
    subprocess.run([sys.executable, "-m", "isort", "scripts/", "backend/", "--profile", "black"], check=True)

    # Format code
    print("🎨 Formatting code...")
    subprocess.run([sys.executable, "-m", "black", "scripts/", "backend/"], check=True)

    print("✅ Code formatting complete!")

if __name__ == "__main__":
    format_code()
"""

    script_path = Path("scripts/format_code.py")
    with open(script_path, "w") as f:
        f.write(script_content)

    # Make it executable
    script_path.chmod(0o755)

    print(f"✅ Created formatting helper script: {script_path}")


def update_gitignore():
    """Update .gitignore to exclude formatting artifacts"""

    gitignore_content = """
# Code formatting artifacts
.coverage
.pytest_cache/
__pycache__/
*.pyc
*.pyo
*.pyd

# Environment files
.env
.env.local
.env.production
.env.production.keys.backup

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Logs
*.log
logs/

# Database
*.db
*.sqlite
*.sqlite3

# Node modules
node_modules/

# Build artifacts
build/
dist/
*.egg-info/
"""

    gitignore_path = Path(".gitignore")
    if gitignore_path.exists():
        with open(gitignore_path, "a") as f:
            f.write("\n# Added by automated formatting setup\n")
            f.write(gitignore_content)
    else:
        with open(gitignore_path, "w") as f:
            f.write(gitignore_content)

    print("✅ Updated .gitignore with formatting artifacts")


if __name__ == "__main__":
    if format_code():
        create_pre_commit_config()
        create_formatting_script()
        update_gitignore()

        print("\n🎉 AUTOMATED CODE FORMATTING SYSTEM IMPLEMENTED")
        print("📋 What was accomplished:")
        print("   ✅ Fixed all import sorting issues")
        print("   ✅ Fixed all code formatting issues")
        print("   ✅ Created pre-commit hooks configuration")
        print("   ✅ Created formatting helper script")
        print("   ✅ Updated .gitignore")
        print("\n🚀 Usage:")
        print("   python scripts/format_code.py  # Quick formatting")
        print("   pre-commit install             # Enable pre-commit hooks")
        print("   pre-commit run --all-files     # Run all checks")
    else:
        print("❌ Code formatting implementation failed")
        sys.exit(1)
