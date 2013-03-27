# (c) Nelen & Schuurmans.  MIT licensed, see LICENSE.rst.
from __future__ import print_function, unicode_literals
from __future__ import absolute_import, division

from collections import OrderedDict

from rest_framework.reverse import reverse
from rest_framework.views import APIView
from rest_framework.response import Response


class Root(APIView):
    def get(self, request, format=None):
        response = OrderedDict([
            ('alarms', reverse('alarm_active-list', request=request)),
            ('datasets', reverse('dataset-list', request=request)),
            ('locations', reverse('location-list', request=request)),
            ('timeseries', reverse('timeseries-list', request=request)),
            ('parameters', reverse('parameter-list', request=request)),
            ('logicalgroups', reverse('logicalgroup-list', request=request)),
            ('layers', reverse('layer-list', request=request)),
            ('collages', reverse('collage-list', request=request)),
            ('collageitems', reverse('collageitem-list', request=request)),
            ('workspaces', reverse('workspace-list', request=request)),
            ('workspaceitems', reverse('workspaceitem-list', request=request)),
        ])

        user = getattr(request, 'user', None)
        if user is not None and user.is_superuser:
            response.update({
                'users': reverse('user-list', request=request),
                'groups': reverse('usergroup-list', request=request),
                'roles': reverse('role-list', request=request),
            })
        return Response(response)
