from setuptools import setup, find_packages

packages = find_packages(
    exclude=["wdio-next-dashboard", "venv"]
)

setup(
    name='WDIO-NEXT-PY',
    version='0.1.0',
    url='https://github.com/RahulARanger/wdio-next-python',
    license='MIT License',
    author='Rahul A Ranger',
    author_email='saihanumarahul66@gmail.com',
    description='Utilizing Nextjs for dashboard and python for test result processing',
    packages=packages,
    include_package_data=True,
    install_requires=[
        'Click',
    ],
    entry_points={
        'console_scripts': [
            'pynw = src:cli',
        ],
    }
)
