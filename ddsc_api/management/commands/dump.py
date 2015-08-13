from django.core.management.base import BaseCommand
from django.contrib.gis.db.models import Model
from django.db.models.loading import get_model
from datetime import datetime, date
from django.contrib.gis.geos import Point

import json

APP_LABEL = 'ddsc_core'
IDENTIFIERS = ['uuid', 'code', 'username', 'name']


def get(item, key):
    val = getattr(item, key)
    if issubclass(type(val), Model):
        for id in IDENTIFIERS:
            if hasattr(val, id):
                return ("{}.{}".format(key, id), getattr(val, id))
        raise Exception("Don't know how to identify '%s'" % type(val))
    if isinstance(val, (datetime, date, Point)):
        val = str(val)
    return (key, val)


class Command(BaseCommand):

    def handle(self, model_name, limit=1000000, *args, **options):
        model = get_model(APP_LABEL, model_name)
        if model is None:
            raise Exception("Model '%s' not found" % model_name)

        for item in model.objects.all()[:limit]:
            if model_name != 'Location' or item.timeseries.count() > 0:
                props = dict(get(item, key.name) for key in model._meta.fields if key.name[:1] != '_')
                if model_name == 'Timeseries':
                    for data_set in item.data_set.all():
                        props['data_set.name'] = data_set.name
                        if data_set.owner is not None:
                            props['data_set_owner.name'] = data_set.owner.name
                print(json.dumps(props, sort_keys=True))
