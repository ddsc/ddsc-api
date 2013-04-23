var accessGroupDS = isc.DataSource.create({
  dataFormat: 'custom',
  dataURL: settings.datasets_url,
  defaultsNewNodesToRoot: true,
  fields:[
    {name: 'id', title: 'Id', type: 'text', canEdit: false, hidden: true},
    {name: 'url', title: 'Url', type: 'text', canEdit: false, primaryKey: true, hidden: true},
    {name: 'name', title: 'Naam'},
    {name: 'owner', title: 'Eigenaar'}
  ],
  transformRequest: function(dsRequest) {
    dsRequest.httpHeaders = {
      "Accept" : "application/json"
    }
    dsRequest.params = {
      page_size: 0
    }
  },
  transformResponse: function(dsResponse) {
    var json_data = isc.JSON.decode(dsResponse.data);
    dsResponse.totalRows = json_data.length;
    dsResponse.data = json_data;
  }
});

var setAgFormData = function(data) {
  agTimeseriesSelectionGrid.setData(data.timeseries);

  delete data['timeseries'];
  accessGroupForm.setData(data);
  accessGroupForm.setErrors([]);
}


var accessGroupGrid = isc.ListGrid.create({
  //ID: "alarmList",
  width:400,
  alternateRecordStyles:true,
  autoFetchData: true,
  dataSource: accessGroupDS,
  rowClick: function(record) {
    RPCManager.sendRequest({
      actionURL: record.url,
      httpMethod: 'GET',
      callback: function(rpcResponse, data, rpcRequest) {
        var data = isc.JSON.decode(rpcResponse.data);
        setAgFormData(data);
      }
    });
  },
  canReorderFields: true
});


//#####################################################################################################################

var accessGroupForm = isc.DynamicForm.create({
  dataSource: accessGroupDS,
  numCols: 2,
  colWidths: [100, 250],
  fields: [
    {type: 'header', defaultValue: "Toegangs Groep", width: "*"},
    {name: "id", title:"id", type: 'integer', canEdit: false},
    //{name: "url", title: "Url", canEdit: false},
    {name: "name", width: "*"},
    {
      name: "owner", type: "combo",
      width: "*",
      displayField: "name",
      valueField: "name",
      optionDataSource: isc.DataSource.create({
        dataFormat: 'json',
        recordXPath: "results",
        params: {
          page_size: 1000
        },
        dataURL: settings.dataowners_url,
        fields:[
          {name: 'id', title: 'iD', primaryKey: true},
          {name: 'name', title: 'Name'}
        ]
      })
    }
  ]
});


var agTimeseriesSelectionGrid = isc.ListGrid.create({

  alternateRecordStyles:true,
  canReorderRecords: true,
  canAcceptDroppedRecords: true,
  preventDuplicates: true,
  fields:[
    {name:"id", title:"id", showIf: "return false"},
    {name:"url", title:"Url", showIf: "return false"},
    {name:"name", title:"Name"}
  ]
});

//#####################################################################################################################

var agTimeseriesDS = isc.FilterPaginatedDataSource.create({
  autoFetchData: false,
  dataURL: settings.timeseries_url,
  fields:[
    {name: 'id', title: 'id', hidden: true},
    {name: 'uuid', title: 'UUID'},
    {name: 'name', title: 'Naam'},
    {
      name: 'value_type', title: 'Waarde type', valueMap: ['integer', 'float', 'text', 'image',
      'georeferenced remote sensing', 'movie', 'file'], canFilter: false
    },
    {name: 'owner', title: 'Data eigenaar'},
    {name: 'location.name', title: 'Locatie'},
    {name: 'parameter', title: 'Parameter'},
    {name: 'unit', title: 'Eenheid'}
  ]
});


var agTimeseries = isc.ListGrid.create({
  alternateRecordStyles:true,
  showFilterEditor: true,
  autoFetchData: true,
  dataSource: agTimeseriesDS,
  canDragRecordsOut: true,
  dragDataAction: 'copy',
  dataProperties:{
    disableCacheSync: true
  },
  canReorderFields: true,
  dataPageSize: 50,
  drawAheadRatio: 2
});

