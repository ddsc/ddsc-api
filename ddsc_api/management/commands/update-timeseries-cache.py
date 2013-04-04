from django.core.management.base import BaseCommand
from ddsc_core.models import Timeseries, DataStore
from datetime import timedelta


class Command(BaseCommand):

    def handle(self, *args, **options):
        store = DataStore()
        timeseries = Timeseries.objects.all()

        for ts in timeseries:
            first_cache = ts.first_value_timestamp
            last_cache = ts.latest_value_timestamp
            last_cache_value = ts.latest_value()
            if not first_cache or not last_cache:
                continue
            data = store.read('events', ts.uuid, ts.first_value_timestamp, ts.latest_value_timestamp + timedelta(seconds=1))
            first_store = None
            last_store = None
            last_store_value = None
            try:
                first_store = data.first_valid_index()
                last_store = data.last_valid_index()
                row = data.tail(1).to_dict()
                if 'value' in row:
                    last_store_value = row['value'].values()[0]
            except IndexError:
                pass

            print "============================================================"
            print "%s (cache): %s - %s - %s" % (ts, first_cache, last_cache, last_cache_value)
            print "%s (store): %s - %s - %s" % (ts, first_store, last_store, last_store_value)
            
            # Update cache
            ts.first_value_timestamp = first_store
            ts.latest_value_timestamp = last_store
            if ts.value_type == Timeseries.ValueType.INTEGER:
                ts.latest_value_number = None
                if last_store_value:
                    ts.latest_value_number = int(float(last_store_value))
            if ts.value_type == Timeseries.ValueType.FLOAT:
                ts.latest_value_number = None
                if last_store_value:
                    ts.latest_value_number = float(last_store_value)
            if ts.value_type == Timeseries.ValueType.TEXT:
                ts.latest_value_text = last_store_value
            ts.save()
