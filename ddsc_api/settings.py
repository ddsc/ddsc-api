# Base Django settings, suitable for production.
# Imported (and partly overridden) by developmentsettings.py which also
# imports localsettings.py (which isn't stored in svn).  Buildout takes care
# of using the correct one.
# So: "DEBUG = TRUE" goes into developmentsettings.py and per-developer
# database ports go into localsettings.py.  May your hear turn purple if you
# ever put personal settings into this file or into developmentsettings.py!

import os
import tempfile

import django.conf.global_settings as DEFAULT_SETTINGS

from lizard_ui.settingshelper import setup_logging
from lizard_ui.settingshelper import STATICFILES_FINDERS

STATICFILES_FINDERS = STATICFILES_FINDERS

# Set matplotlib defaults.
# Uncomment this when using lizard-map.
# import matplotlib
# # Force matplotlib to not use any Xwindows backend.
# matplotlib.use('Agg')
# import lizard_map.matplotlib_settings

# SETTINGS_DIR allows media paths and so to be relative to this settings file
# instead of hardcoded to c:\only\on\my\computer.
SETTINGS_DIR = os.path.dirname(os.path.realpath(__file__))

# BUILDOUT_DIR is for access to the "surrounding" buildout, for instance for
# BUILDOUT_DIR/var/static files to give django-staticfiles a proper place
# to place all collected static files.
BUILDOUT_DIR = os.path.abspath(os.path.join(SETTINGS_DIR, '..'))

# Set up logging. No console logging. By default, var/log/django.log and
# sentry at 'WARN' level.
LOGGING = setup_logging(BUILDOUT_DIR, console_level=None, sentry_level='WARN')

# Production, so DEBUG is False. developmentsettings.py sets it to True.
DEBUG = False
# Show template debug information for faulty templates.  Only used when DEBUG
# is set to True.
TEMPLATE_DEBUG = True

# ADMINS get internal error mails, MANAGERS get 404 mails.
ADMINS = (
    # ('Your Name', 'your_email@domain.com'),
)
MANAGERS = ADMINS

# TODO: Switch this to the real production database.
# ^^^ 'postgresql_psycopg2', 'postgresql', 'mysql', 'sqlite3' or 'oracle'.
# In case of geodatabase, prepend with:
# django.contrib.gis.db.backends.(postgis)
DATABASES = {
    # Note: public repo, use localsettings!
    # override me in localsettings
}

POSTGIS_VERSION = (1,5,3)

# Almost always set to 1.  Django allows multiple sites in one database.
SITE_ID = 1

# Local time zone for this installation. Choices can be found here:
# http://en.wikipedia.org/wiki/List_of_tz_zones_by_name although not all
# choices may be available on all operating systems.  If running in a Windows
# environment this must be set to the same as your system time zone.
TIME_ZONE = 'UTC'
USE_TZ = True

# Language code for this installation. All choices can be found here:
# http://www.i18nguy.com/unicode/language-identifiers.html
LANGUAGE_CODE = 'en-US'
# For at-runtime language switching.  Note: they're shown in reverse order in
# the interface!
LANGUAGES = (
    ('en', 'English'),
    ('nl', 'Nederlands'),
)
# If you set this to False, Django will make some optimizations so as not to
# load the internationalization machinery.
USE_I18N = True

# Absolute path to the directory that holds user-uploaded media.
MEDIA_ROOT = os.path.join(BUILDOUT_DIR, 'var', 'media')
# Absolute path to the directory where django-staticfiles'
# "bin/django build_static" places all collected static files from all
# applications' /media directory.
STATIC_ROOT = os.path.join(BUILDOUT_DIR, 'var', 'static')

# URL that handles the media served from MEDIA_ROOT. Make sure to use a
# trailing slash if there is a path component (optional in other cases).
MEDIA_URL = '/media/'
# URL for the per-application /media static files collected by
# django-staticfiles.  Use it in templates like
# "{{ MEDIA_URL }}mypackage/my.css".
STATIC_URL = '/static_media/'

# Make this unique, and don't share it with anybody.
# override me in localsettings
SECRET_KEY = ''

