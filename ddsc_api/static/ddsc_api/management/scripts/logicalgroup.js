var logicalGroupDS = isc.DataSource.create({
  dataFormat: 'custom',
  dataURL: "http://33.33.33.10:8001/api/v1/logicalgroups/",
  defaultsNewNodesToRoot: true,
  fields:[
    {name: 'id', title: 'Id', type: 'text', canEdit: false},
    {name: 'url', title: 'Url', type: 'text', canEdit: false, primaryKey: true},
    {name: 'parents', title: 'Parent', type: 'text', foreignKey: 'url', rootValue: 'root'},
    {name: 'name', title: 'Name'}
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
          parent_ids.push(json_data.parents[i].parent);
        }
        json_data.parents = parent_ids;
        logicalGroupForm.setData(json_data);
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
    {name: "owner", width: "*"},
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
          {name: 'id', title: 'iD', type: 'text', primaryKey: true},
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

var saveLogicalGroup = function() {
  //todo: validation

  var data = logicalGroupForm.getData();
  var timeseries = timeseriesSelectionGrid.getData();
  //var parents = parentSelectionGrid.getData();


  var parents = [];
  for (var i=0; i<data.parents.length; i++) {
    parents.push({parent: 1*data.parents[i]});
  }
  data.parents = parents;

  var timeseries_ids = [];
  for (var i=0; i<timeseries.length; i++) {
    timeseries_ids.push(timeseries[i].url);
  }
  data.timeseries = timeseries_ids;


  RPCManager.sendRequest({
    actionURL: data.url,
    httpMethod: 'PUT',
    data: data,
    params: data,
    httpHeaders: {
      'X-CSRFToken': document.cookie.split('=')[1]
    },
    callback: function(rpcResponse, data, rpcRequest) {

      if (rpcResponse.httpResponseCode == 200) {
        console.log('opslaan gelukt');
        var data = isc.JSON.decode(data);
        logicalGroupForm.setData(data);
        timeseriesSelectionGrid.setData(data.alarm_item_set);

      } else if (rpcResponse.httpResponseCode == 201) {
        console.log('aanmaken nieuw object gelukt');
        data = isc.JSON.decode(data);
        logicalGroupForm.setData(data);
        timeseriesSelectionGrid.setData(data.alarm_item_set);

      } else if (rpcResponse.httpResponseCode == 400) {
        logicalGroupForm.setErrors(isc.JSON.decode(rpcResponse.httpResponseText), true);
        alert('validatie mislukt');

      } else {
        alert('Opslaan mislukt. ' + data);
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
        isc.IButton.create({
          title: 'Opslaan',
          click: function() {
            saveLogicalGroup(false);
          }
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