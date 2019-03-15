import os
from os.path import dirname, exists, join, realpath, relpath
from setuptools import setup
from sys import platform
import shutil

ROOT = dirname(realpath(__file__))
ENV_PATH = os.path.dirname(shutil.which('python'))
print('-- ENV PATH: {}'.format(ENV_PATH))

def get_package_data():
    print('-- GET PACKAGE DATA')

    def get_file_paths(main_path=None, filters=()):
        ''' @filters = ('.html')
        '''
        main_path = join(ROOT, main_path)
        print('>> OCEAN DATA QC JS PATH: {}'.format(main_path))
        if not exists(main_path) or main_path is None:
            raise RuntimeError("packaging non-existent path: %s" % main_path)

        file_paths = []
        for path, dirs, files in os.walk(main_path):
            path = relpath(path, main_path)
            print('>> OCEAN DATA QC JS rel PATH: {}'.format(path))
            for f in files:
                if not filters or f.endswith(filters):
                    file_paths.append(join(path, f))
        print('>> PACKAGE DATA: {}'.format(file_paths))
        return file_paths

    return {
        'ocean_data_qc': [
            'templates/*.*',
            'files/*.json',
        ] + ['static/' + x for x in get_file_paths('ocean_data_qc/static')] + ['octave/' + x for x in get_file_paths('ocean_data_qc/octave')]
        # 'ocean_data_qc_js': get_file_paths('ocean_data_qc_js')
    }

requires = [
    'bokeh >=0.13.0',
    'pandas >=0.23.4',
    'seawater >=3.3.4',
    'more_itertools >=4.3.0',
    'oct2py >=4.0.6',  # this should install scipy automatically
    'scipy >=1.1.0',
    'tilecloud'
]

# TODO: when python setup.py develop >> jupyter lab should be installed as well to make tests

dependency_links = [
    'https://github.com/ocean-data-qc/tilecloud/tarball/master#egg=tilecloud'
]

if platform == "win32":
    requires.append('python-magic-win64 >=0.4.13')  # depends on python-magic and adds the DLL libmagic library

setup(
    name='ocean_data_qc',
    version='0.8.0',                                    # TODO: extract the version from package.json
    description='WHP file managing',
    # long_description=open("README.md").read(),        # TODO: Create some long description
    # long_description_content_type="text/markdown",
    keywords="ocean data quality control seawater csv whp",
    url='https://www.atlantos-h2020.eu/',
    author='Jesus Cacabelos',
    author_email='jcacabelos@iim.csic.es',
    license='MIT',
    install_requires=requires,
    dependency_links=dependency_links,
    packages=[
        'ocean_data_qc',
        'ocean_data_qc.bokeh_models',
        'ocean_data_qc.data_models',
        'ocean_data_qc.octave'
    ],
    package_data=get_package_data(),
    zip_safe=False,
)

# TODO: remove conda-meta in the environment folder (removing absolute paths)
# TODO: remove shebangs

# NOTE: if for some reason they are in readonly mode
#       https://stackoverflow.com/questions/2656322/shutil-rmtree-fails-on-windows-with-access-is-denied
conda_meta = os.path.join(ENV_PATH, 'conda-meta')
if os.path.isdir(conda_meta):
    print('>> REMOVING CONDA-META: {}'.format(conda_meta))
    shutil.rmtree(conda_meta)

# fn = 0
# for root, subdirs, files in os.walk(ENV_PATH):  # root == ENV_PATH
#     print('>> ROOT: {}'.format(root))
#     for filename in files:
#         # TODO: make some filter to do it faster

#         fn += 1
#         if fn % 100 == 0:
#             print('>> FILE NUMBER: {}'.format(fn))
#         file_path = os.path.join(root, filename)
#         try:
#             with open(file_path, 'r') as f:
#                 lines = f.readlines()
#             with open(file_path, 'w') as f:
#                 for line in lines:
#                     f.write(re.sub(r'^#!.*\n', '\n', line))   # TODO: only first line >> faster
#             # print('>> REPLACEMENT DONE IN: {}'.format(file_path))
#         except Exception as e:
#             pass
#             # print('>> ERROR READING FILE: {}'.format(file_path))


# TODO: this is the correct shebang to use >> #!/usr/bin/env python3
#       https://stackoverflow.com/a/19305076/4891717
python_map = [
    '^#! /usr/bin/env python',
    '^#!python',
    '^#!.*python.exe',  # absolute paths
]