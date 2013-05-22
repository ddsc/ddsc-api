var logicalGroupDS = isc.DataSource.create({
  dataFormat: 'custom',
  dataURL: settings.logicalgroups_url,
  requestProperties: {
    params: {
      management: true,
      page_size: 1000
    },
    httpHeaders: {
      "Accept" : "application/json"
    }
  },
  defaultsNewNodesToRoot: true,
  fields:[
    {name: 'id', title: 'Id', type: 'text', canEdit: false},
    {name: 'url', title: 'Url', type: 'text', canEdit: false},
    {name: 'parents', title: 'Parent', type: 'text', foreignKey: 'url', rootValue: 'root'},
    {name: 'name', title: 'Naam'},
    {name: 'owner', title: 'Eigenaar'},
    {name: 'description', title: 'Beschrijving'}
  ],
  transformResponse: function(dsResponse) {
    var json_data = isc.JSON.decode(dsResponse.data);
    var result = [];

    //process data, to put nodes under multiple parent nodes
    for (var i = 0; i < json_data.results.length; i++ ) {
      var rec = json_data.results[i];
      rec.isFolder = true;

      if (rec.parents.length > 0) {
        for (var ii = 0; ii < rec.parents.length; ii++ ) {
          var sub_rec = isc.clone(rec);
          sub_rec._url = sub_rec.url;
          if (ii > 0) {
            sub_rec.id = null;
            sub_rec.url = null;
          }
          sub_rec.parents = rec.parents[ii];
          result.push(sub_rec);

        }
        //result.push(rec);
      } else {
        rec.parents = 'root';
        rec._url = rec.url;
        result.push(rec);
      }
    }
    dsResponse.data = result;
  }
});

var setLogicalGroupFormData = function(data) {

  timeseriesSelectionGrid.setData(data.timeseries);

  delete data['timeseries'];
  delete data['childs'];

  var parent_ids = []
  for (var i=0; i<data.parents.length; i++) {
    parent_ids.push(data.parents[i].parent_id);
  }
  data.parents = parent_ids;
  logicalGroupForm.setData(data);
  logicalGroupForm.setErrors([]);
}


var logicalGroupTree = isc.TreeGrid.create({
  dataSource: logicalGroupDS,
  width: 300,
  canReorderRecords: true,
  canAcceptDroppedRecords: true,
  autoFetchData:true,
  loadDataOnDemand:false,
  dataProperties:{
    dataArrived:function (parentNode) {
      this.openAll();
    },
    disableCacheSync: true
  },
  fields:[
    { name: 'name', formatCellValue: "return value + '  (' + record.owner + ')'" }
  ],
  rowClick: function(record) {
    RPCManager.sendRequest({
      actionURL: record._url,
      httpMethod: 'GET',
      httpHeaders: {
        "Accept" : "application/json"
      },
      callback: function(rpcResponse, data, rpcRequest) {
        var data = isc.JSON.decode(rpcResponse.data);
        setLogicalGroupFormData(data);
      }
    });
  }
});

//#####################################################################################################################

var logicalGroupForm = isc.DynamicForm.create({
  dataSource: logicalGroupDS,
  numCols: 2,
  colWidths: [100, 300],
  fields: [
    {type: 'header', defaultValue: "Logische Groep", width: "*"},
    {name: "id", title:"id", type: 'integer', canEdit: false},
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
          {name: 'name', title: 'Naam'}
        ]
      })
    },
    {name: "description", title: 'Beschrijving', type: 'textArea', width: "*"},
    {
      name: "parents",
      title: "Parents",
      editorType: "MultiComboBoxItem",
      defaultValue: [],
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
        dataURL: settings.logicalgroups_url,
        fields:[
          {name: 'id', title: 'iD', primaryKey: true},
          {name: 'name', title: 'Naam'}
        ]
      }),
      displayField: "name",
      valueField: "id"
     // autoFetchData: true,
      //layoutStyle: initialLayoutStyle
    }
  ]
});


var timeseriesSelectionGrid = isc.ListGrid.create({
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

var lgTimeseriesDS = isc.FilterPaginatedDataSource.create({
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


var lgTimeseries = isc.DefaultListGrid.create({
  //width:700,
  dataSource: lgTimeseriesDS,
  canDragRecordsOut: true,
  dragDataAction: 'copy',
  dataProperties:{
    disableCacheSync: true
  },
  canReorderFields: true
});

//#####################################################################################################################

var saveLogicalGroup = function(saveAsNew) {
  var data = logicalGroupForm.getData();
  var timeseries = timeseriesSelectionGrid.getData();

  data.parents = logicalGroupForm.getField('parents').getValue();
  var parents = [];
  for (var i=0; i<data.parents.length; i++) {
    parents.push({parent: data.parents[i]});
  }
  data.parents = parents;

  var timeseries_ids = [];
  for (var i=0; i<timeseries.length; i++) {
    timeseries_ids.push(timeseries[i].url);
  }
  data.timeseries = timeseries_ids;

  saveObject(logicalGroupForm, data, settings.logicalgroups_url, {
    saveAsNew: saveAsNew,
    reloadList: logicalGroupTree,
    setFormData: setLogicalGroupFormData
  });
}


logicalGroupPage = isc.HLayout.create({
  members: [
    logicalGroupTree,
    isc.VLayout.create({
      width: 400,
      padding: 10,
      membersMargin: 10,
      members: [
        logicalGroupForm,
        timeseriesSelectionGrid,
        isc.HLayout.create({
          height: 20,
          members: [
            isc.IButton.create({
              title: 'Annuleren',
              click: function() {
                logicalGroupForm.setData([]);
                logicalGroupForm.getField('parents').setValue([]); //reset this field manual
                logicalGroupForm.setErrors([]);
                timeseriesSelectionGrid.setData([]);
              }
            }),
            isc.IButton.create({
              title: 'Nieuw',
              click: function() {
                logicalGroupForm.setData([]);
                logicalGroupForm.getField('parents').setValue([]); //reset this field manual
                logicalGroupForm.setErrors([]);
                timeseriesSelectionGrid.setData([]);
              }
            }),
            isc.IButton.create({
              title: 'Opslaan',
              click: function() {
                saveLogicalGroup(false);
              }
            }),
            isc.IButton.create({
              title: 'Verwijderen',
              click: function() {
                var id = logicalGroupForm.getValue('id');
                if (id) {
                  RPCManager.sendRequest({
                    actionURL: logicalGroupForm.getData()['url'],
                    httpMethod: 'DELETE',
                    httpHeaders: {
                      'X-CSRFToken': document.cookie.split('=')[1],
                      "Accept" : "application/json"
                    },
                    callback: function(rpcResponse, data, rpcRequest) {
                      console.log('verwijderen gelukt');
                      logicalGroupForm.setData([]);
                      logicalGroupForm.setErrors([]);
                      timeseriesSelectionGrid.setData([]);
                      logicalGroupTree.fetchData({test: timestamp()}); //force new fetch with timestamp
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
      isc.Img.create({src: static_media_root + "ddsc_api/management/images/arrow_left.png", width:32, height:32,
        click: function() {
          timeseriesSelectionGrid.transferSelectedData(lgTimeseries);
        }
      }),
      isc.Img.create({src: static_media_root + "ddsc_api/management/images/arrow_right.png", width:32, height:32,
        click: function() {
          if (timeseriesSelectionGrid.getSelectedRecords()) {
            timeseriesSelectionGrid.data.removeAll(timeseriesSelectionGrid.getSelectedRecords());
          }

        }
      })
    ]}),
    lgTimeseries
  ]
});
