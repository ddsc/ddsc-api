# (c) Nelen & Schuurmans.  MIT licensed, see LICENSE.rst.
from django.conf.urls.defaults import include
from django.conf.urls.defaults import patterns
from django.conf.urls.defaults import url
from django.contrib import admin
from django.views.generic.simple import redirect_to
from lizard_ui.urls import debugmode_urlpatterns


admin.autodiscover()

urlpatterns = patterns(
    '',
    url(r'^$', redirect_to, {'url': 'api'}),
    url(r'^admin/', include(admin.site.urls)),
    url(r'^api/', include('dikedata_api.urls')),
)

urlpatterns += debugmode_urlpatterns()
