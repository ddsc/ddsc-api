var accessGroupDS = isc.DataSource.create({
  dataFormat: 'custom',
  dataURL: settings.datasets_url,
  requestProperties: {
    params: {
      management: true,
      page_size: 0
    },
    httpHeaders: {
      "Accept" : "application/json"
    }
  },
  //defaultsNewNodesToRoot: true,
  fields:[
    {name: 'id', title: 'Id', type: 'text', canEdit: false, hidden: true},
    {name: 'url', title: 'Url', type: 'text', canEdit: false, primaryKey: true, hidden: true},
    {name: 'name', title: 'Naam'},
    {name: 'owner', title: 'Eigenaar'}
  ],
  transformResponse: function(dsResponse) {
    var json_data = isc.JSON.decode(dsResponse.data);
    dsResponse.totalRows = json_data.length;
    dsResponse.data = json_data;
  }
});

var setAgFormData = function(data) {
  agTimeseriesSelectionGrid.setData(data.timeseries);
  agAccessGroupOverview.setData(data.permission_mappers);
  delete data['timeseries'];
  accessGroupForm.setData(data);
  accessGroupForm.setErrors([]);
}


var accessGroupGrid = isc.ListGrid.create({
  //ID: "alarmList",
  width: 300,
  alternateRecordStyles:true,
  autoFetchData: true,
  dataSource: accessGroupDS,
  rowClick: function(record) {
    RPCManager.sendRequest({
      actionURL: record.url,
      httpMethod: 'GET',
      httpHeaders: {
        "Accept" : "application/json"
      },
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
  colWidths: [100, 300],
  fields: [
    {type: 'header', defaultValue: "Toegangsgroep", width: "*"},
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
        requestProperties: {
          params: {
            page_size: 1000,
            management: true
          },
          httpHeaders: {
            "Accept" : "application/json"
          }
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

var agAccessGroupOverview = isc.ListGrid.create({
  width: 400,
  alternateRecordStyles:true,
  autoFitMaxRecords: 5,
  autoFitData: "vertical",
  fields:[
    {name:"id", title:"id", showIf: "return false"},
    {name:"user_group", title:"Gebruikersgroep (alleen lezen)"},
    {name:"permission_group", title:"Rol"},
    {name:"name", title:"Naam (optioneel)", showIf: "return false"}
  ]
});


var agTimeseriesSelectionGrid = isc.ListGrid.create({
  width: 400,
  alternateRecordStyles:true,
  canReorderRecords: true,
  canAcceptDroppedRecords: true,
  preventDuplicates: true,
  fields:[
    {name:"id", title:"id", showIf: "return false"},
    {name:"url", title:"Url", showIf: "return false"},
    {name:"name", title:"Gselecteerde tijdseries - Naam"}

  ]
});

//#####################################################################################################################

var agTimeseriesDS = isc.FilterPaginatedDataSource.create({
  autoFetchData: false,
  dataURL: settings.timeseries_url,
  requestProperties: {
    params: {
      management: true
    },
    httpHeaders: {
      "Accept" : "application/json"
    }
  },
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


var agTimeseries = isc.DefaultListGrid.create({
  dataSource: agTimeseriesDS,
  canDragRecordsOut: true,
  dragDataAction: 'copy',
  sortField: 'name',
  sortDirection: Array.ASCENDING,
  dataProperties:{
    disableCacheSync: true
  },
  canReorderFields: true
});

//#####################################################################################################################

var saveAccessGroup = function(saveAsNew) {
  var data = accessGroupForm.getData();
  var timeseries = agTimeseriesSelectionGrid.getData();

  var timeseries_ids = [];
  for (var i=0; i<timeseries.length; i++) {
    timeseries_ids.push(timeseries[i].url);
  }
  data.timeseries = timeseries_ids;

  saveObject(accessGroupForm, data, settings.datasets_url, {
    saveAsNew: saveAsNew,
    reloadList: accessGroupGrid,
    setFormData: setAgFormData
  });
}

accessGroupPage = isc.HLayout.create({
  members: [
    accessGroupGrid,
    isc.VLayout.create({
      width: 300,
      padding: 10,
      membersMargin: 10,
      defaultLayoutAlign: 'fill',
      members: [
        accessGroupForm,
        agAccessGroupOverview,
        agTimeseriesSelectionGrid,
        isc.HLayout.create({
          height: 20,
          members: [
            isc.IButton.create({
              title: 'Annuleren',
              click: function() {
                accessGroupForm.setData([]);
                accessGroupForm.setErrors([]);
                agAccessGroupOverview.setData([]);
                agTimeseriesSelectionGrid.setData([]);
              }
            }),
            isc.IButton.create({
              title: 'Nieuw',
              click: function() {
                accessGroupForm.setData([]);
                accessGroupForm.setErrors([]);
                agAccessGroupOverview.setData([]);
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
                      'X-CSRFToken': document.cookie.split('=')[1],
                      "Accept" : "application/json"
                    },
                    callback: function(rpcResponse, data, rpcRequest) {
                      console.log('verwijderen gelukt');
                      accessGroupForm.setData([]);
                      accessGroupForm.setErrors([]);
                      agTimeseriesSelectionGrid.setData([]);
                      accessGroupGrid.invalidateCache(); //force new fetch with timestamp
                    }
                  });
                }
              }
            })
          ]
        }),
        isc.IButton.create({
          title: 'Help',
          click: function() {
            window.open(settings.doc.accessgroup_url, "Help");
          }
        })
      ]
    }),
    isc.VStack.create({width:32, height:74, layoutAlign:"center", membersMargin:10, members:[
      isc.Img.create({src: static_media_root + "ddsc_api/management/images/arrow_left.png", width:32, height:32,
        click: function() {
          agTimeseriesSelectionGrid.transferSelectedData(agTimeseries);
        }
      }),
      isc.Img.create({src: static_media_root + "ddsc_api/management/images/arrow_right.png", width:32, height:32,
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