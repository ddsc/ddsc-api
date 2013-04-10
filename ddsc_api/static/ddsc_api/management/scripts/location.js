RPCManager.allowCrossDomainCalls = true

rowCount = 0

var locationDS = isc.RestDataSource.create({
  ID: "locationDS",
  autoFetchData: false,
  dataFormat: 'custom',
  recordXPath: 'results',
  bypassCache: false,
  dataURL: "http://33.33.33.10:8001/api/v1/locations",
  containsCredentials: true,
  fields:[
    {name:"url", title:"Url", hidden: true},
    {name:"uuid", title:"Uuid", hidden: true},
    {name:"name", title:"Name"},
    {name:"description", title:"Description"},
    {name:"point_geometry", title:"geometry"},
    {name: "path", title: "path", type: "text", width: 80},
    {name: "depth", title: "diepte", type: "integer", width:50}
  ],
  transformRequest: function(dsRequest) {
    dsRequest.httpHeaders = {
      "Accept" : "application/json"
    }
    dsRequest.params = {
      page: Math.floor(dsRequest.startRow / dsRequest.dataPageSize) + 1, //first result is page 1
      srow: dsRequest.startRow,
      page_size: dsRequest.dataPageSize
    }

    if (dsRequest.data) {
      var filter = {}
      for (key in dsRequest.data ) {
        filter[key + '__icontains'] = dsRequest.data[key];
      }
      dsRequest.params.filter = filter;
    }
  },
  transformResponse: function(dsResponse) {
    var json_data = isc.JSON.decode(dsResponse.data);
    dsResponse.totalRows = json_data.count;
    dsResponse.data = json_data.results;
    dsResponse.startRow = (dsResponse.context.params.page - 1) * dsResponse.context.params.page_size;
    dsResponse.endRow = dsResponse.startRow + dsResponse.context.params.page_size;
    console.log('got row ' + dsResponse.startRow + ' till ' + dsResponse.endRow);
  }
//  clientOnly: true,
//  testData: countryData
});

var locationDetailDS = isc.RestDataSource.create({
  ID: "locationDetailDS",
  autoFetchData: false,
  dataFormat: 'json',
  dataURL: "http://33.33.33.10:8001/api/v1/locations/8D608BED-28C8-463A-8E80-D7361E5D49A1",
  fields:[
    {name:"url", title:"Url", hidden: true},
    {name:"uuid", title:"Uuid", hidden: true},
    {name:"name", title:"Name"},
    {name:"description", title:"Description"},
    {name:"point_geometry", title:"geometry"},
    {name:"geometry_precision", title:"Geometry precisie", hidden: true},
    {name:"relative_location", title:"Relatieve locatie", hidden: true},
    {name: "path", title: "path", type: "text", width: 80},
    {name: "depth", title: "diepte", type: "integer", width:50}
  ],
  transformRequest: function(dsRequest) {
    dsRequest.httpHeaders = {
      "Accept" : "application/json"
    }
  },
  transformResponse: function(dsResponse) {
  }
});




var locationForm = isc.DynamicForm.create({
  ID: "locationForm",
  //autoFetchData: true,
  autoDraw: false,
  width: 250,
  //dataSource: locationDS,
  fields: [
    {
      name: "uuid",
      title: 'Uuid',
      required: true,
      type: 'text'
    },
    {
      name: "name",
      title: 'Name',
      required: true,
      type: 'text'
    },
    {name: "description",
      title: "description",
      required: true,
      type: "text"
    },
    {name: "point_geometry",
      required: true,
      title: "geometry",
      type: "text"
    },
    {
      name:"geometry_precision",
      title:"Geometry precisie"
    },
    {
      name:"relative_location",
      title:"Relatieve locatie",
      hidden: true
    },
    {name: "path",
      required: true,
      title: "path",
      type: "text"
    },
    {name: "depth",
      required: true,
      title: "diepte",
      type: "integer"
    },
    {
      name: 'postBtn',
      title: 'Opslaan',
      type: 'Button',
      click: function(form) {
        //todo: validation

        debugger;
        var data = form.getData();

        delete data['timeseries']
        delete data['sublocations']

        RPCManager.sendRequest({
          actionURL: data.url,
          httpMethod: 'PUT',
          data: data,
          params: data,
          httpHeaders: {
            'X-CSRFToken': document.cookie.split('=')[1]
          },
          callback: function(rpcResponse, data, rpcRequest) {
            alert('opgeslagen');
          }
        });

        form.saveData();
      }
    }
    //table

  ]
});


locationPage = isc.HLayout.create({
  autoDraw: false,
  members: [
    isc.ListGrid.create({
      ID: "LocationGrid",
      width:700,
      alternateRecordStyles:true,
      showFilterEditor: true,
      autoFetchData: true,
      dataSource: locationDS,
      /*fields:[
        {name:"name", title:"Name"},
        {name:"description", title:"Description"},
        {name:"point_geometry", title:"geom"}
      ],*/
      rowClick: function(record) {
        RPCManager.sendRequest({
          actionURL: record.url,
          httpMethod: 'GET',
          callback: function(rpcResponse, data, rpcRequest) {
            locationForm.setData(isc.JSON.decode(data));
          }
        });
      },
      canReorderFields: true,
      dataPageSize: 50,
      drawAheadRatio: 2
    }),
    locationForm
  ]
});