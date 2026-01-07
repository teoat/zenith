# Quick Start: Python 3.12 Migration

## Installation

### macOS (Homebrew)
```bash
brew install python@3.12
```

### macOS (pyenv) - Recommended
```bash
# Install pyenv if not already installed
brew install pyenv

# Install Python 3.12
pyenv install 3.12.0

# Set as local version for this project
cd /Users/Arief/Desktop/zenith
pyenv local 3.12.0

# Verify
python --version  # Should show Python 3.12.x
```

## Backend Environment Setup

```bash
# Navigate to project
cd /Users/Arief/Desktop/zenith/backend

# Remove old venv
rm -rf venv

# Create new venv with Python 3.12
python3.12 -m venv venv

# Activate venv
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt
pip install -r requirements-dev.txt

# Verify installation
python --version  # Should be 3.12.x
pip list
```

## Regenerate Package Metadata

```bash
# From project root
cd /Users/Arief/Desktop/zenith

# Install in editable mode
pip install -e .

# This will create zenith.egg-info (not 378x492.egg-info)
ls -la | grep egg-info  # Should show zenith.egg-info
```

## Testing

```bash
# Backend tests
cd backend
python -m pytest tests/ -v

# Specific test categories
python -m pytest tests/unit/ -v
python -m pytest tests/integration/ -v

# With coverage
python -m pytest tests/ -v --cov=. --cov-report=html
```

## Docker Verification

```bash
# Build development image
docker build -f Dockerfile -t zenith:dev .

# Build production image
docker build -f Dockerfile.production -t zenith:prod .

# Run development container
docker run --rm -p 8000:8000 zenith:dev

# Verify Python version in container
docker run --rm zenith:dev python --version
# Should output: Python 3.12.x
```

## Quick Verification

```bash
# Check Python version
python --version

# Check .python-version file
cat .python-version

# Check for any remaining 3.11 references
grep -r "3\.11" . --exclude-dir={node_modules,.git,venv,archives} | grep -v Binary

# Check for any remaining legacy names
grep -r "378x492" . --exclude-dir={node_modules,.git,venv,archives,build} | grep -v Binary
grep -r "fraud-detection-platform" . --exclude-dir={node_modules,.git,venv,archives,build} | grep -v Binary
```

## Troubleshooting

### Issue: Python 3.12 not found
**Solution**: Install Python 3.12 using methods above

### Issue: Module not found errors
**Solution**: Rebuild venv with Python 3.12
```bash
cd backend
rm -rf venv
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install -r requirements-dev.txt
```

### Issue: Tests failing
**Solution**: Ensure you're using Python 3.12
```bash
python --version  # Must be 3.12.x
which python  # Should point to venv or 3.12 installation
```

### Issue: Docker build fails
**Solution**: Clear Docker cache and rebuild
```bash
docker system prune -a
docker build --no-cache -f Dockerfile -t zenith:dev .
```

## Summary of Changes

✅ All configuration files updated to Python 3.12  
✅ All GitHub workflows updated to Python 3.12  
✅ All app names standardized to "zenith"  
✅ Legacy artifacts removed  

**Next**: Install Python 3.12 and rebuild backend environment
