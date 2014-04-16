from setuptools import setup

version = '0.5.dev0'

long_description = '\n\n'.join([
    open('README.rst').read(),
    open('CREDITS.rst').read(),
    open('CHANGES.rst').read(),
    ])

install_requires = [
    'Django',
    'ddsc-logging',
    'ddsc-core',
    'ddsc-opendap',
    'ddsc-site',
    'dikedata-api',
    'django-cors-headers',
    'django-extensions',
    'django-haystack >= 2.0',
    'django-nose',
    'gunicorn',
    'lizard-security',
    'lizard-auth-client',
    'lizard-ui >= 4.0b5',
    'lxml >= 3.0',
    'pyproj',
    'python-magic',
    'python-memcached',
    'raven',
    'requests',
    'tslib',
    'werkzeug',
    ],

setup(name='ddsc-api',
      version=version,
      description="TODO",
      long_description=long_description,
      # Get strings from http://www.python.org/pypi?%3Aaction=list_classifiers
      classifiers=['Programming Language :: Python',
                   'Framework :: Django',
                   ],
      keywords=[],
      author='Reinout van Rees',
      author_email='reinout.vanrees@nelen-schuurmans.nl',
      url='',
      license='MIT',
      packages=['ddsc_api'],
      include_package_data=True,
      zip_safe=False,
      install_requires=install_requires,
      entry_points={
          'console_scripts': [
          ]},
      )
