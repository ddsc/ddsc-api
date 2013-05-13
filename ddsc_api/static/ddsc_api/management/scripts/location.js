RPCManager.allowCrossDomainCalls = true

rowCount = 0

var locationDS = isc.FilterPaginatedDataSource.create({
  dataURL: settings.locations_url,
  fields:[
    {name:"url", title:"Url", hidden: true},
    {name:"uuid", title:"Uuid"},
    {name:"name", title:"naam"},
    {name:"description", title:"beschrijving", hidden: true},
    {name:"point_geometry", title:"punt geometrie"},
    {name:"srid", title:"SRID", hidden: true},
    {name:"geometry_precision", title:"geometrie precisie", hidden: true}
  ]
});

var locationList = isc.DefaultListGrid.create({
  width:700,
  dataSource: locationDS,
  rowClick: function(record) {
    RPCManager.sendRequest({
      actionURL: record.url,
      httpMethod: 'GET',
      callback: function(rpcResponse, data, rpcRequest) {
        locationForm.setData(isc.JSON.decode(data));
        locationForm.setErrors([]);
      }
    });
  }
});


var locationForm = isc.DynamicForm.create({
  numCols: 2,
  colWidths: [100, 250],
  width: 350,
  dataSource: locationDS,
  fields: [
    {type: 'header', defaultValue: "Locatie", width: "*"},
    {name:"uuid", canEdit: false},
    {name:"name", width: '*'},
    {name:"description", type: 'TextArea', width: '*'},
    {name:"point_geometry", width: '*'},
    {name:"srid"},
    {name:"geometry_precision", type: 'spinner'}
  ]
});

var saveLocation = function(saveAsNew) {
  var data = locationForm.getData();

  if (saveAsNew || !data.uuid) {
    delete data.path;
    delete data.depth;
  }

  saveObject(locationForm, data, settings.locations_url, {
    saveAsNew: saveAsNew,
    idField: 'uuid',
    reloadList: locationList,
    setFormData: function(data) {
      locationForm.setErrors([]);
      RPCManager.sendRequest({
        actionURL: data.url,
        httpMethod: 'GET',
        callback: function(rpcResponse, data, rpcRequest) {
          locationForm.setData(isc.JSON.decode(data));
        }
      });
    }
  });
}

locationPage = isc.HLayout.create({
  autoDraw: false,
  members: [
    locationList,
    isc.VLayout.create({
      padding: 10,
      members: [
        locationForm,
        isc.HLayout.create({
          members: [
            isc.IButton.create({
              title: 'Annuleren',
              click: function() {
                locationForm.setData([]);
                locationForm.setErrors([]);
              }
            }),
            isc.IButton.create({
              title: 'Nieuw',
              click: function() {
                locationForm.setData([]);
                locationForm.setErrors([]);
              }
            }),
            isc.IButton.create({
              title: 'Opslaan',
              click: function() {
                saveLocation(false);
              }
            }),
            isc.IButton.create({
              title: 'Verwijderen',
              click: function() {
                var uuid = locationForm.getValue('uuid');
                if (uuid) {
                  RPCManager.sendRequest({
                    actionURL: locationForm.getData()['url'],
                    httpMethod: 'DELETE',
                    httpHeaders: {
                      'X-CSRFToken': document.cookie.split('=')[1]
                    },
                    callback: function(rpcResponse, data, rpcRequest) {
                      console.log('verwijderen gelukt');
                      locationForm.setData([]);
                      locationForm.setErrors([]);
                      locationList.fetchData({test: timestamp()}); //force new fetch with timestamp
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