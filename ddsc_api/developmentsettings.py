from lizard_ui.settingshelper import setup_logging

from ddsc_api.settings import *

DEBUG = True

# By default, var/log/django.log gets WARN level logging, the console gets
# DEBUG level logging.
LOGGING = setup_logging(BUILDOUT_DIR)

# ENGINE: 'postgresql_psycopg2', 'postgresql', 'mysql', 'sqlite3' or 'oracle'.
# In case of geodatabase, prepend with:
# django.contrib.gis.db.backends.(postgis)
DATABASES = {
    # If you want to use another database, consider putting the database
    # settings in localsettings.py. Otherwise, if you change the settings in
    # the current file and commit them to the repository, other developers will
    # also use these settings whether they have that database or not.
    # One of those other developers is Jenkins, our continuous integration
    # solution. Jenkins can only run the tests of the current application when
    # the specified database exists. When the tests cannot run, Jenkins sees
    # that as an error.
    'default': {
        'NAME': 'ddsc_api',
        'ENGINE': 'django.contrib.gis.db.backends.postgis',
        'USER': 'buildout',
        'PASSWORD': 'xxxxxxxx',
        'HOST': '',  # empty string for localhost.
        'PORT': '',  # empty string for default.
        }
    }


try:
    from ddsc_api.localsettings import *
    # For local dev overrides.
except ImportError:
    pass
