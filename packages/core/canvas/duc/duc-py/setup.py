from setuptools import setup, find_packages

setup(
    name='duc-py',
    version='0.1.0',
    packages=['Duc'] + find_packages(),
    install_requires=['flatbuffers', 'nanoid'],
)