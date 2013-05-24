# (c) Nelen & Schuurmans.  MIT licensed, see LICENSE.rst.
from __future__ import absolute_import, division
from __future__ import print_function, unicode_literals

from collections import OrderedDict

from django.shortcuts import render_to_response
from django.template import RequestContext
from django.views.generic import TemplateView

from lizard_security.models import DataOwner, PermissionMapper

from rest_framework import exceptions as ex
from rest_framework.response import Response
from rest_framework.reverse import reverse
from rest_framework.views import APIView

from ddsc_core.models import IdMapping, Timeseries
from dikedata_api import serializers
from dikedata_api.views import write_events


class ManagementView(TemplateView):
    template_name = 'ddsc_api/index.html'

    def get_context_data(self, **kwargs):
        context = super(ManagementView, self).get_context_data(**kwargs)

        if not self.request.user.is_authenticated():
            return context

        if self.request.user.is_superuser or DataOwner.objects.filter(data_managers=self.request.user).count() > 0:
            context['is_data_owner'] = True
        if self.request.user.is_superuser or \
                PermissionMapper.objects.filter(permission_group__permissions__codename='change_timeseries',
                                                     user_group__members=self.request.user):
            context['is_data_provider'] = True

        context['nr'] = 1

        return context

    def dispatch(self, *args, **kwargs):
        return super(ManagementView, self).dispatch(*args, **kwargs)


class CSVUploadView(TemplateView):
    template_name = 'ddsc_api/csv-upload.html'

    def dispatch(self, *args, **kwargs):
        return super(CSVUploadView, self).dispatch(*args, **kwargs)

    def post(self, request, *args, **kwargs):
        if not 'file' in request.FILES:
            return self._response("Geen CSV bestand ontvangen.", 400)
        file = request.FILES.get('file')
        content = [line.strip().split(',')
            for line in file.read().split('\n') if line.strip()]
        data = [{'uuid':row[1].strip('"'),
                 'events':[{'datetime':row[0].strip('"'),
                            'value':row[2].strip('"')}]}
                for row in content]

        # DDSC UUIDs are expected, but we have to support "ID mapping" as well.
        # First, assume an external (aka remote) ID. If it cannot be mapped
        # on a timeseries, it is assumed to be a internal, DDSC UUID.

        idmap = {}

        for item in data:
            if not item['uuid'] in idmap.keys():
                try:
                    obj = IdMapping.objects.get(
                        user__username=request.user,
                        remote_id=item['uuid']
                    )
                    idmap[obj.remote_id] = obj.timeseries.uuid
                except IdMapping.DoesNotExist:
                    if Timeseries.objects.filter(uuid=item['uuid']).exists():
                        idmap[item['uuid']] = item['uuid']
                    else:
                        msg = "Onbekende tijdreeks: {}".format(item['uuid'])
                        return self._response(msg, 404)

        for item in data:
            item['uuid'] = idmap[item['uuid']]

        serializer = serializers.MultiEventListSerializer(data=data)

        if not serializer.is_valid():
            return self._response(serializer.errors, 400)

        try:
            write_events(getattr(request, 'user', None), serializer.data)
        except ex.NotAuthenticated:
            return self._response("U dient in te loggen.", 401)
        except ex.PermissionDenied:
            return self._response(
                "U heeft geen toegang tot een of meer tijdseries.",
                403
            )
        except Timeseries.DoesNotExist:
            return self._response(
                "Een of meer tijdseries zijn niet gevonden.",
                404
            )
        except Exception as e:
            return self._response(e.detail, 500)

        return self._response("Het CSV-bestand is opgeslagen in DDSC.", 201)

    def _response(self, message, code):
        return render_to_response(
            self.template_name,
            RequestContext(self.request, {"message": message})
        )


class Root(APIView):
    def get(self, request, format=None):
        response = OrderedDict([
            ('locations', reverse('location-list', request=request)),
            ('timeseries', reverse('timeseries-list', request=request)),
            ('logicalgroups', reverse('logicalgroup-list', request=request)),
            ('sources', reverse('source-list', request=request)),
        ])

        user = getattr(request, 'user', None)
        if user is not None and user.is_superuser:
            response.update({
                'layers': reverse('layer-list', request=request),
                'collages': reverse('collage-list', request=request),
                'collageitems': reverse('collageitem-list', request=request),
                'workspaces': reverse('workspace-list', request=request),
                'workspaceitems': reverse('workspaceitem-list', request=request),
                'users': reverse('user-list', request=request),
                'groups': reverse('usergroup-list', request=request),
                'roles': reverse('role-list', request=request),
            })
        return Response(response)