ROOT_URLCONF = 'ddsc_api.urls'

TEST_RUNNER = 'django_nose.NoseTestSuiteRunner'

CACHES = {
    'default': {
        'KEY_PREFIX': BUILDOUT_DIR,
        'BACKEND': 'django.core.cache.backends.memcached.MemcachedCache',
        'LOCATION': '127.0.0.1:11211',
    }
}

MIDDLEWARE_CLASSES = (
    # Gzip needs to be at the top.
    'django.middleware.gzip.GZipMiddleware',
    # Below is the default list, don't modify it.
    'django.middleware.locale.LocaleMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    # Lizard security.
    'tls.TLSRequestMiddleware',
    'dikedata_api.middleware.AuthenticationMiddleware',
    'lizard_security.middleware.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'ddsc_api.middleware.DisableClientSideCaching',
)

AUTHENTICATION_BACKENDS = (
    'django.contrib.auth.backends.ModelBackend',
    'lizard_auth_client.backends.SSOBackend',
    'lizard_security.backends.DDSCPermissionBackend',
)

INSTALLED_APPS = (
    'lizard_security',
    'ddsc_api',
    'ddsc_core',
    'dikedata_api',
    'lizard_ui',
    'lizard_map',
    'lizard_maptree',
    'lizard_wms',
    'ddsc_site', # depends on lizard_wms & lizard_security
    'rest_framework',
    'south',
    'compressor',
    'staticfiles',
    'django_extensions',
    'corsheaders',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.gis',
    'django.contrib.markup',
    'django.contrib.sessions',
    'django.contrib.sites',
    'gunicorn',
    'treebeard',
    'raven.contrib.django',
    'haystack',
)

REST_FRAMEWORK = {
    'DEFAULT_RENDERER_CLASSES': (
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',
    ),
    'DEFAULT_PARSER_CLASSES': (
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.FormParser',
        'dikedata_api.parsers.SimpleFileUploadParser',
    ),
    'FILTER_BACKEND': 'rest_framework.filters.DjangoFilterBackend',
    'PAGINATE_BY': 10,
    'PAGINATE_BY_PARAM': 'page_size'
}

CORS_ORIGIN_ALLOW_ALL = False
CORS_ALLOW_CREDENTIALS = True
# Package corsheaders offers either ALLOW_ALL, or a whitelist.
# In the future, we might want to pass the request header Origin as-is
# in the response.
CORS_ORIGIN_WHITELIST = [
    '127.0.0.1',
    '192.168.56.101',
    '33.33.33.10',
    'dijkdata.nl',
    'test.dijkdata.nl',
    'ddsc.github.com',
]

SSO_ENABLED = False

HAYSTACK_CONNECTIONS = {
    'default': {
        'ENGINE': 'haystack.backends.solr_backend.SolrEngine',
        'URL': 'http://127.0.0.1:8080/solr'
    },
}

# TODO: Put your real url here to configure Sentry.
# override me in localsettings
SENTRY_DSN = None

# override me in localsettings
UI_GAUGES_SITE_ID = ''

TEMPLATE_CONTEXT_PROCESSORS = DEFAULT_SETTINGS.TEMPLATE_CONTEXT_PROCESSORS + (
    'django.core.context_processors.request',  # treebeard
)

# Enable realtime updating of the index.
# This has a negative impact on performance.
# In high load environments, this should be done by an hourly cronjob.
HAYSTACK_SIGNAL_PROCESSOR = 'haystack.signals.RealtimeSignalProcessor'

AUTH_PROFILE_MODULE = 'ddsc_site.UserProfile'

try:
    # For local production overrides (DB passwords, for instance)
    from ddsc_api.localsettings import *  # NOQA
    # for ddsc, the following stuff need to be defined in localsettings.py,
    # and shared across the various Django instances.
    #DATABASES
    #SECRET_KEY
    #UI_GAUGES_SITE_ID
    #SESSION_COOKIE_DOMAIN
    #SESSION_COOKIE_NAME
    #DATABASE_ROUTERS
except ImportError:
    pass