//#####################################################################################################################

var saveAccessGroup = function(saveAsNew) {
  //todo: validation
  var data = accessGroupForm.getData();
  var timeseries = agTimeseriesSelectionGrid.getData();

  var timeseries_ids = [];
  for (var i=0; i<timeseries.length; i++) {
    timeseries_ids.push(timeseries[i].url);
  }
  data.timeseries = timeseries_ids;

  if (saveAsNew || !data.id) {
    delete data.id;
    delete data.url;
    //todo: set alarmItem id's on null
    var method = 'POST';
    var url = settings.datasets_url;
  } else {
    var method = 'PUT';
    var url = data.url;
  }
  accessGroupForm.setErrors([]);

  RPCManager.sendRequest({
    actionURL: url,
    httpMethod: method,
    data: data,
    params: data,
    httpHeaders: {
      'X-CSRFToken': document.cookie.split('=')[1]
    },
    callback: function(rpcResponse, data, rpcRequest) {

      if (rpcResponse.httpResponseCode == 200 || rpcResponse.httpResponseCode == 201) {
        console.log('gelukt');
        var data = isc.JSON.decode(data);
        setAgFormData(data)
        accessGroupGrid.fetchData({test: timestamp()}); //force new fetch with timestamp
      } else if (rpcResponse.httpResponseCode == 400) {
        accessGroupForm.setErrors(isc.JSON.decode(rpcResponse.httpResponseText), true);
        alert('validatie mislukt');
      } else {
        alert('Opslaan mislukt.');
      }
    }
  });
}


accessGroupPage = isc.HLayout.create({
  members: [
    accessGroupGrid,
    isc.VLayout.create({
      width: 300,
      members: [
        accessGroupForm,
        agTimeseriesSelectionGrid,
        isc.HLayout.create({
          height: 30,
          members: [
            isc.IButton.create({
              title: 'Annuleren',
              click: function() {
                accessGroupForm.setData([]);
                accessGroupForm.setErrors([]);
                agTimeseriesSelectionGrid.setData([]);
              }
            }),
            isc.IButton.create({
              title: 'Nieuw',
              click: function() {
                accessGroupForm.setData([]);
                accessGroupForm.setErrors([]);
                agTimeseriesSelectionGrid.setData([]);
              }
            }),
            isc.IButton.create({
              title: 'Opslaan',
              click: function() {
                saveAccessGroup(false);
              }
            }),
            isc.IButton.create({
              title: 'Verwijderen',
              click: function() {
                var id = accessGroupForm.getValue('id');
                if (id) {
                  RPCManager.sendRequest({
                    actionURL: accessGroupForm.getData()['url'],
                    httpMethod: 'DELETE',
                    httpHeaders: {
                      'X-CSRFToken': document.cookie.split('=')[1]
                    },
                    callback: function(rpcResponse, data, rpcRequest) {
                      console.log('verwijderen gelukt');
                      accessGroupForm.setData([]);
                      accessGroupForm.setErrors([]);
                      agTimeseriesSelectionGrid.setData([]);
                      accessGroupGrid.fetchData({test: timestamp()}); //force new fetch with timestamp
                    }
                  });
                }
              }
            })
          ]
        })
      ]
    }),
    isc.VStack.create({width:32, height:74, layoutAlign:"center", membersMargin:10, members:[
      isc.Img.create({src:"/static_media/ddsc_api/management/images/arrow_left.png", width:32, height:32,
        click: function() {
          agTimeseriesSelectionGrid.transferSelectedData(agTimeseries);
        }
      }),
      isc.Img.create({src:"/static_media/ddsc_api/management/images/arrow_right.png", width:32, height:32,
        click: function() {
          if (agTimeseriesSelectionGrid.getSelectedRecords()) {
            agTimeseriesSelectionGrid.data.removeAll(agTimeseriesSelectionGrid.getSelectedRecords());
          }

        }
      })
    ]}),
    agTimeseries
  ]
});