from setuptools import setup, find_packages

setup(
    name="ducflair-duc",
    version='1.2.3',
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    description="The duc 2D CAD file format Python implementation",
    long_description=open("README.md").read(),
    long_description_content_type="text/markdown",
    author="Ducflair",
    author_email="support@ducflair.com",
    url="https://github.com/ducflair/duc/tree/main/packages/duc-py",
    license="MIT",
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.7",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
    ],
    python_requires=">=3.7",
)