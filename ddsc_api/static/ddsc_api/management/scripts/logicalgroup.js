var logicalGroupDS = isc.DataSource.create({
  dataFormat: 'custom',
  dataURL: "http://33.33.33.10:8001/api/v1/logicalgroups/",
  defaultsNewNodesToRoot: true,
  fields:[
    {name: 'id', title: 'Id', type: 'text', canEdit: false},
    {name: 'url', title: 'Url', type: 'text', canEdit: false, primaryKey: true},
    {name: 'parents', title: 'Parent', type: 'text', foreignKey: 'url', rootValue: 'root'},
    {name: 'name', title: 'Naam'},
    {name: 'owner', title: 'Eigenaar'}
  ],
  transformResponse: function(dsResponse) {
    var json_data = isc.JSON.decode(dsResponse.data);
    var result = [];
    for (var i = 0; i < json_data.results.length; i++ ) {
      var rec = json_data.results[i];
      rec.isFolder = true;

      if (rec.parents.length > 0) {
        for (var ii = 0; ii < rec.parents.length; ii++ ) {
          var sub_rec = Object.create(rec);
          sub_rec.parents = rec.parents[ii];
          result.push(sub_rec);
        }
        result.push(rec);
      } else {
        rec.parents = 'root';
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
      actionURL: record.url,
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
    {name: "owner", type: "combo",
      width: "*",
      displayField: "name",
      valueField: "name",
      optionDataSource: isc.DataSource.create({
        dataFormat: 'json',
        recordXPath: "results",
        params: {
          page_size: 1000
        },
        dataURL: "http://33.33.33.10:8001/api/v1/dataowner/",
        fields:[
          {name: 'id', title: 'iD', primaryKey: true},
          {name: 'name', title: 'Name'}
        ]
      })
    },
    {name: "description", type: 'textArea', width: "*"},
    {
      name: "parents",
      title: "Parents",
      editorType: "MultiComboBoxItem",
      optionDataSource: isc.DataSource.create({
        dataFormat: 'json',
        recordXPath: "results",
        dataURL: "http://33.33.33.10:8001/api/v1/logicalgroups/",
        fields:[
          {name: 'id', title: 'iD', primaryKey: true},
          {name: 'name', title: 'Name'}
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

var lgTimeseriesDS = isc.RestDataSource.create({
  autoFetchData: false,
  dataFormat: 'custom',
  dataURL: "http://33.33.33.10:8001/api/v1/timeseries",
  fields:[
    {name:"url", title:"Url", hidden: true},
    {name:"uuid", title:"Uuid", hidden: true},
    {name:"name", title:"Name"}
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
  rowClick: function(record) {
    RPCManager.sendRequest({
      actionURL: record.url,
      httpMethod: 'GET',
      callback: function(rpcResponse, data, rpcRequest) {
        locationForm.setData(isc.JSON.decode(data));
      }
    });
  },
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
    var url = "http://33.33.33.10:8001/api/v1/logicalgroups";
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