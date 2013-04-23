var logicalGroupDS = isc.DataSource.create({
  dataFormat: 'custom',
  dataURL: settings.logicalgroups_url,
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


var logicalGroupTree = isc.TreeGrid.create({
  dataSource: logicalGroupDS,
  width: 400,
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
      callback: function(rpcResponse, data, rpcRequest) {
        var json_data = isc.JSON.decode(rpcResponse.data);
        timeseriesSelectionGrid.setData(json_data.timeseries);

        delete json_data['timeseries'];
        delete json_data['childs'];

        var parent_ids = []
        for (var i=0; i<json_data.parents.length; i++) {
          parent_ids.push(json_data.parents[i].parent_id);
        }
        json_data.parents = parent_ids;
        logicalGroupForm.setData(json_data);
        logicalGroupForm.setErrors([]);
      }
    });
  }
});

//#####################################################################################################################

var logicalGroupForm = isc.DynamicForm.create({
  dataSource: logicalGroupDS,
  numCols: 2,
  colWidths: [100, 250],
  fields: [
    {type: 'header', defaultValue: "Logische Groep", width: "*"},
    {name: "id", title:"id", type: 'integer', canEdit: false},
    {name: "url", title: "Url", canEdit: false /*editorType: 'hiddenField'*/},
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
          {name: 'name', title: 'Naam'}
        ]
      })
    },
    {name: "description", title: 'Beschrijving', type: 'textArea', width: "*"},
    {
      name: "parents",
      title: "Parents",
      editorType: "MultiComboBoxItem",
      optionDataSource: isc.DataSource.create({
        dataFormat: 'json',
        recordXPath: "results",
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

var lgTimeseriesDS = isc.FilterPaginatedDataSource.create({
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


var lgTimeseries = isc.ListGrid.create({
  //width:700,
  autoDraw: false,
  alternateRecordStyles:true,
  showFilterEditor: true,
  autoFetchData: true,
  dataSource: lgTimeseriesDS,
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

var saveLogicalGroup = function(saveAsNew) {
  //todo: validation

  var data = logicalGroupForm.getData();
  var timeseries = timeseriesSelectionGrid.getData();
  //var parents = parentSelectionGrid.getData();

  //todo: bug with parent field in post
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

  if (saveAsNew || !data.id) {
    //logicalGroupForm.setValue('id', null);
    //logicalGroupForm.setValue('url', null);
    delete data.id;
    delete data.url;
    //todo: set alarmItem id's on null
    var method = 'POST';
    var url = settings.logicalgroups_url;
  } else {
    var method = 'PUT';
    var url = data.url;
  }
  alarmForm.setErrors([]);

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
        var parent_ids = []
        for (var i=0; i<data.parents.length; i++) {
          parent_ids.push(data.parents[i].parent_id);
        }
        data.parents = parent_ids;
        logicalGroupForm.setData(data);
        logicalGroupForm.setErrors([]);
        timeseriesSelectionGrid.setData(data.alarm_item_set);
        logicalGroupTree.fetchData({test: timestamp()}); //force new fetch with timestamp
      } else if (rpcResponse.httpResponseCode == 400) {
        logicalGroupForm.setErrors(isc.JSON.decode(rpcResponse.httpResponseText), true);
        alert('validatie mislukt');
      } else {
        alert('Opslaan mislukt.');
      }
    }
  });
}


logicalGroupPage = isc.HLayout.create({
  members: [
    logicalGroupTree,
    isc.VLayout.create({
      width: 400,
      members: [
        logicalGroupForm,
        timeseriesSelectionGrid,
        isc.HLayout.create({
          height: 30,
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
              title: 'Opslaan als nieuw',
              width: 150,
              click: function() {
                saveLogicalGroup(true);
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
                      'X-CSRFToken': document.cookie.split('=')[1]
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
      isc.Img.create({src:"/static_media/ddsc_api/management/images/arrow_left.png", width:32, height:32,
        click: function() {
          timeseriesSelectionGrid.transferSelectedData(lgTimeseries);
        }
      }),
      isc.Img.create({src:"/static_media/ddsc_api/management/images/arrow_right.png", width:32, height:32,
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