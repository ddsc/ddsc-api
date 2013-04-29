
var sourceDS = isc.FilterPaginatedDataSource.create({
  dataURL: settings.sources_url,
  fields:[
    {name: 'id', title: 'id', hidden: true},
    {name: 'uuid', title: 'UUID', width: 100},
    {name: 'name', title: 'Naam'},
    {name: 'source_type', title: 'Bron type', valueMap: ['Calculated', 'Sensor', 'Simulated', 'Derived'],
      canFilter: false, width: 100},
    {name: 'manufacturer', title: 'Leverancier', width: 100},
    {name: 'details', title: 'Beschrijving', hidden: true},
    {name: 'frequency', title: 'Inwin frequentie (s)', width: 80},
    {name: 'timeout', title: 'Attentie tijd (s)', width: 80}
  ]
});


var setSourceFormData = function(data) {
  sourceForm.setData(data);
  sourceForm.setErrors([]);
}


var sourceList = isc.DefaultListGrid.create({
  width:700,
  dataSource: sourceDS,
  rowClick: function(record) {
    setSourceFormData(record);
  }
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
  width: 350,
  numCols: 2,
  colWidths: [100, 250],
  fields: [
    {type: 'header', defaultValue: 'Bron instellingen', width: '*'},
    {name: 'id', title: 'id', canEdit: false, width: '*'},
    {name: 'uuid', title: 'uuid', canEdit: false, width: '*'},
    {name: 'name', width: '*'},
    {name: 'source_type', width: '*'},
    {name: 'manufacturer', type: 'combo', valueField: 'name', displayField: 'name',
      optionDataSource: manufacturerDS, width: '*'},
    {name: 'details', type: 'textArea', width: '*'},
    {name: 'frequency', type: 'spinner', minValue: 1},
    {name: 'timeout', type: 'spinner', minValue: 1}
  ]
});


var saveSource = function(saveAsNew) {
  var data = sourceForm.getData();

  saveObject(sourceForm, data, settings.sources_url, {
    saveAsNew: saveAsNew,
    idField: 'uuid',
    reloadList: sourceList
  });
}


sourcePage = isc.HLayout.create({
  autoDraw: false,
  minWidth: 1050,
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