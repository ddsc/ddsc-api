# (c) Nelen & Schuurmans.  MIT licensed, see LICENSE.rst.
from django.conf.urls.defaults import include
from django.conf.urls.defaults import patterns
from django.conf.urls.defaults import url
from django.contrib import admin
from lizard_ui.urls import debugmode_urlpatterns

from ddsc_api import views

admin.autodiscover()

urlpatterns = patterns(
    '',
#    url(r'^$', HomepageView.as_view()),
    url(r'^admin/', include(admin.site.urls)),
    url(r'^ui/', include('lizard_ui.urls')),
    url(r'^api/', include('dikedata_api.urls')),
    # url(r'^something/',
    #     views.some_method,
    #     name="name_it"),
    # url(r'^something_else/$',
    #     views.SomeClassBasedView.as_view(),
    #     name='name_it_too'),
    )
urlpatterns += debugmode_urlpatterns()
