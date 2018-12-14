from setuptools import setup
import os
from os.path import dirname, exists, join, realpath, relpath

ROOT = dirname(realpath(__file__))


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
            'static/css/*.*',
            'static/font-awesome-v5.3.1/css/*.*',
            'static/font-awesome-v5.3.1/webfonts/*.*',
            'templates/*.*',
            'files/*.json',
        ],
        # 'ocean_data_qc_js': get_file_paths('ocean_data_qc_js')
    }

REQUIRES = [
    'bokeh >=0.13.0',
    'pandas >=0.23.4',
    'seawater >=3.3.4',
    'more_itertools >=4.3.0',
    'oct2py >=4.0.6',  # this should install scipy automatically
    'scipy >=1.1.0'
]

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
    install_requires=REQUIRES,
    packages=[
        'ocean_data_qc',
        'ocean_data_qc.bokeh_models',
        'ocean_data_qc.data_models',
    ],
    package_data=get_package_data(),
    zip_safe=False,
)