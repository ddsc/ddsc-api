from ddsc_api.settings import *

DATABASES = {
    # Changed server from production to staging
    'default': {
        'NAME': 'ddsc_api',
        'ENGINE': 'django.contrib.gis.db.backends.postgis',
        'USER': 'ddsc_api',
        'PASSWORD': 'xxxxxxxx',
        'HOST': 'yyyyyyyy',
        'PORT': '5432',
        },
    }

CASSANDRA = {
        'servers': [
            '10.100.235.201:9160',
            '10.100.235.202:9160',
            '10.100.235.203:9160',
            '10.100.235.204:9160'
        ],
        'keyspace': 'ddsc',
        'column_family': 'timeseries',
    }

RABBITMQ = {
    'server': 'p-flod-rmq-d1.external-nens.local',
    'vhost': 'ddsc-development',
    'user': 'ddsc',
    'password': 'xxxxxxxxxxxx'
}

# TODO: add staging gauges ID here.
UI_GAUGES_SITE_ID = ''  # Staging has a separate one.
