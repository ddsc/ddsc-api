from django.utils.cache import add_never_cache_headers

class DisableClientSideCaching(object):
    def process_response(self, request, response):
        try:
            add_never_cache_headers(response)
        except:
            pass
        return response
