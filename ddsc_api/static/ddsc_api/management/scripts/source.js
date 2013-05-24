
var sourceDS = isc.FilterPaginatedDataSource.create({
  dataURL: settings.sources_url,
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
    {name: 'uuid', title: 'uuid', width: 100},
    {name: 'name', title: 'naam'},
    {name: 'source_type', title: 'bron type', valueMap: ['Calculated', 'Sensor', 'Simulated', 'Derived'],
      canFilter: false, width: 100},
    {name: 'owner', title: 'eigenaar'},
    {name: 'manufacturer', title: 'leverancier', width: 100},
    {name: 'details', title: 'beschrijving', hidden: true},
    {name: 'frequency', title: 'inwin frequentie (s)', width: 80},
    {name: 'timeout', title: 'attentie tijd (s)', width: 80}
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
  requestProperties: {
    httpHeaders: {
      "Accept" : "application/json"
    }
  },
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
    {
      name: 'owner', title: 'Data eigenaar', type: 'combo',
      width: '*',
      valueField: 'name', displayField: 'name',
      optionDataSource: isc.DataSource.create({
        dataFormat: 'json',
        recordXPath: 'results',
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
          {name: 'id', title: 'ID', primaryKey: true},
          {name: 'name', title: 'Name'}
        ]
      })
    },
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
                      'X-CSRFToken': document.cookie.split('=')[1],
                      "Accept" : "application/json"
                    },
                    callback: function(rpcResponse, data, rpcRequest) {
                      console.log('verwijderen gelukt');
                      sourceForm.setData([]);
                      sourceForm.setErrors([]);
                      sourceList.invalidateCache(); //force new fetch with timestamp
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
            window.open(settings.doc.source_url, "Help");
          }
        })
      ]
    })
  ]
});