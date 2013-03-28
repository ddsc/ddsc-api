# (c) Nelen & Schuurmans.  MIT licensed, see LICENSE.rst.
from django.conf.urls.defaults import include
from django.conf.urls.defaults import patterns
from django.conf.urls.defaults import url
from django.contrib import admin
from django.views.generic.simple import redirect_to
from lizard_ui.urls import debugmode_urlpatterns

from .views import Root

admin.autodiscover()

urlpatterns = patterns(
    '',
    url(r'^$', redirect_to, {'url': 'api/v1'}),
    url(r'^api$', redirect_to, {'url': 'api/v1'}),
    url(r'^admin/', include(admin.site.urls)),
    url(r'^api/v1/$', Root.as_view()),

    url(r'^api/', include('dikedata_api.urls')),
    url(r'^api/', include('ddsc_site.urls')),

)

urlpatterns += debugmode_urlpatterns()
