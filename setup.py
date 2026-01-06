from setuptools import find_packages, setup

setup(
    name="zenith",
    version="0.1.0",
    description="Investigation platform",
    packages=find_packages(exclude=("tests", "build", "dist", "release")),
    include_package_data=True,
)
