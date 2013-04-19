
var sourceDS = isc.FilterPaginatedDataSource.create({
  dataURL: settings.sources_url,
  fields:[
    {name: 'id', title: 'id', hidden: true},
    {name: 'uuid', title: 'UUID'},
    {name: 'name', title: 'Naam'},
    {name: 'source_type', title: 'Bron type', valueMap: ['Calculated', 'Sensor', 'Simulated', 'Derived']},
    {name: 'manufacturer', title: 'Leverancier'},
    {name: 'details', title: 'Beschrijving'},
    {name: 'frequency', title: 'Verwachte inwin frequentie (s)'},
    {name: 'timeout', title: 'Tijd tot attentie (s)'}
  ]
});

var setSourceFormData = function(data) {
  sourceForm.setData(data);
  sourceForm.setErrors([]);
}


var sourceList = isc.ListGrid.create({
  width:700,
  alternateRecordStyles:true,
  autoFetchData: true,
  dataSource: sourceDS,
  showFilterEditor: true,
  rowClick: function(record) {
    setSourceFormData(record);
  },
  canReorderFields: true,
  dataPageSize: 50,
  drawAheadRatio: 2
});


var manufacturerDS = isc.FilterPaginatedDataSource.create({
  dataURL: settings.manufacturer_url,
  autoFetchData: false,
  fields:[
    {name: 'code', title: 'Code', primaryKey: true, hidden: true},
    {name: 'name', title: 'Naam'}
  ]
});


var sourceForm = isc.DynamicForm.create({
  dataSource: sourceDS,
  width: 300,
  numCols: 2,
  colWidths: [100, 200],
  fields: [
    {type: 'header', defaultValue: 'Bron instellingen'},
    {name: 'id', title: 'id', canEdit: false},
    {name: 'name'},
    {name: 'source_type'},
    {name: 'manufacturer', type: 'combo', valueField: 'name', displayField: 'name',
      optionDataSource: manufacturerDS},
    {name: 'details', type: 'textArea'},
    {name: 'frequency', type: 'spinner', minValue: 0},
    {name: 'timeout', type: 'spinner', minValue: 0}
  ]
});


var saveSource = function(saveAsNew) {
  //todo: validation

  var data = sourceForm.getData();

  if (saveAsNew || !data.uuid) {
    delete data.uuid;
    delete data.url;
    var method = 'POST';
    var url = settings.sources_url;
  } else {
    var method = 'PUT';
    var url = data.url;
  }
  sourceForm.setErrors([]);

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
        console.log('Gelukt');
        var data = isc.JSON.decode(data);
        setSourceFormData(data);
        sourceList.fetchData({test: timestamp()}); //force new fetch with timestamp
      } else if (rpcResponse.httpResponseCode == 400) {
        sourceForm.setErrors(isc.JSON.decode(rpcResponse.httpResponseText), true);
        alert('validatie mislukt.');
      } else {
        alert('Opslaan mislukt.');
      }
    }
  });
}


sourcePage = isc.HLayout.create({
  autoDraw: false,
  members: [
    sourceList,
    isc.VLayout.create({
      padding: 10,
      members: [
        sourceForm,
        isc.HLayout.create({
          members: [
            isc.IButton.create({
              title: 'Annuleren',
              click: function() {
                sourceForm.setData([]);
                sourceForm.setErrors([]);
              }
            }),
            isc.IButton.create({
              title: 'Nieuw',
              click: function() {
                sourceForm.setData([]);
                sourceForm.setErrors([]);
              }
            }),
            isc.IButton.create({
              title: 'Opslaan',
              click: function() {
                saveSource(false);
              }
            }),
            isc.IButton.create({
              title: 'Verwijderen',
              click: function() {
                var uuid = sourceForm.getValue('uuid');
                if (uuid) {
                  RPCManager.sendRequest({
                    actionURL: sourceForm.getData()['url'],
                    httpMethod: 'DELETE',
                    httpHeaders: {
                      'X-CSRFToken': document.cookie.split('=')[1]
                    },
                    callback: function(rpcResponse, data, rpcRequest) {
                      console.log('verwijderen gelukt');
                      sourceForm.setData([]);
                      sourceForm.setErrors([]);
                      sourceList.fetchData({test: timestamp()}); //force new fetch with timestamp
                    }
                  });
                }
              }
            })
          ]
        })
      ]
    })
  ]
});